import { Gamepad2, RotateCcw } from 'lucide-react'

const TelecomModeSection = ({ onPlay, onExit }) => {
  return (
    <section className="py-16 bg-surface-page border-t border-border animate-fadeIn">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
          Modo Telecom
        </h2>
        <p className="text-text-secondary mb-8">
          Você desbloqueou o modo secreto. Aproveita pra jogar um pouco antes de voltar ao normal.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onPlay}
            className="btn-primary"
          >
            <Gamepad2 size={18} />
            Jogar
          </button>

          <button
            onClick={onExit}
            className="btn-secondary"
          >
            <RotateCcw size={18} />
            Voltar ao normal
          </button>
        </div>
      </div>
    </section>
  )
}

export default TelecomModeSection