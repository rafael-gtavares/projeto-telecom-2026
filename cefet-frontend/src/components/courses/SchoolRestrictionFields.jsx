import { X, RefreshCw, Lock } from 'lucide-react'
import { useSchools } from '../../hooks/useSchools'
import { generateAccessCode } from '../../utils/schoolAccess'

// Bloco do formulário de curso: fechar a turma para escola(s) específica(s).
// Só entra quem tem uma dessas escolas no perfil E digita o código de acesso.
//
// Props:
//  - enabled / schools (ids) / accessCode
//  - onChange(patch): { isRestricted?, restrictedSchools?, accessCode? }
//  - codeError: mensagem de validação do código
const SchoolRestrictionFields = ({ enabled, schools, accessCode, onChange, codeError }) => {
  const { schools: allSchools, loading } = useSchools()

  const nameOf = (id) => {
    const s = allSchools.find((x) => x._id === id)
    return s ? `${s.name}${s.city ? ` — ${s.city}` : ''}` : 'Escola'
  }
  const available = allSchools.filter((s) => !schools.includes(s._id))

  const toggle = (checked) =>
    onChange({
      isRestricted: checked,
      // Ao fechar a turma pela primeira vez já sugere um código
      accessCode: checked && !accessCode ? generateAccessCode() : accessCode,
    })

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium text-text-primary">
            Turma fechada para escola(s) específica(s)
          </span>
          <span className="block text-xs text-text-muted">
            O curso continua aparecendo na Home, mas só entra quem é da escola selecionada e digita o código de acesso.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="space-y-4 p-4 rounded-lg border border-border bg-surface-hover/50">
          {/* Escolas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Escolas com acesso</label>
            {schools.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {schools.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {nameOf(id)}
                    <button
                      type="button"
                      onClick={() => onChange({ restrictedSchools: schools.filter((s) => s !== id) })}
                      className="p-0.5 rounded-full hover:bg-primary/20"
                      aria-label="Remover escola"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <select
              value=""
              disabled={loading || available.length === 0}
              onChange={(e) => e.target.value && onChange({ restrictedSchools: [...schools, e.target.value] })}
              className="input-field w-full"
            >
              <option value="">
                {loading ? 'Carregando escolas…' : available.length === 0 ? 'Todas as escolas já foram adicionadas' : 'Adicionar escola…'}
              </option>
              {available.map((s) => (
                <option key={s._id} value={s._id}>{s.name}{s.city ? ` — ${s.city}` : ''}</option>
              ))}
            </select>
            {schools.length === 0 && (
              <p className="text-xs text-warning-text mt-1.5">Selecione ao menos uma escola ou desmarque a opção acima.</p>
            )}
          </div>

          {/* Código de acesso */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Código de acesso</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={accessCode}
                  maxLength={20}
                  onChange={(e) => onChange({ accessCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="input-field w-full pl-9 font-mono tracking-widest"
                  placeholder="Ex.: ESCOLA-2026"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange({ accessCode: generateAccessCode() })}
                className="btn-secondary gap-1.5 flex-shrink-0"
                title="Gerar um código aleatório"
              >
                <RefreshCw size={15} /> Gerar novo
              </button>
            </div>
            <p className={`text-xs mt-1.5 ${codeError ? 'text-warning-text' : 'text-text-muted'}`}>
              {codeError || 'Informe este código aos alunos da escola. Trocar o código não remove quem já entrou.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolRestrictionFields
