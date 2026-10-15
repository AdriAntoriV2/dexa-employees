import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="attendance"
              element={<PlaceholderPage title="Attendance" />}
            />
            <Route
              path="profile"
              element={<PlaceholderPage title="My Profile" />}
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="setup-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EMPLOYEE PORTAL</p>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="setup-card">
        <div className="setup-copy">
          <h3>Coming in a future feature chunk</h3>
          <p>This page will be implemented separately.</p>
        </div>
        <span className="setup-status pending">Planned</span>
      </div>
    </section>
  )
}

export default App
