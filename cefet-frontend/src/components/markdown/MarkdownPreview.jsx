import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Extrai o ID de um vídeo do YouTube de várias formas de URL
export const getYoutubeId = (url = '') => {
  const m = String(url).match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/
  )
  return m ? m[1] : null
}

const YouTubeEmbed = ({ id }) => (
  <div className="relative w-full rounded-card overflow-hidden my-4 border border-border" style={{ aspectRatio: '16 / 9' }}>
    <iframe
      className="absolute inset-0 w-full h-full"
      src={`https://www.youtube.com/embed/${id}`}
      title="Vídeo do YouTube"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  </div>
)

// Componentes customizados (react-markdown v9 entrega nós no formato hast)
const components = {
  p({ node, children }) {
    // Parágrafo que contém apenas um link/URL de YouTube → vira player embutido.
    // (Evita <div> dentro de <p>, que seria HTML inválido.)
    const kids = node?.children || []
    if (kids.length === 1) {
      const c = kids[0]
      let url = ''
      if (c.type === 'text') url = c.value
      else if (c.type === 'element' && c.tagName === 'a') url = c.properties?.href
      const id = getYoutubeId(url)
      if (id) return <YouTubeEmbed id={id} />
    }
    return <p>{children}</p>
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
  img({ src, alt }) {
    return <img src={src} alt={alt || ''} loading="lazy" />
  },
}

// Renderiza conteúdo Markdown com o estilo .md-content (ver index.css)
const MarkdownPreview = ({ content, className = '' }) => (
  <div className={`md-content ${className}`}>
    {content?.trim() ? (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    ) : (
      <p className="text-text-muted text-sm italic">Nada para pré-visualizar ainda.</p>
    )}
  </div>
)

export default MarkdownPreview
