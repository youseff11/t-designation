import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useLogout, useMe, useSetLanguage, useSite } from '@/api/hooks'
import type { Lang } from '@/api/types'
import { applyDocumentLanguage } from '@/i18n'
import { useTheme } from '@/lib/theme'

interface NavItem {
  to: string
  label: string
  active: (path: string) => boolean
}

const under = (prefix: string) => (path: string) => path === prefix || path.startsWith(`${prefix}/`)

/** روابط اللوحة — نفس ترتيب ‎partials/nav.html‎ القديم (الباقات مفعّلة مع الإعدادات كمان). */
const NAV: NavItem[] = [
  { to: '/dashboard', label: 'home', active: (path) => path === '/dashboard' },
  { to: '/dashboard/invitations', label: 'invitations', active: under('/dashboard/invitations') },
  { to: '/dashboard/templates', label: 'templates', active: under('/dashboard/templates') },
  { to: '/dashboard/fonts', label: 'fonts', active: under('/dashboard/fonts') },
  { to: '/dashboard/music', label: 'music', active: under('/dashboard/music') },
  { to: '/dashboard/intros', label: 'intros', active: under('/dashboard/intros') },
  { to: '/dashboard/orders', label: 'orders', active: under('/dashboard/orders') },
  {
    to: '/dashboard/plans',
    label: 'plans',
    active: (path) => under('/dashboard/plans')(path) || under('/dashboard/site')(path),
  },
  { to: '/dashboard/analytics', label: 'analytics', active: under('/dashboard/analytics') },
]

/** ‎window.innerWidth‎ اللي فوقه القائمة بتتقفل لوحدها (زي site.js القديم). */
const DESKTOP_AT = 900

/** الترويسة العائمة بتاعة اللوحة — نفس ‎partials/nav.html‎ مع ‎dash=True‎. */
export function DashboardHeader() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { data: user } = useMe()
  const { data: site } = useSite()
  const logout = useLogout()
  const setLanguage = useSetLanguage()
  const toggleTheme = useTheme((state) => state.toggle)
  const [menuOpen, setMenuOpen] = useState(false)
  const [stuck, setStuck] = useState(false)

  const lang = (i18n.language as Lang) ?? 'ar'
  const next: Lang = lang === 'ar' ? 'en' : 'ar'
  const siteName = site?.name[lang] ?? ''
  const switchTitle = lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'

  // الترويسة بتتقلّص وتاخد ظل لما المستخدم ينزل بالصفحة
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        setStuck(window.scrollY > 12)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // القائمة (الموبايل): Escape وتكبير الشاشة بيقفلوها
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth > DESKTOP_AT) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen])

  function switchLanguage(event: FormEvent) {
    event.preventDefault()
    setLanguage.mutate(next, {
      onSuccess: () => {
        void i18n.changeLanguage(next)
        applyDocumentLanguage(next)
      },
    })
  }

  function signOut(event: FormEvent) {
    event.preventDefault()
    // نخرج من منطقة اللوحة الأول، وإلا الحارس هيرجّعنا لصفحة الدخول بدل الرئيسية
    navigate('/', { replace: true })
    logout.mutate()
  }

  return (
    <>
      <header className={stuck ? 'nav is-stuck' : 'nav'} id="site-nav">
        <div className="nav-shell">
          <Link className="brand" to="/">
            <span className="sr-only">{siteName}</span>
          </Link>

          <nav
            className={menuOpen ? 'nav-links is-open' : 'nav-links'}
            id="nav-menu"
            aria-label={t('dashboard.nav.main')}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
            }}
          >
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className={item.active(pathname) ? 'is-active' : undefined}>
                {t(`dashboard.nav.${item.label}`)}
              </Link>
            ))}
            <a href="/admin/">{t('dashboard.nav.admin')}</a>
            <Link className="nav-only-mobile" to="/">
              {t('dashboard.nav.publicSite')}
            </Link>
            <form className="nav-only-mobile nav-logout-inline" onSubmit={signOut}>
              <button className="btn btn--ghost btn--sm btn--block" type="submit">
                {t('dashboard.nav.logout')} ({user?.username})
              </button>
            </form>
          </nav>

          <div className="nav-tools">
            <form className="lang-form" onSubmit={switchLanguage}>
              <button
                className={setLanguage.isPending ? 'lang-btn is-busy' : 'lang-btn'}
                type="submit"
                title={switchTitle}
                aria-label={switchTitle}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3.5 9.2h17M3.5 14.8h17" />
                  <path d="M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.5-4-9s1.4-6.5 4-9Z" />
                </svg>
                <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
              </button>
            </form>

            <button
              className="icon-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={t('dashboard.nav.theme')}
            >
              <svg
                className="i-sun"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5" />
              </svg>
              <svg
                className="i-moon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8Z" />
              </svg>
            </button>

            <form className="nav-logout" onSubmit={signOut}>
              <button className="btn btn--ghost btn--sm nav-cta" type="submit">
                {t('dashboard.nav.logout')}
              </button>
            </form>

            <button
              className="nav-burger"
              id="nav-burger"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              aria-label={menuOpen ? t('dashboard.nav.closeMenu') : t('dashboard.nav.openMenu')}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div className="nav-scrim" id="nav-scrim" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />
    </>
  )
}
