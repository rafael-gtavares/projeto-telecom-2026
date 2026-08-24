import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useSchools } from '../../../hooks/useSchools'
import CandidateCard from './CandidateCard'

const CandidatesTab = ({ requests, actionLoading, onApprove, onReject }) => {
  const { schools } = useSchools()
  const [search, setSearch] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const student = r.student || {}
      if (schoolFilter !== 'all') {
        const studentSchoolId = student.school?._id || student.school
        if (schoolFilter === 'none' ? !!studentSchoolId : studentSchoolId !== schoolFilter) return false
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matches = student.name?.toLowerCase().includes(q) || student.email?.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [requests, search, schoolFilter])

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-text-primary">
          Candidatos a vaga — {filtered.length} de {requests.length}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="input-field w-full pl-9 text-sm"
          />
        </div>
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="input-field text-sm py-2"
        >
          <option value="all">Todas as escolas</option>
          <option value="none">Sem escola</option>
          {schools.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          {requests.length === 0
            ? 'Nenhuma solicitação de entrada no momento.'
            : 'Nenhum candidato encontrado com esse filtro.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((request) => (
            <CandidateCard
              key={request._id}
              request={request}
              actionLoading={actionLoading}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CandidatesTab