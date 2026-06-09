import {
  Users,
  BookOpen,
  ClipboardList,
  BarChart2
} from 'lucide-react'

import MetricCard from '../../../components/admin/MetricCard'

const DashboardMetrics = ({ stats }) => {

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

      <MetricCard
        label="Alunos"
        value={stats?.totalUsers ?? '—'}
        icon={Users}
      />

      <MetricCard
        label="Cursos publicados"
        value={stats?.totalCourses ?? '—'}
        icon={BookOpen}
        bg="bg-success-light"
        color="text-success"
      />

      <MetricCard
        label="Inscrições"
        value={stats?.totalEnrollments ?? '—'}
        icon={ClipboardList}
        bg="bg-warning-light"
        color="text-warning"
      />

      <MetricCard
        label="Ocupação média"
        value={
          stats?.avgOccupancy
            ? `${stats.avgOccupancy}%`
            : '—'
        }
        icon={BarChart2}
        bg="bg-purple-50"
        color="text-purple-600"
      />

    </div>
  )
}

export default DashboardMetrics