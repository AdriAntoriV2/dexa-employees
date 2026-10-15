import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="attendance" element={<PlaceholderPage title="Attendance" />} />
          <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
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
