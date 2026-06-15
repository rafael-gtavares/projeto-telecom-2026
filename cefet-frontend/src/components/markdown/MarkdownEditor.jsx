import { useRef } from 'react'
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Link as LinkIcon, Image, Youtube, Code, Minus,
} from 'lucide-react'
import MarkdownPreview from './MarkdownPreview'

// Editor Markdown com toolbar + pré-visualização ao vivo.
// `value` controlado pelo pai; `onChange(novoTexto)`.
const MarkdownEditor = ({ value, onChange }) => {
  const ref = useRef(null)

  // Aplica uma transformação na seleção atual do textarea
  const apply = (transform) => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const { text, selStart, selEnd } = transform(selected, value, start, end)
    onChange(text)
    // restaura o foco/seleção após o re-render
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(selStart, selEnd)
    })
  }

  // Envolve a seleção com marcadores (negrito, itálico, etc.)
  const wrap = (before, after = before, placeholder = '') => () =>
    apply((sel, val, start, end) => {
      const inner = sel || placeholder
      const text = val.slice(0, start) + before + inner + after + val.slice(end)
      const selStart = start + before.length
      return { text, selStart, selEnd: selStart + inner.length }
    })

  // Prefixa a(s) linha(s) selecionada(s) (títulos, listas, citação)
  const linePrefix = (prefix, placeholder = '') => () =>
    apply((sel, val, start, end) => {
      // expande para o início da linha
      const lineStart = val.lastIndexOf('\n', start - 1) + 1
      const block = val.slice(lineStart, end) || placeholder
      const prefixed = block
        .split('\n')
        .map((l, i) => (prefix === '1. ' ? `${i + 1}. ${l}` : prefix + l))
        .join('\n')
      const text = val.slice(0, lineStart) + prefixed + val.slice(end)
      return { text, selStart: lineStart, selEnd: lineStart + prefixed.length }
    })

  // Insere um bloco no cursor (links, imagem, vídeo, linha horizontal)
  const insert = (snippet) => () =>
    apply((sel, val, start, end) => {
      const text = val.slice(0, start) + snippet + val.slice(end)
      const pos = start + snippet.length
      return { text, selStart: pos, selEnd: pos }
    })

  const Btn = ({ onClick, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
    >
      {children}
    </button>
  )
  const Sep = () => <span className="w-px h-5 bg-border mx-0.5" />

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Editor */}
      <div className="flex flex-col border border-border rounded-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface-page">
          <Btn onClick={wrap('**', '**', 'negrito')} title="Negrito"><Bold size={16} /></Btn>
          <Btn onClick={wrap('*', '*', 'itálico')} title="Itálico"><Italic size={16} /></Btn>
          <Btn onClick={wrap('~~', '~~', 'riscado')} title="Riscado"><Strikethrough size={16} /></Btn>
          <Btn onClick={wrap('`', '`', 'código')} title="Código"><Code size={16} /></Btn>
          <Sep />
          <Btn onClick={linePrefix('# ', 'Título')} title="Título 1"><Heading1 size={16} /></Btn>
          <Btn onClick={linePrefix('## ', 'Título')} title="Título 2"><Heading2 size={16} /></Btn>
          <Btn onClick={linePrefix('### ', 'Título')} title="Título 3"><Heading3 size={16} /></Btn>
          <Sep />
          <Btn onClick={linePrefix('- ', 'item')} title="Lista"><List size={16} /></Btn>
          <Btn onClick={linePrefix('1. ', 'item')} title="Lista numerada"><ListOrdered size={16} /></Btn>
          <Btn onClick={linePrefix('- [ ] ', 'tarefa')} title="Lista de tarefas"><ListChecks size={16} /></Btn>
          <Btn onClick={linePrefix('> ', 'citação')} title="Citação"><Quote size={16} /></Btn>
          <Sep />
          <Btn onClick={insert('[texto do link](https://)')} title="Link"><LinkIcon size={16} /></Btn>
          <Btn onClick={insert('![descrição da imagem](https://)')} title="Imagem"><Image size={16} /></Btn>
          <Btn onClick={insert('\nhttps://www.youtube.com/watch?v=\n')} title="Vídeo do YouTube"><Youtube size={16} /></Btn>
          <Btn onClick={insert('\n\n---\n\n')} title="Linha divisória"><Minus size={16} /></Btn>
        </div>

        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escreva o conteúdo da aula em Markdown..."
          className="w-full flex-1 min-h-[340px] p-4 text-sm font-mono text-text-primary resize-y outline-none"
        />
      </div>

      {/* Pré-visualização */}
      <div className="border border-border rounded-card overflow-hidden flex flex-col">
        <div className="px-4 py-1.5 border-b border-border bg-surface-page">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Pré-visualização</span>
        </div>
        <div className="p-4 overflow-y-auto min-h-[340px] max-h-[60vh]">
          <MarkdownPreview content={value} />
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
