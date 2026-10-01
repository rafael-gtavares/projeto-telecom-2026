const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { createCertificateDoc, formatWorkload } = require('./certificate');
const { sendCertificateEmail } = require('../config/email');

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

// Nome de arquivo seguro: "certificado-<titulo-do-curso>.pdf"
const certificateFileName = (courseTitle) => {
  const safeTitle = String(courseTitle || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'curso';
  return `certificado-${safeTitle}.pdf`;
};

// Monta os dados que o createCertificateDoc espera. Usado tanto pela rota que
// serve o PDF (download/preview) quanto pelo envio por e-mail, garantindo que
// o PDF anexado seja idêntico ao que o aluno baixa no site.
const buildCertificateData = async ({ enrollment, course, studentName, signature }) => {
  // Carga horária = soma das durações das aulas do cronograma
  const lessons = await Lesson.find({ course: course._id }, 'startTime endTime').lean();
  const totalMinutes = lessons.reduce(
    (sum, l) => sum + Math.max(0, timeToMinutes(l.endTime) - timeToMinutes(l.startTime)),
    0
  );

  return {
    studentName,
    courseTitle: course.title,
    modalityLabel: MODALITY_LABELS[course.modality] || course.modality,
    workloadLabel: formatWorkload(totalMinutes),
    startDate: course.startDate,
    endDate: course.endDate,
    issuedAt: enrollment.certificateIssuedAt || new Date(),
    certId: certIdFor(enrollment._id),
    signerName: signature?.name,
    signatureText: signature?.text,
    signatureFont: signature?.font,
  };
};

// Renderiza o certificado em memória e devolve um Buffer com o PDF.
const generateCertificateBuffer = (data) =>
  new Promise((resolve, reject) => {
    try {
      const doc = createCertificateDoc(data);
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });

// Envia o certificado já emitido por e-mail (PDF em anexo) para o aluno.
// Best-effort: NUNCA lança. Qualquer falha (aluno sem e-mail, erro ao gerar o
// PDF, erro do provedor de e-mail) é logada e devolvida como `false`, para não
// comprometer a emissão, que já foi gravada. Devolve `true` se enviou.
const sendCertificateByEmail = async ({ enrollment, course }) => {
  try {
    const student = await User.findById(enrollment.user).select('name email');
    if (!student?.email) {
      console.warn(`[certificado] aluno ${enrollment.user} sem e-mail; envio ignorado`);
      return false;
    }

    // Usa a assinatura "congelada" na emissão (mesma do PDF do site)
    const data = await buildCertificateData({
      enrollment,
      course,
      studentName: student.name,
      signature: enrollment.certificateSignature,
    });
    const pdfBuffer = await generateCertificateBuffer(data);

    await sendCertificateEmail(student.email, student.name, {
      courseTitle: course.title,
      pdfBuffer,
      fileName: certificateFileName(course.title),
    });
    return true;
  } catch (err) {
    console.error('[certificado] falha ao enviar o e-mail do certificado:', err.message);
    return false;
  }
};

module.exports = {
  buildCertificateData,
  generateCertificateBuffer,
  certificateFileName,
  sendCertificateByEmail,
};