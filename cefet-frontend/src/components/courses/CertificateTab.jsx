import { useState, useEffect } from 'react'
import { Download, Clock, CheckCircle, Award } from 'lucide-react'
import { Spinner, Badge } from '../ui/index'
import Button from '../ui/Button'
import { getCertificatePdfAPI } from '../../api/courses'
import { readBlobError } from '../../utils/blobError'

// Aba "Certificado" do aluno (só aparece com o curso concluído).
// Em análise → aviso; Emitido → prévia do PDF + download.
const CertificateTab = ({ courseId, enrollment }) => {
  const emitido = enrollment?.certificateStatus === 'emitido'
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!emitido) return
    let objectUrl
    setLoading(true)
    setError('')
    getCertificatePdfAPI(courseId)
      .then((res) => { objectUrl = URL.createObjectURL(res.data); setPdfUrl(objectUrl) })
      .catch(async (err) => setError(await readBlobError(err, 'Não foi possível carregar o certificado. Tente novamente.')))
      .finally(() => setLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [emitido, courseId])

  const handleDownload = () => {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = 'certificado.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (!emitido) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
          <Clock size={26} className="text-warning" />
        </div>
        <Badge variant="warning">Em análise</Badge>
        <p className="text-sm text-text-secondary mt-3 max-w-sm mx-auto leading-relaxed">
          Seu certificado está <strong>em análise</strong>. Assim que a coordenação do curso
          liberá-lo, ele aparecerá aqui para visualização e download.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle size={12} /> Emitido
          </Badge>
          <span className="text-sm text-text-muted truncate">Seu certificado de conclusão está pronto.</span>
        </div>
        <Button variant="primary" className="text-sm flex-shrink-0" onClick={handleDownload} disabled={!pdfUrl}>
          <Download size={15} /> Baixar PDF
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <div className="text-center py-12">
          <Award size={28} className="mx-auto text-text-muted opacity-40 mb-2" />
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : pdfUrl ? (
        <div className="w-full rounded-card border border-border overflow-hidden bg-surface-page" style={{ height: '70vh' }}>
          <iframe title="Certificado de conclusão" src={pdfUrl} className="w-full h-full" />
        </div>
      ) : null}
    </div>
  )
}

export default CertificateTab
