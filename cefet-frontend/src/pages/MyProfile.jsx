import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Lock, Eye, EyeOff } from 'lucide-react'
import Header from '../components/layout/Header'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Avatar, Badge } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { updateMeAPI } from '../api/users'
import { getActiveSchoolsAPI } from '../api/schools'
import { getRoleLabel } from '../utils/formatDate'

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

const MyProfile = () => {
  const { user, role, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    birthDate: user?.birthDate ? user.birthDate.slice(0, 10) : '',
    gender: user?.gender || 'prefiro_nao_informar',
    schoolLevel: user?.schoolLevel || '',
    incomeRange: user?.incomeRange || 'prefiro_nao_informar',
    school: user?.school?._id || user?.school || '',
  })
  const [schools, setSchools] = useState([])
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [showPassSection, setShowPassSection] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getActiveSchoolsAPI()
      .then(res => setSchools(res.data.data))
      .catch(() => setSchools([]))
  }, [])

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  const handleSave = async () => {
    setError(''); setSuccess('')
    const payload = { ...form, school: form.school || null }
    if (showPassSection && passwords.password) {
      if (passwords.password !== passwords.confirm) { setError('As senhas não coincidem'); return }
      if (passwords.password.length < 6) { setError('Mínimo 6 caracteres'); return }
      payload.password = passwords.password
    }
    setLoading(true)
    try {
      const { data } = await updateMeAPI(payload)
      updateUser(data.data)
      setSuccess('Perfil atualizado com sucesso!')
      setPasswords({ password: '', confirm: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setForm({
      name: user?.name || '', birthDate: user?.birthDate?.slice(0, 10) || '',
      gender: user?.gender || 'prefiro_nao_informar', schoolLevel: user?.schoolLevel || '',
      incomeRange: user?.incomeRange || 'prefiro_nao_informar',
      school: user?.school?._id || user?.school || '',
    })
    setError(''); setSuccess(''); setShowPassSection(false)
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="page-container">
        <div className="max-w-[560px] mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Meu Perfil</h1>

          <div className="card p-6 md:p-8 animate-fadeIn">
            <div className="flex flex-col items-center mb-8">
              <Avatar name={user?.name} size="xl" />
              <h2 className="font-semibold text-text-primary mt-3 text-lg">{user?.name}</h2>
              <p className="text-text-muted text-sm">{user?.email}</p>
              <Badge variant="blue" className="mt-2">{getRoleLabel(role)}</Badge>
            </div>

            {success && <div className="bg-success-light border border-success/20 text-success-text text-sm rounded-lg px-4 py-3 mb-5">{success}</div>}
            {error && <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}

            <div className="space-y-4">
              <Input label="Nome completo" value={form.name} onChange={set('name')} />
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
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Nível Escolar</label>
                <select value={form.schoolLevel} onChange={set('schoolLevel')} className="input-field">
                  {schoolLevelOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Renda familiar per capita</label>
                <select value={form.incomeRange} onChange={set('incomeRange')} className="input-field">
                  {incomeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Campo escola — só aparece para alunos */}
              {role !== 'professor' && (
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
              )}

              {/* Password section */}
              <div className="border border-border rounded-card overflow-hidden">
                <button
                  onClick={() => setShowPassSection(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-page transition-colors"
                >
                  <span className="flex items-center gap-2"><Lock size={15} /> Alterar senha</span>
                  {showPassSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPassSection && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                    <Input
                      label="Nova senha"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={passwords.password}
                      onChange={e => setPasswords(p => ({ ...p, password: e.target.value }))}
                      icon={Lock}
                      rightElement={
                        <button type="button" onClick={() => setShowPass(s => !s)} className="text-text-muted">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    <Input
                      label="Confirmar nova senha"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      icon={Lock}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="primary" className="flex-1" onClick={handleSave} loading={loading}>
                Salvar alterações
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProfile