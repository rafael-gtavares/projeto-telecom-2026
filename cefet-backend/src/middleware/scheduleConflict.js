const mongoose = require('mongoose');
const { getScheduleConflicts, sendScheduleConflict } = require('../helpers/enrollmentConflictHelper');

// Bloqueia a matrícula (ou a solicitação de vaga) quando o curso tem aulas no
// mesmo dia e horário de outro curso em que o aluno já está inscrito.
// Lê o curso de req.params.courseId ou req.body.courseId e o aluno de req.user.id.
// Na aprovação de solicitação, approveRequest já troca req.user.id pelo aluno
// (e preenche req._resolvingRequest) antes deste middleware rodar.
const checkScheduleConflict = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body?.courseId;

    // Id ausente/inválido: deixa o controller responder (404/400) como hoje
    if (!courseId || !mongoose.isValidObjectId(courseId)) return next();

    const conflicts = await getScheduleConflicts(req.user.id, courseId);
    if (conflicts.length) {
      return sendScheduleConflict(res, conflicts, { forStudent: !req._resolvingRequest });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkScheduleConflict;