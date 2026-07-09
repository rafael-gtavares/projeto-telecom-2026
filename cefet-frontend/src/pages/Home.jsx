import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Briefcase, Globe, BookOpen, Star, Quote } from 'lucide-react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import EventCard from '../components/courses/EventCard'
import CourseDetailModal from '../components/courses/CourseDetailModal'
//import CalendarLessons from '../components/home/CalendarLessons'
import HeroBackground from '../components/home/HeroBackground'
import HeroTransmitter from '../components/home/HeroTransmitter'
import ScheduleCalendar from '../components/home/ScheduleCalendar'
import Toast from '../components/ui/Toast'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { getCoursesAPI, getCalendarLessons } from '../api/courses'
import { getFeaturedFeedbacksAPI } from '../api/feedbacks'
import { mockCourses, mockPartners } from '../mockData/courses'
import { MODALITY_LABELS } from '../utils/formatModality'

const partners = [...mockPartners, ...mockPartners]

const features = [
  { icon: Zap, title: 'Ensino de Excelência', desc: 'Professores altamente qualificados e metodologia moderna focada no mercado de trabalho.' },
  { icon: Briefcase, title: 'Conexão com o Mercado', desc: 'Parcerias com as principais empresas de telecomunicações do Brasil e do mundo.' },
  { icon: Globe, title: 'Tecnologia de Ponta', desc: 'Laboratórios equipados e currículo atualizado com as tendências tecnológicas globais.' },
]

// Destaques exibidos na hero (mesmos pilares da seção "Por que escolher")
const heroHighlights = [
  { icon: Zap, label: 'Ensino de excelência' },
  { icon: Briefcase, label: 'Conexão com o mercado' },
  { icon: Globe, label: 'Tecnologia de ponta' },
]

