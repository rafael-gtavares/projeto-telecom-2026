import { useMemo, useState } from 'react'
import { GraduationCap, TrendingUp, Award, Users } from 'lucide-react'
import { GRADING_METHODS } from '../../../constants/gradingMethods'
import { SITUATIONS, SITUATION_LABELS } from '../../../constants/enrollmentSitutation'

const SCHOOL_LEVEL_LABELS = {
  ensino_fundamental: 'Ensino Fundamental',
  '1_ou_2_ano_em': '1º ou 2º Ano do EM',
  ultimo_ano_em: 'Último ano do EM',
  ensino_medio_finalizado: 'Ensino Médio Finalizado',
  eja: 'EJA',
  superior_completo: 'Superior Completo',
  superior_incompleto: 'Superior Incompleto',
}

// Ordem e cor de cada situação nas barras/legendas
const STATUS_META = [
  { key: SITUATIONS.APROVADO, bar: 'bg-success', text: 'text-success' },
  { key: SITUATIONS.REPROVADO, bar: 'bg-error', text: 'text-error' },
  { key: SITUATIONS.DESISTENTE, bar: 'bg-warning', text: 'text-warning' },
  { key: SITUATIONS.PENDENTE, bar: 'bg-text-muted', text: 'text-text-muted' },
]

const NO_SCHOOL = '__none__'
const round1 = (n) => Math.round(n * 10) / 10
const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0)

const StatTile = ({ label, value, sub, icon: Icon, accent = 'text-primary' }) => (
  <div className="card p-3 flex flex-col justify-center">
    <div className="flex items-center gap-1.5 mb-1 text-text-muted">
      {Icon && <Icon size={14} />}
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    {sub && <span className="text-[11px] text-text-muted mt-0.5">{sub}</span>}
  </div>
)

