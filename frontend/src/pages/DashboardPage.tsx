import { useTranslation } from 'react-i18next'

import { useMe } from '@/api/hooks'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** مكان مؤقت — صفحات اللوحة بتتنقل في المرحلة B. */
export function DashboardPage() {
  const { t } = useTranslation()
  const { data: user } = useMe()
  useDocumentTitle(t('dashboard.title'))

  return (
    <div className="page wrap">
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome', { name: user?.displayName })}</p>
      <p className="notice">{t('dashboard.soon')}</p>
    </div>
  )
}
