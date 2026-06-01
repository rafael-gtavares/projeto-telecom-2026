import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import LogoSVG from '../assets/cefetrj-logo'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { validateResetTokenAPI, resetPasswordAPI } from '../api/auth'
import { passwordStrength } from '../utils/passwordStrength'

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [tokenStatus, setTokenStatus] = useState('loading') // 'loading' | 'valid' | 'invalid'
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalErr, setGlobalErr] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = passwordStrength(form.password)
  const strengthColors = ['', 'bg-error', 'bg-orange-400', 'bg-yellow-400', 'bg-success']
  const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte']

  // Valida o token ao carregar a página
  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return }
    validateResetTokenAPI(token)
      .then(() => setTokenStatus('valid'))
      .catch(() => setTokenStatus('invalid'))
  }, [token])

  const validate = () => {
    const errs = {}
    if (!form.password) errs.password = 'Nova senha obrigatória'
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (!form.confirmPassword) errs.confirmPassword = 'Confirmação obrigatória'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'As senhas não coincidem'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setGlobalErr('')
    try {
      await resetPasswordAPI(token, form.password, form.confirmPassword)
      navigate('/login', { state: { success: 'Senha redefinida com sucesso! Faça login com a nova senha.' } })
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'TOKEN_INVALID') {
        setTokenStatus('invalid')
      } else {
        setGlobalErr(err.response?.data?.message || 'Erro ao redefinir a senha. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Estado: verificando token
  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn text-center">
            <Loader2 size={40} className="text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-secondary text-sm">Verificando o link...</p>
          </div>
        </div>
      </div>
    )
  }

  // Estado: token inválido
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-6">
              <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
            </Link>
            <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mx-auto mb-5">
              <XCircle size={32} className="text-error" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Link inválido ou expirado</h1>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Este link de redefinição de senha não é mais válido. Solicite um novo link.
            </p>
            <Link to="/esqueci-senha">
              <Button variant="primary" className="w-full mb-3">Solicitar novo link</Button>
            </Link>
            <Link to="/login" className="block text-sm text-primary font-semibold hover:underline">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Estado: token válido — exibe o formulário
  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-1">
              <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
            </Link>
            <h1 className="text-xl font-bold text-text-primary mt-3">Redefinir senha</h1>
            <p className="text-text-secondary text-sm mt-1">
              Digite e confirme sua nova senha abaixo.
            </p>
          </div>

          {globalErr && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-5">
              {globalErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Nova senha"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                icon={Lock}
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(e => ({ ...e, password: '' })) }}
                error={errors.password}
                rightElement={
                  <button type="button" onClick={() => setShowPass(s => !s)} className="text-text-muted hover:text-text-secondary">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strengthColors[strength.score] : 'bg-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{strengthLabels[strength.score]}</p>
                </div>
              )}
            </div>

            <Input
              label="Confirmar nova senha"
              type={showPass ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              icon={Lock}
              value={form.confirmPassword}
              onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setErrors(e => ({ ...e, confirmPassword: '' })) }}
              error={errors.confirmPassword}
            />

            <Button type="submit" variant="primary" className="w-full h-12 text-base mt-2" loading={loading}>
              Redefinir senha
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-primary font-semibold hover:underline">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RedefinirSenha
