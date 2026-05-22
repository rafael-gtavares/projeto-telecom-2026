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

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/cadastro" element={<Register />} />
    <Route path="/meus-cursos" element={<PrivateRoute><MyCourses /></PrivateRoute>} />
    <Route path="/meu-perfil" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
    <Route path="/admin" element={<PrivateRoute roles={['admin', 'professor']}><Admin /></PrivateRoute>} />
    <Route path="/admin/:tab" element={<PrivateRoute roles={['admin', 'professor']}><Admin /></PrivateRoute>} />
    <Route path="*" element={<Home />} />
    <Route path="/auth/verify-email/:token" element={<VerifyEmailPage />} />
    <Route path="/check-email" element={<CheckEmailPage />}/>
  </Routes>
)

export default AppRoutes
