const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment')

const getCourses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 12 } = req.query;  // ← REMOVIDO o default 'published'
    const filter = {};
    console.log('User role:', req.user?.role, 'Requested status:', status);

    if (req.user?.role === 'aluno' || !req.user) {
      // Visitantes e alunos: sempre apenas publicados, sem exceção
      filter.status = 'published';
    } else if (status && status !== 'all') {
      // Admin/Professor: aplica filtro se status foi passado E não é 'all'
      filter.status = status;
    }
    // Admin/Professor sem status (ou status='all'): filter fica vazio → retorna todos

    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      // ATUALIZADO: Ordena pela data de início do curso
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);
    res.json({ success: true, data: { courses, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('professor', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

const getAllCourses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 12 } = req.query;
    const filter = {};

    // Aceita opcionalmente filter por status quando passado (ex: draft, published, closed)
    if (status && status !== 'all') filter.status = status;

    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);
    res.json({ success: true, data: { courses, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

const getCourseStats = async (req, res, next) => {
  try {

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    // Professor só pode acessar stats dos próprios cursos
    if (
      req.user.role === 'professor' &&
      course.professor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar estatísticas deste curso'
      });
    }

    const enrollments = await Enrollment.find({
      course: req.params.id
    }).populate({
      path: 'user',
      select: 'gender schoolLevel incomeRange birthDate'
    });

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
      eja: 0
    };

    const incomeRangeStats = {
      ate_1sm: 0,
      '1_a_2sm': 0,
      '2_a_3sm': 0,
      '3_a_5sm': 0,
      acima_5sm: 0,
      prefiro_nao_informar: 0
    };

    const ageStats = {
      ate_14: 0,
      de_15_a_17: 0,
      de_18_a_21: 0,
      de_22_a_25: 0,
      acima_de_25: 0
    };

    // =========================
    // PROCESSAMENTO DAS ESTATÍSTICAS
    // =========================

    enrollments.forEach((enrollment) => {

      const user = enrollment.user;

      if (!user) return;

      const {
        gender,
        schoolLevel,
        incomeRange,
        birthDate
      } = user;

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

        let age = today.getFullYear() - birth.getFullYear();

        const monthDiff = today.getMonth() - birth.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
          age--;
        }

        if (age <= 14) {
          ageStats.ate_14++;
        }

        else if (age <= 17) {
          ageStats.de_15_a_17++;
        }

        else if (age <= 21) {
          ageStats.de_18_a_21++;
        }

        else if (age <= 25) {
          ageStats.de_22_a_25++;
        }

        else {
          ageStats.acima_de_25++;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalEnrollments: enrollments.length,
        genderStats,
        schoolLevelStats,
        incomeRangeStats,
        ageStats
      }
    });

  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    if (req.body.schedule && typeof req.body.schedule === 'string') {
      req.body.schedule = JSON.parse(req.body.schedule);
    }
    const { title, description, schedule, startDate, endDate, professor, maxSlots, status, imageUrl } = req.body;

    const course = await Course.create({
      title,
      description,
      schedule,   // Array de sessões [{dayOfWeek, startTime, endTime}]
      startDate,
      endDate,
      professor: professor || req.user.id,
      maxSlots,
      status,
      imageUrl: imageUrl || null,
    });

    await course.populate('professor', 'name email');
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
};

const updateCourse = async (req, res, next) => {
  try {
    if (req.body.schedule && typeof req.body.schedule === 'string') {
      req.body.schedule = JSON.parse(req.body.schedule);
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (req.user.role === 'professor' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sem permissão para editar este curso' });

    const updates = { ...req.body };

    const updated = await Course.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('professor', 'name email');

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (req.user.role === 'professor' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sem permissão para excluir este curso' });

    await course.deleteOne();
    res.json({ success: true, message: 'Curso excluído com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getCourses, getCourse, getAllCourses, createCourse, updateCourse, deleteCourse, getCourseStats };