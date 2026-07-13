const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const AssessmentScore = require('../models/AssessmentScore');
const GradingConfig = require('../models/GradingConfig');
const Enrollment = require('../models/Enrollment');
const { GRADING_METHODS } = require('../constants/gradingMethods');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ASSESSMENT_TYPES } = require('../constants/assessmentTypes');
const { getConfig, recomputeCourse } = require('../helpers/gradeCompute');
const { notifyGradesPublished } = require('../services/notify');

const TYPES = Object.values(ASSESSMENT_TYPES);
const TITLE_MAX = 120;
const MAX_ASSESSMENTS = 40;

// IDs dos alunos com vaga confirmada (mesma regra de getCourseStudents).
const getEnrolledIds = async (courseId) => {
  const rows = await Enrollment.find({
    course: courseId,
    status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
  }, 'user').lean();
  return new Set(rows.map((r) => String(r.user)));
};

// Normaliza/valida o corpo de uma avaliação (create/update).
const sanitizeAssessment = (body) => {
  const title = String(body.title || '').trim();
  if (!title) return { error: 'O título da avaliação é obrigatório' };
  if (title.length > TITLE_MAX) return { error: `O título deve ter até ${TITLE_MAX} caracteres` };

  const type = TYPES.includes(body.type) ? body.type : ASSESSMENT_TYPES.EXAM;

  let maxScore = Number(body.maxScore);
  if (!Number.isFinite(maxScore) || maxScore < 0.5 || maxScore > 1000) maxScore = 10;

  let weight = Number(body.weight);
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) weight = 1;

  return { data: { title, type, maxScore, weight } };
};

// GET /courses/:courseId/assessments — dados completos para o gestor
const getAssessments = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const [config, assessments, scores] = await Promise.all([
      getConfig(courseId),
      Assessment.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).lean(),
      AssessmentScore.find({ course: courseId }).lean(),
    ]);
    res.json({ success: true, data: { config, assessments, scores } });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/assessments/my — visão do aluno inscrito
const getMyAssessments = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const enrollment = await Enrollment.findOne({
      course: courseId,
      user: req.user.id,
      status: { $ne: ENROLLMENT_STATUS.WAITING_LIST },
    });
    if (!enrollment)
      return res.status(403).json({ success: false, message: 'Você não está inscrito neste curso' });

    const [config, assessments, myScores] = await Promise.all([
      getConfig(courseId),
      Assessment.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).lean(),
      AssessmentScore.find({ course: courseId, student: req.user.id }).lean(),
    ]);

    const scoreMap = new Map(myScores.map((s) => [String(s.assessment), s.score]));

    // O total (soma) considera todas as avaliações previstas do curso.
    const total = config.method === GRADING_METHODS.SUM
      ? assessments.reduce((s, a) => s + (a.maxScore || 0), 0)
      : null;

    const list = assessments.map((a) => ({
      _id: a._id,
      title: a.title,
      type: a.type,
      maxScore: a.maxScore,
      weight: a.weight,
      published: a.published,
      // Só mostra a nota quando a avaliação está publicada.
      score: a.published && scoreMap.has(String(a._id)) ? scoreMap.get(String(a._id)) : null,
    }));

    res.json({
      success: true,
      data: {
        config: { method: config.method, passingGrade: config.passingGrade, total },
        assessments: list,
        situation: enrollment.situation,
        finalScore: enrollment.averageGrade,
      },
    });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/assessments/config
const updateConfig = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const method = Object.values(GRADING_METHODS).includes(req.body.method)
      ? req.body.method
      : GRADING_METHODS.WEIGHTED;

    let passingGrade = Number(req.body.passingGrade);
    if (!Number.isFinite(passingGrade) || passingGrade < 0) passingGrade = 0;

    const config = await GradingConfig.findOneAndUpdate(
      { course: courseId },
      { $set: { method, passingGrade } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Mudar o método/média altera as notas finais e o status automático.
    await recomputeCourse(courseId);

    res.json({ success: true, data: { method: config.method, passingGrade: config.passingGrade } });
  } catch (err) { next(err); }
};

