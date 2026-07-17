const Feedback = require('../models/Feedback');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

// Todos os feedbacks
const getAllFeedbacks = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('user', 'name email')
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: feedbacks });
    } catch (err) { return next(err) }
}

// Feedbacks por curso
const getCourseFeedbacks = async (req, res, next) => {
    try {
        const { idCourse } = req.params;

        if (!idCourse) {
            const err = new Error('Id do curso não enviado');
            err.status = 400;
            return next(err);
        }

        const feedbacks = await Feedback.find({ course: idCourse })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: feedbacks });
    } catch (err) { return next(err) }
}

// Feedbacks favoritados (destacados na Home)
const getFeaturedFeedbacks = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find({ isFeatured: true })
            .populate('user', 'name email')
            .populate('course', 'title')
            .sort({ createdAt: -1 })
            .limit(6); // regra de negócio: no máximo 6 na Home

        return res.status(200).json({ success: true, data: feedbacks });
    } catch (err) { return next(err) }
}

// Criação de feedback
const createFeedback = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { course, content, stars } = req.body;

        if (!course || !content || !stars) {
            const err = new Error('Dados incompletos para criar o feedback');
            err.status = 400;
            return next(err);
        }

        // Verifica se o aluno concluiu o curso
        const enrollment = await Enrollment.findOne({ user: userId, course });
        if (!enrollment || enrollment.status !== ENROLLMENT_STATUS.COMPLETED) {
            const err = new Error('Você precisa concluir o curso para deixar um feedback');
            err.status = 403;
            return next(err);
        }

        // O índice único no model já protege contra duplicados,
        // mas checar antes dá uma mensagem de erro mais clara pro usuário
        const existing = await Feedback.findOne({ user: userId, course });
        if (existing) {
            const err = new Error('Você já enviou um feedback para este curso');
            err.status = 409;
            return next(err);
        }

        const feedback = await Feedback.create({ user: userId, course, content, stars });

        return res.status(201).json({ success: true, data: feedback });
    } catch (err) { return next(err) }
}

// Alternar destaque do feedback (única "edição" permitida, feita pelo admin)
const toggleFeaturedFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            const err = new Error('Feedback não encontrado');
            err.status = 404;
            return next(err);
        }

        // Regra: no máximo 6 destacados ao mesmo tempo
        if (!feedback.isFeatured) {
            const featuredCount = await Feedback.countDocuments({ isFeatured: true });
            if (featuredCount >= 6) {
                const err = new Error('Já existem 6 feedbacks em destaque. Remova um antes de adicionar outro.');
                err.status = 400;
                return next(err);
            }
        }

        feedback.isFeatured = !feedback.isFeatured;
        await feedback.save();

        return res.status(200).json({ success: true, data: feedback });
    } catch (err) { return next(err) }
}

// Exclusão de feedback (aluno exclui o próprio, admin exclui qualquer um)
const deleteFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // mesmo ajuste do createFeedback
        const isAdmin = req.user.role === 'admin'; // ajuste conforme seu padrão de roles

        if (!id) {
            const err = new Error('Id não encontrado');
            err.status = 400;
            return next(err);
        }

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            const err = new Error('Feedback não encontrado');
            err.status = 404;
            return next(err);
        }

        if (!isAdmin && feedback.user.toString() !== userId) {
            const err = new Error('Você não tem permissão para excluir este feedback');
            err.status = 403;
            return next(err);
        }

        await feedback.deleteOne();

        return res.status(200).json({ success: true, message: 'Feedback excluído com sucesso.' });
    } catch (err) { return next(err) }
}

module.exports = {
    getAllFeedbacks,
    getCourseFeedbacks,
    getFeaturedFeedbacks,
    createFeedback,
    toggleFeaturedFeedback,
    deleteFeedback
}