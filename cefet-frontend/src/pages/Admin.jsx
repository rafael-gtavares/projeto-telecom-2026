import { useState, useEffect } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import { Plus, Search, Trash2, AlertCircle, BookOpen } from 'lucide-react'

// Layout
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'


// Dashboard
import DashboardMetrics from '../components/admin/dashboard/DashboardMetrics'
import SiteAccessSection from '../components/admin/dashboard/SiteAccessSection'
import RecentCoursesCard from '../components/admin/dashboard/RecentCoursesCard'
import CourseStatsSection from '../components/admin/dashboard/CourseStatsSection'


// Charts
import PeriodSelect, { PERIOD_LABELS } from '../components/admin/charts/PeriodSelect'
import EnrollmentChartCard from '../components/admin/charts/EnrollmentChartCard'
import GenderChartCard from '../components/admin/charts/GenderChartCard'
import AgeChartCard from '../components/admin/charts/AgeChartCard'
import SchoolLevelChartCard from '../components/admin/charts/SchoolLevelChartCard'
import IncomeRangeChartCard from '../components/admin/charts/IncomeRangeChartCard'
import SchoolChartCard from '../components/admin/charts/SchoolChartCard'

// Tables
import CourseTable from '../components/admin/CourseTable'
import UserTable from '../components/admin/UserTable'
import AdminFeedbacksPanel from '../components/admin/AdminFeedbacksPanel'

// Manager
import SchoolsManager from '../components/admin/SchoolsManager'


// Modals
import CourseModal from '../components/courses/CourseModal'

import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'

import { Spinner } from '../components/ui/index'


// Context
import { useAuth } from '../context/AuthContext'
import { canManageUsers, canManageSchools } from '../utils/permissions'

// Hooks
import { useSchools } from '../hooks/useSchools'


// APIs
import {
  getAllCoursesAPI,
  createCourseAPI,
  updateCourseAPI,
  deleteCourseAPI,
  getUserEnrollmentsAPI
} from '../api/courses'

import {
  getUsersAPI,
  updateUserRoleAPI,
  getAdminStatsAPI,
  updateEditPermissionAPI
} from '../api/users'



// Mock
import { mockCourses } from '../mockData/courses'


