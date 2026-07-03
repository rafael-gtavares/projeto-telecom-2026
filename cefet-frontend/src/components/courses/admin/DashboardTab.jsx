import { Users, BookOpen, FileText, BarChart2 } from 'lucide-react'
import { formatDate } from '../../../utils/formatDate'
import { formatModality } from '../../../utils/formatModality'

// Card de métrica local (compacto), específico da visão de curso.
// Não usa components/admin/MetricCard.jsx pois esse último tem um layout
// maior, pensado para os dashboards gerais do admin.
const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="card p-4 flex flex-col justify-center">
    <div className="flex items-center gap-2 mb-2 text-text-muted">
      <Icon size={16} />
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-2xl font-bold text-primary">{value}</span>
  </div>
)

const DashboardTab = ({ course, students, lessons, materials }) => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard label="Alunos inscritos" value={students.length} icon={Users} />
      <MetricCard label="Aulas cadastradas" value={lessons.length} icon={BookOpen} />
      <MetricCard label="Materiais" value={materials.length} icon={FileText} />
      <MetricCard
        label="Ocupação"
        value={`${course.maxSlots > 0 ? Math.round((course.enrolledCount / course.maxSlots) * 100) : 0}%`}
        icon={BarChart2}
      />
    </div>
    <div className="card p-4">
      <h3 className="font-semibold text-text-primary mb-3 text-sm">Informações do curso</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-text-muted text-xs">Início</p><p className="font-medium">{formatDate(course.startDate)}</p></div>
        <div><p className="text-text-muted text-xs">Término</p><p className="font-medium">{formatDate(course.endDate)}</p></div>
        <div><p className="text-text-muted text-xs">Modalidade</p><p className="font-medium">{formatModality(course.modality)}</p></div>
        <div><p className="text-text-muted text-xs">Local</p><p className="font-medium">{course.location || '—'}</p></div>
      </div>
    </div>
  </div>
)

export default DashboardTab
