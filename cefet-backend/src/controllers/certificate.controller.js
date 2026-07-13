const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { CERTIFICATE_STATUS } = require('../constants/certificateStatus');
const { createCertificateDoc, formatWorkload } = require('../services/certificate');

// Mesmos rótulos da UI (utils/formatModality) para o PDF bater com a prévia
const MODALITY_LABELS = {
  presencial: 'Presencial',
  ead: 'EAD',
  semi_presencial: 'Semi-presencial',
  palestra: 'Palestra',
  workshop: 'Workshop',
  outro: 'Outro',
};

const timeToMinutes = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Código de validação estável a partir do id da inscrição
const certIdFor = (enrollmentId) => `CEFET-${String(enrollmentId).slice(-8).toUpperCase()}`;

// GET /courses/:courseId/certificate/pdf — gera o PDF do certificado do aluno logado.
// ?download=1 → força o download; caso contrário abre inline (para preview).
const getCertificatePdf = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    // Um gestor do curso pode pré-visualizar o certificado de um aluno via
    // ?student=<id>. Sem isso, servimos o certificado do próprio usuário logado.
    const isManager = course.hasManageAccess(req.user.id, req.user.role);
    const previewingStudent = req.query.student && isManager ? String(req.query.student) : null;
    const targetUserId = previewingStudent || req.user.id;

    const enrollment = await Enrollment.findOne({ user: targetUserId, course: courseId })
      .populate('user', 'name');

    if (!enrollment ||
      [ENROLLMENT_STATUS.WAITING_LIST, ENROLLMENT_STATUS.CANCELED].includes(enrollment.status))
      return res.status(403).json({ success: false, message: 'Aluno não está inscrito neste curso' });

    if (course.status !== COURSE_STATUS.CLOSED)
      return res.status(400).json({ success: false, message: 'O curso ainda não foi concluído' });

    // O aluno só acessa o próprio certificado depois de emitido; o gestor pode
    // pré-visualizar mesmo antes da emissão (para conferir o documento).
    if (!previewingStudent && enrollment.certificateStatus !== CERTIFICATE_STATUS.ISSUED)
      return res.status(403).json({ success: false, message: 'Seu certificado ainda não foi emitido' });

    // Carga horária = soma das durações das aulas do cronograma
    const lessons = await Lesson.find({ course: courseId }, 'startTime endTime').lean();
    const totalMinutes = lessons.reduce(
      (sum, l) => sum + Math.max(0, timeToMinutes(l.endTime) - timeToMinutes(l.startTime)),
      0
    );

    const doc = createCertificateDoc({
      studentName: enrollment.user.name,
      courseTitle: course.title,
      modalityLabel: MODALITY_LABELS[course.modality] || course.modality,
      workloadLabel: formatWorkload(totalMinutes),
      startDate: course.startDate,
      endDate: course.endDate,
      issuedAt: enrollment.certificateIssuedAt || new Date(),
      certId: certIdFor(enrollment._id),
    });

    const download = req.query.download === '1' || req.query.download === 'true';
    const safeTitle = course.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'curso';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="certificado-${safeTitle}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
};

module.exports = { getCertificatePdf };
