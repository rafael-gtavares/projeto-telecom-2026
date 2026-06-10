const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Permite visualizar o conteúdo de um curso (aulas, materiais) apenas para:
//  - quem tem acesso de gestão (admin, criador ou allowedProfessor), ou
//  - alunos efetivamente inscritos no curso.
// Evita que qualquer conta logada leia aulas/materiais (incluindo meetingUrl)
// de cursos em que não participa.
const requireCourseView = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (course.hasManageAccess(req.user.id, req.user.role)) {
      req.course = course;
      return next();
    }

    const enrolled = await Enrollment.exists({ user: req.user.id, course: courseId });
    if (!enrolled)
      return res.status(403).json({ success: false, message: 'Você não tem acesso a este curso' });

    req.course = course;
    next();
  } catch (err) { next(err); }
};

module.exports = requireCourseView;
