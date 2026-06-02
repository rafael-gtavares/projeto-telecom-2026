import { useState, useEffect } from 'react'

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


    return (

        <div className="mt-10">

            {/* ======================================================
          HEADER
      ====================================================== */}

                  <div className="mt-8 mb-4">

                    <h2 className="text-lg font-semibold text-text-primary">
                      Estatísticas por curso
                    </h2>

                    <p className="text-sm text-text-muted">
                      Dados referentes aos alunos inscritos em um curso específico
                    </p>

                  </div>

                  <div className="flex items-center justify-between mb-4">

                    <div>
                      <h3 className="font-semibold text-text-primary text-sm">
                        Evolução das inscrições
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


            {/* ======================================================
          LISTA DE CURSOS
      ====================================================== */}

            <div className="grid md:grid-cols-3 gap-3 mb-6">

                {courses.map(course => (

                    <button
                        key={course._id}
                        onClick={() => setSelectedCourse(course)}
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
          LOADING ESTATÍSTICAS
      ====================================================== */}

            {loadingStats ? (

                <div className="flex justify-center py-12">
                    <Spinner />
                </div>

            ) : stats ? (

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

            ) : (

                <div className="text-center py-12 text-text-muted">
                    Não foi possível carregar as estatísticas do curso.
                </div>

            )}

        </div>
    )
}

export default CourseStatsSection