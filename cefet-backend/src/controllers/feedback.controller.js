const mongoose = require('mongoose');
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { getEnrolledStudentIds, notifyFeedbackAvailable } = require('../services/notify');

const QUESTION_TYPES = ['multiple_choice', 'stars', 'text'];

// Limites (segurança: evita payloads gigantes / abuso de armazenamento)
const TEXT_MAX = 1000;       // resposta de texto do aluno
const TITLE_MAX = 300;       // enunciado da questão
const OPTION_MAX = 200;      // texto de cada alternativa
const MAX_QUESTIONS = 30;    // questões por formulário
const MAX_OPTIONS = 8;       // alternativas por questão
const EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1 edição por dia

// Valida e normaliza as questões vindas do body. Retorna { questions } ou { error }.
const sanitizeQuestions = (raw) => {
  if (!Array.isArray(raw)) return { error: 'Formato de questões inválido' };
  if (raw.length > MAX_QUESTIONS) return { error: `Máximo de ${MAX_QUESTIONS} questões por formulário` };

  const questions = [];
  for (const q of raw) {
    if (!QUESTION_TYPES.includes(q?.type))
      return { error: 'Tipo de questão inválido' };
    const title = String(q?.title || '').trim();
    if (!title) return { error: 'Toda questão precisa de um enunciado' };
    if (title.length > TITLE_MAX) return { error: `Enunciado muito longo (máx. ${TITLE_MAX} caracteres)` };

    const clean = { type: q.type, title };
    // Preserva o id da questão já existente (mantém as respostas casadas).
    // Ignora _id inválido para não permitir injeção de valores estranhos.
    if (q._id && mongoose.Types.ObjectId.isValid(q._id)) clean._id = q._id;

    if (q.type === 'multiple_choice') {
      const options = Array.isArray(q.options)
        ? q.options.map((o) => String(o || '').trim()).filter(Boolean)
        : [];
      if (options.length < 2)
        return { error: 'Questões de múltipla escolha precisam de ao menos 2 alternativas' };
      if (options.length > MAX_OPTIONS)
        return { error: `Máximo de ${MAX_OPTIONS} alternativas por questão` };
      if (options.some((o) => o.length > OPTION_MAX))
        return { error: `Alternativa muito longa (máx. ${OPTION_MAX} caracteres)` };
      clean.options = options;
    } else if (q.type === 'stars') {
      const max = Number(q.maxStars);
      if (!Number.isInteger(max) || max < 1 || max > 10)
        return { error: 'A nota máxima das estrelas deve ser um inteiro entre 1 e 10' };
      clean.maxStars = max;
    }

    questions.push(clean);
  }
  return { questions };
};

// Monta as respostas casando cada item recebido com a questão do formulário,
// gravando um snapshot do enunciado/alternativa. Ignora o que for inválido e
// trunca defensivamente textos acima do limite. Compartilhado por criar/editar.
const buildAnswers = (form, incoming) => {
  const list = Array.isArray(incoming) ? incoming : [];
  const byId = new Map(list.map((a) => [String(a?.question), a]));
  const answers = [];

  for (const q of form.questions) {
    const a = byId.get(String(q._id));
    if (!a) continue; // questão não respondida (opcional por questão)

    if (q.type === 'multiple_choice') {
      const idx = Number(a.optionIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) continue;
      answers.push({
        question: q._id, type: q.type, questionTitle: q.title,
        optionIndex: idx, optionText: q.options[idx],
      });
    } else if (q.type === 'stars') {
      const s = Number(a.stars);
      if (!Number.isInteger(s) || s < 0 || s > q.maxStars) continue;
      answers.push({ question: q._id, type: q.type, questionTitle: q.title, stars: s });
    } else if (q.type === 'text') {
      const text = String(a.text || '').trim().slice(0, TEXT_MAX);
      if (!text) continue;
      answers.push({ question: q._id, type: q.type, questionTitle: q.title, text });
    }
  }
  return answers;
};

// Garante que o usuário é um aluno inscrito e o curso está concluído com
// formulário publicado. Retorna { form } ou { status, message } de erro.
const requireAnswerableForm = async (courseId, course, userId) => {
  if (course?.status !== 'closed')
    return { status: 400, message: 'O feedback só fica disponível após a conclusão do curso' };

  const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
  if (!enrollment ||
    [ENROLLMENT_STATUS.WAITING_LIST, ENROLLMENT_STATUS.CANCELED].includes(enrollment.status))
    return { status: 403, message: 'Apenas alunos do curso podem enviar feedback' };

  const form = await FeedbackForm.findOne({ course: courseId, published: true });
  if (!form || form.questions.length === 0)
    return { status: 400, message: 'Este curso não tem formulário de feedback disponível' };

  return { form };
};

// GET /courses/:courseId/feedback/form — formulário para o gestor montar/editar
const getForm = async (req, res, next) => {
  try {
    const form = await FeedbackForm.findOne({ course: req.params.courseId });
    res.json({ success: true, data: { form } });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/feedback/form — cria/atualiza o formulário (gestor)
const saveForm = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { questions, error } = sanitizeQuestions(req.body.questions || []);
    if (error) return res.status(400).json({ success: false, message: error });

    const published = !!req.body.published;

    let form = await FeedbackForm.findOne({ course: courseId });
    if (!form) form = new FeedbackForm({ course: courseId });
    form.questions = questions;
    form.published = published;
    await form.save();

    // Se o curso já está concluído e o formulário foi publicado, convida os
    // alunos a avaliar (best-effort; dedupe interno evita repetição).
    if (published && questions.length > 0 && req.course?.status === 'closed') {
      await notifyFeedbackAvailable({ course: courseId, createdBy: req.user.id });
    }

    res.json({ success: true, data: { form } });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/feedback — visão do aluno (também acessível ao gestor).
// Retorna disponibilidade, o formulário publicado e a resposta já enviada (se houver).
const getStudentFeedback = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = req.course; // populado pelo requireCourseView

    const form = await FeedbackForm.findOne({ course: courseId, published: true }).lean();
    const myResponse = await FeedbackResponse.findOne({ course: courseId, user: req.user.id }).lean();

    const available =
      course?.status === 'closed' && !!form && (form.questions || []).length > 0;

    res.json({ success: true, data: { available, form: available ? form : null, myResponse } });
  } catch (err) { next(err); }
};

// POST /courses/:courseId/feedback/response — o aluno envia o feedback
const submitResponse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const check = await requireAnswerableForm(courseId, req.course, req.user.id);
    if (check.status) return res.status(check.status).json({ success: false, message: check.message });

    const existing = await FeedbackResponse.findOne({ course: courseId, user: req.user.id });
    if (existing)
      return res.status(409).json({ success: false, message: 'Você já enviou o feedback deste curso' });

    const answers = buildAnswers(check.form, req.body.answers);
    if (answers.length === 0)
      return res.status(400).json({ success: false, message: 'Responda ao menos uma questão' });

    const response = await FeedbackResponse.create({ course: courseId, user: req.user.id, answers });
    res.status(201).json({ success: true, data: response });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Você já enviou o feedback deste curso' });
    next(err);
  }
};

// PUT /courses/:courseId/feedback/response — o aluno edita o próprio feedback.
// Regra: no máximo 1 edição por dia (cooldown de 24h, validado no servidor).
const editResponse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const check = await requireAnswerableForm(courseId, req.course, req.user.id);
    if (check.status) return res.status(check.status).json({ success: false, message: check.message });

    const existing = await FeedbackResponse.findOne({ course: courseId, user: req.user.id });
    if (!existing)
      return res.status(404).json({ success: false, message: 'Você ainda não enviou um feedback para editar' });

    // Cooldown: só permite nova edição 24h após a última.
    if (existing.lastEditedAt) {
      const elapsed = Date.now() - new Date(existing.lastEditedAt).getTime();
      if (elapsed < EDIT_COOLDOWN_MS) {
        const nextEditAt = new Date(new Date(existing.lastEditedAt).getTime() + EDIT_COOLDOWN_MS);
        return res.status(429).json({
          success: false,
          message: 'Você só pode editar o feedback uma vez por dia. Tente novamente mais tarde.',
          data: { nextEditAt },
        });
      }
    }

    const answers = buildAnswers(check.form, req.body.answers);
    if (answers.length === 0)
      return res.status(400).json({ success: false, message: 'Responda ao menos uma questão' });

    existing.answers = answers;
    existing.lastEditedAt = new Date();
    existing.editCount += 1;
    await existing.save();

    res.json({ success: true, data: existing });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/feedback/results — respostas + total de alunos (gestor).
// A visão individual e a agregada são montadas no frontend a partir daqui.
const getResults = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const [form, responses, enrolledIds] = await Promise.all([
      FeedbackForm.findOne({ course: courseId }).lean(),
      FeedbackResponse.find({ course: courseId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      getEnrolledStudentIds(courseId),
    ]);

    res.json({
      success: true,
      data: { form, responses, totalStudents: enrolledIds.length },
    });
  } catch (err) { next(err); }
};

module.exports = { getForm, saveForm, getStudentFeedback, submitResponse, editResponse, getResults };
