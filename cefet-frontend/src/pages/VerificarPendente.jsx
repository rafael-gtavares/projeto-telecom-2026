import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MailCheck, RefreshCw } from 'lucide-react'
import LogoSVG from '../assets/cefetrj-logo'
import Button from '../components/ui/Button'
import { resendVerificationAPI } from '../api/auth'

const VerificarPendente = () => {
  const location = useLocation()
  const email = location.state?.email || ''

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [waitSeconds, setWaitSeconds] = useState(0)

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await resendVerificationAPI(email)
      setSuccess('Novo link enviado! Verifique sua caixa de entrada.')
      // Rate limiting visual: aguardar 60s antes do próximo reenvio
      setWaitSeconds(60)
      const interval = setInterval(() => {
        setWaitSeconds(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const wait = err.response?.data?.waitSeconds
      if (wait) {
        setWaitSeconds(wait)
        setError(`Aguarde ${wait} segundo(s) antes de solicitar um novo link.`)
      } else {
        setError(err.response?.data?.message || 'Erro ao reenviar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-[460px]">
        <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn text-center">

          <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-6">
            <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
          </Link>

          <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-5">
            <MailCheck size={32} className="text-primary" />
          </div>

          <h1 className="text-xl font-bold text-text-primary mb-2">
            Verifique seu e-mail
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Enviamos um link de confirmação para{' '}
            {email
              ? <strong className="text-text-primary">{email}</strong>
              : 'o e-mail cadastrado'
            }.
            {' '}Clique no link para ativar sua conta.
          </p>

          {success && (
            <div className="bg-success-light border border-success/20 text-success-text text-sm rounded-lg px-4 py-3 mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="bg-surface-page rounded-card p-4 text-left mb-6 space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Não recebeu o e-mail?
            </p>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
              <li>Verifique a pasta de spam ou lixo eletrônico</li>
              <li>Aguarde alguns minutos</li>
              <li>Certifique-se de que o e-mail está correto</li>
            </ul>
          </div>

          {email && (
            <Button
              variant="secondary"
              className="w-full mb-3"
              onClick={handleResend}
              loading={loading}
              disabled={waitSeconds > 0}
            >
              <RefreshCw size={15} />
              {waitSeconds > 0
                ? `Reenviar em ${waitSeconds}s`
                : 'Reenviar link de verificação'
              }
            </Button>
          )}

          <Link to="/login" className="block text-sm text-primary font-semibold hover:underline mt-2">
            Voltar para o login
          </Link>

        </div>
      </div>
    </div>
  )
}

export default VerificarPendente
