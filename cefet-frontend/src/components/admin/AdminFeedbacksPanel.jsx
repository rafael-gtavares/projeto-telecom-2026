import { useState, useEffect } from 'react'
import { Search, Star, Trash2, MessageSquareText } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Spinner } from '../ui/index'
import { getAllFeedbacksAPI, deleteFeedbackAPI, toggleFeaturedFeedbackAPI } from '../../api/feedbacks'

// Curadoria global dos depoimentos (feedback "antigo"): lista todos, permite
// buscar/filtrar, excluir e destacar até 6 na Home. Autocontido — busca sozinho
// e usa onNotify para o toast do painel.
const AdminFeedbacksPanel = ({ onNotify }) => {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [featuring, setFeaturing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [starsFilter, setStarsFilter] = useState(null) // null = todas
  const [deleteModal, setDeleteModal] = useState({ open: false, feedback: null })

  const notify = (message) => onNotify?.(message)

  useEffect(() => {
    let active = true
    setLoading(true)
    getAllFeedbacksAPI()
      .then((res) => { if (active) setFeedbacks(res.data.data) })
      .catch(() => { if (active) setFeedbacks([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredFeedbacks = feedbacks
    .filter(f => {
      if (starsFilter !== null && f.stars !== starsFilter) return false
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        (f.user?.name || '').toLowerCase().includes(q) ||
        (f.user?.email || '').toLowerCase().includes(q) ||
        (f.course?.title || '').toLowerCase().includes(q) ||
        (f.content || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (b.isFeatured === a.isFeatured ? 0 : b.isFeatured ? 1 : -1)) // destacados primeiro

  const featuredCount = feedbacks.filter(f => f.isFeatured).length

  const handleToggleFeatured = async (feedback) => {
    if (!feedback.isFeatured && featuredCount >= 6) {
      notify('Já existem 6 feedbacks em destaque. Remova um antes de adicionar outro.')
      return
    }
    setFeaturing(true)
    try {
      const { data } = await toggleFeaturedFeedbackAPI(feedback._id)
      setFeedbacks(prev => prev.map(f => (f._id === data.data._id ? data.data : f)))
      notify(data.data.isFeatured ? 'Feedback destacado na Home.' : 'Feedback removido dos destaques.')
    } catch (err) {
      notify(err.response?.data?.message || 'Erro ao atualizar destaque')
    } finally {
      setFeaturing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.feedback) return
    setDeleting(true)
    try {
      await deleteFeedbackAPI(deleteModal.feedback._id)
      setFeedbacks(prev => prev.filter(f => f._id !== deleteModal.feedback._id))
      setDeleteModal({ open: false, feedback: null })
      notify('Feedback excluído com sucesso.')
    } catch (err) {
      notify(err.response?.data?.message || 'Erro ao excluir feedback')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Feedbacks</h1>
        <p className="text-sm text-text-muted mt-1">{featuredCount}/6 em destaque na Home</p>
      </div>

      <div className="card overflow-hidden">
        {/* Busca + filtro por estrelas */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              placeholder="Buscar por aluno, e-mail, curso ou comentário..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-sm py-2.5 w-full"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setStarsFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${starsFilter === null ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
            >
              Todas
            </button>
            {[5, 4, 3, 2, 1].map(n => (
              <button
                key={n}
                onClick={() => setStarsFilter(n)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${starsFilter === n ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
              >
                {n} <Star size={11} className={starsFilter === n ? 'fill-white' : 'fill-warning text-warning'} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquareText size={36} className="text-text-muted mb-3" />
              <p className="font-semibold text-text-primary mb-1">Nenhum feedback encontrado</p>
              <p className="text-sm text-text-muted">
                {search.trim() || starsFilter !== null
                  ? 'Nenhum feedback corresponde ao filtro.'
                  : 'Ainda não há feedbacks na plataforma.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedbacks.map(f => (
                <div key={f._id} className={`card p-4 ${f.isFeatured ? 'ring-2 ring-primary bg-surface-blue' : ''}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{f.user?.name || 'Aluno'}</p>
                        <span className="text-xs text-text-muted">{f.user?.email}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{f.course?.title}</p>
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={13} className={n <= f.stars ? 'fill-warning text-warning' : 'text-border'} />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">{f.content}</p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      variant={f.isFeatured ? 'secondary' : 'primary'}
                      className="text-xs py-1.5 px-3"
                      onClick={() => handleToggleFeatured(f)}
                      disabled={featuring}
                    >
                      {f.isFeatured ? 'Remover destaque' : 'Destacar na Home'}
                    </Button>

                    <button
                      onClick={() => setDeleteModal({ open: true, feedback: f })}
                      className="text-text-muted hover:text-error transition-colors p-1.5"
                      title="Excluir feedback"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal excluir feedback */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, feedback: null })}
        title="Excluir feedback"
        size="sm"
      >
        <p className="text-text-secondary text-sm mb-5">
          Tem certeza que deseja excluir o feedback de{' '}
          <strong className="text-text-primary">{deleteModal.feedback?.user?.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleDelete}
            loading={deleting}
            className="flex-1 bg-error hover:bg-error-text border-0"
          >
            <Trash2 size={14} /> Excluir
          </Button>
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, feedback: null })} disabled={deleting}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminFeedbacksPanel
