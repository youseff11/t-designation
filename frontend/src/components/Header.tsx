import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import { useLogout, useMe, useSite } from '@/api/hooks'
import { LanguageSwitch } from './LanguageSwitch'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const { t, i18n } = useTranslation()
  const { data: user } = useMe()
  const { data: site } = useSite()
  const logout = useLogout()
  const siteName = site?.name[i18n.language as 'ar' | 'en'] ?? ''

  return (
    <header className="nav">
      <div className="nav-shell">
        <Link to="/" className="brand" aria-label={siteName}>
          <span className="visually-hidden">{siteName}</span>
        </Link>
        <nav className="nav-links" aria-label="main">
          <NavLink to="/" end className="nav-link">
            {t('nav.home')}
          </NavLink>
          {user?.isStaff && (
            <NavLink to="/dashboard" className="nav-link">
              {t('nav.dashboard')}
            </NavLink>
          )}
          {user ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              {t('nav.logout')}
            </button>
          ) : (
            <Link to="/login" className="btn btn--gold btn--sm">
              {t('nav.login')}
            </Link>
          )}
          <LanguageSwitch />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
