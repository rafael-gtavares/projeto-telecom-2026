import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, GraduationCap } from 'lucide-react'
import { registerAPI } from '../api/auth'
import { getActiveSchoolsAPI } from '../api/schools'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { passwordStrength } from '../utils/passwordStrength'
import LogoSVG from '../assets/cefetrj-logo'

const incomeOptions = [
  { value: 'ate_1sm', label: 'Até 1 salário mínimo' },
  { value: '1_a_2sm', label: 'De 1 a 2 salários mínimos' },
  { value: '2_a_3sm', label: 'De 2 a 3 salários mínimos' },
  { value: '3_a_5sm', label: 'De 3 a 5 salários mínimos' },
  { value: 'acima_5sm', label: 'Acima de 5 salários mínimos' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
]

const schoolLevelOptions = [
  { value: 'ensino_fundamental', label: 'Ensino Fundamental' },
  { value: '1_ou_2_ano_em', label: '1º ou 2º Ano do Ensino Médio' },
  { value: 'ultimo_ano_em', label: 'Último ano do Ensino Médio' },
  { value: 'ensino_medio_finalizado', label: 'Ensino Médio Finalizado' },
  { value: 'eja', label: 'EJA' },
]

const Register = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', birthDate: '', gender: 'prefiro_nao_informar',
    password: '', confirmPassword: '', schoolLevel: '', incomeRange: 'prefiro_nao_informar', school: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalErr, setGlobalErr] = useState('')

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
    setErrors(e => ({ ...e, [k]: '' }))
    setGlobalErr('')
  }

  const strength = passwordStrength(form.password)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome obrigatório'
    if (!form.email) errs.email = 'E-mail obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'E-mail inválido'
    if (!form.password) errs.password = 'Senha obrigatória'
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'As senhas não coincidem'
    if (!form.schoolLevel) errs.schoolLevel = 'Selecione um nível escolar'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = form
      await registerAPI(payload)
      navigate('/check-email', { state: { success: 'Verifique seu email para concluir seu cadastro.' } })
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const [schools, setSchools] = useState([])
  useEffect(() => {
    getActiveSchoolsAPI()
      .then(res => setSchools(res.data.data))
      .catch(() => setSchools([]))
  }, [])

  const strengthColors = ['', 'bg-error', 'bg-orange-400', 'bg-yellow-400', 'bg-success']
  const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte']

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-[520px]">
        <div className="card rounded-modal shadow-modal p-8 md:p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-2xl mb-1">
              <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
            </Link>
            <h1 className="text-xl font-bold text-text-primary mt-2">Crie sua conta</h1>
            <p className="text-text-muted text-sm mt-1">Preencha os dados abaixo para se cadastrar</p>
          </div>

          {globalErr && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-5">
              {globalErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome completo" placeholder="Seu nome completo" icon={User} value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="E-mail" type="email" placeholder="seu@email.com" icon={Mail} value={form.email} onChange={set('email')} error={errors.email} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Data de nascimento" type="date" value={form.birthDate} onChange={set('birthDate')} />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Sexo</label>
                <select value={form.gender} onChange={set('gender')} className="input-field">
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="prefiro_nao_informar">Prefiro não informar</option>
                </select>
              </div>
            </div>

            <div>
              <Input
                label="Senha"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                icon={Lock}
                value={form.password}
                onChange={set('password')}
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
              label="Confirmar senha"
              type={showPass ? 'text' : 'password'}
              placeholder="Repita a senha"
              icon={Lock}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Nível Escolar
              </label>

              <select
                value={form.schoolLevel}
                onChange={set('schoolLevel')}
                className="input-field"
                required
              >
                <option value="" disabled>
                  Selecione
                </option>

                {schoolLevelOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {errors.schoolLevel && (
                <p className="text-error text-sm mt-1">
                  {errors.schoolLevel}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Renda familiar per capita</label>
              <select value={form.incomeRange} onChange={set('incomeRange')} className="input-field">
                {incomeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Escola de origem</label>
              <select value={form.school} onChange={set('school')} className="input-field">
                <option value="">Prefiro não informar</option>
                {schools.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name}{s.city ? ` — ${s.city}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" className="w-full h-12 text-base mt-2" loading={loading}>
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
