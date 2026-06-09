import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import LogoSVG from '../assets/cefetrj-logo'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { forgotPasswordAPI } from '../api/auth'

const EsqueciSenha = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [waitSeconds, setWaitSeconds] = useState(0)

  const validate = () => {
    if (!email) { setEmailError('E-mail obrigatório'); return false }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('E-mail inválido'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')
    try {
      await forgotPasswordAPI(email)
      setSubmitted(true)
    } catch (err) {
      const wait = err.response?.data?.waitSeconds
      if (wait) {
        setWaitSeconds(wait)
        setError(`Aguarde ${wait} segundo(s) antes de solicitar novamente.`)
        const interval = setInterval(() => {
          setWaitSeconds(prev => {
            if (prev <= 1) { clearInterval(interval); return 0 }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(err.response?.data?.message || 'Erro ao processar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-6">
              <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
            </Link>
            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-5">
              <Mail size={32} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Verifique seu e-mail</h1>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Se o endereço <strong className="text-text-primary">{email}</strong> estiver cadastrado,
              você receberá as instruções para redefinir sua senha em breve.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                <ArrowLeft size={15} /> Voltar para o login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-1">
              <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
            </Link>
            <h1 className="text-xl font-bold text-text-primary mt-3">Esqueceu a senha?</h1>
            <p className="text-text-secondary text-sm mt-1">
              Digite seu e-mail e enviaremos as instruções para redefinir sua senha.
            </p>
          </div>

          {error && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail cadastrado"
              type="email"
              placeholder="seu@email.com"
              icon={Mail}
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError('') }}
              error={emailError}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-base"
              loading={loading}
              disabled={waitSeconds > 0}
            >
              {waitSeconds > 0 ? `Aguarde ${waitSeconds}s` : 'Enviar instruções'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
              <ArrowLeft size={14} /> Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EsqueciSenha
