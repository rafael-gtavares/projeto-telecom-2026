import { Wifi, Activity } from 'lucide-react'
import LogoSVG from '../../assets/cefetrj-logo'

// Transmissor de sinal: o logo da CEFET como elemento principal da hero.
// Fica no fluxo do layout (empilha no mobile, à direita no desktop). O canvas
// de fundo (HeroBackground) rastreia o #hero-transmitter para alinhar o brilho,
// os pulsos e as linhas de conexão exatamente atrás dele.
const HeroTransmitter = () => (
  <div className="relative animate-float select-none">
    {/* Medalhão de vidro com o logo */}
    <div
      id="hero-transmitter"
      className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_12px_60px_rgba(21,101,192,0.30)] flex items-center justify-center"
    >
      <div className="absolute inset-4 rounded-full border border-primary/15" />
      <div className="absolute inset-8 rounded-full border border-primary/10" />
      <LogoSVG color="#1565C0" size={118} />
    </div>

    {/* Card "Rede ativa" — canto superior direito */}
    <div className="absolute -top-3 -right-6 sm:-right-10 lg:-right-16 flex rounded-2xl border border-white/50 bg-white/65 backdrop-blur-md shadow-lg px-3 py-2 sm:px-3.5 sm:py-2.5 items-center gap-2 sm:gap-2.5">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Wifi size={15} />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold text-text-primary">Rede ativa</p>
        <span className="flex items-center gap-1 text-[10px] text-success font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          Online
        </span>
      </div>
    </div>

    {/* Card "Fluxo de dados" — canto inferior esquerdo */}
    <div className="absolute -bottom-3 -left-8 sm:-left-12 lg:-left-20 flex rounded-2xl border border-white/50 bg-white/65 backdrop-blur-md shadow-lg px-3 py-2 sm:px-3.5 sm:py-2.5 items-center gap-2 sm:gap-2.5">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Activity size={15} />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold text-text-primary mb-1">Fluxo de dados</p>
        <div className="flex items-end gap-0.5 h-3.5">
          {[0, 0.15, 0.3, 0.45, 0.2].map((d, i) => (
            <span key={i} className="eq-bar w-1 rounded-full bg-primary" style={{ height: '100%', animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default HeroTransmitter
