import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="text-sm font-medium tracking-wide text-foreground">
            BoltAssignment
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/register"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              Register
            </NavLink>
            <NavLink
              to="/checkout"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              Checkout
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  )
}
