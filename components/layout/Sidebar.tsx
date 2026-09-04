'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Calendar, BookOpen, Target, Brain,
  Code2, Map, BarChart3, Users, Settings, LogOut,
  Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Today', href: '/today', icon: Calendar },
  { label: 'Subjects', href: '/subjects', icon: BookOpen },
  { label: 'GATE', href: '/gate', icon: Target },
  { label: 'ML Track', href: '/ml', icon: Brain },
  { label: 'DSA', href: '/dsa', icon: Code2 },
  { label: 'Career', href: '/career', icon: Map },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Shared', href: '/shared', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  userName: string
  userId: string
}

export default function Sidebar({ userName, userId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isShivraj = userName === 'Shivraj'
  const accentColor = isShivraj ? '#6c63ff' : '#00d4aa'
  const initials = isShivraj ? 'SJ' : 'MP'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">Engineering OS</div>
            <div className="sidebar-logo-sub">v2.0 — Adaptive</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {NAV_ITEMS.slice(0, 3).map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button
              key={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
              id={`nav-${item.href.slice(1)}`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}

        <div className="nav-section-label">Study</div>
        {NAV_ITEMS.slice(3, 7).map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
              id={`nav-${item.href.slice(1)}`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}

        <div className="nav-section-label">Insights</div>
        {NAV_ITEMS.slice(7).map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
              id={`nav-${item.href.slice(1)}`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User info */}
      <div className="sidebar-user">
        <div
          className="user-avatar"
          style={{ background: `linear-gradient(135deg, ${accentColor}aa, ${accentColor})` }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-info-name">{userName}</div>
          <div className="user-info-role">CS Engineer</div>
        </div>
        <button
          className="btn-icon btn btn-secondary"
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Sign out"
          id="sign-out-btn"
          style={{ flexShrink: 0 }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