const CoursePerformanceStats = ({ students, assessments, scores, config }) => {
  const [schoolFilter, setSchoolFilter] = useState('all')

  const isSum = config?.method === GRADING_METHODS.SUM
  const totalPoints = useMemo(
    () => (assessments || []).reduce((s, a) => s + (a.maxScore || 0), 0),
    [assessments]
  )

  // Escolas presentes entre os inscritos (para o filtro)
  const schoolOptions = useMemo(() => {
    const map = new Map()
    let noneCount = 0
    for (const e of (students || [])) {
      const sc = e.user?.school
      if (sc && sc._id) map.set(String(sc._id), sc.name || 'Escola')
      else noneCount++
    }
    const opts = [...map.entries()].map(([id, name]) => ({ id, name }))
    opts.sort((a, b) => a.name.localeCompare(b.name))
    // Sempre oferece o filtro de alunos sem escola cadastrada (mesmo com 0).
    opts.push({ id: NO_SCHOOL, name: `Sem escola cadastrada (${noneCount})` })
    return opts
  }, [students])

  const schoolIdOf = (e) => (e.user?.school?._id ? String(e.user.school._id) : NO_SCHOOL)

  const filtered = useMemo(() => {
    if (schoolFilter === 'all') return students || []
    return (students || []).filter(e => schoolIdOf(e) === schoolFilter)
  }, [students, schoolFilter])

  const fmtGrade = (v) => (v == null ? '—' : isSum ? `${round1(v)}` : round1(v).toFixed(1))

  // Contagem por situação
  const countBy = (list) => {
    const c = { [SITUATIONS.APROVADO]: 0, [SITUATIONS.REPROVADO]: 0, [SITUATIONS.DESISTENTE]: 0, [SITUATIONS.PENDENTE]: 0 }
    for (const e of list) {
      const s = e.situation || SITUATIONS.PENDENTE
      c[s] = (c[s] || 0) + 1
    }
    return c
  }

  const stats = useMemo(() => {
    const counts = countBy(filtered)
    const total = filtered.length
    const graded = filtered.filter(e => e.averageGrade != null)
    const avg = graded.length ? graded.reduce((s, e) => s + e.averageGrade, 0) / graded.length : null
    const decided = counts[SITUATIONS.APROVADO] + counts[SITUATIONS.REPROVADO]
    const approvalRate = decided > 0 ? Math.round((counts[SITUATIONS.APROVADO] / decided) * 100) : null
    return { counts, total, gradedCount: graded.length, avg, approvalRate }
  }, [filtered])

  // Média por avaliação (entre os alunos filtrados que têm nota)
  const perAssessment = useMemo(() => {
    const filteredIds = new Set(filtered.map(e => String(e.user?._id)))
    return (assessments || []).map(a => {
      const rows = (scores || []).filter(
        s => String(s.assessment) === String(a._id) && filteredIds.has(String(s.student))
      )
      const avg = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : null
      return { ...a, avg, count: rows.length }
    })
  }, [assessments, scores, filtered])

  // Distribuição de notas por faixa (apenas métodos de média, escala 0–10)
  const distribution = useMemo(() => {
    if (isSum) return null
    const faixas = [
      { label: '0–2', min: 0, max: 2 },
      { label: '2–4', min: 2, max: 4 },
      { label: '4–6', min: 4, max: 6 },
      { label: '6–8', min: 6, max: 8 },
      { label: '8–10', min: 8, max: 10.01 },
    ]
    return faixas.map(f => ({
      ...f,
      count: filtered.filter(e => e.averageGrade != null && e.averageGrade >= f.min && e.averageGrade < f.max).length,
    }))
  }, [filtered, isSum])

  // Quebra por escola (sempre todas as escolas, para comparação)
  const bySchool = useMemo(() => {
    const groups = new Map()
    for (const e of (students || [])) {
      const id = schoolIdOf(e)
      const name = e.user?.school?.name || 'Sem escola'
      if (!groups.has(id)) groups.set(id, { id, name, list: [] })
      groups.get(id).list.push(e)
    }
    return [...groups.values()].map(g => {
      const counts = countBy(g.list)
      const graded = g.list.filter(e => e.averageGrade != null)
      const avg = graded.length ? graded.reduce((s, e) => s + e.averageGrade, 0) / graded.length : null
      return { ...g, counts, total: g.list.length, avg }
    }).sort((a, b) => b.total - a.total)
  }, [students])

  // Distribuição por nível escolar (entre os filtrados)
  const byLevel = useMemo(() => {
    const map = new Map()
    for (const e of filtered) {
      const lvl = e.user?.schoolLevel || 'nao_informado'
      map.set(lvl, (map.get(lvl) || 0) + 1)
    }
    return [...map.entries()].map(([lvl, count]) => ({
      label: SCHOOL_LEVEL_LABELS[lvl] || 'Não informado', count,
    })).sort((a, b) => b.count - a.count)
  }, [filtered])

  if ((students || []).length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">Nenhum aluno inscrito para gerar estatísticas.</p>
  }

  const { counts, total, avg, approvalRate, gradedCount } = stats

  return (
    <div className="space-y-5">
      {/* Cabeçalho + filtro por escola */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> Desempenho da turma
        </h3>
        <div className="flex items-center gap-1.5">
          <GraduationCap size={14} className="text-text-muted" />
          <span className="text-xs text-text-muted flex-shrink-0">Escola de origem:</span>
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="input-field text-xs py-1.5 max-w-[200px]"
          >
            <option value="all">Todas ({students.length})</option>
            {schoolOptions.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Situação dos alunos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Aprovados" value={counts[SITUATIONS.APROVADO]} sub={`${pct(counts[SITUATIONS.APROVADO], total)}% da turma`} icon={Award} accent="text-success" />
        <StatTile label="Reprovados" value={counts[SITUATIONS.REPROVADO]} sub={`${pct(counts[SITUATIONS.REPROVADO], total)}% da turma`} accent="text-error" />
        <StatTile label="Desistentes" value={counts[SITUATIONS.DESISTENTE]} sub={`${pct(counts[SITUATIONS.DESISTENTE], total)}% da turma`} accent="text-warning" />
        <StatTile label="Em andamento" value={counts[SITUATIONS.PENDENTE]} sub={`${pct(counts[SITUATIONS.PENDENTE], total)}% da turma`} accent="text-text-secondary" />
      </div>

      {/* Barra de proporção das situações */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex h-3 rounded-full overflow-hidden bg-surface-page">
            {STATUS_META.map(m => {
              const w = pct(counts[m.key], total)
              return w > 0 ? <div key={m.key} className={m.bar} style={{ width: `${w}%` }} title={`${SITUATION_LABELS[m.key]}: ${counts[m.key]}`} /> : null
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {STATUS_META.map(m => (
              <span key={m.key} className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <span className={`w-2 h-2 rounded-full ${m.bar} inline-block`} /> {SITUATION_LABELS[m.key]} ({counts[m.key]})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores gerais */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatTile
          label="Taxa de aprovação"
          value={approvalRate != null ? `${approvalRate}%` : '—'}
          sub="entre aprovados e reprovados"
          icon={TrendingUp}
        />
        <StatTile
          label="Nota final média"
          value={avg != null ? (isSum ? `${round1(avg)} / ${totalPoints}` : round1(avg).toFixed(1)) : '—'}
          sub={`${gradedCount} com nota`}
          icon={Award}
        />
        <StatTile
          label="Já avaliados"
          value={`${gradedCount}/${total}`}
          sub={`${pct(gradedCount, total)}% com nota lançada`}
          icon={Users}
        />
      </div>

      {/* Média por avaliação */}
      {(assessments || []).length > 0 && (
        <div className="card p-4 space-y-3">
          <h4 className="font-semibold text-text-primary text-sm">Média por avaliação</h4>
          {perAssessment.map(a => {
            const max = isSum ? a.maxScore : 10
            const w = a.avg != null ? Math.min(100, (a.avg / max) * 100) : 0
            return (
              <div key={a._id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary truncate">{a.title}{!a.published && <span className="text-text-muted"> (rascunho)</span>}</span>
                  <span className="font-semibold text-text-primary flex-shrink-0 ml-2">
                    {a.avg != null ? `${round1(a.avg)} / ${max}` : '—'}
                    <span className="text-text-muted font-normal"> · {a.count} nota{a.count !== 1 ? 's' : ''}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-page overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${w}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Distribuição de notas por faixa (métodos de média) */}
      {distribution && (
        <div className="card p-4 space-y-3">
          <h4 className="font-semibold text-text-primary text-sm">Distribuição das notas finais</h4>
          {distribution.map(f => {
            const w = pct(f.count, gradedCount)
            return (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-10 flex-shrink-0">{f.label}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-page overflow-hidden">
                  <div className={`h-full rounded-full ${f.min >= 6 ? 'bg-success' : f.min >= 4 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${w}%` }} />
                </div>
                <span className="text-xs font-semibold text-text-primary w-8 text-right flex-shrink-0">{f.count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Quebra por escola de origem */}
      {bySchool.length > 1 && (
        <div className="card p-0 overflow-hidden">
          <h4 className="font-semibold text-text-primary text-sm px-4 pt-4 pb-2">Por escola de origem</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border">
                  <th className="text-left font-medium px-4 py-2">Escola</th>
                  <th className="text-center font-medium px-2 py-2">Alunos</th>
                  <th className="text-center font-medium px-2 py-2 text-success">Aprov.</th>
                  <th className="text-center font-medium px-2 py-2 text-error">Reprov.</th>
                  <th className="text-center font-medium px-2 py-2 text-warning">Desist.</th>
                  <th className="text-center font-medium px-2 py-2">Em and.</th>
                  <th className="text-center font-medium px-4 py-2">Média</th>
                </tr>
              </thead>
              <tbody>
                {bySchool.map(g => (
                  <tr key={g.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-text-primary font-medium truncate max-w-[160px]">{g.name}</td>
                    <td className="text-center px-2 py-2 text-text-secondary">{g.total}</td>
                    <td className="text-center px-2 py-2 text-success font-semibold">{g.counts[SITUATIONS.APROVADO]}</td>
                    <td className="text-center px-2 py-2 text-error font-semibold">{g.counts[SITUATIONS.REPROVADO]}</td>
                    <td className="text-center px-2 py-2 text-warning font-semibold">{g.counts[SITUATIONS.DESISTENTE]}</td>
                    <td className="text-center px-2 py-2 text-text-muted">{g.counts[SITUATIONS.PENDENTE]}</td>
                    <td className="text-center px-4 py-2 text-primary font-semibold">
                      {g.avg != null ? (isSum ? round1(g.avg) : round1(g.avg).toFixed(1)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribuição por nível escolar */}
      {byLevel.length > 0 && (
        <div className="card p-4 space-y-2">
          <h4 className="font-semibold text-text-primary text-sm mb-1">Por nível escolar</h4>
          {byLevel.map(l => (
            <div key={l.label} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{l.label}</span>
              <span className="font-semibold text-text-primary">{l.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CoursePerformanceStats
