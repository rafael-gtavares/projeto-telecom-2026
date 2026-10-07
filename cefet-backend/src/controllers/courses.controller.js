const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const EnrollmentRequest = require('../models/EnrollmentRequest');
const School = require('../models/School');
const Lesson = require('../models/Lesson');
const { ROLE_HIERARCHY, ROLES } = require('../constants/roles');
const { VALID_FONTS } = require('../helpers/signatureHelper');
const User = require('../models/User');
const {
  canEditCertificateSettings,
  isInstructorLocked,
  hasCourseAccess,
  getEligibleInstructors,
  buildCertificateSettings,
} = require('../helpers/certificateInstructorHelper');

const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ENROLLMENT_REQUEST_STATUS } = require('../constants/enrollmentRequestStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { COURSE_PHASE } = require('../constants/coursePhase');
const { NOTIFICATION_TYPES, NOTIFICATION_TABS } = require('../constants/notifications');

const {
  validateSchedule,
  getCoursePeriod,
  buildLessons,
  generateLessons,
} = require('../helpers/scheduleHelper');

const {
  updateCourseStatus,
  getCourseStatus
} = require('../helpers/courseStatusHelper');

const {
  resolvePrerequisites,
  getPrerequisiteStatusMap,
} = require('../helpers/prerequisiteHelper');

const { notifyCourseStudents, removeNotificationsByRef, notifyFeedbackAvailable } = require('../services/notify');

// Normaliza os campos de plataforma externa: link e mensagem só são mantidos
// quando a opção está ativada (desativar limpa os dois).
const normalizeExternal = ({ isExternal, externalUrl, externalMessage }) => {
  const enabled = isExternal === true || isExternal === 'true';
  return {
    isExternal: enabled,
    externalUrl: enabled ? String(externalUrl ?? '').trim() : '',
    externalMessage: enabled ? String(externalMessage ?? '').trim() : '',
  };
};

// Listagem pública (home) — apenas publicados
const getCourses = async (req, res, next) => {
  try {
    const { status, modality, page = 1 } = req.query;
    // Teto de paginação para evitar abuso (ex.: limit=999999)
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const filter = {};

    if (req.user?.role === 'aluno' || !req.user) {
      // Cursos com vagas encerradas continuam visíveis na home (para consulta),
      // só não aceitam novas inscrições/solicitações.
      filter.status = { $in: [COURSE_STATUS.PUBLISHED, COURSE_STATUS.VACANCIES_CLOSED] };
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    // Filtro por modalidade (opcional)
    if (modality && modality !== 'all') filter.modality = modality;

    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      .populate('prerequisites', 'title')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      // externalUrl fica de fora da listagem pública (só inscritos/gestores veem o link)
      .select('-materials -externalUrl');

    const total = await Course.countDocuments(filter);

    // Se o usuário estiver autenticado, verifica inscrição em lote (evita N+1 no frontend).
    // Distingue inscrição com vaga (isEnrolled) de fila de espera (isWaitlisted).
    let enrolledIds = new Set();
    let waitlistedIds = new Set();
    let pendingRequestMap = new Map(); // courseId -> requestId
    let prereqMap = new Map(); // courseId -> { met, missing }  
    if (req.user?.id) {
      const enrollments = await Enrollment.find(
        { user: req.user.id, course: { $in: courses.map(c => c._id) } },
        'course status'
      );
      for (const e of enrollments) {
        if (e.status === ENROLLMENT_STATUS.WAITING_LIST) waitlistedIds.add(e.course.toString());
        else enrolledIds.add(e.course.toString());
      }

      const pendingRequests = await EnrollmentRequest.find(
        { student: req.user.id, course: { $in: courses.map(c => c._id) }, status: ENROLLMENT_REQUEST_STATUS.PENDING },
        'course'
      );
      for (const r of pendingRequests) pendingRequestMap.set(r.course.toString(), r._id.toString());

      prereqMap = await getPrerequisiteStatusMap(req.user.id, courses);
    }

    const coursesWithEnrollment = courses.map(c => {
      const prereq = prereqMap.get(c._id.toString());
      return {
        ...c.toJSON(),
        isEnrolled: enrolledIds.has(c._id.toString()),
        isWaitlisted: waitlistedIds.has(c._id.toString()),
        isPendingRequest: pendingRequestMap.has(c._id.toString()),
        pendingRequestId: pendingRequestMap.get(c._id.toString()) || null,
        // null = visitante (não dá para saber); true/false = aluno logado
        prerequisitesMet: prereq ? prereq.met : null,
        missingPrerequisites: prereq ? prereq.missing : [],
      };
    });

    res.json({ success: true, data: { courses: coursesWithEnrollment, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

// Listagem para o painel admin/professor — respeita visibilidade por dono
const getAllCourses = async (req, res, next) => {
  try {

    await updateCourseStatus();

    const { status, page = 1 } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    // Professor só vê seus próprios cursos OU cursos em que foi adicionado como allowedProfessor
    if (req.user.role === 'professor') {
      filter.$or = [
        { professor: req.user.id },
        { allowedProfessors: req.user.id },
      ];
    }
    // Admin vê tudo — sem filtro adicional

    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      .populate('prerequisites', 'title status')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-materials');

    const total = await Course.countDocuments(filter);
    res.json({ success: true, data: { courses, total, page: Number(page), limit } });
  } catch (err) { next(err); }
};

const getCourse = async (req, res, next) => {
  try {
    await updateCourseStatus();

    const course = await Course.findById(req.params.id)
      .populate('professor', 'name email')
      .populate('allowedProfessors', 'name email role');
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    // Rascunhos (draft) são privados: só quem gerencia o curso pode vê-los.
    // Cursos published/em_andamento/closed seguem acessíveis (aluno inscrito precisa deles).
    if (course.status === COURSE_STATUS.DRAFT && !course.hasManageAccess(req.user.id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para acessar este curso' });
    }

    // O link da plataforma externa só é entregue a quem gerencia o curso ou está
    // inscrito com vaga (não vaza para visitantes, fila de espera ou cancelados).
    const data = course.toJSON();

    // Configuração do certificado (ministrador/assinatura) só para quem gerencia
    const isManager = course.hasManageAccess(req.user.id, req.user.role);
    if (isManager) {
      Object.assign(data, JSON.parse(JSON.stringify(await buildCertificateSettings(course))));
    } else {
      delete data.certificateInstructor;
      delete data.certificateSignatureFont;
      delete data.certificateInstructorLockedAt;
    }

    if (data.externalUrl) {
      const canSeeLink =
        course.hasManageAccess(req.user.id, req.user.role) ||
        (await Enrollment.exists({
          course: course._id,
          user: req.user.id,
          status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
        }));
      if (!canSeeLink) delete data.externalUrl;
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getCourseStats = async (req, res, next) => {
  try {
    await updateCourseStatus();

    // =========================
    // CURSO
    // =========================

    const { id: courseId } = req.params;

    const course = await Course.findById(
      courseId,
      'title maxSlots enrolledCount'
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado',
      });
    }


    // =========================
    // PERÍODO PARA FILTRO
    // =========================

    const { period = '6m' } = req.query;

    const periodMap = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
    };

    const monthsBack = periodMap[period] || 6;

    const startDate = new Date();

    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);


    // =========================
    // MÉTRICAS DO CURSO
    // =========================

    const totalEnrollments = await Enrollment.countDocuments({
      course: courseId,
    });

    const occupancy = course.maxSlots
      ? Math.round(
        (course.enrolledCount / course.maxSlots) * 100
      )
      : 0;


    // =========================
    // INSCRIÇÕES POR MÊS
    // =========================

    const enrollmentsByMonth = await Enrollment.aggregate([
      {
        $match: {
          course: course._id,
          createdAt: { $gte: startDate },
        },
      },

      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },

          count: { $sum: 1 },
        },
      },

      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];

    const chartData = enrollmentsByMonth.map(item => ({
      month: months[item._id.month - 1],
      count: item.count,
    }));


    // =========================
    // ESTATÍSTICAS DE ESCOLAS
    // =========================

    const enrollments = await Enrollment.find({
      course: courseId,
      createdAt: { $gte: startDate },
    }).populate({
      path: 'user',
      select:
        'gender schoolLevel incomeRange birthDate school',
    });

    const schoolStatsRaw = {};

    enrollments.forEach(enrollment => {
      const schoolId = enrollment.user?.school?.toString() || 'outras';

      schoolStatsRaw[schoolId] =
        (schoolStatsRaw[schoolId] || 0) + 1;
    });

    const schoolIds = Object.keys(schoolStatsRaw)
      .filter(id => id !== 'outras');

    const schools = await School.find(
      { _id: { $in: schoolIds } },
      'name'
    );

    const schoolNamesMap = {};

    schools.forEach(school => {
      schoolNamesMap[school._id.toString()] = school.name;
    });

    const schoolStats = Object.entries(schoolStatsRaw).map(
      ([schoolId, count]) => ({
        name:
          schoolId === 'outras'
            ? 'Outras'
            : schoolNamesMap[schoolId] || 'Desconhecida',
        count,
      })
    );


    // =========================
    // ESTATÍSTICAS DEMOGRÁFICAS
    // =========================

    const genderStats = {
      masculino: 0,
      feminino: 0,
      prefiro_nao_informar: 0,
    };

    const schoolLevelStats = {
      ensino_fundamental: 0,
      '1_ou_2_ano_em': 0,
      ultimo_ano_em: 0,
      ensino_medio_finalizado: 0,
      eja: 0,
      superior_completo: 0,
      superior_incompleto: 0
    };

    const incomeRangeStats = {
      ate_1sm: 0,
      '1_a_2sm': 0,
      '2_a_3sm': 0,
      '3_a_5sm': 0,
      acima_5sm: 0,
      prefiro_nao_informar: 0,
    };

    const ageStats = {
      ate_14: 0,
      de_15_a_17: 0,
      de_18_a_21: 0,
      de_22_a_25: 0,
      acima_de_25: 0,
    };


    // =========================
    // PROCESSAMENTO
    // =========================

    enrollments.forEach(enrollment => {
      const user = enrollment.user;

      if (!user) return;

      const gender = user.gender;
      const schoolLevel = user.schoolLevel;
      const incomeRange = user.incomeRange;
      const birthDate = user.birthDate;


      // Gênero
      if (genderStats[gender] !== undefined) {
        genderStats[gender]++;
      }


      // Escolaridade
      if (schoolLevelStats[schoolLevel] !== undefined) {
        schoolLevelStats[schoolLevel]++;
      }


      // Faixa de renda
      if (incomeRangeStats[incomeRange] !== undefined) {
        incomeRangeStats[incomeRange]++;
      }


      // Idade
      if (birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);

        let age =
          today.getFullYear() - birth.getFullYear();

        const monthDiff =
          today.getMonth() - birth.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 &&
            today.getDate() < birth.getDate())
        ) {
          age--;
        }

        if (age <= 14) {
          ageStats.ate_14++;
        } else if (age <= 17) {
          ageStats.de_15_a_17++;
        } else if (age <= 21) {
          ageStats.de_18_a_21++;
        } else if (age <= 25) {
          ageStats.de_22_a_25++;
        } else {
          ageStats.acima_de_25++;
        }
      }
    });


    // =========================
    // RESPOSTA
    // =========================

    res.json({
      success: true,

      data: {
        course: {
          _id: course._id,
          title: course.title,
          enrolledCount: course.enrolledCount,
          maxSlots: course.maxSlots,
          occupancy,
        },

        totalEnrollments,

        enrollmentsByMonth: chartData,

        genderStats,
        schoolLevelStats,
        incomeRangeStats,
        ageStats,
        schoolStats,
      },
    });

  } catch (err) {
    next(err);
  }
};

// GET /courses/prerequisite-options?exclude=<courseId>
// Cursos disponíveis para seleção como pré-requisito (a busca por nome é feita no front).
const getPrerequisiteOptions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.exclude) filter._id = { $ne: req.query.exclude };

    // Professor não enxerga rascunhos de outros professores
    if (req.user.role === 'professor') {
      filter.$or = [
        { status: { $ne: COURSE_STATUS.DRAFT } },
        { professor: req.user.id },
        { allowedProfessors: req.user.id },
      ];
    }

    const courses = await Course.find(filter)
      .select('title status startDate')
      .sort({ title: 1 })
      .lean();

    res.json({ success: true, data: courses });
  } catch (err) { next(err); }
};