// POST /courses/:courseId/assessments
const createAssessment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const { error, data } = sanitizeAssessment(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const count = await Assessment.countDocuments({ course: courseId });
    if (count >= MAX_ASSESSMENTS)
      return res.status(400).json({ success: false, message: `Limite de ${MAX_ASSESSMENTS} avaliações por curso` });

    const assessment = await Assessment.create({ course: courseId, ...data, order: count });
    res.status(201).json({ success: true, data: assessment });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/assessments/:assessmentId
const updateAssessment = async (req, res, next) => {
  try {
    const { courseId, assessmentId } = req.params;
    const { error, data } = sanitizeAssessment(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const assessment = await Assessment.findOneAndUpdate(
      { _id: assessmentId, course: courseId },
      { $set: data },
      { new: true }
    );
    if (!assessment)
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });

    // Peso/valor mudaram → recalcula as médias.
    await recomputeCourse(courseId);
    res.json({ success: true, data: assessment });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/assessments/:assessmentId
const deleteAssessment = async (req, res, next) => {
  try {
    const { courseId, assessmentId } = req.params;
    const assessment = await Assessment.findOneAndDelete({ _id: assessmentId, course: courseId });
    if (!assessment)
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });

    await AssessmentScore.deleteMany({ assessment: assessmentId });
    await recomputeCourse(courseId);
    res.json({ success: true, message: 'Avaliação removida com sucesso' });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/assessments/:assessmentId/scores — lançamento em lote
// body: { scores: [{ studentId, score }], publish: boolean }
// Score em branco/null remove a nota daquele aluno.
const saveScores = async (req, res, next) => {
  try {
    const { courseId, assessmentId } = req.params;
    const { scores, publish } = req.body;

    const assessment = await Assessment.findOne({ _id: assessmentId, course: courseId });
    if (!assessment)
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });

    if (!Array.isArray(scores))
      return res.status(400).json({ success: false, message: 'Lista de notas inválida' });

    const enrolled = await getEnrolledIds(courseId);
    const ops = [];
    const graded = []; // alunos que receberam nota (para notificar)

    for (const item of (scores || [])) {
      const sid = item?.studentId;
      if (!mongoose.Types.ObjectId.isValid(sid) || !enrolled.has(String(sid))) continue;

      const blank = item.score === '' || item.score === null || item.score === undefined;
      if (blank) {
        ops.push({ deleteOne: { filter: { assessment: assessmentId, student: sid } } });
        continue;
      }

      const val = Number(item.score);
      if (!Number.isFinite(val) || val < 0)
        return res.status(400).json({ success: false, message: 'Nota inválida' });
      if (val > assessment.maxScore)
        return res.status(400).json({ success: false, message: `A nota não pode ser maior que ${assessment.maxScore}` });

      ops.push({
        updateOne: {
          filter: { assessment: assessmentId, student: sid },
          update: { $set: { score: val, course: courseId, gradedBy: req.user.id } },
          upsert: true,
        },
      });
      graded.push(String(sid));
    }

    if (ops.length) await AssessmentScore.bulkWrite(ops, { ordered: false });

    const wasPublished = assessment.published;
    if (typeof publish === 'boolean' && publish !== assessment.published) {
      assessment.published = publish;
      await assessment.save();
    }

    // Recalcula finais/status de todos (mudou nota e/ou publicação).
    await recomputeCourse(courseId);

    // Notifica os alunos avaliados só na PRIMEIRA publicação (evita spam ao editar).
    if (assessment.published && !wasPublished && graded.length) {
      notifyGradesPublished({
        course: courseId,
        studentIds: graded,
        assessmentTitle: assessment.title,
        createdBy: req.user.id,
      });
    }

    const [freshScores] = await Promise.all([
      AssessmentScore.find({ course: courseId, assessment: assessmentId }).lean(),
    ]);

    res.json({ success: true, data: { assessment, scores: freshScores } });
  } catch (err) { next(err); }
};

module.exports = {
  getAssessments,
  getMyAssessments,
  updateConfig,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  saveScores,
};
