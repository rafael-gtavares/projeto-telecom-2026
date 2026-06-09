import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import LogoSVG from '../assets/cefetrj-logo'
import Button from '../components/ui/Button'
import { verifyEmailAPI } from '../api/auth'

const VerificarEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Link de verificação inválido.')
      return
    }

    verifyEmailAPI(token)
      .then(() => {
        setStatus('success')
        setMessage('E-mail verificado com sucesso! Sua conta está ativa.')
        // Redireciona para login após 3 segundos
        setTimeout(() => {
          navigate('/login', { state: { success: 'Conta verificada! Faça login para continuar.' } })
        }, 3000)
      })
      .catch(err => {
        setStatus('error')
        setMessage(
          err.response?.data?.message ||
          'Link de verificação inválido ou expirado. Solicite um novo link.'
        )
      })
  }, [token])

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn text-center">

          <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-6">
            <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
          </Link>

          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-5">
                <Loader2 size={32} className="text-primary animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-text-primary mb-2">Verificando seu e-mail...</h1>
              <p className="text-text-secondary text-sm">Aguarde um momento.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-success" />
              </div>
              <h1 className="text-xl font-bold text-text-primary mb-2">E-mail confirmado!</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">{message}</p>
              <p className="text-text-muted text-xs mb-4">Redirecionando para o login...</p>
              <Link to="/login">
                <Button variant="primary" className="w-full">Ir para o login agora</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mx-auto mb-5">
                <XCircle size={32} className="text-error" />
              </div>
              <h1 className="text-xl font-bold text-text-primary mb-2">Link inválido</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">{message}</p>
              <Link to="/login">
                <Button variant="secondary" className="w-full mb-3">Ir para o login</Button>
              </Link>
              <p className="text-sm text-text-muted">
                Precisa de um novo link?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Solicite ao fazer login
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default VerificarEmail
