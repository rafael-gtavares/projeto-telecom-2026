import { useState, useEffect } from 'react'
import { Lock, AlertTriangle, PenLine } from 'lucide-react'
import { Spinner } from '../../ui/index'
import Button from '../../ui/Button'
import { SIGNATURE_FONTS, signatureFontFamily } from '../../../constants/signatureFonts'
import { resolveSignature } from '../../../utils/certificate'
import { getRoleLabel } from '../../../utils/formatDate'

// Seção "Certificado" da aba Configurações: escolha do ministrador (nome +
// assinatura exibidos no certificado) e do estilo da assinatura.
//  - canEdit: admin, superadmin ou professor criador
//  - o ministrador trava após a emissão do 1º certificado (course.certificateInstructorLocked)
const CertificateInstructorSection = ({ course, canEdit, options, optionsLoading, saving, onSave }) => {
  const creatorId = course.professor?._id || course.professor
  const currentInstructorId = course.certificateInstructor?._id || creatorId
  const currentFont = course.certificateSignatureFont || ''
  const locked = !!course.certificateInstructorLocked

  const [instructorId, setInstructorId] = useState(currentInstructorId)
  const [font, setFont] = useState(currentFont)

  // Sincroniza com o curso quando ele é salvo/recarregado
  useEffect(() => { setInstructorId(currentInstructorId) }, [currentInstructorId])
  useEffect(() => { setFont(currentFont) }, [currentFont])

  const selected = options.find(u => u._id === instructorId)
  const signature = selected
    ? resolveSignature(selected, font || null)
    : course.certificateSigner || resolveSignature(null)
  const previewFont = font || signature.font

  const instructorChanged = instructorId !== currentInstructorId
  const dirty = instructorChanged || font !== currentFont

  const handleSave = () => {
    const payload = { signatureFont: font || null }
    // Travado: não envia o ministrador (o backend também recusaria a troca)
    if (!locked) payload.instructorId = instructorId === creatorId ? null : instructorId
    onSave(payload)
  }

  const canChangeInstructor = canEdit && !locked

  return (
    <div className="pt-6 mt-6 border-t border-border">
      <h3 className="font-semibold text-text-primary mb-1">Certificado — ministrador</h3>
      <p className="text-xs text-text-muted mb-4">
        O nome e a assinatura do ministrador são exibidos nos certificados do curso. Por padrão,
        é o professor que criou o curso. Só é possível escolher pessoas com acesso ao curso.
      </p>

      {optionsLoading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="certificate-instructor">
              Ministrador das aulas
            </label>
            <select
              id="certificate-instructor"
              value={instructorId}
              onChange={e => setInstructorId(e.target.value)}
              disabled={!canChangeInstructor || saving}
              className="input-field disabled:bg-surface-page disabled:text-text-muted disabled:cursor-not-allowed"
            >
              {/* Enquanto as opções não chegam (ou para quem só visualiza), mostra o atual */}
              {!selected && (
                <option value={currentInstructorId}>
                  {course.certificateInstructor?.name || course.professor?.name || 'Professor criador'}
                </option>
              )}
              {options.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} — {getRoleLabel(u.role)}{u._id === creatorId ? ' (criador, padrão)' : ''}
                </option>
              ))}
            </select>

            {locked ? (
              <p className="flex items-start gap-2 text-xs text-text-secondary bg-surface-page border border-border rounded-lg px-3 py-2 mt-2">
                <Lock size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  O ministrador não pode mais ser alterado porque já foi emitido ao menos um certificado
                  neste curso. Isso garante a integridade dos certificados emitidos.
                </span>
              </p>
            ) : canEdit ? (
              <p className="flex items-start gap-2 text-xs text-warning-text bg-warning-light border border-warning/20 rounded-lg px-3 py-2 mt-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  O ministrador poderá ser alterado enquanto nenhum certificado tiver sido emitido.
                  Após a emissão do primeiro certificado, essa informação ficará bloqueada para
                  garantir a integridade dos certificados emitidos.
                </span>
              </p>
            ) : (
              <p className="text-xs text-text-muted mt-2">
                Apenas o criador do curso, administradores e superadministradores podem alterar o ministrador.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Estilo da assinatura</label>
            <p className="text-xs text-text-muted mb-2">
              Por padrão usa o estilo da assinatura da própria pessoa. Se quiser, escolha outra fonte.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: '', label: 'Padrão da pessoa', cssFamily: signatureFontFamily(resolveSignature(selected).font) },
                ...SIGNATURE_FONTS].map(f => {
                const active = font === f.value
                return (
                  <button
                    key={f.value || 'default'}
                    type="button"
                    disabled={!canEdit || saving}
                    onClick={() => setFont(f.value)}
                    className={`rounded-card border px-3 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      active ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="block text-2xl text-text-primary leading-tight truncate" style={{ fontFamily: f.cssFamily }}>
                      {signature.text || 'Assinatura'}
                    </span>
                    <span className="block text-[11px] text-text-muted mt-1">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Prévia no certificado</label>
            <div className="border border-border rounded-card bg-white py-6 px-4 flex flex-col items-center">
              <span className="text-4xl text-[#1f2933] leading-none pb-2" style={{ fontFamily: signatureFontFamily(previewFont) }}>
                {signature.text || 'Assinatura'}
              </span>
              <span className="w-52 border-t border-[#1f2933]" />
              <span className="text-sm font-semibold text-[#1f2933] mt-1.5">{signature.name || 'Coordenação de Cursos e Eventos'}</span>
              <span className="text-xs text-[#5b6b7b]">CEFET/RJ</span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-text-muted mt-2">
              <PenLine size={12} /> A assinatura de cada pessoa pode ser editada em “Meu Perfil”. Sem edição, usa-se o nome da pessoa.
            </p>
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} loading={saving} disabled={!dirty}>
                Salvar configurações do certificado
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CertificateInstructorSection