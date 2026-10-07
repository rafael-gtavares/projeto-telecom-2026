const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { CERTIFICATE_STATUS } = require('../constants/certificateStatus');
const { createCertificateDoc } = require('../services/certificate');
const { buildCertificateData, certificateFileName } = require('../services/certificateDelivery');
const { resolveCertificateSigner } = require('../helpers/certificateInstructorHelper');

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

    // A assinatura é a "congelada" na emissão (certificado imutável). Antes da
    // emissão só o gestor pré-visualiza — aí usamos a do ministrador do curso
    // (padrão: criador) para ver como ficará, sem alterar certificados emitidos.
    let signature = enrollment.certificateSignature;
    if (!signature?.text) {
      const me = await User.findById(req.user.id).select('name signature');
      signature = await resolveCertificateSigner(course, me);
    }

    const data = await buildCertificateData({
      enrollment,
      course,
      studentName: enrollment.user.name,
      signature,
    });
    const doc = createCertificateDoc(data);

    const download = req.query.download === '1' || req.query.download === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${certificateFileName(course.title)}"`);

    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
};

module.exports = { getCertificatePdf };