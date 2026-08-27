const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { notifyFeedbackAvailable } = require('../services/notify');

// As datas de curso são gravadas como meia-noite UTC representando um DIA de
// calendário. Comparar direto com `now` fecharia o curso já à meia-noite UTC,
// que no Brasil (UTC-3) ainda é a noite do dia anterior — daí um evento de
// "amanhã" aparecia como encerrado. Por isso avaliamos o status usando os
// limites do dia no fuso do Brasil (UTC-3, sem horário de verão desde 2019).
const BR_OFFSET_MS = 3 * 60 * 60 * 1000;

// Início do dia (00:00 BR) da data, em ms UTC.
const brDayStart = (d) => {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), 0, 0, 0, 0) + BR_OFFSET_MS;
};

// Fim do dia (23:59:59.999 BR) da data, em ms UTC — o curso só encerra depois disso.
const brDayEnd = (d) => {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), 23, 59, 59, 999) + BR_OFFSET_MS;
};

// Status "correto" de um curso a partir das datas (fonte única da verdade).
// DRAFT é preservado; os demais derivam puramente das datas.
// VACANCIES_CLOSED (vagas encerradas) é um fechamento manual de inscrições,
// não uma fase do curso: antes do início, ele é preservado (assim como DRAFT);
// a partir do início, o curso segue o ciclo normal (em_andamento -> closed),
// já que "vagas encerradas" não é o mesmo que o curso ter acontecido/encerrado.
const getCourseStatus = ({ status, startDate, endDate }) => {
  if (status === COURSE_STATUS.DRAFT) {
    return COURSE_STATUS.DRAFT;
  }

  const now = Date.now();

  if (now > brDayEnd(endDate)) {
    return COURSE_STATUS.CLOSED;
  }

  if (now >= brDayStart(startDate)) {
    return COURSE_STATUS.IN_PROGRESS;
  }

  if (status === COURSE_STATUS.VACANCIES_CLOSED) {
    return COURSE_STATUS.VACANCIES_CLOSED;
  }

  return COURSE_STATUS.PUBLISHED;
};

// Sincroniza os enrollments de um curso conforme a NOVA fase — espelha o que o
// fluxo manual (changeCourseStatus) já faz, para reabertura e fechamento.
const syncEnrollmentsForStatus = async (courseId, target) => {
  if (target === COURSE_STATUS.CLOSED) {
    // encerrou: quem estava cursando conclui
    await Enrollment.updateMany(
      { course: courseId, status: { $in: [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.ACTIVE] } },
      { status: ENROLLMENT_STATUS.COMPLETED }
    );
  } else if (target === COURSE_STATUS.IN_PROGRESS) {
    // em andamento: inscritos (e concluídos, se reabriu) passam a ativos
    await Enrollment.updateMany(
      { course: courseId, status: { $in: [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.COMPLETED] } },
      { status: ENROLLMENT_STATUS.ACTIVE }
    );
  } else if (target === COURSE_STATUS.PUBLISHED) {
    // voltou a "aguardando/inscrições": ativos/concluídos voltam a inscritos
    await Enrollment.updateMany(
      { course: courseId, status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED] } },
      { status: ENROLLMENT_STATUS.ENROLLED }
    );
  }
  // WAITING_LIST e CANCELED nunca são tocados.
};

// Recalcula o status de TODOS os cursos (exceto rascunhos) a partir das datas.
// Bidirecional: além de fechar cursos vencidos, reabre cursos cujas datas
// voltaram para o presente/futuro (ex.: data de uma palestra remarcada).
const updateCourseStatus = async () => {
  const courses = await Course.find(
    { status: { $ne: COURSE_STATUS.DRAFT } },
    '_id status startDate endDate'
  );

  const newlyClosed = [];

  for (const course of courses) {
    const target = getCourseStatus({
      status: course.status,
      startDate: course.startDate,
      endDate: course.endDate,
    });

    if (target === course.status) continue;

    await syncEnrollmentsForStatus(course._id, target);
    await Course.updateOne({ _id: course._id }, { status: target });

    if (target === COURSE_STATUS.CLOSED) newlyClosed.push(course._id);
  }

  // Convida os alunos a avaliar cada curso que ACABOU de fechar (best-effort;
  // só notifica se houver formulário publicado e faz dedupe internamente).
  for (const id of newlyClosed) {
    await notifyFeedbackAvailable({ course: id });
  }
};

module.exports = {
  updateCourseStatus,
  getCourseStatus
};
