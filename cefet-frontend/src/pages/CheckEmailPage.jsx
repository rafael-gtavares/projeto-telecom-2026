import { useLocation } from 'react-router-dom'

export default function CheckEmailPage() {
  const { state } = useLocation()

  const title = state?.title || 'Verifique seu e-mail'
  const message = state?.message || 'Enviamos um link de verificação para o seu e-mail. Clique no link recebido para ativar sua conta.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}