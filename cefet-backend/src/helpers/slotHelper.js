const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

// Vagas ocupadas = matriculados + reservadas por convites pendentes.
// `$ifNull` cobre cursos antigos gravados antes de existir `reservedCount`.
const occupiedExpr = { $add: ['$enrolledCount', { $ifNull: ['$reservedCount', 0] }] };

// Condição atômica "cabe mais `n` pessoas?" para usar em findOneAndUpdate.
const hasRoomExpr = (n = 1) => ({ $lte: [{ $add: [occupiedExpr, n] }, '$maxSlots'] });

// Tenta ocupar uma vaga atomicamente. Retorna o curso atualizado ou null (lotado).
const takeSlot = (courseId) =>
  Course.findOneAndUpdate(
    { _id: courseId, $expr: hasRoomExpr(1) },
    { $inc: { enrolledCount: 1 } },
    { new: true }
  );

// Promove o primeiro da fila de espera do curso, se houver vaga.
// Retorna true se alguém foi promovido.
const promoteFromWaitlist = async (courseId) => {
  const next = await Enrollment.findOne({ course: courseId, status: ENROLLMENT_STATUS.WAITING_LIST })
    .sort({ createdAt: 1 });
  if (!next) return false;

  const taken = await takeSlot(courseId);
  if (!taken) return false;

  next.status = ENROLLMENT_STATUS.ENROLLED;
  await next.save();
  return true;
};

// Libera a vaga reservada por um convite (recusado/expirado/cancelado) e
// entrega ao primeiro da fila de espera do curso, como no cancelamento.
const releaseReservation = async (courseId) => {
  await Course.updateOne(
    { _id: courseId, reservedCount: { $gt: 0 } },
    { $inc: { reservedCount: -1 } }
  );
  return promoteFromWaitlist(courseId);
};

module.exports = {
  hasRoomExpr,
  takeSlot,
  promoteFromWaitlist,
  releaseReservation,
};
