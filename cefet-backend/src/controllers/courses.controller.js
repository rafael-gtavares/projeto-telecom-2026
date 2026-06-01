const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Listagem pública (home) — apenas publicados
const getCourses = async (req, res, next) => {
  try {
    const { status, modality, page = 1, limit = 12 } = req.query;
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
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);

    // Se o usuário estiver autenticado, verifica inscrição em lote (evita N+1 no frontend)
    let enrolledIds = new Set();
    if (req.user?.id) {
      const enrollments = await Enrollment.find(
        { user: req.user.id, course: { $in: courses.map(c => c._id) }, status: { $in: ['inscrito', 'ativo'] } },
        'course'
      );
      enrolledIds = new Set(enrollments.map(e => e.course.toString()));
    }

    const coursesWithEnrollment = courses.map(c => ({
      ...c.toJSON(),
      isEnrolled: enrolledIds.has(c._id.toString()),
    }));

    res.json({ success: true, data: { courses: coursesWithEnrollment, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

// Listagem para o painel admin/professor — respeita visibilidade por dono
const getAllCourses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
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
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);
    res.json({ success: true, data: { courses, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('professor', 'name email')
      .populate('allowedProfessors', 'name email role');
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

const createCourse = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate, modality, location, maxSlots, status, imageUrl, instructor } = req.body;
    const course = await Course.create({
      title, description, startDate, endDate,
      modality: modality || 'presencial',
      location: location || '',
      professor: req.user.id,   // SEMPRE o usuário logado — nunca aceita professor do body
      instructor: instructor || '',
      maxSlots, status,
      imageUrl: imageUrl || null,
    });
    await course.populate('professor', 'name email');
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (!course.hasManageAccess(req.user.id, req.user.role))
      return res.status(403).json({ success: false, message: 'Sem permissão para editar este curso' });

    // Campos que NÃO podem ser alterados via update: professor, allowedProfessors (tem endpoint próprio)
    const { professor: _, allowedProfessors: __, ...updates } = req.body;

    const prevStatus = course.status;
    const newStatus = updates.status;

    const updated = await Course.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('professor', 'name email')
      .populate('allowedProfessors', 'name email role');

    // Sincroniza matrículas quando status muda
    if (newStatus && newStatus !== prevStatus) {
      if (newStatus === 'em_andamento') {
        // inscritos → ativos; se estava fechado (concluido), volta a ativo
        await Enrollment.updateMany(
          { course: course._id, status: { $in: ['inscrito', 'concluido'] } },
          { status: 'ativo' }
        );
      } else if (newStatus === 'published') {
        // se estava fechado (concluido), volta para inscrito
        if (prevStatus === 'closed') {
          await Enrollment.updateMany(
            { course: course._id, status: 'concluido' },
            { status: 'inscrito' }
          );
        }
      } else if (newStatus === 'closed') {
        await Enrollment.updateMany(
          { course: course._id, status: { $in: ['inscrito', 'ativo'] } },
          { status: 'concluido' }
        );
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
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
    if (!valid.includes(phase)) return res.status(400).json({ message: 'Fase inválida' });

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
    res.json({ data: populated });
  } catch (err) { next(err); }
};

module.exports = {
  getCourses, getAllCourses, getCourse,
  createCourse, updateCourse, deleteCourse,
  addAllowedProfessor, removeAllowedProfessor,
  changeCoursePhase,
};