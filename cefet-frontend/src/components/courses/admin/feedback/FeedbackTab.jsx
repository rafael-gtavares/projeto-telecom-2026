import { useState, useEffect } from 'react'
import { ClipboardList, BarChart3, Save, Loader2 } from 'lucide-react'
import Button from '../../../ui/Button'
import Toast from '../../../ui/Toast'
import { Spinner } from '../../../ui/index'
import FeedbackFormBuilder from './FeedbackFormBuilder'
import FeedbackResults from './FeedbackResults'
import { getFeedbackFormAPI, saveFeedbackFormAPI, getFeedbackResultsAPI } from '../../../../api/feedback'

// Aba "Feedbacks" do painel do curso (gestor). Dois modos:
//  - Formulário: montar/editar as questões e publicar
//  - Respostas: analisar (geral + individual)
const FeedbackTab = ({ courseId, course }) => {
  const [subTab, setSubTab] = useState('form') // 'form' | 'results'

  const [questions, setQuestions] = useState([])
  const [published, setPublished] = useState(false)
  const [loadingForm, setLoadingForm] = useState(true)
  const [saving, setSaving] = useState(false)

  const [results, setResults] = useState(null)
  const [loadingResults, setLoadingResults] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '' })
  const showToast = (message) => setToast({ show: true, message })

  // Carrega o formulário
  useEffect(() => {
    let active = true
    setLoadingForm(true)
    getFeedbackFormAPI(courseId)
      .then(({ data }) => {
        if (!active) return
        const form = data.data.form
        setQuestions((form?.questions || []).map((q) => ({ ...q, _key: crypto.randomUUID() })))
        setPublished(!!form?.published)
      })
      .catch(() => { if (active) showToast('Erro ao carregar o formulário.') })
      .finally(() => { if (active) setLoadingForm(false) })
    return () => { active = false }
  }, [courseId])

  // Carrega as respostas ao abrir a aba de resultados (e após salvar)
  const loadResults = () => {
    setLoadingResults(true)
    getFeedbackResultsAPI(courseId)
      .then(({ data }) => setResults(data.data))
      .catch(() => showToast('Erro ao carregar as respostas.'))
      .finally(() => setLoadingResults(false))
  }

  useEffect(() => {
    if (subTab === 'results' && !results) loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        published,
        questions: questions.map(({ _key, ...q }) => q), // remove a chave do React
      }
      const { data } = await saveFeedbackFormAPI(courseId, payload)
      const form = data.data.form
      setQuestions((form?.questions || []).map((q) => ({ ...q, _key: crypto.randomUUID() })))
      setPublished(!!form?.published)
      showToast('Formulário salvo com sucesso.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao salvar o formulário.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Sub-abas */}
      <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-page">
        {[
          { key: 'form', label: 'Formulário', icon: ClipboardList },
          { key: 'results', label: 'Respostas', icon: BarChart3 },
        ].map((opt) => {
          const Icon = opt.icon
          return (
            <button key={opt.key} onClick={() => setSubTab(opt.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                subTab === opt.key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
              }`}>
              <Icon size={15} /> {opt.label}
            </button>
          )
        })}
      </div>

      {subTab === 'form' ? (
        loadingForm ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-text-primary mb-1">Formulário de feedback</h3>
              <p className="text-xs text-text-muted">
                Monte as questões que o aluno responderá ao concluir o curso. Três tipos: múltipla escolha,
                estrelas (nota) e texto aberto.
              </p>
            </div>

            <FeedbackFormBuilder value={questions} onChange={setQuestions} />

            {/* Publicação + salvar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 accent-primary mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Publicar formulário</strong> — libera o feedback para os
                  alunos que concluíram o curso.
                  {course?.status !== 'closed' && (
                    <span className="block text-xs text-text-muted mt-0.5">
                      O curso ainda não foi concluído; os alunos só responderão após o encerramento.
                    </span>
                  )}
                </span>
              </label>

              <Button variant="primary" onClick={handleSave} loading={saving} className="flex-shrink-0">
                <Save size={15} /> Salvar formulário
              </Button>
            </div>
          </div>
        )
      ) : (
        loadingResults || !results ? (
          <div className="flex justify-center py-12">
            <Loader2 size={22} className="animate-spin text-text-muted" />
          </div>
        ) : (
          <FeedbackResults
            form={results.form}
            responses={results.responses}
            totalStudents={results.totalStudents}
          />
        )
      )}

      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false, message: '' })} />
    </div>
  )
}

export default FeedbackTab