const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,

      scheduleType,
      scheduleConfig,

      modality,
      location,

      maxSlots,
      status,
      imageUrl,
      instructor,
      materials,

      enrollmentType,

      prerequisites,

      startDate,
      endDate,

      isExternal,
      externalUrl,
      externalMessage,
    } = req.body;

    validateSchedule({
      scheduleType,
      scheduleConfig,
      startDate,
      endDate,
    });

    const period = getCoursePeriod({
      scheduleType,
      scheduleConfig,
      startDate,
      endDate,
    });

    const prerequisiteIds = await resolvePrerequisites(prerequisites);

    const course = await Course.create({
      title,
      description,

      scheduleType,
      scheduleConfig,

      startDate: period.startDate,
      endDate: period.endDate,

      modality: modality || 'presencial',
      location: location || '',

      professor: req.user.id,

      instructor: instructor || '',

      materials: materials || [],

      maxSlots,

      status: status || COURSE_STATUS.DRAFT,

      enrollmentType: enrollmentType || 'open',

      prerequisites: prerequisiteIds,

      ...normalizeExternal({ isExternal, externalUrl, externalMessage }),

      imageUrl: imageUrl || null,
    });

    await generateLessons({
      courseId: course._id,
      scheduleType,
      scheduleConfig,
      startDate: period.startDate,
      endDate: period.endDate,
      modality,
      location,
      createdBy: req.user.id,
    });

    await course.populate(
      'professor',
      'name email'
    );

    await course.populate('prerequisites', 'title status');

    res.status(201).json({
      success: true,
      data: course,
    });

  } catch (err) {
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado',
      });
    }

    if (!course.hasManageAccess(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para editar este curso',
      });
    }

    const {
      scheduleType,
      scheduleConfig,
      startDate,
      endDate,
    } = req.body;

    // Whitelist de campos editáveis — evita mass-assignment de campos sensíveis
    // (enrolledCount, phase, professor, allowedProfessors, etc.)
    const ALLOWED_FIELDS = [
      'title',
      'description',
      'modality',
      'location',
      'maxSlots',
      'status',
      'imageUrl',
      'instructor',
      'materials',
      'enrollmentType',
    ];

    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Pré-requisitos: [] remove todos; undefined mantém o que já existe
    if (req.body.prerequisites !== undefined) {
      updates.prerequisites = await resolvePrerequisites(req.body.prerequisites, course._id);
    }

    // Plataforma externa: só mexe nos campos se algum veio no body.
    // Desativar a opção limpa link e mensagem (ver normalizeExternal).
    const touchesExternal = ['isExternal', 'externalUrl', 'externalMessage']
      .some((f) => req.body[f] !== undefined);
    if (touchesExternal) {
      Object.assign(updates, normalizeExternal({
        isExternal: req.body.isExternal ?? course.isExternal,
        externalUrl: req.body.externalUrl ?? course.externalUrl,
        externalMessage: req.body.externalMessage ?? course.externalMessage,
      }));
    }

    const prevStatus = course.status;

    const hasScheduleUpdate =
      scheduleType !== undefined ||
      scheduleConfig !== undefined ||
      startDate !== undefined ||
      endDate !== undefined;

    if (hasScheduleUpdate) {

      const finalScheduleType =
        scheduleType || course.scheduleType;

      const finalScheduleConfig =
        scheduleConfig || course.scheduleConfig;

      const finalStartDate =
        startDate || course.startDate;

      const finalEndDate =
        endDate || course.endDate;

      validateSchedule({
        scheduleType: finalScheduleType,
        scheduleConfig: finalScheduleConfig,
        startDate: finalStartDate,
        endDate: finalEndDate,
      });

      const period = getCoursePeriod({
        scheduleType: finalScheduleType,
        scheduleConfig: finalScheduleConfig,
        startDate: finalStartDate,
        endDate: finalEndDate,
      });

      updates.scheduleType =
        finalScheduleType;

      updates.scheduleConfig =
        finalScheduleConfig;

      updates.startDate =
        period.startDate;

      updates.endDate =
        period.endDate;
    }

    const finalStartDate =
      updates.startDate ?? course.startDate;

    const finalEndDate =
      updates.endDate ?? course.endDate;

    const currentStatus =
      updates.status ?? course.status;

    updates.status = getCourseStatus({
      status: currentStatus,
      startDate: finalStartDate,
      endDate: finalEndDate,
    });

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('professor', 'name email')
      .populate('prerequisites', 'title status')
      .populate(
        'allowedProfessors',
        'name email role'
      );

    if (hasScheduleUpdate) {
      // Reconciliação por DATA: aulas de datas mantidas são preservadas
      // intactas (conteúdo/edições), datas removidas são excluídas e datas
      // novas são criadas. Evita reescrever aulas já editadas ao só adicionar
      // uma data nova.
      const desired = buildLessons({
        courseId: updated._id,
        scheduleType: updated.scheduleType,
        scheduleConfig: updated.scheduleConfig,
        startDate: updated.startDate,
        endDate: updated.endDate,
        modality: updated.modality,
        location: updated.location,
        createdBy: req.user.id,
      });

      const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

      const existing = await Lesson.find({ course: course._id });
      const existingKeys = new Set(existing.map((l) => dateKey(l.date)));
      const desiredKeys = new Set(desired.map((l) => dateKey(l.date)));

      // Remove aulas cujas datas saíram do novo cronograma
      const toDelete = existing.filter((l) => !desiredKeys.has(dateKey(l.date)));
      if (toDelete.length) {
        await Lesson.deleteMany({ _id: { $in: toDelete.map((l) => l._id) } });
        // Limpa notificações órfãs das aulas removidas
        toDelete.forEach((l) => removeNotificationsByRef(l._id));
      }

      // Cria apenas as aulas das datas novas (as existentes ficam intactas)
      const toInsert = desired.filter((l) => !existingKeys.has(dateKey(l.date)));
      if (toInsert.length) {
        await Lesson.insertMany(toInsert);
      }

      // Se a agenda realmente mudou (criou/removeu datas), avisa a turma (best-effort)
      if (toDelete.length || toInsert.length) {
        const parts = [];
        if (toInsert.length) parts.push(`${toInsert.length} aula(s) adicionada(s)`);
        if (toDelete.length) parts.push(`${toDelete.length} aula(s) removida(s)`);
        await notifyCourseStudents({
          course: course._id,
          type: NOTIFICATION_TYPES.SCHEDULE,
          title: 'Cronograma atualizado',
          message: parts.join(' e '),
          tab: NOTIFICATION_TABS.CRONOGRAMA,
          createdBy: req.user.id,
        });
      }
    }

    // Link da plataforma externa definido/alterado → avisa a turma (best-effort)
    const prevExternalUrl = course.isExternal ? (course.externalUrl || '') : '';
    const newExternalUrl = updated.isExternal ? (updated.externalUrl || '') : '';
    if (newExternalUrl && newExternalUrl !== prevExternalUrl) {
      await notifyCourseStudents({
        course: course._id,
        type: NOTIFICATION_TYPES.EXTERNAL_LINK,
        title: prevExternalUrl ? 'Link da plataforma externa alterado' : 'Curso em plataforma externa',
        message: prevExternalUrl
          ? 'O endereço de acesso ao curso foi atualizado. Confira o novo link.'
          : 'Este curso será realizado em outra plataforma. Veja como acessar.',
        tab: NOTIFICATION_TABS.EXTERNO,
        createdBy: req.user.id,
      });
    }

    const newStatus = updates.status;

    if (
      newStatus &&
      newStatus !== prevStatus
    ) {
      if (newStatus === COURSE_STATUS.IN_PROGRESS) {
        await Enrollment.updateMany(
          {
            course: course._id,
            status: {
              $in: [
                ENROLLMENT_STATUS.ENROLLED,
                ENROLLMENT_STATUS.COMPLETED,
              ],
            },
          },
          {
            status: ENROLLMENT_STATUS.ACTIVE,
          }
        );
      }

      if (
        newStatus === COURSE_STATUS.PUBLISHED &&
        prevStatus === COURSE_STATUS.CLOSED
      ) {
        await Enrollment.updateMany(
          {
            course: course._id,
            status: ENROLLMENT_STATUS.COMPLETED,
          },
          {
            status: ENROLLMENT_STATUS.ENROLLED,
          }
        );
      }

      if (newStatus === COURSE_STATUS.CLOSED) {
        await Enrollment.updateMany(
          {
            course: course._id,
            status: {
              $in: [
                ENROLLMENT_STATUS.ENROLLED,
                ENROLLMENT_STATUS.ACTIVE,
              ],
            },
          },
          {
            status: ENROLLMENT_STATUS.COMPLETED,
          }
        );
      }
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    // Apenas o criador original ou admin pode deletar
    if (req.user.role !== 'admin' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Apenas o criador do curso ou um admin pode excluí-lo' });

    await course.deleteOne();

    // Remove o curso excluído da lista de pré-requisitos dos demais
    await Course.updateMany(
      { prerequisites: course._id },
      { $pull: { prerequisites: course._id } }
    );

    res.json({ success: true, message: 'Curso excluído com sucesso' });
  } catch (err) { next(err); }
};

