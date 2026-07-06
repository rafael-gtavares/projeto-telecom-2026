const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    stars: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Garante 1 feedback por aluno por curso, direto no banco
feedbackSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);