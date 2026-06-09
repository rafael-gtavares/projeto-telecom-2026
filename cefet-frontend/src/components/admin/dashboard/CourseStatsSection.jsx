import { useState, useEffect } from 'react'

import { BookOpen } from 'lucide-react'

import {
    getAllCoursesAPI,
    getCourseStatsAPI
} from '../../../api/courses'

import { Spinner } from '../../ui'

import EnrollmentChartCard from '../charts/EnrollmentChartCard'
import GenderChartCard from '../charts/GenderChartCard'
import AgeChartCard from '../charts/AgeChartCard'
import SchoolLevelChartCard from '../charts/SchoolLevelChartCard'
import IncomeRangeChartCard from '../charts/IncomeRangeChartCard'
import SchoolChartCard from '../charts/SchoolChartCard'
import PeriodSelect, { PERIOD_LABELS } from '../charts/PeriodSelect'

const CourseStatsSection = () => {

    const [courses, setCourses] = useState([])
    const [selectedCourse, setSelectedCourse] = useState(null)

    const [stats, setStats] = useState(null)

    const [period, setPeriod] = useState('6m')

    const [loadingCourses, setLoadingCourses] = useState(true)
    const [loadingStats, setLoadingStats] = useState(false)


    // ======================================================
    // BUSCAR CURSOS
    // ======================================================

    useEffect(() => {

        const loadCourses = async () => {

            try {

                const response = await getAllCoursesAPI({
                    limit: 50,
                    status: 'published'
                })

                const coursesData = response.data.data.courses || []

                setCourses(coursesData)

                if (coursesData.length) {
                    setSelectedCourse(coursesData[0])
                }

            }

            catch {

                setCourses([])
            }

            finally {

                setLoadingCourses(false)
            }
        }

        loadCourses()

    }, [])


    // ======================================================
    // BUSCAR ESTATÍSTICAS
    // ======================================================

    useEffect(() => {

        if (!selectedCourse) return

        const loadStats = async () => {

            setLoadingStats(true)

            try {

                const response = await getCourseStatsAPI(
                    selectedCourse._id,
                    period
                )

                setStats(response.data.data)

            }

            catch {

                setStats(null)
            }

            finally {

                setLoadingStats(false)
            }
        }

        loadStats()

    }, [selectedCourse, period])


    // ======================================================
    // LOADING INICIAL
    // ======================================================

    if (loadingCourses) {

        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        )
    }


    // ======================================================
    // EMPTY STATE — nenhum curso publicado
    // ======================================================

    if (!courses.length) {

        return (
            <div className="mt-10">

                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Estatísticas do curso selecionado
                    </h2>
                    <p className="text-sm text-text-muted">
                        Perfil dos alunos inscritos em um curso específico
                    </p>
                </div>

                <div className="card flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen size={36} className="text-text-muted mb-3" />
                    <p className="font-semibold text-text-primary mb-1">
                        Nenhum curso publicado
                    </p>
                    <p className="text-sm text-text-muted">
                        Publique um curso para visualizar as estatísticas por curso.
                    </p>
                </div>

            </div>
        )
    }


    return (

        <div className="mt-10">

            {/* ======================================================
          HEADER
      ====================================================== */}

            <div className="mb-4">

                <h2 className="text-lg font-semibold text-text-primary">
                    Estatísticas do curso selecionado
                </h2>

                <p className="text-sm text-text-muted">
                    Perfil dos alunos inscritos em um curso específico
                </p>

            </div>


            {/* ======================================================
          FILTRO DE PERÍODO
      ====================================================== */}

            <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">

                <div>
                    <h3 className="font-semibold text-text-primary text-sm">
                        Perfil dos inscritos
                    </h3>

                    <p className="text-xs text-text-muted">
                        {PERIOD_LABELS[period]}
                    </p>
                </div>

                <PeriodSelect value={period} onChange={setPeriod} />

            </div>


            {/* ======================================================
          LISTA DE CURSOS
      ====================================================== */}

            <div className="grid md:grid-cols-3 gap-3 mb-6">

                {courses.map(course => (

                    <button
                        type="button"
                        key={course._id}
                        onClick={() => setSelectedCourse(course)}
                        aria-pressed={selectedCourse?._id === course._id}
                        className={`
              card p-4 text-left transition-all

              ${selectedCourse?._id === course._id
                                ? 'ring-2 ring-primary'
                                : ''
                            }
            `}
                    >

                        <h3 className="font-semibold text-text-primary">
                            {course.title}
                        </h3>

                        <p className="text-sm text-text-muted mt-1">
                            {course.enrolledCount}/{course.maxSlots} inscritos
                        </p>

                    </button>

                ))}

            </div>


            {/* ======================================================
          ESTATÍSTICAS — altura estável + overlay de loading
          (evita que a tela "salte" ao trocar de curso)
      ====================================================== */}

            <div className="relative min-h-[480px]">

                {loadingStats && (
                    <div className="absolute inset-0 z-10 flex justify-center pt-16 bg-surface-page/50">
                        <Spinner />
                    </div>
                )}

                {stats ? (

                    <>

                        {/* ======================================================
                  MÉTRICAS
              ====================================================== */}

                        <div className="grid md:grid-cols-4 gap-4 mb-6">

                            <div className="card p-4">

                                <p className="text-sm text-text-muted mb-1">
                                    Inscritos
                                </p>

                                <h3 className="text-2xl font-bold text-text-primary">
                                    {stats.course.enrolledCount}
                                </h3>

                            </div>

                            <div className="card p-4">

                                <p className="text-sm text-text-muted mb-1">
                                    Vagas
                                </p>

                                <h3 className="text-2xl font-bold text-text-primary">
                                    {stats.course.maxSlots}
                                </h3>

                            </div>

                            <div className="card p-4">

                                <p className="text-sm text-text-muted mb-1">
                                    Ocupação
                                </p>

                                <h3 className="text-2xl font-bold text-text-primary">
                                    {stats.course.occupancy}%
                                </h3>

                            </div>

                            <div className="card p-4">

                                <p className="text-sm text-text-muted mb-1">
                                    Matrículas
                                </p>

                                <h3 className="text-2xl font-bold text-text-primary">
                                    {stats.totalEnrollments}
                                </h3>

                            </div>

                        </div>


                        {/* ======================================================
                  GRÁFICOS
              ====================================================== */}

                        <div className="grid md:grid-cols-2 gap-6">

                            <EnrollmentChartCard
                                data={stats.enrollmentsByMonth}
                                period={period}
                            />

                            <GenderChartCard
                                data={stats.genderStats}
                            />

                            <AgeChartCard
                                data={stats.ageStats}
                            />

                            <SchoolLevelChartCard
                                data={stats.schoolLevelStats}
                            />

                            <IncomeRangeChartCard
                                data={stats.incomeRangeStats}
                            />

                            <SchoolChartCard
                                data={stats.schoolStats}
                            />

                        </div>

                    </>

                ) : !loadingStats && (

                    <div className="text-center py-12 text-text-muted">
                        Não foi possível carregar as estatísticas do curso.
                    </div>

                )}

            </div>

        </div>
    )
}

export default CourseStatsSection
