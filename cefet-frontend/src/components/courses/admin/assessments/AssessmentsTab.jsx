import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, ClipboardList, Settings2, Check, X } from 'lucide-react'
import { Badge, Avatar } from '../../../ui/index'
import Button from '../../../ui/Button'
import Input from '../../../ui/Input'
import AssessmentFormModal from './AssessmentFormModal'
import BatchGradeModal from './BatchGradeModal'
import {
  GRADING_METHODS, METHOD_LABELS, METHOD_HELP, METHOD_OPTIONS, passingLabel,
} from '../../../../constants/gradingMethods'
import { SITUATIONS, SITUATION_LABELS } from '../../../../constants/enrollmentSitutation'

const TYPE_LABELS = { prova: 'Prova', trabalho: 'Trabalho', participacao: 'Participação', outro: 'Outro' }
const AUTO = '__auto__'

const situationBadgeVariant = (s) =>
  s === SITUATIONS.APROVADO ? 'success'
    : s === SITUATIONS.REPROVADO ? 'error'
      : s === SITUATIONS.DESISTENTE ? 'warning'
        : 'gray'

// Quantas notas (publicadas) já foram lançadas em uma avaliação
const gradedCount = (scores, assessmentId) =>
  (scores || []).filter(s => String(s.assessment) === String(assessmentId)).length

