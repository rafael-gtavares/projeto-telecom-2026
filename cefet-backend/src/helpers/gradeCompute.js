const Enrollment = require('../models/Enrollment');
const Assessment = require('../models/Assessment');
const AssessmentScore = require('../models/AssessmentScore');
const GradingConfig = require('../models/GradingConfig');
const { GRADING_METHODS, DEFAULT_CONFIG } = require('../constants/gradingMethods');
const { ENROLLMENT_SITUATION } = require('../constants/enrollmentSituation');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

// Config do curso, com defaults quando o admin ainda não configurou.
const getConfig = async (courseId) => {
  const cfg = await GradingConfig.findOne({ course: courseId }).lean();
  return {
    method: cfg?.method || DEFAULT_CONFIG.method,
    passingGrade: cfg?.passingGrade ?? DEFAULT_CONFIG.passingGrade,
  };
};

// Calcula a nota final a partir das avaliações do curso e das notas do aluno.
// `scoreMap` deve conter APENAS notas de avaliações publicadas (o cálculo e o
// status só consideram o que já foi publicado). `assessments` é a lista completa
// (inclui não publicadas) para saber se o curso já foi todo lançado.
const computeFinal = (method, assessments, scoreMap) => {
  const graded = assessments.filter((a) => scoreMap.has(String(a._id)));
  const allGraded = assessments.length > 0 && graded.length === assessments.length;

  let final = null;
  if (graded.length > 0) {
    if (method === GRADING_METHODS.SUM) {
      final = graded.reduce((s, a) => s + scoreMap.get(String(a._id)), 0);
    } else if (method === GRADING_METHODS.WEIGHTED) {
      const wsum = graded.reduce((s, a) => s + (a.weight || 0), 0);
      final = wsum > 0
        ? graded.reduce((s, a) => s + scoreMap.get(String(a._id)) * (a.weight || 0), 0) / wsum
        : 0;
    } else {
      // média simples
      final = graded.reduce((s, a) => s + scoreMap.get(String(a._id)), 0) / graded.length;
    }
  }

  // Total de referência: no modo soma é a pontuação máxima possível do curso.
  const total = method === GRADING_METHODS.SUM
    ? assessments.reduce((s, a) => s + (a.maxScore || 0), 0)
    : null;

  return { final, total, allGraded, gradedCount: graded.length };
};

// Situação automática a partir da nota final.
//  - Sem nota lançada → "em andamento" (nao_lancado)
//  - Soma: aprova assim que atinge a pontuação (pontos só sobem); reprova só
//    quando tudo lançado e ainda abaixo.
//  - Médias: só decide (aprova/reprova) quando todas as avaliações foram lançadas.
const autoSituation = (method, passingGrade, final, allGraded) => {
  if (final == null) return ENROLLMENT_SITUATION.NOT_RELEASED;
  const reached = final >= passingGrade;

  if (method === GRADING_METHODS.SUM) {
    if (reached) return ENROLLMENT_SITUATION.APPROVED;
    return allGraded ? ENROLLMENT_SITUATION.FAILED : ENROLLMENT_SITUATION.NOT_RELEASED;
  }

  if (!allGraded) return ENROLLMENT_SITUATION.NOT_RELEASED;
  return reached ? ENROLLMENT_SITUATION.APPROVED : ENROLLMENT_SITUATION.FAILED;
};

// Monta o mapa avaliação→nota considerando apenas avaliações publicadas.
const buildScoreMap = (assessments, scores) => {
  const publishedIds = new Set(
    assessments.filter((a) => a.published).map((a) => String(a._id))
  );
  return new Map(
    scores
      .filter((s) => publishedIds.has(String(s.assessment)))
      .map((s) => [String(s.assessment), s.score])
  );
};

const round2 = (n) => (n == null ? null : Number(n.toFixed(2)));

// Recalcula a nota final e a situação (automática) de UM aluno.
// Não sobrescreve a situação quando ela foi definida manualmente pelo admin.
const recomputeEnrollment = async (courseId, studentId) => {
  const enrollment = await Enrollment.findOne({ course: courseId, user: studentId });
  if (!enrollment) return null;

  const { method, passingGrade } = await getConfig(courseId);
  const [assessments, scores] = await Promise.all([
    Assessment.find({ course: courseId }).lean(),
    AssessmentScore.find({ course: courseId, student: studentId }).lean(),
  ]);

  const scoreMap = buildScoreMap(assessments, scores);
  const { final, allGraded } = computeFinal(method, assessments, scoreMap);

  enrollment.averageGrade = round2(final);
  if (!enrollment.situationManual) {
    enrollment.situation = autoSituation(method, passingGrade, final, allGraded);
  }
  await enrollment.save();
  return enrollment;
};

// Recalcula todos os alunos com vaga confirmada no curso. Usado quando muda a
// config, uma avaliação (peso/valor) ou um lote de notas.
const recomputeCourse = async (courseId) => {
  const [{ method, passingGrade }, enrollments, assessments, allScores] = await Promise.all([
    getConfig(courseId),
    Enrollment.find({
      course: courseId,
      status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
    }),
    Assessment.find({ course: courseId }).lean(),
    AssessmentScore.find({ course: courseId }).lean(),
  ]);

  const scoresByStudent = new Map();
  for (const s of allScores) {
    const k = String(s.student);
    if (!scoresByStudent.has(k)) scoresByStudent.set(k, []);
    scoresByStudent.get(k).push(s);
  }

  await Promise.all(enrollments.map((e) => {
    const scoreMap = buildScoreMap(assessments, scoresByStudent.get(String(e.user)) || []);
    const { final, allGraded } = computeFinal(method, assessments, scoreMap);
    e.averageGrade = round2(final);
    if (!e.situationManual) {
      e.situation = autoSituation(method, passingGrade, final, allGraded);
    }
    return e.save();
  }));
};

module.exports = {
  getConfig,
  computeFinal,
  autoSituation,
  recomputeEnrollment,
  recomputeCourse,
};
