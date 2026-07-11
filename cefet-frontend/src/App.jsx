import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { NotificationProvider } from './context/NotificationProvider'
import AppRoutes from './routes/AppRoutes'
import ScrollToTop from './components/layout/ScrollToTop'
import VisitLogger from './components/usage/VisitLogger'

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <VisitLogger />
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