const AssessmentsTab = ({
  config,
  assessments,
  scores,
  students,
  onSaveConfig,
  onCreateAssessment,
  onUpdateAssessment,
  onDeleteAssessment,
  onSaveScores,
  onSetStatus,
  onDeleteConfirm,
}) => {
  const [formModal, setFormModal] = useState({ open: false, assessment: null })
  const [gradeModal, setGradeModal] = useState({ open: false, assessment: null })
  const [savingForm, setSavingForm] = useState(false)
  const [savingScores, setSavingScores] = useState(false)

  const [configEdit, setConfigEdit] = useState(false)
  const [configForm, setConfigForm] = useState({ method: config.method, passingGrade: config.passingGrade })
  const [savingConfig, setSavingConfig] = useState(false)
  const [statusSaving, setStatusSaving] = useState(null)

  const method = config.method
  const isSum = method === GRADING_METHODS.SUM

  const totalPoints = useMemo(
    () => (assessments || []).reduce((s, a) => s + (a.maxScore || 0), 0),
    [assessments]
  )

  const openConfigEdit = () => {
    setConfigForm({ method: config.method, passingGrade: config.passingGrade })
    setConfigEdit(true)
  }

  const saveConfig = async () => {
    setSavingConfig(true)
    const ok = await onSaveConfig({
      method: configForm.method,
      passingGrade: Number(configForm.passingGrade) || 0,
    })
    setSavingConfig(false)
    if (ok) setConfigEdit(false)
  }

  const handleSaveForm = async (payload) => {
    setSavingForm(true)
    const ok = formModal.assessment
      ? await onUpdateAssessment(formModal.assessment._id, payload)
      : await onCreateAssessment(payload)
    setSavingForm(false)
    if (ok) setFormModal({ open: false, assessment: null })
  }

  const handleSaveScores = async (scoreList, publish) => {
    setSavingScores(true)
    const ok = await onSaveScores(gradeModal.assessment._id, { scores: scoreList, publish })
    setSavingScores(false)
    if (ok) setGradeModal({ open: false, assessment: null })
  }

  const changeStatus = async (enrollmentId, value) => {
    setStatusSaving(enrollmentId)
    await onSetStatus(enrollmentId, value === AUTO ? { auto: true } : { situation: value })
    setStatusSaving(null)
  }

  const fmtFinal = (avg) => {
    if (avg == null) return '—'
    return isSum ? `${avg} / ${totalPoints}` : avg.toFixed(1)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Configuração do sistema de avaliações ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
            <Settings2 size={16} className="text-primary" /> Como a nota é calculada
          </h3>
          {!configEdit && (
            <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={openConfigEdit}>
              <Edit2 size={13} /> Alterar
            </Button>
          )}
        </div>

        {!configEdit ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">{METHOD_LABELS[method]}</Badge>
              <span className="text-xs text-text-muted">
                {passingLabel(method)}: <strong className="text-text-primary">{config.passingGrade}</strong>
                {isSum && totalPoints > 0 && <span className="text-text-muted"> (total {totalPoints} pts)</span>}
              </span>
            </div>
            <p className="text-xs text-text-muted">{METHOD_HELP[method]}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Método de cálculo</label>
              <select
                value={configForm.method}
                onChange={e => setConfigForm(f => ({ ...f, method: e.target.value }))}
                className="input-field w-full"
              >
                {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-xs text-text-muted mt-1">{METHOD_HELP[configForm.method]}</p>
            </div>
            <Input
              label={passingLabel(configForm.method)}
              type="number" min="0" step="0.5"
              value={configForm.passingGrade}
              onChange={e => setConfigForm(f => ({ ...f, passingGrade: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="primary" className="text-xs py-1.5 px-3 gap-1" loading={savingConfig} onClick={saveConfig}>
                <Check size={14} /> Salvar
              </Button>
              <Button variant="ghost" className="text-xs py-1.5 px-3 gap-1" onClick={() => setConfigEdit(false)}>
                <X size={14} /> Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Lista de avaliações ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-text-primary text-sm">
            Avaliações {(assessments || []).length > 0 && `(${assessments.length})`}
          </h3>
          <Button variant="primary" className="text-xs py-1.5 px-3 gap-1"
            onClick={() => setFormModal({ open: true, assessment: null })}>
            <Plus size={14} /> Nova avaliação
          </Button>
        </div>

        {(assessments || []).length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">
            Nenhuma avaliação criada. Comece adicionando uma prova, trabalho, etc.
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map(a => (
              <div key={a._id} className="card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-card bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
                  <ClipboardList size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary truncate">{a.title}</p>
                    {a.published
                      ? <Badge variant="success" className="text-[10px]">Publicada</Badge>
                      : <Badge variant="warning" className="text-[10px]">Rascunho</Badge>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {TYPE_LABELS[a.type] || a.type}
                    {isSum && ` · vale ${a.maxScore} pts`}
                    {method === GRADING_METHODS.WEIGHTED && ` · peso ${a.weight}`}
                    {` · ${gradedCount(scores, a._id)} nota${gradedCount(scores, a._id) !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="secondary" className="text-xs py-1.5 px-3 gap-1"
                    onClick={() => setGradeModal({ open: true, assessment: a })}>
                    <ClipboardList size={13} /> Lançar notas
                  </Button>
                  <button onClick={() => setFormModal({ open: true, assessment: a })} title="Editar"
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDeleteConfirm(a)} title="Excluir"
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Resultados e status dos alunos ── */}
      <div className="space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">Resultados dos alunos</h3>
        {(students || []).length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">Nenhum aluno inscrito ainda.</div>
        ) : (
          <div className="space-y-2">
            {students.map(e => {
              const manual = e.situationManual
              const situation = e.situation || SITUATIONS.PENDENTE
              return (
                <div key={e._id} className="card p-3 flex flex-wrap items-center gap-3">
                  <Avatar name={e.user?.name} size="sm" />
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-medium text-text-primary truncate">{e.user?.name}</p>
                    <p className="text-xs text-text-muted">
                      Nota final: <strong className="text-primary">{fmtFinal(e.averageGrade)}</strong>
                    </p>
                  </div>
                  <Badge variant={situationBadgeVariant(situation)}>
                    {SITUATION_LABELS[situation]}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={manual ? situation : AUTO}
                      disabled={statusSaving === e._id}
                      onChange={ev => changeStatus(e._id, ev.target.value)}
                      className="input-field text-xs py-1.5 disabled:opacity-50"
                      title={manual ? 'Definido manualmente' : 'Calculado automaticamente'}
                    >
                      <option value={AUTO}>Automático</option>
                      <option value={SITUATIONS.PENDENTE}>{SITUATION_LABELS[SITUATIONS.PENDENTE]}</option>
                      <option value={SITUATIONS.APROVADO}>{SITUATION_LABELS[SITUATIONS.APROVADO]}</option>
                      <option value={SITUATIONS.REPROVADO}>{SITUATION_LABELS[SITUATIONS.REPROVADO]}</option>
                      <option value={SITUATIONS.DESISTENTE}>{SITUATION_LABELS[SITUATIONS.DESISTENTE]}</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-xs text-text-muted">
          Em <strong>Automático</strong> o status segue o cálculo das notas. Ao escolher um status manual,
          o cálculo deixa de alterá-lo até você voltar para Automático.
        </p>
      </div>

      <AssessmentFormModal
        open={formModal.open}
        assessment={formModal.assessment}
        method={method}
        onClose={() => setFormModal({ open: false, assessment: null })}
        onSave={handleSaveForm}
        saving={savingForm}
      />
      <BatchGradeModal
        open={gradeModal.open}
        assessment={gradeModal.assessment}
        students={students}
        scores={scores}
        onClose={() => setGradeModal({ open: false, assessment: null })}
        onSave={handleSaveScores}
        saving={savingScores}
      />
    </div>
  )
}

export default AssessmentsTab