const Home = () => {
  const { isAuthenticated } = useAuth()
  // Elementos decorativos da hero (transmissor + campo de partículas) só no desktop.
  // No mobile o foco é o conteúdo — sem custo de canvas/animação.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const [courses, setCourses] = useState([])
  const [allLessons, setAllLessons] = useState([])
  const [toast, setToast] = useState({ show: false, message: '' })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleCourses, setVisibleCourses] = useState(3)
  const [modalityFilter, setModalityFilter] = useState('all')

  const [featuredFeedbacks, setFeaturedFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true)

  useEffect(() => {
    const getLessons = async () => {
      try {
        const data = await getCalendarLessons()
        setAllLessons(data)
      } catch (err) {
        console.error('Erro ao buscar aulas: ', err)
      }
    }
    getLessons()
  }, [])

  useEffect(() => {
    getFeaturedFeedbacksAPI()
      .then(r => setFeaturedFeedbacks(r.data.data))
      .catch(() => setFeaturedFeedbacks([]))
      .finally(() => setLoadingFeedbacks(false))
  }, [])

  // Refaz a busca quando o login/logout muda — assim os flags isEnrolled/isWaitlisted
  // acompanham o usuário atual (ao deslogar, os botões voltam para "Inscrever-se").
  useEffect(() => {
    getCoursesAPI({ status: 'published' })
      .then(r => setCourses(r.data.data.courses))
      .catch(() => setCourses(mockCourses))
  }, [isAuthenticated])

  const filteredCourses = modalityFilter === 'all'
    ? courses
    : courses.filter(c => c.modality === modalityFilter)

  const handleModalityFilter = (modality) => {
    setModalityFilter(modality)
    setVisibleCourses(3)
  }

  const handleShowMore = () => {
    setVisibleCourses(prev => prev + 3)
  }

  const handleShowLess = () => {
    setVisibleCourses(3)
  }

  const handleOpenModal = (course) => {
    setSelectedCourse(course)
    setModalOpen(true)
  }

  const handleEnrollSuccess = (courseId, result = {}) => {
    setCourses(prev => prev.map(c => {
      if (c._id !== courseId) return c
      const enrolledCount = result.enrolledCount ?? c.enrolledCount + 1
      return { ...c, isEnrolled: true, enrolledCount, availableSlots: c.maxSlots - enrolledCount }
    }))
    setToast({ show: true, message: 'Inscrição confirmada com sucesso! 🎉' })
  }

  const handleCancelSuccess = (courseId, result = {}) => {
    // O enrolledCount pode não mudar se alguém da fila assumiu a vaga — usa o valor do backend
    setCourses(prev => prev.map(c => {
      if (c._id !== courseId) return c
      const enrolledCount = result.enrolledCount ?? Math.max(0, c.enrolledCount - 1)
      return { ...c, isEnrolled: false, enrolledCount, availableSlots: c.maxSlots - enrolledCount }
    }))
    setToast({ show: true, message: 'Inscrição cancelada.' })
  }

  // Entrar/sair da fila de espera — atualiza o botão do card na hora (sem F5)
  const handleWaitlistChange = (courseId, waitlisted) => {
    setCourses(prev => prev.map(c =>
      c._id === courseId ? { ...c, isWaitlisted: waitlisted, isEnrolled: false } : c
    ))
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />

      {/* Hero */}
      <section className="relative pt-[88px] md:pt-[110px] pb-16 md:pb-24 bg-gradient-to-br from-surface-page via-surface-blue to-surface-page overflow-hidden">
        {/* Decoração de fundo (glows) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-[26rem] h-[26rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -left-24 w-80 h-80 rounded-full bg-primary-lighter/10 blur-3xl" />
        </div>

        {/* Campo de rede interativo (desktop apenas — puramente decorativo) */}
        {isDesktop && <HeroBackground />}

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-8 items-center md:min-h-[480px]">
            <div className="animate-fadeIn flex flex-col items-center md:items-start text-center md:text-left">
              <span className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-primary/15 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                CEFET/RJ — Telecomunicações
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] tracking-tight mb-5">
                Transforme o mundo através das{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-primary-lighter">
                  conexões
                </span>
              </h1>

              <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                O curso de Telecomunicações do CEFET/RJ prepara você para dominar as tecnologias que conectam pessoas, empresas e o futuro. Seja o profissional que o mercado busca.
              </p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start w-full mb-8">
                <a href="#cursos">
                  <Button variant="primary" className="gap-2 min-w-[150px] shadow-hover hover:shadow-lg">
                    Ver Cursos <ArrowRight size={16} />
                  </Button>
                </a>
                <a href="#sobre">
                  <Button variant="secondary" className="min-w-[120px]">Saiba Mais</Button>
                </a>
              </div>

              {/* Destaques */}
              <div className="flex flex-wrap gap-x-6 gap-y-2.5 justify-center md:justify-start">
                {heroHighlights.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                    <Icon size={15} className="text-primary" /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Transmissor (logo CEFET) — apenas no desktop (decorativo) */}
            {isDesktop && (
              <div className="flex justify-end">
                <HeroTransmitter />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Partners Slider */}
      <section id="parceiros" className="py-12 bg-white border-y border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 mb-6 text-center">
          <h2 className="text-xl font-semibold text-text-primary">Nossos Parceiros</h2>
          <p className="text-text-muted text-sm mt-1">Empresas que confiam no CEFET</p>
        </div>

        <div className="relative max-w-[920px] mx-auto overflow-hidden">

          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          <div className="flex gap-4 animate-scroll [animation-duration:70s] w-max py-2">
            {[...partners, ...partners].map((p, i) => (
              <div
                key={i}
                className="w-[130px] h-[52px] bg-surface-page border border-border rounded-lg flex items-center justify-center flex-shrink-0 hover:border-primary transition-colors px-4"
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  className={`object-contain ${p.name === 'Anatel'
                    ? 'h-18 w-auto'
                    : 'h-8 w-auto'
                    }`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="sobre" className="py-16 bg-surface-page">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">Por que escolher o CEFET?</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Uma instituição comprometida com a excelência no ensino técnico e tecnológico</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-hover hover:border-primary-light transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Icon size={22} className="text-primary group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="cursos" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Cursos & Eventos</h2>
            <p className="text-text-secondary">Inscrições abertas — vagas limitadas</p>
          </div>

          {/* Filtro por modalidade */}
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {['all', ...Object.keys(MODALITY_LABELS)].map(mod => (
                <button
                  key={mod}
                  onClick={() => handleModalityFilter(mod)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${modalityFilter === mod
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-page text-text-secondary border border-border hover:border-primary hover:text-primary'
                    }`}
                >
                  {mod === 'all' ? 'Todos' : MODALITY_LABELS[mod]}
                </button>
              ))}
            </div>
          )}

          {filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary">
                {courses.length === 0
                  ? 'Nenhum curso disponível no momento.'
                  : 'Nenhum curso encontrado para esta modalidade.'}
              </p>
              {courses.length > 0 && (
                <button
                  onClick={() => handleModalityFilter('all')}
                  className="mt-4 text-sm text-primary font-medium hover:underline"
                >
                  Ver todos os cursos
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.slice(0, visibleCourses).map(c => (
                  <EventCard key={c._id} course={c} onOpenModal={handleOpenModal} />
                ))}
              </div>

              {/* Paginação */}
              {filteredCourses.length > 3 && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    {visibleCourses < filteredCourses.length && (
                      <Button variant="primary" onClick={handleShowMore}>
                        Ver mais cursos
                      </Button>
                    )}
                    {visibleCourses > 3 && (
                      <Button variant="ghost" onClick={handleShowLess} className="text-text-muted text-sm">
                        Ver menos
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {Math.min(visibleCourses, filteredCourses.length)} de {filteredCourses.length}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Agenda semanal — horários de todos os cursos e conflitos */}
      <section id="agenda" className="py-16 bg-surface-page">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Agenda de horários</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Veja os horários de todos os cursos numa semana típica e identifique conflitos antes de se inscrever
            </p>
          </div>
          <ScheduleCalendar />
        </div>
      </section>

      {/* Feedbacks em destaque */}
      {(loadingFeedbacks || featuredFeedbacks.length > 0) && (
        <section id="feedbacks" className="py-16 bg-surface-page">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">O que dizem nossos alunos</h2>
              <p className="text-text-secondary max-w-xl mx-auto">Depoimentos de quem já passou pelos nossos cursos</p>
            </div>

            {loadingFeedbacks ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-6 animate-pulse h-40" />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredFeedbacks.map(f => (
                  <div key={f._id} className="card p-6 flex flex-col hover:shadow-hover transition-all duration-200">
                    <Quote size={20} className="text-primary/30 mb-3" />

                    <p className="text-text-secondary text-sm leading-relaxed flex-1 mb-4">
                      {f.content}
                    </p>

                    <div className="flex items-center gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={14} className={n <= f.stars ? 'fill-warning text-warning' : 'text-border'} />
                      ))}
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-semibold text-text-primary">{f.user?.name || 'Aluno'}</p>
                      <p className="text-xs text-text-muted mt-0.5">{f.course?.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />

      <CourseDetailModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCourse(null) }}
        course={selectedCourse}
        onEnrollSuccess={handleEnrollSuccess}
        onCancelSuccess={handleCancelSuccess}
        onWaitlistChange={handleWaitlistChange}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        action={toast.action}
        onClose={() => setToast({ show: false })}
      />
    </div>
  )
}

export default Home
