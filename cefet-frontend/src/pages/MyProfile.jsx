import { useState } from 'react'
import { ChevronDown, ChevronUp, Lock, Eye, EyeOff, PenLine, Trash2 } from 'lucide-react'
import Header from '../components/layout/Header'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Avatar, Badge } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { updateMeAPI, updateSignatureAPI } from '../api/users'
import { useSchools } from '../hooks/useSchools'
import { getRoleLabel } from '../utils/formatDate'
import { passwordStrength } from '../utils/passwordStrength'
import { SIGNATURE_FONTS } from '../constants/signatureFonts'

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
  const { schools, loading: schoolsLoading } = useSchools()
  const [passwords, setPasswords] = useState({ current: '', password: '', confirm: '' })
  const [showPassSection, setShowPassSection] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Professores/admin podem configurar uma assinatura usada nos certificados
  const canSign = role !== 'aluno'
  const [sig, setSig] = useState({
    text: user?.signature?.text || user?.name || '',
    font: user?.signature?.font || SIGNATURE_FONTS[0].value,
  })
  const [sigLoading, setSigLoading] = useState(false)
  const [sigMsg, setSigMsg] = useState({ error: '', success: '' })
  const hasSavedSignature = !!user?.signature?.text
  const sigFamily = SIGNATURE_FONTS.find(f => f.value === sig.font)?.cssFamily || 'inherit'

  const handleSaveSignature = async () => {
    setSigMsg({ error: '', success: '' })
    const text = sig.text.trim()
    if (!text) { setSigMsg({ error: 'Informe o texto da assinatura', success: '' }); return }
    setSigLoading(true)
    try {
      const { data } = await updateSignatureAPI({ text, font: sig.font })
      updateUser(data.data)
      setSigMsg({ error: '', success: 'Assinatura salva com sucesso!' })
    } catch (err) {
      setSigMsg({ error: err.response?.data?.message || 'Erro ao salvar a assinatura', success: '' })
    } finally {
      setSigLoading(false)
    }
  }

  const handleRemoveSignature = async () => {
    setSigMsg({ error: '', success: '' })
    setSigLoading(true)
    try {
      const { data } = await updateSignatureAPI({ text: '' })
      updateUser(data.data)
      setSig({ text: user?.name || '', font: SIGNATURE_FONTS[0].value })
      setSigMsg({ error: '', success: 'Assinatura removida.' })
    } catch (err) {
      setSigMsg({ error: err.response?.data?.message || 'Erro ao remover a assinatura', success: '' })
    } finally {
      setSigLoading(false)
    }
  }

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  // Admin e professores sempre podem editar nome/nascimento; aluno só com permissão.
  const canEditIdentity = user?.canEditPersonalInfo || role !== 'aluno'

  const handleSave = async () => {
    setError(''); setSuccess('')
    const payload = { ...form }
    // Não envia nome/nascimento quando o usuário não pode editá-los (evita 403
    // desnecessário ao salvar apenas os demais campos).
    if (!canEditIdentity) {
      delete payload.name
      delete payload.birthDate
    }
    if (showPassSection && passwords.password) {
      if (!passwords.current) { setError('Informe sua senha atual'); return }
      if (passwords.password !== passwords.confirm) { setError('As senhas não coincidem'); return }
      if (passwords.password.length < 6) { setError('Mínimo 6 caracteres'); return }
      payload.password = passwords.password
      payload.currentPassword = passwords.current
    }
    setLoading(true)
    try {
      const { data } = await updateMeAPI(payload)
      updateUser(data.data)
      setSuccess('Perfil atualizado com sucesso!')
      setPasswords({ current: '', password: '', confirm: '' })
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
    setPasswords({ current: '', password: '', confirm: '' })
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
              <Input label="Nome completo" value={form.name} onChange={set('name')} disabled={!canEditIdentity}/>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data de nascimento" type="date" value={form.birthDate} onChange={set('birthDate')} disabled={!canEditIdentity}/>
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
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Nível Escolar
                </label>

                <select
                  value={form.schoolLevel}
                  onChange={set('schoolLevel')}
                  className="input-field"
                  required
                >
                  {schoolLevelOptions.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Escola de origem
                </label>
                {schoolsLoading ? (
                  <div className="input-field flex items-center gap-2 text-text-muted text-sm">
                    <span className="w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin" />
                    Carregando...
                  </div>
                ) : (
                  <select
                    value={form.school}
                    onChange={set('school')}
                    className="input-field"
                  >
                    <option value="">Outra</option>
                    {schools.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name}{s.city ? ` — ${s.city}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Renda familiar per capita</label>
                <select value={form.incomeRange} onChange={set('incomeRange')} className="input-field">
                  {incomeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

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
                      label="Senha atual"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Sua senha atual"
                      value={passwords.current}
                      onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                      icon={Lock}
                    />
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
                    {passwords.password && (() => {
                      const { score, label, color } = passwordStrength(passwords.password)
                      return (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? color : 'bg-border'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-text-muted">Força: <span className="font-medium">{label}</span></p>
                        </div>
                      )
                    })()}
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

          {canSign && (
            <div className="card p-6 md:p-8 animate-fadeIn mt-6">
              <div className="flex items-center gap-2 mb-1">
                <PenLine size={18} className="text-primary" />
                <h2 className="font-semibold text-text-primary text-lg">Assinatura do certificado</h2>
              </div>
              <p className="text-text-muted text-sm mb-5">
                Defina como sua assinatura aparecerá nos certificados que você emitir.
                Escolha o texto e um estilo de fonte.
              </p>

              {sigMsg.success && <div className="bg-success-light border border-success/20 text-success-text text-sm rounded-lg px-4 py-3 mb-5">{sigMsg.success}</div>}
              {sigMsg.error && <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-5">{sigMsg.error}</div>}

              <div className="space-y-5">
                <Input
                  label="Texto da assinatura"
                  value={sig.text}
                  onChange={e => setSig(s => ({ ...s, text: e.target.value }))}
                  maxLength={60}
                  placeholder="Ex.: Seu nome"
                />

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Estilo da fonte</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SIGNATURE_FONTS.map(f => {
                      const selected = sig.font === f.value
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setSig(s => ({ ...s, font: f.value }))}
                          className={`rounded-card border px-3 py-3 text-center transition-all ${
                            selected
                              ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <span
                            className="block text-2xl text-text-primary leading-tight truncate"
                            style={{ fontFamily: f.cssFamily }}
                          >
                            {sig.text.trim() || 'Assinatura'}
                          </span>
                          <span className="block text-[11px] text-text-muted mt-1">{f.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Prévia como ficará no rodapé do certificado */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Prévia no certificado</label>
                  <div className="border border-border rounded-card bg-white py-6 px-4 flex flex-col items-center">
                    <span
                      className="text-4xl text-[#1f2933] leading-none pb-2"
                      style={{ fontFamily: sigFamily }}
                    >
                      {sig.text.trim() || 'Assinatura'}
                    </span>
                    <span className="w-52 border-t border-[#1f2933]" />
                    <span className="text-sm font-semibold text-[#1f2933] mt-1.5">{sig.text.trim() || user?.name}</span>
                    <span className="text-xs text-[#5b6b7b]">CEFET/RJ</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1" onClick={handleSaveSignature} loading={sigLoading}>
                  Salvar assinatura
                </Button>
                {hasSavedSignature && (
                  <Button variant="secondary" onClick={handleRemoveSignature} disabled={sigLoading}>
                    <Trash2 size={16} /> Remover
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyProfile
