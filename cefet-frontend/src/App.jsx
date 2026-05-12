import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import ScrollToTop from './components/layout/ScrollToTop'

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
)

export default App
