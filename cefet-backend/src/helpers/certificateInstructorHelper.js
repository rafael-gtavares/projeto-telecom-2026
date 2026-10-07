const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ROLES, ROLE_HIERARCHY } = require('../constants/roles');
const { CERTIFICATE_STATUS } = require('../constants/certificateStatus');
const { resolveSignature } = require('./signatureHelper');

const atLeast = (role, minimum) => (ROLE_HIERARCHY[role] || 0) >= ROLE_HIERARCHY[minimum];

// Quem pode ALTERAR a configuração do certificado: admin, superadmin ou o
// professor criador do curso (professores com acesso adicional só visualizam).
const canEditCertificateSettings = (course, user) =>
  atLeast(user.role, ROLES.ADMIN) || String(course.professor?._id || course.professor) === String(user.id);

// O ministrador está travado? Sim se o curso já registrou a 1ª emissão
// (certificateInstructorLockedAt) ou se existe qualquer certificado emitido
// (cobre cursos emitidos antes desta funcionalidade existir).
const isInstructorLocked = async (course) => {
  if (course.certificateInstructorLockedAt) return true;
  return !!(await Enrollment.exists({ course: course._id, certificateStatus: CERTIFICATE_STATUS.ISSUED }));
};

// Registra a emissão do 1º certificado (idempotente: só grava se ainda não houver).
const lockCertificateInstructor = (course) =>
  Course.updateOne(
    { _id: course._id, certificateInstructorLockedAt: null },
    { $set: { certificateInstructorLockedAt: new Date() } }
  );

// "Tem acesso ao curso" = criador, professor com acesso adicional, admin ou superadmin.
const hasCourseAccess = (course, user) => {
  if (!user || !atLeast(user.role, ROLES.PROFESSOR)) return false;
  if (atLeast(user.role, ROLES.ADMIN)) return true;
  const id = String(user._id);
  return String(course.professor?._id || course.professor) === id
    || (course.allowedProfessors || []).some((p) => String(p._id || p) === id);
};

// Pessoas que podem ser escolhidas como ministrador (criador primeiro).
const getEligibleInstructors = async (course) => {
  const creatorId = String(course.professor?._id || course.professor);
  const accessIds = [creatorId, ...(course.allowedProfessors || []).map((p) => String(p._id || p))];

  const users = await User.find(
    {
      role: { $in: [ROLES.PROFESSOR, ROLES.ADMIN, ROLES.SUPERADMIN] },
      $or: [{ _id: { $in: accessIds } }, { role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } }],
    },
    '_id name email role signature'
  ).sort({ name: 1 }).lean();

  users.sort((a, b) => (String(a._id) === creatorId ? -1 : String(b._id) === creatorId ? 1 : 0));
  return users;
};

// Quem aparece no certificado: ministrador escolhido (se ainda tiver acesso)
// → criador do curso → fallbackUser (quem está emitindo). Nunca lança por falta
// de assinatura: resolveSignature sempre devolve uma assinatura válida.
const resolveCertificateSigner = async (course, fallbackUser = null) => {
  const candidates = [course.certificateInstructor, course.professor].filter(Boolean);

  for (const ref of candidates) {
    const user = await User.findById(ref._id || ref).select('name role signature');
    if (user && hasCourseAccess(course, user)) {
      return resolveSignature(user, course.certificateSignatureFont);
    }
  }
  return resolveSignature(fallbackUser, course.certificateSignatureFont);
};

// Bloco de configuração enviado ao front (só para quem gerencia o curso).
const buildCertificateSettings = async (course) => {
  await course.populate('certificateInstructor', 'name email role');
  return {
    certificateInstructor: course.certificateInstructor || null,
    certificateSignatureFont: course.certificateSignatureFont || null,
    certificateInstructorLocked: await isInstructorLocked(course),
    certificateSigner: await resolveCertificateSigner(course),
  };
};

module.exports = {
  canEditCertificateSettings,
  isInstructorLocked,
  lockCertificateInstructor,
  hasCourseAccess,
  getEligibleInstructors,
  resolveCertificateSigner,
  buildCertificateSettings,
};