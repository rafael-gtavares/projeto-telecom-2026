import { Edit2, Trash2, Calendar as CalendarIcon, Clock, BookOpen } from 'lucide-react'
import { Badge } from '../ui/index'
import { formatDate } from '../../utils/formatDate'

const statusMap = { 
  published: ['success', 'Publicado'], 
  draft: ['gray', 'Rascunho'], 
  closed: ['warning', 'Encerrado'] 
}

const CourseTable = ({ courses, onEdit, onDelete }) => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {['Curso', 'Professor', 'Período / Dias', 'Vagas', 'Status', 'Ações'].map(h => (
              <th key={h} className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map(c => {
            const [variant, label] = statusMap[c.status] || ['gray', c.status]
            
            // Lógica para mostrar o período de forma compacta
            const isMultiDay = new Date(c.startDate).toDateString() !== new Date(c.endDate).toDateString()
            const daysCount = c.schedule?.length || 0

            return (
              <tr key={c._id} className="hover:bg-surface-page transition-colors group">
                {/* COLUNA: CURSO */}
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3 ml-1">
                    <div className="w-12 h-12 rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden border border-border">
                      {c.imageUrl
                        ? <img src={`${apiBase}${course.imageUrl}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-hover font-bold text-xs">
                            <BookOpen size={20} />
                          </div>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary max-w-[180px] truncate group-hover:text-primary transition-colors">
                        {c.title}
                      </span>
                      <span className="text-[11px] text-text-muted">ID: {c._id.slice(-6)}</span>
                    </div>
                  </div>
                </td>

                {/* COLUNA: PROFESSOR */}
                <td className="py-4 pr-4 text-text-secondary font-medium whitespace-nowrap">
                  {c.professor || '—'}
                </td>

                {/* COLUNA: DATA / CRONOGRAMA (A que mais mudou) */}
                <td className="py-4 pr-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-text-primary font-semibold text-xs">
                      <CalendarIcon size={13} className="text-primary" />
                      {isMultiDay 
                        ? `${formatDate(c.startDate)} - ${formatDate(c.endDate)}` 
                        : formatDate(c.startDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <Clock size={13} />
                      {daysCount > 1 
                        ? `${daysCount} sessões semanais` 
                        : `${c.schedule?.[0]?.dayOfWeek || 'Data única'} às ${c.schedule?.[0]?.startTime || '--:--'}`}
                    </div>
                  </div>
                </td>

                {/* COLUNA: VAGAS */}
                <td className="py-4 pr-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-text-primary font-bold">{c.enrolledCount}/{c.maxSlots}</span>
                    <div className="w-16 bg-border h-1 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${Math.min(100, (c.enrolledCount / c.maxSlots) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* COLUNA: STATUS */}
                <td className="py-4 pr-4">
                  <Badge variant={variant}>{label}</Badge>
                </td>

                {/* COLUNA: AÇÕES */}
                <td className="py-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(c)} 
                      title="Editar curso"
                      className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(c)} 
                      title="Excluir curso"
                      className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      
      {courses.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-surface-hover w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarIcon size={24} className="text-text-muted" />
          </div>
          <p className="text-text-muted text-sm font-medium">Nenhum curso cadastrado no sistema.</p>
        </div>
      )}
    </div>
  )
}

export default CourseTable