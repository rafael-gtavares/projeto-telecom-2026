const Grade = require('../models/Grade');
const Enrollment = require('../models/Enrollment');

// GET /courses/:courseId/grades — professor/admin vê todas as notas do curso
const getCourseGrades = async (req, res, next) => {
  try {
    const grades = await Grade.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .populate('material', 'title type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: grades });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/grades/my — aluno vê apenas suas próprias notas
const getMyGrades = async (req, res, next) => {
  try {
    // Verifica se o aluno está inscrito no curso
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: req.params.courseId });
    if (!enrollment)
      return res.status(403).json({ success: false, message: 'Você não está inscrito neste curso' });

    const grades = await Grade.find({ course: req.params.courseId, student: req.user.id })
      .populate('material', 'title type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: grades });
  } catch (err) { next(err); }
};

// POST /courses/:courseId/grades — cria nota para um aluno
const createGrade = async (req, res, next) => {
  try {
    const { studentId, title, type, grade, maxGrade, feedback, materialId } = req.body;
    if (!studentId || !title || !type || grade === undefined)
      return res.status(400).json({ success: false, message: 'Aluno, título, tipo e nota são obrigatórios' });

    if (grade < 0 || grade > (maxGrade || 10))
      return res.status(400).json({ success: false, message: 'Nota inválida' });

    const enrollment = await Enrollment.findOne({ user: studentId, course: req.params.courseId });
    if (!enrollment)
      return res.status(400).json({ success: false, message: 'Aluno não está inscrito neste curso' });

    const newGrade = await Grade.create({
      course: req.params.courseId,
      student: studentId,
      material: materialId || null,
      title, type,
      grade: Number(grade),
      maxGrade: maxGrade || 10,
      feedback: feedback || '',
      gradedBy: req.user.id,
    });

    await newGrade.populate('student', 'name email');
    res.status(201).json({ success: true, data: newGrade });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/grades/:gradeId
const updateGrade = async (req, res, next) => {
  try {
    const gradeDoc = await Grade.findOne({ _id: req.params.gradeId, course: req.params.courseId });
    if (!gradeDoc) return res.status(404).json({ success: false, message: 'Nota não encontrada' });

    const { grade, feedback, title, type } = req.body;
    if (grade !== undefined) gradeDoc.grade = Number(grade);
    if (feedback !== undefined) gradeDoc.feedback = feedback;
    if (title) gradeDoc.title = title;
    if (type) gradeDoc.type = type;

    await gradeDoc.save();
    await gradeDoc.populate('student', 'name email');
    res.json({ success: true, data: gradeDoc });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/grades/:gradeId
const deleteGrade = async (req, res, next) => {
  try {
    const gradeDoc = await Grade.findOneAndDelete({ _id: req.params.gradeId, course: req.params.courseId });
    if (!gradeDoc) return res.status(404).json({ success: false, message: 'Nota não encontrada' });
    res.json({ success: true, message: 'Nota removida com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getCourseGrades, getMyGrades, createGrade, updateGrade, deleteGrade };
