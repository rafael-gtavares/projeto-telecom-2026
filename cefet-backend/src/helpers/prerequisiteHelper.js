const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ENROLLMENT_SITUATION } = require('../constants/enrollmentSituation');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { getCourseStatus } = require('./courseStatusHelper');

// Aceita ObjectId, string ou documento populado.
const toId = (p) => String(p?._id || p);

const httpError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Impede ciclos (A exige B e B exige A → ninguém conseguiria se inscrever).
// Percorre os pré-requisitos dos pré-requisitos; se chegar no próprio curso, falha.
const assertNoCycle = async (courseId, prereqIds) => {
  const target = String(courseId);
  const visited = new Set();
  let frontier = prereqIds;

  while (frontier.length) {
    const courses = await Course.find({ _id: { $in: frontier } }, 'prerequisites').lean();
    const next = [];

    for (const c of courses) {
      for (const p of c.prerequisites || []) {
        const id = String(p);
        if (id === target) {
          throw httpError('Pré-requisitos circulares: um dos cursos selecionados já exige este curso.');
        }
        if (!visited.has(id)) {
          visited.add(id);
          next.push(id);
        }
      }
    }
    frontier = next;
  }
};

// Valida e normaliza a lista de pré-requisitos vinda do body.
// Opcional: undefined/null/[] → []. `courseId` só é passado na edição.
const resolvePrerequisites = async (raw, courseId = null) => {
  if (raw === undefined || raw === null || raw === '') return [];
  if (!Array.isArray(raw)) throw httpError('Pré-requisitos inválidos.');

  const ids = [...new Set(raw.map(toId))];

  if (!ids.every((id) => mongoose.isValidObjectId(id))) {
    throw httpError('Pré-requisitos inválidos.');
  }
  if (courseId && ids.includes(String(courseId))) {
    throw httpError('Um curso não pode ser pré-requisito de si mesmo.');
  }
  if (!ids.length) return [];

  const found = await Course.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) {
    throw httpError('Um ou mais cursos selecionados como pré-requisito não existem.');
  }

  if (courseId) await assertNoCycle(courseId, ids);

  return ids;
};

// Calcula, em lote, se o usuário cumpre os pré-requisitos de cada curso.
// Retorna Map<courseId, { met: boolean, missing: [{ _id, title }] }>.
//
// "Concluído" = inscrição do aluno no pré-requisito com status `concluido`
// (ou curso já encerrado) e situação diferente de reprovado/desistente.
// Cursos sem lançamento de notas (palestras etc.) ficam como `nao_lancado` e
// contam como concluídos.
const getPrerequisiteStatusMap = async (userId, courses) => {
  const result = new Map();

  const allIds = [
    ...new Set(courses.flatMap((c) => (c.prerequisites || []).map(toId))),
  ];

  const titles = new Map();
  const completed = new Set();

  if (allIds.length) {
    const [prereqCourses, enrollments] = await Promise.all([
      Course.find({ _id: { $in: allIds } }, 'title status startDate endDate').lean(),
      Enrollment.find(
        {
          user: userId,
          course: { $in: allIds },
          status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
          situation: { $nin: [ENROLLMENT_SITUATION.FAILED, ENROLLMENT_SITUATION.DROPPED_OUT] },
        },
        'course status'
      ).lean(),
    ]);

    const courseById = new Map();
    for (const c of prereqCourses) {
      courseById.set(String(c._id), c);
      titles.set(String(c._id), c.title);
    }

    for (const e of enrollments) {
      const c = courseById.get(String(e.course));
      if (!c) continue;

      // Usa o status "real" pelas datas — o campo no banco pode estar defasado
      // até alguém acionar o updateCourseStatus.
      const effective = getCourseStatus({
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
      });

      if (e.status === ENROLLMENT_STATUS.COMPLETED || effective === COURSE_STATUS.CLOSED) {
        completed.add(String(e.course));
      }
    }
  }

  for (const c of courses) {
    // Pré-requisito que foi excluído (não está em `titles`) é ignorado.
    const missing = (c.prerequisites || [])
      .map(toId)
      .filter((id) => titles.has(id) && !completed.has(id))
      .map((id) => ({ _id: id, title: titles.get(id) }));

    result.set(String(c._id), { met: missing.length === 0, missing });
  }

  return result;
};

const getPrerequisiteStatus = async (userId, course) => {
  const map = await getPrerequisiteStatusMap(userId, [course]);
  return map.get(String(course._id));
};

// 403 padronizado — o front usa `code` e `missingPrerequisites`.
const sendPrerequisitesNotMet = (res, missing) =>
  res.status(403).json({
    success: false,
    code: 'PREREQUISITES_NOT_MET',
    message: `Pré-requisitos não concluídos: ${missing.map((m) => m.title).join(', ')}.`,
    missingPrerequisites: missing,
  });

module.exports = {
  resolvePrerequisites,
  getPrerequisiteStatusMap,
  getPrerequisiteStatus,
  sendPrerequisitesNotMet,
};