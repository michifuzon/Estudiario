import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { NAV_ITEMS } from '@/app/nav'

export function Sidebar() {
  return (
    <aside className="safe-top hidden w-64 shrink-0 flex-col border-r border-border/70 bg-surface px-6 py-8 sm:flex">
      <div className="mb-10 flex items-center gap-3">
        <img src="/logo-mark.png" alt="" className="h-9 w-9 object-contain" />
        <span className="text-lg font-extrabold tracking-tight text-ink">Estudiario</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-medium',
                  isActive
                    ? 'bg-accent text-white shadow-[var(--shadow-sm)]'
                    : 'text-muted hover:bg-surface-raised hover:text-ink',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  )
}
