const mongoose = require('mongoose');
const { ROLES, ROLE_HIERARCHY } = require('../constants/roles')
const { COURSE_STATUS } = require('../constants/courseStatus')
const { COURSE_PHASE } = require('../constants/coursePhase')
const { SIGNATURE_FONTS } = require('../constants/signatureFonts')

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
  },

  // Tipo de agenda utilizada pelo curso
  scheduleType: {
    type: String,
    enum: [
      'single',
      'weekly',
      'custom',
    ],
    default: 'single',
    required: true,
  },

  // Configuração da agenda (sempre um array — evita null que quebrava o front)
  scheduleConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: () => [],
  },

  // Primeira e última aula do curso
  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    required: true,
  },

  // Modalidade do curso
  modality: {
    type: String,
    enum: [
      'presencial',
      'ead',
      'semi_presencial',
      'palestra',
      'workshop',
      'outro',
    ],
    default: 'presencial',
    required: true,
  },

  // Local (para presencial/semi)
  location: {
    type: String,
    trim: true,
    default: '',
  },

  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Ministrador exibido no certificado (nome + assinatura). null = padrão:
  // o professor criador do curso. Só pode ser alguém com acesso ao curso e
  // fica travado após a emissão do primeiro certificado.
  certificateInstructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Fonte da assinatura escolhida para este curso. null = usa a fonte da
  // própria assinatura do ministrador (ou a fonte padrão do sistema).
  certificateSignatureFont: {
    type: String,
    enum: [...Object.values(SIGNATURE_FONTS), null],
    default: null,
  },

  // Preenchido na emissão do 1º certificado e nunca limpado (nem se o
  // certificado for revogado): é o que mantém o ministrador travado.
  certificateInstructorLockedAt: {
    type: Date,
    default: null,
  },

  // Nome livre do instrutor/palestrante
  instructor: {
    type: String,
    trim: true,
    default: '',
  },

  // Professores com acesso adicional ao curso
  allowedProfessors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],

  maxSlots: {
    type: Number,
    required: true,
    min: 1,
  },

  enrolledCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Vagas reservadas por convites pendentes (ver CourseInvitation). Contam
  // como ocupadas até o convite ser aceito, recusado, cancelado ou expirar.
  reservedCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  imageUrl: {
    type: String,
    default: null,
  },

  materials: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      type: {
        type: String,
        enum: [
          'text',
          'link',
          'file',
        ],
        required: true,
      },

      content: {
        type: String,
        required: true,
        trim: true,
      },
    },
  ],

  status: {
    type: String,
    enum: Object.values(COURSE_STATUS),
    default: COURSE_STATUS.DRAFT,
  },

  phase: {
    type: String,
    enum: Object.values(COURSE_PHASE),
    default: COURSE_PHASE.WAITING,
  },
  enrollmentType: {
    type: String,
    enum: ['open', 'approval'],
    default: 'open',
  },
  prerequisites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],

  // Turma fechada: só entra quem é de uma destas escolas E informa o código
  // de acesso. Vazio = curso aberto a todos.
  restrictedSchools: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
  ],

  // Código de acesso da turma fechada. `select: false`: nunca sai nas
  // listagens/populates — só é lido com .select('+accessCode') (gestores).
  accessCode: {
    type: String,
    default: null,
    select: false,
  },

  isExternal: {
    type: Boolean,
    default: false,
  },

  externalUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (v) => !v || /^https?:\/\/\S+$/i.test(v),
      message: 'O link da plataforma externa deve começar com http:// ou https://',
    },
  },

  externalMessage: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'A mensagem da plataforma externa deve ter no máximo 1000 caracteres.'],
  },
}, {
  timestamps: true,
});

courseSchema.virtual('availableSlots').get(function () {
  return Math.max(
    0,
    this.maxSlots - this.enrolledCount - (this.reservedCount || 0)
  );
});

courseSchema.set('toJSON', {
  virtuals: true,
});

courseSchema.set('toObject', {
  virtuals: true,
});

courseSchema.index({
  startDate: 1,
});

courseSchema.index({
  professor: 1,
});

courseSchema.index({
  scheduleType: 1,
});

courseSchema.pre('validate', function (next) {
  if (
    this.startDate &&
    this.endDate &&
    this.startDate > this.endDate
  ) {
    this.invalidate(
      'endDate',
      'A data de término não pode ser anterior à data de início.'
    );
  }

  next();
});

// Método para verificar se um userId tem acesso de gestão ao curso
courseSchema.methods.hasManageAccess = function (userId, userRole) {
  if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[ROLES.ADMIN]) {
    return true;
  }

  const id = userId.toString();

  // `professor`/`allowedProfessors` podem vir populados (documento) ou como
  // ObjectId — compara sempre pelo _id. (Um documento populado não devolve o
  // id em toString(), o que fazia o gestor não ser reconhecido no getCourse.)
  const toId = (v) => String(v?._id ?? v);

  if (toId(this.professor) === id) {
    return true;
  }

  if (
    this.allowedProfessors?.some(
      professor => toId(professor) === id
    )
  ) {
    return true;
  }

  return false;
};

module.exports = mongoose.model(
  'Course',
  courseSchema
);