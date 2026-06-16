const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const School = require('../models/School');
const Lesson = require('../models/Lesson');

const {
  validateSchedule,
  getCoursePeriod,
  buildLessons,
  generateLessons,
} = require('../helpers/scheduleHelper');

const {
  updateCourseStatuses,
} = require('../helpers/courseStatusHelper');

// Listagem pública (home) — apenas publicados
const getCourses = async (req, res, next) => {
  try {
    const { status, modality, page = 1 } = req.query;
    // Teto de paginação para evitar abuso (ex.: limit=999999)
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const filter = {};

    if (req.user?.role === 'aluno' || !req.user) {
      filter.status = 'published';
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    // Filtro por modalidade (opcional)
    if (modality && modality !== 'all') filter.modality = modality;

    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-materials');

    const total = await Course.countDocuments(filter);

    // Se o usuário estiver autenticado, verifica inscrição em lote (evita N+1 no frontend).
    // Distingue inscrição com vaga (isEnrolled) de fila de espera (isWaitlisted).
    let enrolledIds = new Set();
    let waitlistedIds = new Set();
    if (req.user?.id) {
      const enrollments = await Enrollment.find(
        { user: req.user.id, course: { $in: courses.map(c => c._id) } },
        'course status'
      );
      for (const e of enrollments) {
        if (e.status === 'fila_espera') waitlistedIds.add(e.course.toString());
        else enrolledIds.add(e.course.toString());
      }
    }

    const coursesWithEnrollment = courses.map(c => ({
      ...c.toJSON(),
      isEnrolled: enrolledIds.has(c._id.toString()),
      isWaitlisted: waitlistedIds.has(c._id.toString()),
    }));

    res.json({ success: true, data: { courses: coursesWithEnrollment, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

// Listagem para o painel admin/professor — respeita visibilidade por dono
const getAllCourses = async (req, res, next) => {
  try {

    await updateCourseStatuses();
    
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
    await updateCourseStatuses();

    const course = await Course.findById(req.params.id)
      .populate('professor', 'name email')
      .populate('allowedProfessors', 'name email role');
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    // Rascunhos (draft) são privados: só quem gerencia o curso pode vê-los.
    // Cursos published/em_andamento/closed seguem acessíveis (aluno inscrito precisa deles).
    if (course.status === 'draft' && !course.hasManageAccess(req.user.id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para acessar este curso' });
    }

    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

const getCourseStats = async (req, res, next) => {
  try {
    await updateCourseStatuses();

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

      startDate,
      endDate,
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

      status: status || 'draft',

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
      'materials'
    ];

    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
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

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('professor', 'name email')
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
      }

      // Cria apenas as aulas das datas novas (as existentes ficam intactas)
      const toInsert = desired.filter((l) => !existingKeys.has(dateKey(l.date)));
      if (toInsert.length) {
        await Lesson.insertMany(toInsert);
      }
    }

    const newStatus = updates.status;

    if (
      newStatus &&
      newStatus !== prevStatus
    ) {
      if (newStatus === 'em_andamento') {
        await Enrollment.updateMany(
          {
            course: course._id,
            status: {
              $in: [
                'inscrito',
                'concluido',
              ],
            },
          },
          {
            status: 'ativo',
          }
        );
      }

      if (
        newStatus === 'published' &&
        prevStatus === 'closed'
      ) {
        await Enrollment.updateMany(
          {
            course: course._id,
            status: 'concluido',
          },
          {
            status: 'inscrito',
          }
        );
      }

      if (newStatus === 'closed') {
        await Enrollment.updateMany(
          {
            course: course._id,
            status: {
              $in: [
                'inscrito',
                'ativo',
              ],
            },
          },
          {
            status: 'concluido',
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
    const valid = ['aguardando_inicio', 'em_andamento', 'encerrado'];
    if (!valid.includes(phase)) return res.status(400).json({ success: false, message: 'Fase inválida' });

    const course = req.course;
    course.phase = phase;

    if (phase === 'em_andamento') {
      await Enrollment.updateMany({ course: course._id, status: 'inscrito' }, { status: 'ativo' });
    } else if (phase === 'encerrado') {
      await Enrollment.updateMany(
        { course: course._id, status: { $in: ['inscrito', 'ativo'] } },
        { status: 'concluido' }
      );
      course.status = 'closed';
    }

    await course.save();
    const populated = await Course.findById(course._id).populate('professor', 'name email').populate('allowedProfessors', 'name email');
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

module.exports = {
  getCourses, getAllCourses, getCourse, getCourseStats,
  createCourse, updateCourse, deleteCourse,
  addAllowedProfessor, removeAllowedProfessor,
  changeCoursePhase,
};