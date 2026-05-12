import { Edit2, Trash2 } from 'lucide-react'
import { Badge } from '../ui/index'
import { formatDate } from '../../utils/formatDate'

const statusMap = { published: ['success', 'Publicado'], draft: ['gray', 'Rascunho'], closed: ['warning', 'Encerrado'] }

const CourseTable = ({ courses, onEdit, onDelete }) => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  console.log(courses)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {['Curso', 'Professor', 'Data', 'Vagas', 'Status', 'Ações'].map(h => (
              <th key={h} className="pb-3 pr-4 text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map(c => {
            const [variant, label] = statusMap[c.status] || ['gray', c.status]
            return (
              <tr key={c._id} className="hover:bg-surface-page transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 ml-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-light flex-shrink-0 overflow-hidden">
                      {c.imageUrl
                        ? <img src={`${apiBase}${c.imageUrl}`} alt="" className="w-full h-full object-cover" />
                        : null}
                    </div>
                    <span className="font-medium text-text-primary max-w-[160px] truncate">{c.title}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{c.professor || '—'}</td>
                <td className="py-3 pr-4 text-text-muted whitespace-nowrap">{formatDate(c.date)}</td>
                <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                  {c.enrolledCount}/{c.maxSlots}
                </td>
                <td className="py-3 pr-4"><Badge variant={variant}>{label}</Badge></td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(c)} className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {courses.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">Nenhum curso encontrado.</div>
      )}
    </div>
  )
}

export default CourseTable
