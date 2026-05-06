import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, BookOpen, ClipboardList, BarChart2, Plus, Search, Trash2 } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'
import MetricCard from '../components/admin/MetricCard'
import CourseTable from '../components/admin/CourseTable'
import UserTable from '../components/admin/UserTable'
import CourseModal from '../components/courses/CourseModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { Spinner } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { getCoursesAPI, createCourseAPI, updateCourseAPI, deleteCourseAPI } from '../api/courses'
import { getUsersAPI, updateUserRoleAPI, getAdminStatsAPI } from '../api/users'
import { mockCourses } from '../mockData/courses'

const BarChartSimple = ({ data }) => {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map(({ month, count }) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-text-muted">{count}</span>
          <div className="w-full bg-surface-hover rounded-t-sm relative" style={{ height: `${(count / max) * 96}px`, minHeight: 4 }}>
            <div className="absolute inset-0 bg-primary rounded-t-sm opacity-80" />
          </div>
          <span className="text-[10px] text-text-muted">{month}</span>
        </div>
      ))}
    </div>
  )
}

const Admin = () => {
  const { tab = '' } = useParams()
  const { logout, role } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [courses, setCourses] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [courseModal, setCourseModal] = useState({ open: false, course: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, course: null })
  const [loading, setLoading] = useState({ stats: true, courses: true, users: true, save: false, delete: false, role: false })

  const setLoad = (k, v) => setLoading(l => ({ ...l, [k]: v }))

  useEffect(() => {
    getAdminStatsAPI().then(r => setStats(r.data.data)).catch(() => setStats(null)).finally(() => setLoad('stats', false))
  }, [])

  useEffect(() => {
    if (tab === '' || tab === undefined) return
    if (tab === 'cursos') {
      getCoursesAPI({ limit: 50 })
        .then(r => setCourses(r.data.data.courses))
        .catch(() => setCourses(mockCourses))
        .finally(() => setLoad('courses', false))
    }
    if (tab === 'usuarios' && role === 'admin') {
      getUsersAPI().then(r => setUsers(r.data.data.users)).catch(() => setUsers([])).finally(() => setLoad('users', false))
    }
  }, [tab])

  useEffect(() => {
    if (tab === 'cursos') {
      setLoad('courses', true)
      getCoursesAPI({ limit: 50 })
        .then(r => setCourses(r.data.data.courses))
        .catch(() => setCourses(mockCourses))
        .finally(() => setLoad('courses', false))
    }
  }, [tab])

  const handleSaveCourse = async (formData) => {
    setLoad('save', true)
    try {
      if (courseModal.course) {
        const { data } = await updateCourseAPI(courseModal.course._id, formData)
        setCourses(cs => cs.map(c => c._id === data.data._id ? data.data : c))
      } else {
        const { data } = await createCourseAPI(formData)
        setCourses(cs => [data.data, ...cs])
      }
      setCourseModal({ open: false, course: null })
    } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar curso') }
    finally { setLoad('save', false) }
  }

  const handleDelete = async () => {
    if (!deleteModal.course) return
    setLoad('delete', true)
    try {
      await deleteCourseAPI(deleteModal.course._id)
      setCourses(cs => cs.filter(c => c._id !== deleteModal.course._id))
      setDeleteModal({ open: false, course: null })
    } catch { alert('Erro ao excluir curso') }
    finally { setLoad('delete', false) }
  }

  const handleRoleChange = async (id, newRole) => {
    setLoad('role', true)
    try {
      const { data } = await updateUserRoleAPI(id, newRole)
      setUsers(us => us.map(u => u._id === id ? data.data : u))
    } catch (err) { alert(err.response?.data?.message || 'Erro ao alterar cargo') }
    finally { setLoad('role', false) }
  }

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-surface-page flex">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        <div className="px-4 md:px-8 py-6 max-w-5xl w-full mx-auto">

          {/* Dashboard */}
          {tab === '' && (
            <div className="animate-fadeIn">
              <h1 className="text-xl font-bold text-text-primary mb-6">Dashboard</h1>
              {loading.stats ? (
                <div className="flex justify-center py-16"><Spinner /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <MetricCard label="Alunos" value={stats?.totalUsers ?? '—'} icon={Users} />
                    <MetricCard label="Cursos ativos" value={stats?.totalCourses ?? '—'} icon={BookOpen} bg="bg-success-light" color="text-success" />
                    <MetricCard label="Inscrições" value={stats?.totalEnrollments ?? '—'} icon={ClipboardList} bg="bg-warning-light" color="text-warning" />
                    <MetricCard label="Ocupação média" value={stats?.avgOccupancy ? `${stats.avgOccupancy}%` : '—'} icon={BarChart2} bg="bg-purple-50" color="text-purple-600" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card p-5">
                      <h3 className="font-semibold text-text-primary text-sm mb-1">Inscrições por mês</h3>
                      <p className="text-xs text-text-muted">Últimos 6 meses</p>
                      <BarChartSimple data={stats?.enrollmentsByMonth} />
                    </div>
                    <div className="card p-5">
                      <h3 className="font-semibold text-text-primary text-sm mb-3">Cursos recentes</h3>
                      <div className="space-y-2.5">
                        {(stats?.recentCourses || []).map(c => (
                          <div key={c._id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-text-primary font-medium truncate">{c.title}</span>
                            <span className="text-text-muted whitespace-nowrap text-xs">{c.enrolledCount}/{c.maxSlots}</span>
                          </div>
                        ))}
                        {!stats?.recentCourses?.length && <p className="text-text-muted text-sm">Nenhum curso cadastrado.</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cursos */}
          {tab === 'cursos' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">Cursos</h1>
                <Button variant="primary" className="gap-2 text-sm py-2.5 px-4" onClick={() => setCourseModal({ open: true, course: null })}>
                  <Plus size={16} /> Novo curso
                </Button>
              </div>
              <div className="card overflow-hidden">
                <div className="p-4 md:p-6">
                  {loading.courses
                    ? <div className="flex justify-center py-12"><Spinner /></div>
                    : <CourseTable courses={courses} onEdit={c => setCourseModal({ open: true, course: c })} onDelete={c => setDeleteModal({ open: true, course: c })} />
                  }
                </div>
              </div>
            </div>
          )}

          {/* Usuários */}
          {tab === 'usuarios' && role === 'admin' && (
            <div className="animate-fadeIn">
              <h1 className="text-xl font-bold text-text-primary mb-6">Usuários & Permissões</h1>
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      placeholder="Buscar por nome ou e-mail..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="input-field pl-9 text-sm py-2.5"
                    />
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  {loading.users
                    ? <div className="flex justify-center py-12"><Spinner /></div>
                    : <UserTable users={filteredUsers} onRoleChange={handleRoleChange} loading={loading.role} />
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <CourseModal
        open={courseModal.open}
        onClose={() => setCourseModal({ open: false, course: null })}
        onSave={handleSaveCourse}
        course={courseModal.course}
        loading={loading.save}
      />

      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, course: null })} title="Excluir curso" size="sm">
        <p className="text-text-secondary text-sm mb-5">
          Tem certeza que deseja excluir <strong className="text-text-primary">"{deleteModal.course?.title}"</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={loading.delete} className="flex-1 btn-primary bg-error hover:bg-error-text justify-center">
            {loading.delete ? 'Excluindo...' : <><Trash2 size={14} /> Excluir</>}
          </button>
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, course: null })}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  )
}

export default Admin
