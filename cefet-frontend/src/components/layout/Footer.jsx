import { Instagram } from 'lucide-react'
import LogoSVG from '../../assets/cefetrj-logo'

const Footer = () => (
  <footer className="bg-primary-dark text-white py-12">
    <div className="max-w-6xl mx-auto px-4 md:px-8">

      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10">

        {/* Créditos */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">
            Desenvolvido por
          </p>

          <p className="text-white/80 text-sm font-medium">
            Rafael Martins &amp; Rafael Tavares
          </p>

          <p className="text-white/30 text-[10px]">
            Projeto de Extensão — CEFET/RJ
          </p>
        </div>

        {/* Instituição */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <div className="flex items-center gap-2 text-xl font-bold justify-center w-full">
            <LogoSVG color="#fff" size={22} />
            CEFET/RJ
          </div>

          <p className="text-white/50 text-xs max-w-xs leading-relaxed text-center">
            Centro Federal de Educação Tecnológica Celso Suckow da Fonseca
          </p>
        </div>

        {/* Redes sociais */}
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">
            Redes sociais
          </p>

          <a
            href="https://www.instagram.com/cefet_rj"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram do CEFET/RJ"
            className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors"
          >
            <Instagram size={16} />
          </a>
        </div>

      </div>

      <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/30 text-xs">
        <span>
          © {new Date().getFullYear()} CEFET/RJ — Todos os direitos reservados
        </span>

        <span>
          Sistema de Gestão de Eventos
        </span>
      </div>

    </div>
  </footer>
)

export default Footer