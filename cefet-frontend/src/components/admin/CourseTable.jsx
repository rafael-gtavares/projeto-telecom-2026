import { Edit2, Trash2, Calendar as CalendarIcon, Clock, BookOpen, ChevronRight } from 'lucide-react'
import { Badge } from '../ui/index'
import { formatDate } from '../../utils/formatDate'

const statusMap = {
  draft: ['gray', 'Rascunho'],
  published: ['success', 'Publicado'],
  em_andamento: ['blue', 'Em Andamento'],
  closed: ['warning', 'Encerrado'],
  vagas_encerradas: ['purple', 'Vagas Encerradas']
}

const CourseTable = ({ courses, onEdit, onDelete, onView }) => {

  return (
    <div className="overflow-x-auto">
      {/* Layout em cards para mobile — visível apenas abaixo de sm */}
      <div className="sm:hidden space-y-3">
        {courses.map(course => {
          const [statusVariant, statusLabel] = statusMap[course.status] || ['gray', course.status]
          return (
            <div key={`mob-${course._id}`} className="flex items-center gap-3 p-3 border border-border rounded-card hover:border-primary transition-colors">

              {/* Miniatura */}
              <div className="w-12 h-12 rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden border border-border">
                {course.imageUrl
                  ? <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen size={18} className="text-text-muted" /></div>
                }
              </div>

              {/* Título e status */}
              <button onClick={() => onView(course)} className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-text-primary text-sm truncate hover:text-primary transition-colors">{course.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  <span className="text-xs text-text-muted">{course.enrolledCount}/{course.maxSlots}</span>
                </div>
              </button>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(course)}
                  className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => onDelete(course)}
                  className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}

        {courses.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">Nenhum curso cadastrado.</div>
        )}
      </div>

      <table className="w-full text-sm hidden sm:table">
        <thead>
          <tr className="border-b border-border text-left">
            {/* Coluna "Curso" — sempre visível (sem alteração) */}
            <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Curso</th>

            {/* Coluna "Criado por" — ocultar em telas abaixo de lg */}
            <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Criado por</th>

            {/* Coluna "Período / Dias" — ocultar em telas abaixo de md */}
            <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Período / Dias</th>

            {/* Colunas "Vagas", "Status", "Ações" — sempre visíveis (sem alteração) */}
            <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Vagas</th>
            <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Status</th>
            <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map(course => {
            const [statusVariant, statusLabel] = statusMap[course.status] || ['gray', course.status]
            
            const isMultiDay = new Date(course.startDate).toDateString() !== new Date(course.endDate).toDateString()

            return (
              <tr key={course._id} className="hover:bg-surface-page transition-colors group">
                {/* COLUNA: CURSO */}
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3 ml-1">
                    <div className="w-12 h-12 rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden border border-border">
                      {course.imageUrl
                        ? <img src={course.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-hover font-bold text-xs">
                            <BookOpen size={20} />
                          </div>}
                    </div>
                    <div className="flex flex-col">
                      <span onClick={() => onView(course)} className="font-bold text-text-primary max-w-[180px] truncate group-hover:text-primary transition-colors cursor-pointer hover:underline">
                        {course.title}
                      </span>
                      <span className="text-[11px] text-text-muted">ID: {course._id.slice(-6)}</span>
                    </div>
                  </div>
                </td>

                {/* COLUNA: CRIADO POR */}
                <td className="py-4 pr-4 text-text-secondary font-medium whitespace-nowrap hidden lg:table-cell">
                  {course.professor?.name || '—'}
                </td>

                {/* COLUNA: DATA / MODALIDADE */}
                <td className="py-4 pr-4 whitespace-nowrap hidden md:table-cell">
                  <div className="flex flex-col gap-1 min-w-0 max-w-[240px]">
                    <div className="flex items-center gap-1.5 text-text-primary font-semibold text-xs truncate overflow-hidden">
                      <CalendarIcon size={13} className="text-primary" />
                      <span className="truncate">
                        {isMultiDay
                          ? `${formatDate(course.startDate)} - ${formatDate(course.endDate)}`
                          : formatDate(course.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px] truncate overflow-hidden">
                      <Clock size={13} />
                      <span className="truncate capitalize">
                        {course.modality?.replace('_', ' ') || 'Presencial'}
                        {course.location ? ` · ${course.location}` : ''}
                      </span>
                    </div>
                  </div>
                </td>

                {/* COLUNA: VAGAS */}
                <td className="py-4 pr-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-text-primary font-bold">{course.enrolledCount}/{course.maxSlots}</span>
                    <div className="w-16 bg-border h-1 rounded-full mt-1 overflow-hidden hidden sm:block">
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${Math.min(100, (course.enrolledCount / course.maxSlots) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* COLUNA: STATUS */}
                <td className="py-4 pr-4">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </td>

                {/* COLUNA: AÇÕES */}
                <td className="py-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onView(course)} 
                      title="Gerenciar curso"
                      className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      onClick={() => onEdit(course)} 
                      title="Editar curso"
                      className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(course)} 
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
        <div className="text-center py-16 hidden sm:block">
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