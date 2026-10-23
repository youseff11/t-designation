import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'

import { Header } from './Header'

export function Layout() {
  const { t } = useTranslation()
  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
    </>
  )
}
