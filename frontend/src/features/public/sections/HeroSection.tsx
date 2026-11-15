import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { HeroInfo } from '@/api/types'

import { useLang } from '../text'
import { useHeroIdle } from '../useHeroIdle'

/** خلفيات الهيرو المخصّصة من اللوحة: نفس الـselectors في public.css (والأحدث في الترتيب بيكسب) */
function heroImagesCss(images: HeroInfo['images'] | undefined): string {
  if (!images) return ''
  const rule = (selector: string, url: string) => (url ? `${selector}{--hero-img:url("${encodeURI(url)}")}` : '')
  return [
    rule('.nx-media', images.lightAr),
    rule('html[lang="en"] .nx-media', images.lightEn),
  ].join('')
}

/** الشريط اللي بيلف تحت الهيرو: مميزات الدعوة في كلمتين */
const TICKER = ['link', 'rsvp', 'qr', 'music', 'countdown', 'maps', 'gallery'] as const

/**
 * الهيرو بالهوية «نيون»: صورة دعوة زفاف (مولّدة بـGoogle Flow) بعرض الشاشة كلها،
 * فوقها تدرّج حبر من ناحية الكلام، ووهج فسفوري، وكروت زجاج صغيرة، وشريط مميزات بيلف.
 * الهيرو غامق في المظهرين عن قصد عشان النيون يلمع.
 */
export function HeroSection({ plansPublic, hero }: { plansPublic: boolean; hero?: HeroInfo }) {
  const { t } = useTranslation()
  const lang = useLang()
  const ref = useRef<HTMLElement>(null)
  const idle = useHeroIdle(ref)
  // أي حقل فاضي في اللوحة بيرجع للنص الافتراضي المترجم
  const custom = hero?.text[lang]
  const text = (value: string | undefined, key: string) => value?.trim() || t(`public.hero.${key}`)
  const imagesCss = heroImagesCss(hero?.images)
  const top = custom?.top?.trim()
  const ticker = TICKER.map((key) => t(`public.hero.ticker.${key}`))

  return (
    <section ref={ref} className={'hero nx' + (idle ? ' is-idle' : '')}>
      {imagesCss && <style>{imagesCss}</style>}
      <div className="nx-media" role="img" aria-label={t('public.hero.alt')} />
      <div className="nx-veil" aria-hidden="true" />
      <div className="nx-glow nx-glow--a" aria-hidden="true" />
      <div className="nx-glow nx-glow--b" aria-hidden="true" />

      <div className="wrap nx-grid">
        <div className="nx-copy" data-reveal>
          {/* السطر الصغير فوق العنوان: من اللوحة لو متكتب، وإلا وصف ثابت للموقع */}
          {!top && (
            <p className="nx-kicker">
              <i aria-hidden="true" />
              <span>{t('public.hero.kicker')}</span>
            </p>
          )}
          <h1>
            {top && (
              <span className="h1-top nx-kicker">
                <i aria-hidden="true" />
                <span>{top}</span>
              </span>
            )}
            <span className="h1-main">{text(custom?.main, 'main')}</span>
          </h1>
          <p className="hero-sub">{text(custom?.sub, 'sub')}</p>
          <div className="hero-actions">
            <Link className="btn btn--gold btn--lg" to="/templates">
              <span>{text(custom?.cta, 'start')}</span>
              <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h13m0 0-5-5m5 5-5 5" />
              </svg>
            </Link>
            {plansPublic && (
              <Link className="btn btn--outline btn--lg" to={{ pathname: '/', hash: '#plans' }}>
                <span>{text(custom?.plans, 'plans')}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="nx-chips" aria-hidden="true">
          <div className="nx-chip nx-chip--rsvp">
            <span className="nx-chip-dot">
              <svg viewBox="0 0 24 24">
                <path d="m6 12.5 4 4 8-9" />
              </svg>
            </span>
            <span className="nx-chip-text">
              <b>{t('public.hero.art.rsvpChip')}</b>
              <small>{t('public.hero.art.rsvpChipSub')}</small>
            </span>
          </div>
          <div className="nx-chip nx-chip--music">
            <span className="nx-eq">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="nx-chip-text">
              <b>{t('public.hero.art.music')}</b>
              <small>{t('public.hero.art.musicSub')}</small>
            </span>
          </div>
        </div>
      </div>

      <div className="nx-ticker" aria-hidden="true">
        <div className="nx-ticker-track">
          {[0, 1].map((copy) => (
            <span className="nx-ticker-set" key={copy}>
              {ticker.map((word) => (
                <span key={word}>
                  {word}
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2c.6 4.8 2.2 7.4 10 10-7.8 2.6-9.4 5.2-10 10-.6-4.8-2.2-7.4-10-10 7.8-2.6 9.4-5.2 10-10Z" />
                  </svg>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
