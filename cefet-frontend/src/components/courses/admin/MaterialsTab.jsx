import { Plus, Edit2, Trash2, BookOpen, Link, FileArchive } from 'lucide-react'
import { Badge } from '../../ui/index'
import Button from '../../ui/Button'

const MaterialsTab = ({ materials, onCreate, onEdit, onDelete }) => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex justify-end">
      <Button variant="primary" className="gap-2 text-sm" onClick={onCreate}>
        <Plus size={15} /> Novo material
      </Button>
    </div>

    {materials.length === 0 ? (
      <div className="text-center py-12 text-text-muted text-sm">Nenhum material cadastrado.</div>
    ) : (
      <div className="space-y-3">
        {materials.map(mat => {
          const typeIcon = {
            text: <BookOpen size={16} />,
            link: <Link size={16} />,
            file: <FileArchive size={16} />
          }[mat.type] || <BookOpen size={16} />

          return (
            <div key={mat._id} className="card p-4 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-card bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
                {typeIcon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary text-sm">{mat.title}</h4>
                <Badge variant="gray" className="text-xs mt-1">{mat.type}</Badge>
                {mat.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{mat.description}</p>}
                {mat.content && (
                  mat.type === 'text' ? (
                    <p className="text-xs italic text-text-muted mt-2 line-clamp-3">
                      "{mat.content}"
                    </p>
                  ) : (
                    <a
                      href={mat.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 block truncate"
                    >
                      {mat.content}
                    </a>
                  )
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onEdit(mat)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(mat._id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)

export default MaterialsTab
