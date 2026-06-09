const Course = require('../models/Course');

// Verifica se o usuário logado tem acesso de gestão ao curso (admin, criador ou allowedProfessor)
const requireCourseAccess = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId || req.params.id);
    if (!course)
      return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (!course.hasManageAccess(req.user.id, req.user.role))
      return res.status(403).json({ success: false, message: 'Sem permissão para acessar este curso' });

    req.course = course; // disponibiliza o curso no request para não buscar novamente
    next();
  } catch (err) { next(err); }
};

module.exports = requireCourseAccess;
