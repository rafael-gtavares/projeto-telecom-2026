import { Component } from 'react'

/**
 * Captura erros de renderização em qualquer componente filho e mostra
 * um fallback amigável, em vez de deixar a tela inteira branca.
 * (Error boundaries precisam ser componentes de classe.)
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Log para depuração — em produção poderia ir para um serviço de monitoramento
    console.error('ErrorBoundary capturou um erro:', error, info)
  }

  handleReload = () => {
    // Limpa o estado de erro e recarrega a aplicação
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface-page px-4 text-center">
          <div className="card max-w-md w-full p-8">
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Ops, algo deu errado
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Encontramos um problema ao exibir esta página. Você pode voltar ao
              início e tentar novamente.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary w-full"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
