import { NavLink, useNavigate } from 'react-router-dom'
import {
  Clock3,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Attendance', to: '/attendance', icon: Clock3 },
  { label: 'My Profile', to: '/profile', icon: UserRound },
]

export function Sidebar() {
  const { logout, employee } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Dexa home">
        <span className="brand-mark">D</span>
        <span>Dexa</span>
      </a>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="navigation" aria-label="Main navigation">
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-account">
        {employee && (
          <div className="sidebar-identity">
            <span className="sidebar-identity-name">
              {employee.fullName}
            </span>
            <span className="sidebar-identity-role">
              {employee.role === 'HR' ? 'HR account' : 'Employee account'}
            </span>
          </div>
        )}

        <button
          className="sidebar-logout"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <span className="status-dot" />
        Employee workspace
      </div>
    </aside>
  )
}
