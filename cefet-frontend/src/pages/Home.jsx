import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Briefcase, Globe, BookOpen } from 'lucide-react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import EventCard from '../components/courses/EventCard'
import CourseDetailModal from '../components/courses/CourseDetailModal'
import Toast from '../components/ui/Toast'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { getCoursesAPI } from '../api/courses'
import { mockCourses, mockPartners } from '../mockData/courses'

const partners = [...mockPartners, ...mockPartners]

const features = [
  { icon: Zap, title: 'Ensino de Excelência', desc: 'Professores altamente qualificados e metodologia moderna focada no mercado de trabalho.' },
  { icon: Briefcase, title: 'Conexão com o Mercado', desc: 'Parcerias com as principais empresas de telecomunicações do Brasil e do mundo.' },
  { icon: Globe, title: 'Tecnologia de Ponta', desc: 'Laboratórios equipados e currículo atualizado com as tendências tecnológicas globais.' },
]

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [courses, setCourses] = useState([])
  const [toast, setToast] = useState({ show: false, message: '' })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  // console.log(courses.map(course => course.id))

  useEffect(() => {
    getCoursesAPI({ status: 'published', limit: 6 })
      .then(r => setCourses(r.data.data.courses))
      .catch(() => setCourses(mockCourses))
  }, [])

  const handleOpenModal = (course) => {
    setSelectedCourse(course)
    setModalOpen(true)
  }

  const handleEnrollSuccess = (courseId) => {
    setCourses(prev => prev.map(c =>
      c._id === courseId
        ? { ...c, enrolledCount: c.enrolledCount + 1, availableSlots: c.availableSlots - 1 }
        : c
    ))
    setToast({ show: true, message: 'Inscrição confirmada com sucesso! 🎉' })
  }

  const handleCancelSuccess = (courseId) => {
    setCourses(prev => prev.map(c =>
      c._id === courseId
        ? { ...c, enrolledCount: c.enrolledCount - 1, availableSlots: c.availableSlots + 1 }
        : c
    ))
    setToast({ show: true, message: 'Inscrição cancelada.' })
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />

      {/* Hero */}
      <section className="pt-[80px] md:pt-[100px] pb-16 bg-gradient-to-br from-surface-page via-surface-blue to-surface-page overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="animate-fadeIn">
              <span className="inline-block bg-surface-hover text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                CEFET/RJ — Telecomunicações
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-text-primary leading-tight mb-4">
                Transforme o mundo através das{' '}
                <span className="text-primary">conexões</span>
              </h1>
              <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                O curso de Telecomunicações do CEFET/RJ prepara você para dominar as tecnologias que conectam pessoas, empresas e o futuro. Seja o profissional que o mercado busca.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#cursos">
                  <Button variant="primary" className="gap-2">
                    Ver Cursos <ArrowRight size={16} />
                  </Button>
                </a>
                <a href="#sobre">
                  <Button variant="secondary">Saiba Mais</Button>
                </a>
              </div>
            </div>

            {/* SVG Illustration */}
            <div className="hidden md:flex items-center justify-center">
              <svg viewBox="0 0 420 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
                <circle cx="210" cy="170" r="60" fill="#E3F0FF" />
                <circle cx="210" cy="170" r="38" fill="#1565C0" fillOpacity="0.12" />
                <circle cx="210" cy="170" r="20" fill="#1565C0" fillOpacity="0.9" />
                {[[80,60],[340,60],[60,280],[360,270],[190,310],[230,40]].map(([x,y],i)=>(
                  <g key={i}>
                    <line x1="210" y1="170" x2={x} y2={y} stroke="#1565C0" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="6 4"/>
                    <circle cx={x} cy={y} r="12" fill="#1976D2" fillOpacity="0.15" stroke="#1565C0" strokeWidth="1.5" strokeOpacity="0.5"/>
                    <circle cx={x} cy={y} r="5" fill="#42A5F5"/>
                  </g>
                ))}
                {[[130,100],[290,100],[140,240],[280,240]].map(([x,y],i)=>(
                  <g key={`s${i}`}>
                    <circle cx={x} cy={y} r="7" fill="#90CAF9" fillOpacity="0.7"/>
                    <circle cx={x} cy={y} r="3" fill="#1565C0" fillOpacity="0.5"/>
                  </g>
                ))}
                <circle cx="210" cy="170" r="7" fill="white"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Slider */}
      <section id="parceiros" className="py-12 bg-white border-y border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 mb-6 text-center">
          <h2 className="text-xl font-semibold text-text-primary">Nossos Parceiros</h2>
          <p className="text-text-muted text-sm mt-1">Empresas que confiam e investem no CEFET</p>
        </div>

        <div className="relative max-w-[920px] mx-auto overflow-hidden">
          
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          <div className="flex gap-4 animate-scroll [animation-duration:70s] w-max py-2">
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="w-[130px] h-[52px] bg-surface-page border border-border rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-medium text-text-muted hover:border-primary hover:text-primary transition-colors">
                {p}
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
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Cursos & Eventos</h2>
            <p className="text-text-secondary">Inscrições abertas — vagas limitadas</p>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary">Nenhum curso disponível no momento.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => (
                <EventCard key={c._id} course={c} onOpenModal={handleOpenModal} />
              ))}
            </div>
          )}
          {/* <div className="text-center mt-10">
            <Button variant="secondary">Ver todos os eventos</Button>
          </div> */}
        </div>
      </section>

      <Footer />

      <CourseDetailModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCourse(null) }}
        course={selectedCourse}
        onEnrollSuccess={handleEnrollSuccess}
        onCancelSuccess={handleCancelSuccess}
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
