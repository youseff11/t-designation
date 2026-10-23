import { useTranslation } from 'react-i18next'

import { useSetLanguage } from '@/api/hooks'
import type { Lang } from '@/api/types'
import { applyDocumentLanguage } from '@/i18n'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const setLanguage = useSetLanguage()
  const next: Lang = i18n.language === 'ar' ? 'en' : 'ar'

  function switchLanguage() {
    setLanguage.mutate(next, {
      onSuccess: () => {
        void i18n.changeLanguage(next)
        applyDocumentLanguage(next)
      },
    })
  }

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={switchLanguage}
      disabled={setLanguage.isPending}
      lang={next}
      title={t('nav.language')}
    >
      {next.toUpperCase()}
    </button>
  )
}
