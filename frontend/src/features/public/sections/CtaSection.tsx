import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { SiteInfo } from '@/api/types'

/**
 * قسم «يلا نعمل دعوتك»: كارت زجاج غامق بإطار متدرّج بيلف حواليه، وظرف دعوة
 * بيتفتح وبيطلع منه كارت، وحلقات وهج ولمعات بتطير. زرار واتساب (أو إيميل لو
 * مفيش واتساب) وزرار تاني للتصميمات.
 */
export function CtaSection({ site }: { site: SiteInfo }) {
  const { t } = useTranslation()
  const label = t('public.cta.button')
  const href = site.whatsapp.url || (site.email ? `mailto:${site.email}` : '')
  return (
    <section className="section home-cta finale" id="contact">
      <div className="wrap">
        <div className="finale-card" data-reveal>
          <div className="finale-aura" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="finale-sparks" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ '--n': i } as CSSProperties} />
            ))}
          </div>

          <div className="finale-copy">
            <p className="eyebrow">{t('public.cta.eyebrow')}</p>
            <h2>{t('public.cta.title')}</h2>
            <p className="finale-sub">{t('public.cta.sub')}</p>
            <div className="finale-actions">
              {href && (
                <a
                  className="btn btn--gold btn--lg finale-wa"
                  href={href}
                  {...(site.whatsapp.url ? { target: '_blank', rel: 'noopener' } : {})}
                >
                  {site.whatsapp.url && (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1Z" />
                    </svg>
                  )}
                  <span>{label}</span>
                </a>
              )}
              <Link className="btn btn--outline btn--lg" to="/templates">
                <span>{t('public.cta.browse')}</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13m0 0-5-5m5 5-5 5" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="finale-art" aria-hidden="true">
            <div className="finale-env">
              <span className="finale-env-back" />
              <span className="finale-letter">
                <b>{t('public.cta.title')}</b>
                <i />
                <i />
              </span>
              <span className="finale-env-front" />
              <span className="finale-env-flap" />
              <span className="finale-seal" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