// Gerenciar professores com acesso ao curso (somente admin e criador do curso)
const addAllowedProfessor = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    // Só o criador do curso ou admin pode gerenciar permissões
    if (req.user.role !== 'admin' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Apenas o criador do curso pode gerenciar permissões' });

    const { professorId } = req.body;
    if (!professorId)
      return res.status(400).json({ success: false, message: 'professorId é obrigatório' });

    // Verifica se já está na lista
    if (course.allowedProfessors.some(p => p.toString() === professorId))
      return res.status(409).json({ success: false, message: 'Professor já tem acesso a este curso' });

    course.allowedProfessors.push(professorId);
    await course.save();
    await course.populate('allowedProfessors', 'name email role');

    res.json({ success: true, data: course.allowedProfessors });
  } catch (err) { next(err); }
};

const removeAllowedProfessor = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (req.user.role !== 'admin' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Apenas o criador do curso pode gerenciar permissões' });

    // Se o professor removido é o ministrador do certificado e perderia o acesso:
    // antes da 1ª emissão volta ao padrão (criador); depois da emissão, bloqueia.
    if (course.certificateInstructor?.toString() === req.params.professorId) {
      const removed = await User.findById(req.params.professorId).select('role');
      const keepsAccess = removed && ROLE_HIERARCHY[removed.role] >= ROLE_HIERARCHY[ROLES.ADMIN];
      if (!keepsAccess) {
        if (await isInstructorLocked(course))
          return res.status(409).json({
            success: false,
            message: 'Este professor é o ministrador dos certificados já emitidos e não pode perder o acesso ao curso.',
          });
        course.certificateInstructor = null;
      }
    }

    course.allowedProfessors = course.allowedProfessors.filter(
      p => p.toString() !== req.params.professorId
    );
    await course.save();

    res.json({ success: true, message: 'Acesso removido com sucesso' });
  } catch (err) { next(err); }
};

