import { Instagram, Linkedin, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import LogoSVG from '../../assets/cefetrj-logo'

const Footer = () => (
  <footer className="bg-primary-dark text-white py-12">
    <div className="max-w-6xl mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className='flex justify-center flex-col w-full items-center'>
          <div className="flex items-center gap-2 text-xl font-bold mb-2 justify-center">
            <LogoSVG color='#fff' size={22} /> CEFET/RJ
          </div>
          <p className="text-white/60 text-sm max-w-xs text-center">Centro Federal de Educação Tecnológica Celso Suckow da Fonseca</p>
        </div>
        {/* <div className="flex gap-8 text-sm text-white/70">
          <div className="space-y-2">
            <Link to="/" className="block hover:text-white transition-colors">Início</Link>
            <Link to="/cadastro" className="block hover:text-white transition-colors">Cadastro</Link>
            <Link to="/login" className="block hover:text-white transition-colors">Login</Link>
          </div>
        </div> */}
        <div className="flex gap-4 justify-center w-full">
          {[Instagram, Linkedin, Youtube].map((Icon, i) => (
            <button key={i} className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/40 text-xs">
        © {new Date().getFullYear()} CEFET/RJ — Todos os direitos reservados
      </div>
    </div>
  </footer>
)

export default Footer
