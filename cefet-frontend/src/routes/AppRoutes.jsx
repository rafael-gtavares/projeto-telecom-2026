import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import MyCourses from '../pages/MyCourses'
import MyProfile from '../pages/MyProfile'
import Admin from '../pages/Admin'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import CheckEmailPage from '../pages/CheckEmailPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/auth/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/meus-cursos" element={<PrivateRoute><MyCourses /></PrivateRoute>} />
      <Route path="/meu-perfil" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roles={['admin', 'professor']}><Admin /></PrivateRoute>} />
      <Route path="/admin/:tab" element={<PrivateRoute roles={['admin', 'professor']}><Admin /></PrivateRoute>} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}

export default AppRoutes