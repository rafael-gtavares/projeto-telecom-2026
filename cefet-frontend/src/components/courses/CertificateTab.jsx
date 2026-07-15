import { useState, useEffect } from 'react'
import { Download, Clock, ExternalLink } from 'lucide-react'
import { Badge } from '../ui/index'
import Button from '../ui/Button'
import CertificateCard from './CertificateCard'
import { getCertificatePdfAPI } from '../../api/courses'
import { readBlobError } from '../../utils/blobError'

// Aba "Certificado" do aluno (só aparece com o curso concluído).
// Em análise → aviso; Emitido → prévia visual (card) + abrir em nova aba + download.
const CertificateTab = ({ courseId, enrollment, course, lessons = [], studentName }) => {
  const emitido = enrollment?.certificateStatus === 'emitido'
  const [pdfUrl, setPdfUrl] = useState(null)
  const [error, setError] = useState('')

  // O PDF é buscado em segundo plano só para os botões (abrir/baixar);
  // a prévia (card) aparece na hora, a partir dos dados.
  useEffect(() => {
    if (!emitido) return
    let objectUrl
    setError('')
    getCertificatePdfAPI(courseId)
      .then((res) => { objectUrl = URL.createObjectURL(res.data); setPdfUrl(objectUrl) })
      .catch(async (err) => setError(await readBlobError(err, 'Não foi possível preparar o PDF para download.')))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [emitido, courseId])

  const openInNewTab = () => { if (pdfUrl) window.open(pdfUrl, '_blank') }
  const download = () => {
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="success">Emitido</Badge>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="text-sm" onClick={openInNewTab} disabled={!pdfUrl}>
            <ExternalLink size={15} /> Abrir em outra página
          </Button>
          <Button variant="primary" className="text-sm" onClick={download} disabled={!pdfUrl}>
            <Download size={15} /> Baixar PDF
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="max-w-3xl mx-auto">
        <CertificateCard
          studentName={studentName}
          course={course}
          lessons={lessons}
          issuedAt={enrollment.certificateIssuedAt}
          enrollmentId={enrollment._id}
          signatureText={enrollment.certificateSignature?.text}
          signatureFont={enrollment.certificateSignature?.font}
          signerName={enrollment.certificateSignature?.name}
        />
      </div>
    </div>
  )
}

export default CertificateTab
