import { Plus, Trash2 } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { Avatar } from '../../ui/index'

const StudentDetailModal = ({ open, student, grades, onClose, onOpenGrade, onDeleteGrade }) => (
  <Modal open={open} onClose={onClose} title={student?.name || 'Aluno'} size="md">
    {student && (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size="lg" />
          <div>
            <p className="font-semibold text-text-primary">{student.name}</p>
            <p className="text-sm text-text-muted">{student.email}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-text-primary text-sm">Notas</h4>
            <Button variant="secondary" className="text-xs py-1.5 px-3 gap-1" onClick={() => onOpenGrade(student)}>
              <Plus size={13} /> Lançar nota
            </Button>
          </div>
          {grades.filter(g => g.student._id === student._id).length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Nenhuma nota lançada ainda.</p>
          ) : (
            grades.filter(g => g.student._id === student._id).map(g => (
              <div key={g._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{g.title}</p>
                  <p className="text-xs text-text-muted">{g.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{g.grade}</span>
                  <span className="text-text-muted text-xs">/{g.maxGrade}</span>
                  <button onClick={() => onDeleteGrade(g._id)} className="p-1 text-text-muted hover:text-error transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </Modal>
)

export default StudentDetailModal
