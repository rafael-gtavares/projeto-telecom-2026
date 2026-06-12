import { Instagram, Youtube, Facebook, Linkedin } from 'lucide-react'
import LogoSVG from '../../assets/cefetrj-logo'

// O lucide-react não tem o logo atual do X (ex-Twitter), então usamos um SVG inline.
const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
)

const socials = [
  { label: 'YouTube do CEFET/RJ', href: 'https://www.youtube.com/@CefetRJ_oficial', Icon: Youtube },
  { label: 'Facebook do CEFET/RJ', href: 'https://www.facebook.com/cefetrjoficial/?locale=pt_BR', Icon: Facebook },
  { label: 'LinkedIn do CEFET/RJ', href: 'https://br.linkedin.com/school/cefetrjoficial/', Icon: Linkedin },
  { label: 'X do CEFET/RJ', href: 'https://x.com/cefet_rj', Icon: XIcon },
  { label: 'Instagram do CEFET/RJ', href: 'https://www.instagram.com/cefet_rj', Icon: Instagram },
]

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
            <a
              href="https://rafaelrmartins.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              Rafael Martins
            </a>
            {' '}&amp; Rafael Tavares
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

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-[160px]">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
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