import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await forgotPassword(email)
      navigate('/check-email', {
        state: {
          title: 'Verifique seu e-mail',
          message: 'Se este e-mail estiver cadastrado, você receberá um link de redefinição em breve.'
        }
      })
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Esqueci a senha</h1>
        <p className="text-gray-600 text-center mb-6">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-gray-500 hover:underline text-center"
          >
            Voltar para o login
          </button>
        </form>
      </div>
    </div>
  )
}