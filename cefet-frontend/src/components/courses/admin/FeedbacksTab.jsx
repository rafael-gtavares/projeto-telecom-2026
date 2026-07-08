import { useState } from 'react'
import { Star, MessageSquareText } from 'lucide-react'
import { Spinner } from '../../ui/index'

const FeedbacksTab = ({ feedbacks, loading }) => {
  const [starsFilter, setStarsFilter] = useState(null) // null = todas

  const filteredFeedbacks = feedbacks
    .filter(f => starsFilter === null || f.stars === starsFilter)
    .sort((a, b) => b.stars - a.stars)

  const averageStars = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.stars, 0) / feedbacks.length).toFixed(1)
    : null

  return (
    <div className="p-4 md:p-6 space-y-6">

      <div className="pb-6 border-b border-border">
        <h3 className="font-semibold text-text-primary mb-1">Feedbacks dos alunos</h3>
        <p className="text-xs text-text-muted mb-4">
          Avaliações enviadas por alunos que concluíram este curso.
        </p>

        {averageStars && (
          <div className="flex items-center gap-2 p-3 bg-surface-page rounded-card w-fit">
            <span className="text-2xl font-bold text-text-primary">{averageStars}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  size={14}
                  className={n <= Math.round(averageStars) ? 'fill-warning text-warning' : 'text-border'}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted ml-1">({feedbacks.length} avaliações)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquareText size={36} className="text-text-muted mb-3" />
          <p className="font-semibold text-text-primary mb-1">Nenhum feedback ainda</p>
          <p className="text-sm text-text-muted">Este curso ainda não recebeu avaliações de alunos.</p>
        </div>
      ) : (
        <>
          {/* Filtro por estrelas */}
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

          {filteredFeedbacks.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              Nenhum feedback com essa quantidade de estrelas.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredFeedbacks.map(f => (
                <div key={f._id} className="p-3 card">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-sm font-medium text-text-primary">{f.user?.name || 'Aluno'}</p>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={13} className={n <= f.stars ? 'fill-warning text-warning' : 'text-border'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FeedbacksTab