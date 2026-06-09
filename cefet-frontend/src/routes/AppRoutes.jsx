import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerificarPendente from '../pages/VerificarPendente'
import VerificarEmail from '../pages/VerificarEmail'
import EsqueciSenha from '../pages/EsqueciSenha'
import RedefinirSenha from '../pages/RedefinirSenha'
import MyCourses from '../pages/MyCourses'
import MyProfile from '../pages/MyProfile'
import Admin from '../pages/Admin'
import AdminCourse from '../pages/AdminCourse'
import StudentCourse from '../pages/StudentCourse'
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/cadastro" element={<Register />} />
    <Route path="/meus-cursos" element={<PrivateRoute><MyCourses /></PrivateRoute>} />
    <Route path="/meu-perfil" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
    <Route path="/admin" element={<PrivateRoute roles={['admin', 'professor']}><Admin /></PrivateRoute>} />
    <Route path="/admin/:tab" element={<PrivateRoute roles={['admin', 'professor']}><Admin /></PrivateRoute>} />
    <Route path="/admin/curso/:courseId" element={<PrivateRoute roles={['admin', 'professor']}><AdminCourse /></PrivateRoute>} />
    <Route path="/meu-curso/:courseId" element={<PrivateRoute><StudentCourse /></PrivateRoute>} />
    <Route path="/verificar-pendente" element={<VerificarPendente />} />
    <Route path="/verificar-email" element={<VerificarEmail />} />
    <Route path="/esqueci-senha" element={<EsqueciSenha />} />
    <Route path="/redefinir-senha" element={<RedefinirSenha />} />
    <Route path="*" element={<Home />} />
  </Routes>
)

export default AppRoutes

