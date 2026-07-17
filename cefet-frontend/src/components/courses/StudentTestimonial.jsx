import { useState, useEffect } from 'react'
import { Star, Trash2, Plus } from 'lucide-react'
import { getCourseFeedbacksAPI, createFeedbackAPI, deleteFeedbackAPI } from '../../api/feedbacks'

// Depoimento do curso (feedback "antigo") — visão do ALUNO. Mostra apenas o
// depoimento do próprio aluno (não os dos demais): ou o formulário para criar,
// ou o depoimento já enviado. Autocontido; usa onNotify para o toast do pai.
const StudentTestimonial = ({ courseId, user, canReview, onNotify }) => {
  const [myFeedback, setMyFeedback] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [stars, setStars] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Busca só para localizar o depoimento do próprio aluno (os demais não são exibidos)
  useEffect(() => {
    const controller = new AbortController()
    getCourseFeedbacksAPI(courseId)
      .then(({ data }) => {
        if (controller.signal.aborted) return
        setMyFeedback(data.data.find(f => f.user?._id === user?._id) || null)
      })
      .catch(() => { /* silencioso */ })
    return () => controller.abort()
  }, [courseId, user?._id])

  const notify = (message) => onNotify?.(message)

  const handleCreate = async () => {
    if (!content.trim() || stars === 0) {
      notify('Preencha o comentário e selecione uma nota.')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await createFeedbackAPI({ course: courseId, content: content.trim(), stars })
      setMyFeedback({ ...data.data, user: { _id: user?._id, name: user?.name, email: user?.email } })
      setShowForm(false); setContent(''); setStars(0)
      notify('Depoimento enviado com sucesso!')
    } catch (err) {
      notify(err.response?.data?.message || 'Erro ao enviar depoimento.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!myFeedback) return
    try {
      await deleteFeedbackAPI(myFeedback._id)
      setMyFeedback(null)
      notify('Depoimento excluído.')
    } catch (err) {
      notify(err.response?.data?.message || 'Erro ao excluir depoimento.')
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-text-primary mb-1">Seu depoimento</h3>
        <p className="text-xs text-text-muted">
          Deixe um depoimento sobre o curso — ele pode ser destacado na página inicial.
        </p>
      </div>

      {myFeedback ? (
        // Depoimento já enviado (apenas o do próprio aluno)
        <div className="card p-4 ring-2 ring-primary bg-surface-blue">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={14} className={n <= myFeedback.stars ? 'fill-warning text-warning' : 'text-border'} />
                ))}
              </div>
              <p className="text-xs font-semibold text-primary mt-1">Seu depoimento</p>
            </div>
            <button onClick={handleDelete} className="text-text-muted hover:text-error transition-colors" title="Excluir depoimento">
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{myFeedback.content}</p>
        </div>
      ) : (
        // Ainda sem depoimento → criar (se concluiu o curso)
        <div className="card p-4">
          {!canReview ? (
            <div className="text-center py-1">
              <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                <Plus size={16} /> Adicionar depoimento
              </button>
              <p className="text-xs text-text-muted mt-2">Conclua o curso para adicionar um depoimento.</p>
            </div>
          ) : !showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-primary w-full">
              <Plus size={16} /> Adicionar depoimento
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-1 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setStars(n)}>
                    <Star size={24} className={n <= stars ? 'fill-warning text-warning' : 'text-border'} />
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conte como foi sua experiência no curso..."
                className="w-full p-3 border border-border rounded-card text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setContent(''); setStars(0) }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentTestimonial
