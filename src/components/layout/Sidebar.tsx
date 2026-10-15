import { NavLink } from 'react-router-dom'
import {
  Clock3,
  LayoutDashboard,
  UserRound,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Attendance', to: '/attendance', icon: Clock3 },
  { label: 'My Profile', to: '/profile', icon: UserRound },
]

export function Sidebar() {
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

      <div className="sidebar-footer">
        <span className="status-dot" />
        Employee workspace
      </div>
    </aside>
  )
}
