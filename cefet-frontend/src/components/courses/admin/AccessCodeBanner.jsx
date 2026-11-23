import { useState } from 'react'
import { School, Copy, Check } from 'lucide-react'
import { formatSchoolNames } from '../../../utils/schoolAccess'

// Faixa no painel do curso para turmas fechadas: mostra as escolas com acesso
// e o código, com botão de copiar (o professor costuma passar o código em sala).
const AccessCodeBanner = ({ course }) => {
  const [copied, setCopied] = useState(false)

  if (!(course?.restrictedSchools || []).length) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(course.accessCode || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-primary/5 border border-primary/20 rounded-card px-4 py-3 my-3">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <School size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-text-primary min-w-0">
          <strong>Turma fechada</strong> para: {formatSchoolNames(course.restrictedSchools)}
        </p>
      </div>
      {course.accessCode && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-text-muted">Código:</span>
          <code className="px-2.5 py-1 rounded-md bg-white border border-border font-mono font-bold tracking-widest text-primary">
            {course.accessCode}
          </code>
          <button
            type="button"
            onClick={copy}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10"
            title="Copiar código"
            aria-label="Copiar código de acesso"
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
        </div>
      )}
    </div>
  )
}

export default AccessCodeBanner
