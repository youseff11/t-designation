import { useTranslation } from 'react-i18next'

import { useSite, useTemplates } from '@/api/hooks'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** صفحة تجريبية للمرحلة A: بتثبت إن الـshell والـAPI وi18n شغالين مع بعض. */
export function HomePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'ar' | 'en'
  const { data: site } = useSite()
  const templates = useTemplates()

  useDocumentTitle(site ? `${site.name[lang]} — ${site.tagline[lang]}` : '')

  return (
    <div className="page wrap">
      <section className="hero">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{site?.name[lang]}</h1>
        <p className="muted">{site?.tagline[lang]}</p>
      </section>

      <h2 className="section-title">{t('home.templates')}</h2>
      {templates.isError && <p className="notice notice--error">{t('home.loadError')}</p>}
      {templates.data && templates.data.results.length === 0 && (
        <p className="muted">{t('home.templatesEmpty')}</p>
      )}
      <div className="grid">
        {templates.data?.results.map((tpl) => (
          <article className="card" key={tpl.id}>
            <div
              className="card-cover"
              style={tpl.cover ? { backgroundImage: `url("${tpl.cover}")` } : undefined}
            />
            <div className="card-body">
              <h3>{tpl.displayName}</h3>
              <p className="muted">{tpl.collection}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
