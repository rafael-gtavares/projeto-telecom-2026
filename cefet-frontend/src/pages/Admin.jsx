import { useState, useEffect } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import {
  Plus,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react'


// Layout
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'


// Dashboard
import DashboardMetrics from '../components/admin/dashboard/DashboardMetrics'
import RecentCoursesCard from '../components/admin/dashboard/RecentCoursesCard'


// Charts
import EnrollmentChartCard from '../components/admin/charts/EnrollmentChartCard'
import GenderChartCard from '../components/admin/charts/GenderChartCard'
import AgeChartCard from '../components/admin/charts/AgeChartCard'
import SchoolLevelChartCard from '../components/admin/charts/SchoolLevelChartCard'
import IncomeRangeChartCard from '../components/admin/charts/IncomeRangeChartCard'

// Tables
import CourseTable from '../components/admin/CourseTable'
import UserTable from '../components/admin/UserTable'


// Modals
import CourseModal from '../components/courses/CourseModal'

import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

import { Spinner } from '../components/ui/index'


// Context
import { useAuth } from '../context/AuthContext'


// APIs
import {
  getCoursesAPI,
  getAllCoursesAPI,
  createCourseAPI,
  updateCourseAPI,
  deleteCourseAPI
} from '../api/courses'

import {
  getUsersAPI,
  updateUserRoleAPI,
  getAdminStatsAPI
} from '../api/users'

import {
  getAdminSchoolsAPI,
  createSchoolAPI,
  updateSchoolAPI,
  deleteSchoolAPI,
} from '../api/schools'


// Mock
import { mockCourses } from '../mockData/courses'

const EMPTY_SCHOOL_FORM = { name: '', city: '', state: '', active: true }

const Admin = () => {

  const { tab = '' } = useParams()

  const navigate = useNavigate()

  const { logout, role } = useAuth()


  // ======================================================
  // STATES
  // ======================================================

  const [stats, setStats] = useState(null)

  const [period, setPeriod] = useState('6m')

  const [courses, setCourses] = useState([])

  const [users, setUsers] = useState([])

  const [schools, setSchools] = useState([])

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [courseModal, setCourseModal] = useState({
    open: false,
    course: null
  })

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    course: null
  })

  const [schoolModal, setSchoolModal] = useState({
    open: false,
    school: null, // null = criação, objeto = edição
  })
  
  const [schoolForm, setSchoolForm] = useState(EMPTY_SCHOOL_FORM)
  const [schoolFormError, setSchoolFormError] = useState('')

  const [deleteSchoolModal, setDeleteSchoolModal] = useState({
    open: false,
    school: null,
  })

  const [statusFilter, setStatusFilter] = useState('all')

  const [loading, setLoading] = useState({
    stats: true,
    courses: true,
    users: true,
    schools: true,
    save: false,
    delete: false,
    role: false,
    schoolSave: false,
    schoolDelete: false,
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


  // ======================================================
  // BUSCAR ESTATÍSTICAS
  // ======================================================

  useEffect(() => {

    setLoad('stats', true)

    getAdminStatsAPI(period)

      .then(response => {
        setStats(response.data.data)
      })

      .catch(() => {
        setStats(null)
      })

      .finally(() => {
        setLoad('stats', false)
      })

  }, [period])


  // ======================================================
  // BUSCAR CURSOS / USUÁRIOS / ESCOLAS
  // ======================================================

  useEffect(() => {

    if (!tab) return

    // Cursos
    if (tab === 'cursos') {

      setLoad('courses', true)

      getAllCoursesAPI({ limit: 50, status: statusFilter })

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

    // Escolas
    if (tab === 'escolas' && role === 'admin') {

      setLoad('schools', true)

      getAdminSchoolsAPI()
        .then(response => setSchools(response.data.data))
        .catch(() => setSchools([]))
        .finally(() => setLoad('schools', false))
    }

  }, [tab, role, statusFilter])

  // useEffect dedicado para busca de usuários com debounce
  useEffect(() => {
    if (tab !== 'usuarios' || role !== 'admin') return

    setLoad('users', true)

    const timeout = setTimeout(() => {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (roleFilter !== 'all') params.role = roleFilter

      getUsersAPI(params)
        .then(response => { setUsers(response.data.data.users) })
        .catch(() => { setUsers([]) })
        .finally(() => { setLoad('users', false) })
    }, 300)

    return () => clearTimeout(timeout)

  }, [tab, role, search, roleFilter])


  // ======================================================
  // SALVAR CURSO
  // ======================================================

  const handleSaveCourse = async (formData) => {

    setLoad('save', true)

    try {

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
      }

      else {

        const { data } = await createCourseAPI(formData)

        setCourses(prev => [
          data.data,
          ...prev
        ])
      }

      setCourseModal({
        open: false,
        course: null
      })

    }

    catch (err) {

      alert(
        err.response?.data?.message ||
        'Erro ao salvar curso'
      )
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

    }

    catch {

      alert('Erro ao excluir curso')
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

      alert(
        err.response?.data?.message ||
        'Erro ao alterar cargo'
      )
    }

    finally {

      setLoad('role', false)
    }
  }


  // ======================================================
  // ESCOLAS — abrir modal
  // ======================================================

  const openSchoolModal = (school = null) => {
    setSchoolForm(school
      ? { name: school.name, city: school.city || '', state: school.state || '', active: school.active ?? true }
      : EMPTY_SCHOOL_FORM
    )
    setSchoolFormError('')
    setSchoolModal({ open: true, school })
  }


  // ======================================================
  // ESCOLAS — salvar (criar ou editar)
  // ======================================================

  const handleSaveSchool = async () => {
    if (!schoolForm.name.trim()) {
      setSchoolFormError('O nome é obrigatório')
      return
    }

    setLoad('schoolSave', true)
    setSchoolFormError('')

    try {
      if (schoolModal.school) {
        // Editar
        const { data } = await updateSchoolAPI(schoolModal.school._id, schoolForm)
        setSchools(prev => prev.map(s => s._id === data.data._id ? data.data : s))
      } else {
        // Criar
        const { data } = await createSchoolAPI(schoolForm)
        setSchools(prev => [data.data, ...prev])
      }
      setSchoolModal({ open: false, school: null })
    } catch (err) {
      setSchoolFormError(err.response?.data?.message || 'Erro ao salvar escola')
    } finally {
      setLoad('schoolSave', false)
    }
  }


  // ======================================================
  // ESCOLAS — excluir
  // ======================================================

  const handleDeleteSchool = async () => {
    if (!deleteSchoolModal.school) return

    setLoad('schoolDelete', true)

    try {
      await deleteSchoolAPI(deleteSchoolModal.school._id)
      setSchools(prev => prev.filter(s => s._id !== deleteSchoolModal.school._id))
      setDeleteSchoolModal({ open: false, school: null })
    } catch {
      alert('Erro ao excluir escola')
    } finally {
      setLoad('schoolDelete', false)
    }
  }


  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {

    logout()

    navigate('/')
  }


  return (

    <div className="min-h-screen bg-surface-page flex">

      <Sidebar onLogout={handleLogout} />


      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0 overflow-y-auto h-screen">

        <div className="px-4 md:px-8 py-6 max-w-5xl w-full mx-auto">


          {/* ======================================================
              DASHBOARD
          ====================================================== */}

          {!tab && (

            <div className="animate-fadeIn">

              <h1 className="text-xl font-bold text-text-primary mb-6">
                Dashboard
              </h1>


              {loading.stats ? (

                <div className="flex justify-center py-16">
                  <Spinner />
                </div>

              ) : (

                <>

                  <DashboardMetrics stats={stats} />

                  <div className="flex items-center justify-between mb-4">

                    <div>
                      <h3 className="font-semibold text-text-primary text-sm">
                        Inscrições por mês
                      </h3>

                      <p className="text-xs text-text-muted">
                        Período selecionado
                      </p>
                    </div>

                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="
                        border border-border
                        rounded-lg
                        px-3 py-2
                        text-sm
                        bg-surface
                      "
                    >
                      <option value="1m">1 mês</option>
                      <option value="3m">3 meses</option>
                      <option value="6m">6 meses</option>
                      <option value="1y">1 ano</option>
                    </select>

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

                    <RecentCoursesCard
                      courses={stats?.recentCourses}
                    />

                  </div>

                </>
              )}
            </div>
          )}


          {/* ======================================================
              CURSOS
          ====================================================== */}

          {tab === 'cursos' && (
            <div className="animate-fadeIn">

              <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">

                <h1 className="text-xl font-bold text-text-primary">
                  Cursos
                </h1>

                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-border rounded-btn px-3 py-2.5 text-sm bg-white text-text-primary focus:border-primary focus:shadow-focus transition-all"
                  >
                    <option value="all">Todos os cursos</option>
                    <option value="published">Publicados</option>
                    <option value="draft">Rascunhos</option>
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

                <div className="p-4 md:p-6">

                  {loading.courses ? (

                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>

                  ) : (

                    <CourseTable
                      courses={courses}
                      onEdit={course =>
                        setCourseModal({
                          open: true,
                          course
                        })
                      }
                      onDelete={course =>
                        setDeleteModal({
                          open: true,
                          course
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          )}


          {/* ======================================================
              USUÁRIOS
          ====================================================== */}

          {tab === 'usuarios' && role === 'admin' && (

            <div className="animate-fadeIn">

              <h1 className="text-xl font-bold text-text-primary mb-6">
                Usuários & Permissões
              </h1>

              <div className="card overflow-hidden">

                <div className="p-4 border-b border-border">
                  <div className="flex gap-3 flex-wrap">

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

                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="border border-border rounded-btn px-3 py-2.5 text-sm bg-white text-text-primary focus:border-primary focus:shadow-focus transition-all"
                    >
                      <option value="all">Todos os usuários</option>
                      <option value="aluno">Alunos</option>
                      <option value="professor">Professores</option>
                      <option value="admin">Admins</option>
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
                      onRoleChange={handleRoleChange}
                      loading={loading.role}
                    />
                  )}

                </div>
              </div>
            </div>
          )}


          {/* ======================================================
              ESCOLAS
          ====================================================== */}

          {tab === 'escolas' && role === 'admin' && (

            <div className="animate-fadeIn">

              <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">Escolas</h1>
                <Button
                  variant="primary"
                  className="gap-2 text-sm py-2.5 px-4"
                  onClick={() => openSchoolModal()}
                >
                  <Plus size={16} />
                  Nova escola
                </Button>
              </div>

              <div className="card overflow-hidden">
                <div className="p-4 md:p-6">

                  {loading.schools ? (

                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>

                  ) : schools.length === 0 ? (

                    <p className="text-center text-text-muted text-sm py-12">
                      Nenhuma escola cadastrada ainda.
                    </p>

                  ) : (

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-3 font-medium text-text-secondary">Nome</th>
                            <th className="pb-3 font-medium text-text-secondary">Cidade</th>
                            <th className="pb-3 font-medium text-text-secondary">Estado</th>
                            <th className="pb-3 font-medium text-text-secondary">Status</th>
                            <th className="pb-3 font-medium text-text-secondary text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {schools.map(school => (
                            <tr key={school._id} className="hover:bg-surface-page transition-colors">
                              <td className="py-3 font-medium text-text-primary">{school.name}</td>
                              <td className="py-3 text-text-secondary">{school.city || '—'}</td>
                              <td className="py-3 text-text-secondary">{school.state || '—'}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  school.active
                                    ? 'bg-success-light text-success-text'
                                    : 'bg-surface-hover text-text-muted'
                                }`}>
                                  {school.active ? 'Ativa' : 'Inativa'}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => openSchoolModal(school)}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteSchoolModal({ open: true, school })}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      <BottomNav />


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
          MODAL EXCLUIR CURSO
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

          <button
            onClick={handleDelete}
            disabled={loading.delete}
            className="flex-1 btn-primary bg-error hover:bg-error-text justify-center"
          >
            {loading.delete
              ? 'Excluindo...'
              : (
                <>
                  <Trash2 size={14} />
                  Excluir
                </>
              )}
          </button>

          <Button
            variant="secondary"
            onClick={() =>
              setDeleteModal({
                open: false,
                course: null
              })
            }
          >
            Cancelar
          </Button>

        </div>
      </Modal>


      {/* ======================================================
          MODAL CRIAR / EDITAR ESCOLA
      ====================================================== */}

      <Modal
        open={schoolModal.open}
        onClose={() => setSchoolModal({ open: false, school: null })}
        title={schoolModal.school ? 'Editar escola' : 'Nova escola'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nome da escola"
            placeholder="Ex: Colégio Estadual João da Silva"
            value={schoolForm.name}
            onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cidade"
              placeholder="Ex: Niterói"
              value={schoolForm.city}
              onChange={e => setSchoolForm(f => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Estado"
              placeholder="Ex: RJ"
              value={schoolForm.state}
              onChange={e => setSchoolForm(f => ({ ...f, state: e.target.value }))}
            />
          </div>

          {/* Toggle ativo/inativo — só aparece na edição */}
          {schoolModal.school && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={schoolForm.active ?? true}
                  onChange={e => setSchoolForm(f => ({ ...f, active: e.target.checked }))}
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${(schoolForm.active ?? true) ? 'bg-primary' : 'bg-border'}`} />
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${(schoolForm.active ?? true) ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-text-secondary">Escola ativa</span>
            </label>
          )}

          {schoolFormError && (
            <p className="text-error text-sm">{schoolFormError}</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveSchool}
            loading={loading.schoolSave}
          >
            {schoolModal.school ? 'Salvar alterações' : 'Criar escola'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSchoolModal({ open: false, school: null })}
            disabled={loading.schoolSave}
          >
            Cancelar
          </Button>
        </div>
      </Modal>


      {/* ======================================================
          MODAL EXCLUIR ESCOLA
      ====================================================== */}

      <Modal
        open={deleteSchoolModal.open}
        onClose={() => setDeleteSchoolModal({ open: false, school: null })}
        title="Excluir escola"
        size="sm"
      >
        <p className="text-text-secondary text-sm mb-5">
          Tem certeza que deseja excluir
          <strong className="text-text-primary"> "{deleteSchoolModal.school?.name}"</strong>?
          {' '}Esta ação não pode ser desfeita.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleDeleteSchool}
            disabled={loading.schoolDelete}
            className="flex-1 btn-primary bg-error hover:bg-error-text justify-center"
          >
            {loading.schoolDelete ? 'Excluindo...' : <><Trash2 size={14} /> Excluir</>}
          </button>
          <Button
            variant="secondary"
            onClick={() => setDeleteSchoolModal({ open: false, school: null })}
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Admin