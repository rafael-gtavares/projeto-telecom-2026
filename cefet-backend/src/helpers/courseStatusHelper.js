const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { notifyFeedbackAvailable } = require('../services/notify');

const getCourseStatus = ({
  status,
  startDate,
  endDate,
}) => {
  if (status === 'draft') {
    return 'draft';
  }

  const now = new Date();

  if (now < startDate) {
    return 'published';
  }

  if (now > endDate) {
    return 'closed';
  }

  return 'em_andamento';
};

const updateCourseStatus = async () => {
  const now = new Date();

  await Course.updateMany(
    {
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now },
    },
    {
      status: 'em_andamento',
    }
  );

  // Precisa dos IDs ANTES do update, pois updateMany não retorna os documentos alterados
  const coursesClosing = await Course.find(
    {
      status: { $in: ['published', 'em_andamento'] },
      endDate: { $lt: now },
    },
    '_id'
  );

  if (coursesClosing.length === 0) return;

  const closingIds = coursesClosing.map((c) => c._id);

  await Course.updateMany(
    { _id: { $in: closingIds } },
    { status: 'closed' }
  );

  // Sincroniza os enrollments dos cursos que acabaram de fechar
  await Enrollment.updateMany(
    {
      course: { $in: closingIds },
      status: { $in: [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.ACTIVE] },
    },
    { $set: { status: ENROLLMENT_STATUS.COMPLETED } }
  );

  // Convida os alunos a avaliar cada curso que acabou de fechar (best-effort;
  // só notifica se houver formulário publicado e faz dedupe internamente).
  for (const id of closingIds) {
    await notifyFeedbackAvailable({ course: id });
  }
};

module.exports = {
  updateCourseStatus,
  getCourseStatus
};