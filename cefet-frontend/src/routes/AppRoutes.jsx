import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import ErrorBoundary from '../components/ErrorBoundary'
import { ROLES } from '../constants/roles'

// Páginas públicas leves — carregadas no bundle inicial
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerificarPendente from '../pages/VerificarPendente'
import VerificarEmail from '../pages/VerificarEmail'
import EsqueciSenha from '../pages/EsqueciSenha'
import RedefinirSenha from '../pages/RedefinirSenha'

// Páginas pesadas (área logada / dashboard com gráficos) — carregadas sob demanda
const MyCourses = lazy(() => import('../pages/MyCourses'))
const MyProfile = lazy(() => import('../pages/MyProfile'))
const Admin = lazy(() => import('../pages/Admin'))
const AdminCourse = lazy(() => import('../pages/AdminCourse'))
const StudentCourse = lazy(() => import('../pages/StudentCourse'))

// Spinner de transição enquanto o chunk da página é baixado
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

const AppRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/meus-cursos" element={<PrivateRoute><MyCourses /></PrivateRoute>} />
        <Route path="/meu-perfil" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute minRole={ROLES.PROFESSOR}><Admin /></PrivateRoute>} />
        <Route path="/admin/:tab" element={<PrivateRoute minRole={ROLES.PROFESSOR}><Admin /></PrivateRoute>} />
        <Route path="/admin/curso/:courseId" element={<PrivateRoute minRole={ROLES.PROFESSOR}><AdminCourse /></PrivateRoute>} />
        <Route path="/meu-curso/:courseId" element={<PrivateRoute><StudentCourse /></PrivateRoute>} />
        <Route path="/verificar-pendente" element={<VerificarPendente />} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
)

export default AppRoutes