const Admin = () => {

  const { tab = '' } = useParams()

  const navigate = useNavigate()

  const { logout, role } = useAuth()

  const { schools } = useSchools()


  // ======================================================
  // STATES
  // ======================================================

  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [period, setPeriod] = useState('6m')

  const [courses, setCourses] = useState([])

  const [users, setUsers] = useState([])

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [courseSearch, setCourseSearch] = useState('')

  const [courseModal, setCourseModal] = useState({
    open: false,
    course: null
  })

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    course: null
  })

  const [statusFilter, setStatusFilter] = useState('all')

  const [loading, setLoading] = useState({
    stats: true,
    courses: true,
    users: true,
    save: false,
    delete: false,
    role: false,
    featuring: false
  })


  // ======================================================
  // HELPERS
  // ======================================================

  const setLoad = (key, value) => {
    setLoading(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Filtro de busca de cursos (por título ou instrutor), feito no cliente
  const filteredCourses = courseSearch.trim()
    ? courses.filter(c => {
      const q = courseSearch.trim().toLowerCase()
      return (c.title || '').toLowerCase().includes(q) ||
        (c.instructor || '').toLowerCase().includes(q)
    })
    : courses


  // ======================================================
  // BUSCAR ESTATÍSTICAS
  // ======================================================

  useEffect(() => {

    setLoad('stats', true)

    getAdminStatsAPI(period)

      .then(response => {
        setStats(response.data.data)
        setStatsError(false)
      })

      .catch(() => {
        setStats(null)
        setStatsError(true)
      })

      .finally(() => {
        setLoad('stats', false)
      })

  }, [period])


  // ======================================================
  // BUSCAR CURSOS / USUÁRIOS
  // ======================================================

  useEffect(() => {

    if (!tab) return


    // Cursos
    if (tab === 'cursos') {

      setLoad('courses', true)

      // envia o filtro de status (pode ser 'all', 'published', 'draft', 'closed')
      getAllCoursesAPI({ limit: 100, status: statusFilter })

        .then(response => {
          setCourses(response.data.data.courses)
        })

        .catch(() => {
          setCourses(mockCourses)
        })

        .finally(() => {
          setLoad('courses', false)
        })
    }

  }, [tab, role, statusFilter])

  useEffect(() => {
    if (tab !== 'usuarios' || !canManageUsers(role)) return

    setLoad('users', true)

    const timeout = setTimeout(() => {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (roleFilter !== 'all') params.role = roleFilter
      if (schoolFilter !== 'all') params.school = schoolFilter

      getUsersAPI(params)
        .then(response => { setUsers(response.data.data.users) })
        .catch(() => { setUsers([]) })
        .finally(() => { setLoad('users', false) })
    }, 300)  // debounce de 300ms para não disparar a cada tecla

    return () => clearTimeout(timeout)

  }, [tab, role, search, roleFilter, schoolFilter])


  // ======================================================
  // SALVAR CURSO
  // ======================================================

  const handleSaveCourse = async (formData) => {

    setLoad('save', true)

    try {

      // Editar
      if (courseModal.course) {

        const { data } = await updateCourseAPI(
          courseModal.course._id,
          formData
        )

        setCourses(prev =>
          prev.map(course =>
            course._id === data.data._id
              ? data.data
              : course
          )
        )

        setToast({
          show: true,
          message: 'Curso atualizado com sucesso.'
        })
      }

      // Criar
      else {

        const { data } = await createCourseAPI(formData)

        setCourses(prev => [
          data.data,
          ...prev
        ])

        setToast({
          show: true,
          message: 'Curso criado com sucesso.'
        })
      }

      setCourseModal({
        open: false,
        course: null
      })

    }

    catch (err) {

      setToast({
        show: true,
        message: err.response?.data?.message || 'Erro ao salvar curso',
      })
    }

    finally {

      setLoad('save', false)
    }
  }


  // ======================================================
  // EXCLUIR CURSO
  // ======================================================

  const handleDelete = async () => {

    if (!deleteModal.course) return

    setLoad('delete', true)

    try {

      await deleteCourseAPI(deleteModal.course._id)

      setCourses(prev =>
        prev.filter(course =>
          course._id !== deleteModal.course._id
        )
      )

      setDeleteModal({
        open: false,
        course: null
      })

      setToast({
        show: true,
        message: 'Curso excluído  acom sucesso.'
      })

    }

    catch {

      setToast({ show: true, message: 'Erro ao excluir curso' })
    }

    finally {

      setLoad('delete', false)
    }
  }


  // ======================================================
  // ALTERAR CARGO
  // ======================================================

  const handleRoleChange = async (id, newRole) => {

    setLoad('role', true)

    try {

      const { data } = await updateUserRoleAPI(
        id,
        newRole
      )

      setUsers(prev =>
        prev.map(user =>
          user._id === id
            ? data.data
            : user
        )
      )

    }

    catch (err) {

      setToast({
        show: true,
        message: err.response?.data?.message || 'Erro ao alterar cargo',
      })
    }

    finally {

      setLoad('role', false)
    }
  }





  // ======================================================
  // GERENCIAR CURSO
  // ======================================================

  const handleViewCourse = (course) => {
    navigate(`/admin/curso/${course._id}`)
  }

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {

    logout()

    navigate('/')
  }

  const handleToggleEditPermission = async (id, value) => {
    setLoad('role', true)

    try {
      const { data } = await updateEditPermissionAPI(id, {
        canEditPersonalInfo: value
      })

      setUsers(prev =>
        prev.map(user =>
          user._id === id
            ? data.data
            : user
        )
      )

    } catch (err) {
      setToast({
        show: true,
        message:
          err.response?.data?.message ||
          'Erro ao alterar permissão',
      })
    } finally {
      setLoad('role', false)
    }
  }

  return (

    <div className="min-h-screen bg-surface-page flex">

      <Sidebar onLogout={handleLogout} />


      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0 overflow-y-auto h-screen">

        <div className="px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">


          {/* ======================================================
              DASHBOARD
          ====================================================== */}

          {!tab && (

            <div className="animate-fadeIn">

              <div className="mb-6">
                <h1 className="text-xl font-bold text-text-primary">
                  Dashboard
                </h1>
              </div>


              {loading.stats ? (

                <div className="flex justify-center py-16">
                  <Spinner />
                </div>

              ) : statsError ? (

                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle size={36} className="text-error mb-3" />
                  <p className="font-semibold text-text-primary mb-1">Erro ao carregar estatísticas</p>
                  <p className="text-sm text-text-muted mb-4">Verifique a conexão com o servidor e tente novamente.</p>
                  <Button variant="secondary" onClick={() => setPeriod(p => p)}>Tentar novamente</Button>
                </div>

              ) : (

                <>
                  <DashboardMetrics stats={stats} />

                  {/* Estatísticas de acesso ao site — somente administradores */}
                  {canManageUsers(role) && <SiteAccessSection />}

                  {/* ======================================================
                    ESTATÍSTICAS GERAIS
                ====================================================== */}

                  <div className="mt-8 mb-4">

                    <h2 className="text-lg font-semibold text-text-primary">
                      Perfil dos inscritos
                    </h2>

                    <p className="text-sm text-text-muted">
                      Distribuições demográficas dos alunos de todos os cursos
                    </p>

                  </div>

                  <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">

                    <div>
                      <h3 className="font-semibold text-text-primary text-sm">
                        Visão geral da plataforma
                      </h3>

                      <p className="text-xs text-text-muted">
                        {PERIOD_LABELS[period]}
                      </p>
                    </div>

                    <PeriodSelect value={period} onChange={setPeriod} />

                  </div>

                  <div className="grid md:grid-cols-2 gap-6">

                    <EnrollmentChartCard
                      data={stats?.enrollmentsByMonth}
                      period={period}
                    />

                    <GenderChartCard
                      data={stats?.genderStats}
                    />

                    <AgeChartCard
                      data={stats?.ageStats}
                    />

                    <SchoolLevelChartCard
                      data={stats?.schoolLevelStats}
                    />

                    <IncomeRangeChartCard
                      data={stats?.incomeRangeStats}
                    />

                    <SchoolChartCard
                      data={stats?.schoolStats}
                    />

                    <RecentCoursesCard
                      courses={stats?.recentCourses}
                    />

                  </div>

                  <CourseStatsSection />

                </>
              )}
            </div>
          )}


          {/* ======================================================
              CURSOS
          ====================================================== */}

          {tab === 'cursos' && (
            <div className="animate-fadeIn">

              <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">

                <div className="mb-6">
                  <h1 className="text-xl font-bold text-text-primary">
                    Cursos
                  </h1>
                </div>

                {/* Select e botão agrupados à direita */}
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field text-sm py-2.5 w-auto"
                  >
                    <option value="all">Todos os cursos</option>
                    <option value="draft">Rascunhos</option>
                    <option value="published">Publicados</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="closed">Encerrados</option>
                  </select>

                  <Button
                    variant="primary"
                    className="gap-2 text-sm py-2.5 px-4"
                    onClick={() =>
                      setCourseModal({
                        open: true,
                        course: null
                      })
                    }
                  >
                    <Plus size={16} />
                    Novo curso
                  </Button>
                </div>

              </div>

              <div className="card overflow-hidden">

                {/* Barra de busca de cursos */}
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      placeholder="Buscar curso por título ou instrutor..."
                      value={courseSearch}
                      onChange={e => setCourseSearch(e.target.value)}
                      className="input-field pl-9 text-sm py-2.5 w-full"
                    />
                  </div>
                </div>

                <div className="p-4 md:p-6">

                  {loading.courses ? (

                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>

                  ) : filteredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BookOpen size={36} className="text-text-muted mb-3" />
                      <p className="font-semibold text-text-primary mb-1">Nenhum curso encontrado</p>
                      <p className="text-sm text-text-muted mb-5">
                        {courseSearch.trim()
                          ? 'Nenhum curso corresponde à busca.'
                          : statusFilter === 'all'
                            ? 'Crie seu primeiro curso para começar.'
                            : 'Nenhum curso com este status.'}
                      </p>
                      {!courseSearch.trim() && (
                        <Button
                          variant="primary"
                          className="gap-2 text-sm"
                          onClick={() => setCourseModal({ open: true, course: null })}
                        >
                          <Plus size={16} /> Criar curso
                        </Button>
                      )}
                    </div>
                  ) : (
                    <CourseTable
                      courses={filteredCourses}
                      onEdit={course =>
                        setCourseModal({ open: true, course })
                      }
                      onDelete={course =>
                        setDeleteModal({ open: true, course })
                      }
                      onView={handleViewCourse}
                    />
                  )}
                </div>
              </div>
            </div>
          )}


          {/* ======================================================
              USUÁRIOS
          ====================================================== */}

          {tab === 'usuarios' && canManageUsers(role) && (

            <div className="animate-fadeIn space-y-8">

              <div className="flex flex-col justify-between flex-wrap">
                <h1 className="text-xl font-bold text-text-primary mb-6">
                  Usuários
                </h1>

                <div className="card overflow-hidden mb-2">

                  <div className="p-4 border-b border-border">
                    <div className="flex gap-3 flex-wrap">

                      {/* Campo de busca — ocupa o espaço disponível */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                          placeholder="Buscar por nome ou e-mail..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="input-field pl-9 text-sm py-2.5 w-full"
                        />
                      </div>

                      {/* Select de filtro por role */}
                      <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="input-field text-sm py-2.5 w-auto"
                      >
                        <option value="all">Todos os usuários</option>
                        <option value="aluno">Alunos</option>
                        <option value="professor">Professores</option>
                        <option value="admin">Admins</option>
                        <option value="superadmin">Superadmins</option>
                      </select>

                      {/* Select de filtro por escola */}
                      <select
                        value={schoolFilter}
                        onChange={e => setSchoolFilter(e.target.value)}
                        className="input-field text-sm py-2.5 w-auto"
                      >
                        <option value="all">Todas as escolas</option>
                        <option value="__none__">Sem escola</option>
                        {schools.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>

                    </div>
                  </div>

                  <div className="p-4 md:p-6">

                    {loading.users ? (

                      <div className="flex justify-center py-12">
                        <Spinner />
                      </div>

                    ) : (

                      <UserTable
                        users={users}
                        schools={schools}
                        onRoleChange={handleRoleChange}
                        loading={loading.role}
                        onToggleEditPermission={handleToggleEditPermission}
                      />
                    )}

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              ESCOLAS
          ====================================================== */}

          {tab === 'escolas' && canManageSchools(role) && (

            <div className="animate-fadeIn">
              <h1 className="text-xl font-bold text-text-primary mb-6">
                Escolas
              </h1>
              <div className="card p-5 md:p-6">
                <SchoolsManager />
              </div>

            </div>
          )}

          {tab === 'feedbacks' && canManageUsers(role) && (
            <AdminFeedbacksPanel onNotify={(message) => setToast({ show: true, message })} />
          )}

        </div>
      </div>


      <BottomNav />

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />


      {/* ======================================================
          MODAL CURSO
      ====================================================== */}

      <CourseModal
        open={courseModal.open}
        onClose={() =>
          setCourseModal({
            open: false,
            course: null
          })
        }
        onSave={handleSaveCourse}
        course={courseModal.course}
        loading={loading.save}
      />


      {/* ======================================================
          MODAL EXCLUIR
      ====================================================== */}

      <Modal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({
            open: false,
            course: null
          })
        }
        title="Excluir curso"
        size="sm"
      >

        <p className="text-text-secondary text-sm mb-5">

          Tem certeza que deseja excluir

          <strong className="text-text-primary">
            {' '}
            "{deleteModal.course?.title}"
          </strong>

          ?

          Esta ação não pode ser desfeita.
        </p>


        <div className="flex gap-3">

          <Button
            onClick={handleDelete}
            loading={loading.delete}
            className="flex-1 bg-error hover:bg-error-text border-0"
          >
            <Trash2 size={14} />
            Excluir
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              setDeleteModal({ open: false, course: null })
            }
            disabled={loading.delete}
          >
            Cancelar
          </Button>

        </div>
      </Modal>


    </div>
  )
}

export default Admin