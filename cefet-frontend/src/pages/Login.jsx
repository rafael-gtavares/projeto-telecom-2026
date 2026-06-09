import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import LogoSVG from '../assets/cefetrj-logo'
import { resendVerificationAPI } from '../api/auth'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalErr, setGlobalErr] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')

  const successMsg = location.state?.success || ''

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
    setErrors(e => ({ ...e, [k]: '' }))
    setGlobalErr('')
  }

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'E-mail obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'E-mail inválido'
    if (!form.password) errs.password = 'Senha obrigatória'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await login(form.email, form.password, form.rememberMe)
      navigate(from, { replace: true })
    } catch (err) {
      const code = err.response?.data?.code
      const message = err.response?.data?.message || 'Credenciais inválidas. Tente novamente.'
      if (code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(form.email)
        setGlobalErr(message)
      } else {
        setGlobalErr(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return
    setResendLoading(true)
    try {
      await resendVerificationAPI(unverifiedEmail)
      setResendSuccess('Novo link enviado! Verifique sua caixa de entrada.')
      setGlobalErr('')
      setUnverifiedEmail('')
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Erro ao reenviar. Tente novamente.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <Link to="/"  className="inline-flex items-center gap-2 text-primary font-bold text-2xl mb-1">
              <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
            </Link>
            <p className="text-text-secondary text-sm mt-1">Acesse sua conta</p>
          </div>

          {globalErr && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-5">
              {globalErr}
            </div>
          )}

          {successMsg && (
            <div className="bg-success-light border border-success/20 text-success-text text-sm rounded-lg px-4 py-3 mb-5">
              {successMsg}
            </div>
          )}

          {unverifiedEmail && (
            <div className="bg-surface-blue border border-primary/10 rounded-lg px-4 py-3 mb-5">
              <p className="text-sm text-text-secondary mb-2">Sua conta ainda não foi verificada.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {resendLoading ? 'Enviando...' : 'Reenviar link de verificação →'}
              </button>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-success-light border border-success/20 text-success-text text-sm rounded-lg px-4 py-3 mb-5">
              {resendSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              icon={Mail}
            />
            <Input
              label="Senha"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              icon={Lock}
              rightElement={
                <button type="button" onClick={() => setShowPass(s => !s)} className="text-text-muted hover:text-text-secondary transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={set('rememberMe')}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                Lembrar por 30 dias
              </label>
              <Link to="/esqueci-senha" className="text-primary text-sm hover:underline">
                Esqueci a senha
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full h-12 text-base mt-2" loading={loading}>
              Entrar
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-xs">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-text-secondary">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-primary font-semibold hover:underline">Cadastrar-se</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