const changeCoursePhase = async (req, res, next) => {
  try {
    const { phase } = req.body;
    if (!Object.values(COURSE_PHASE).includes(phase)) return res.status(400).json({ success: false, message: 'Fase inválida' });

    const course = req.course;
    course.phase = phase;

    if (phase === COURSE_PHASE.IN_PROGRESS) {
      await Enrollment.updateMany(
        { course: course._id, status: ENROLLMENT_STATUS.ENROLLED },
        { status: ENROLLMENT_STATUS.ACTIVE }
      );
    } else if (phase === COURSE_PHASE.ENDED) {
      await Enrollment.updateMany(
        { course: course._id, status: { $in: [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.ACTIVE] } },
        { status: ENROLLMENT_STATUS.COMPLETED }
      );
      course.status = COURSE_STATUS.CLOSED;
    }

    await course.save();

    // Curso encerrado → convida os alunos a avaliar (se houver formulário publicado)
    if (phase === COURSE_PHASE.ENDED) {
      await notifyFeedbackAvailable({ course: course._id, createdBy: req.user.id });
    }

    const populated = await Course.findById(course._id).populate('professor', 'name email').populate('allowedProfessors', 'name email');
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/certificate-instructor-options — pessoas que podem ser
// escolhidas como ministrador (todas com acesso ao curso). Gestores do curso.
const getCertificateInstructorOptions = async (req, res, next) => {
  try {
    const users = await getEligibleInstructors(req.course);
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// PATCH /courses/:id/certificate-settings — body: { instructorId?, signatureFont? }
//  - instructorId: id do ministrador (null/'' = padrão: professor criador)
//  - signatureFont: fonte da assinatura (null/'' = a da própria pessoa)
// Só admin, superadmin ou o professor criador. O ministrador não muda após a
// emissão do 1º certificado (a fonte pode mudar; certificados emitidos têm a
// assinatura congelada e não são afetados).
const updateCertificateSettings = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course)
      return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (!canEditCertificateSettings(course, req.user))
      return res.status(403).json({
        success: false,
        message: 'Apenas o criador do curso, administradores e superadministradores podem alterar o certificado',
      });

    const { instructorId, signatureFont } = req.body;
    if (instructorId === undefined && signatureFont === undefined)
      return res.status(400).json({ success: false, message: 'Nenhuma alteração informada' });

    const set = {};
    const filter = { _id: course._id };

    if (instructorId !== undefined) {
      let nextId = instructorId ? String(instructorId) : null;
      if (nextId && nextId === String(course.professor)) nextId = null; // criador = padrão

      const currentId = course.certificateInstructor ? String(course.certificateInstructor) : null;

      if (nextId !== currentId) {
        if (await isInstructorLocked(course))
          return res.status(409).json({
            success: false,
            message: 'O ministrador não pode mais ser alterado: já foi emitido um certificado neste curso',
          });

        if (nextId) {
          const person = await User.findById(nextId).select('name role');
          if (!person || !hasCourseAccess(course, person))
            return res.status(400).json({
              success: false,
              message: 'Só é possível escolher uma pessoa que tenha acesso ao curso',
            });
        }

        set.certificateInstructor = nextId;
        filter.certificateInstructorLockedAt = null; // atômico: não grava se travou no meio
      }
    }

    if (signatureFont !== undefined) {
      const font = signatureFont || null;
      if (font && !VALID_FONTS.includes(font))
        return res.status(400).json({ success: false, message: 'Fonte de assinatura inválida' });
      set.certificateSignatureFont = font;
    }

    if (Object.keys(set).length) {
      const updated = await Course.findOneAndUpdate(filter, { $set: set }, { new: true });
      if (!updated)
        return res.status(409).json({
          success: false,
          message: 'O ministrador não pode mais ser alterado: já foi emitido um certificado neste curso',
        });
      course = updated;
    }

    const settings = await buildCertificateSettings(course);
    res.json({ success: true, data: JSON.parse(JSON.stringify(settings)) });
  } catch (err) { next(err); }
};

module.exports = {
  getCertificateInstructorOptions, updateCertificateSettings,
  getCourses, getAllCourses, getCourse, getCourseStats,
  getPrerequisiteOptions,
  createCourse, updateCourse, deleteCourse,
  addAllowedProfessor, removeAllowedProfessor,
  changeCoursePhase,
};