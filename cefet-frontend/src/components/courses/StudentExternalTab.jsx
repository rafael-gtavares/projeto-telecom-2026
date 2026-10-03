import { ExternalLink, MessageSquareText } from 'lucide-react'

// Aba de destaque exibida ao aluno quando o curso é ministrado em plataforma externa.
// A inscrição continua sendo gerenciada aqui; o conteúdo acontece no link informado.
const StudentExternalTab = ({ course }) => {
  const { externalUrl, externalMessage } = course
  // Defesa extra: só renderiza o botão para links http(s)
  const safeUrl = /^https?:\/\//i.test(externalUrl || '') ? externalUrl : ''

  return (
    <div className="space-y-4">
      <div className="rounded-card border-2 border-primary/30 bg-surface-blue p-5 text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
          <ExternalLink size={22} />
        </div>
        <h3 className="font-bold text-text-primary">Este curso é ministrado em outra plataforma</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          O conteúdo e as aulas acontecem em um ambiente externo. Sua inscrição continua
          sendo gerenciada aqui.
        </p>
      </div>

      {externalMessage && (
        <div className="card p-4">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquareText size={13} /> Mensagem do professor
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {externalMessage}
          </p>
        </div>
      )}

      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center"
        >
          <ExternalLink size={16} /> Acessar plataforma do curso
        </a>
      ) : (
        <p className="text-sm text-text-muted text-center py-2">
          O link de acesso ainda não está disponível.
        </p>
      )}
    </div>
  )
}

export default StudentExternalTab