import LogoSVG from '../../assets/cefetrj-logo'
import { formatModality } from '../../utils/formatModality'
import { certificateWorkloadLabel, certificateId } from '../../utils/certificate'

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'

// Prévia visual (estática) do certificado — espelha o layout do PDF gerado no
// backend. Usada tanto pelo aluno quanto pelo admin.
const CertificateCard = ({ studentName, course, lessons = [], issuedAt, enrollmentId }) => (
  <div className="relative bg-white rounded-lg border-2 border-primary px-5 py-8 sm:px-10 sm:py-12 text-center overflow-hidden">
    <span className="pointer-events-none absolute inset-2 border border-primary/50 rounded" />
    <div className="relative flex flex-col items-center">
      <LogoSVG color="#1565C0" size={44} />
      <p className="text-primary font-bold text-lg mt-2">CEFET/RJ</p>
      <p className="text-[10px] sm:text-xs text-text-muted px-4">
        Centro Federal de Educação Tecnológica Celso Suckow da Fonseca
      </p>

      <h2 className="text-lg sm:text-3xl font-extrabold text-text-primary tracking-wide mt-5">
        CERTIFICADO DE CONCLUSÃO
      </h2>
      <span className="w-16 h-[3px] rounded bg-primary my-3" />

      <p className="text-xs sm:text-sm text-text-muted mt-2">Certificamos que</p>
      <p className="text-lg sm:text-2xl font-bold text-text-primary mt-1">{studentName || '—'}</p>
      <p className="text-xs sm:text-sm text-text-muted mt-3">concluiu com êxito o curso</p>
      <p className="text-base sm:text-xl font-bold text-primary mt-1 px-2">{course?.title || '—'}</p>

      <p className="text-[11px] sm:text-sm text-text-primary mt-4 max-w-xl leading-relaxed px-2">
        Modalidade {formatModality(course?.modality)} · Carga horária de {certificateWorkloadLabel(lessons)} ·
        Realizado de {fmtDate(course?.startDate)} a {fmtDate(course?.endDate)}.
      </p>

      <div className="mt-8 sm:mt-12 flex flex-col items-center">
        <span className="w-44 border-t border-text-primary" />
        <p className="text-xs sm:text-sm font-bold text-text-primary mt-1.5">Coordenação de Cursos e Eventos</p>
        <p className="text-[10px] sm:text-xs text-text-muted">CEFET/RJ</p>
      </div>

      <div className="w-full flex flex-wrap justify-between gap-x-2 gap-y-1 text-[9px] sm:text-[11px] text-text-muted mt-6">
        <span>Emitido em {fmtDate(issuedAt || new Date())}</span>
        <span>Código de validação: {certificateId(enrollmentId)}</span>
      </div>
    </div>
  </div>
)

export default CertificateCard
