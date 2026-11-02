import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { HeroInfo } from '@/api/types'

import { useLang } from '../text'

/** خلفيات الهيرو المخصّصة: نفس تدرّج الـselectors في public.css (والأحدث في الترتيب بيكسب) */
function heroImagesCss(images: HeroInfo['images'] | undefined): string {
  if (!images) return ''
  const rule = (selector: string, url: string) => (url ? `${selector}{--hero-img:url("${encodeURI(url)}")}` : '')
  return [
    rule('.hero-art', images.lightAr),
    rule('html[lang="en"] .hero-art', images.lightEn),
    rule('[data-theme="dark"] .hero-art', images.darkAr),
    rule('html[lang="en"][data-theme="dark"] .hero-art', images.darkEn),
  ].join('')
}

export function HeroSection({ plansPublic, hero }: { plansPublic: boolean; hero?: HeroInfo }) {
  const { t } = useTranslation()
  const lang = useLang()
  // أي حقل فاضي في اللوحة بيرجع للنص الافتراضي المترجم
  const custom = hero?.text[lang]
  const text = (value: string | undefined, key: string) => value?.trim() || t(`public.hero.${key}`)
  const trust = ['templates', 'delivery', 'editable'].map((name, index) => ({
    value: custom?.trust[index]?.value?.trim() || t(`public.hero.trust.${name}Value`),
    label: custom?.trust[index]?.label?.trim() || t(`public.hero.trust.${name}Label`),
  }))
  const imagesCss = heroImagesCss(hero?.images)

  return (
    <section className="hero">
      {imagesCss && <style>{imagesCss}</style>}
      {/* رسمة بالـCSS بس: موبايل عليه دعوة وحواليه كروت (تأكيد حضور، ضيوف، تاريخ) */}
      <div className="hero-art" aria-hidden="true">
        <div className="hero-stage">
          <span className="hero-ring hero-ring--outer" />
          <span className="hero-ring hero-ring--inner" />
          <div className="hero-phone">
            <div className="hero-screen">
              <i className="hs-bar hs-bar--eyebrow" />
              <span className="hs-mono">&amp;</span>
              <i className="hs-bar hs-bar--name" />
              <i className="hs-bar hs-bar--name2" />
              <i className="hs-rule" />
              <span className="hs-date">
                <i />
                <i />
                <i />
              </span>
              <i className="hs-bar hs-bar--place" />
              <i className="hs-bar hs-bar--place2" />
              <i className="hs-btn" />
            </div>
          </div>
          <div className="hero-chip hero-chip--guests">
            <span className="hero-avatars">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="hero-chip-lines">
              <i />
              <i />
            </span>
          </div>
          <div className="hero-chip hero-chip--rsvp">
            <span className="hero-chip-ic">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="m5 12.5 4.2 4.2L19 7" />
              </svg>
            </span>
            <span className="hero-chip-lines">
              <i />
              <i />
            </span>
          </div>
          <div className="hero-chip hero-chip--date">
            <b />
          </div>
        </div>
      </div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <div className="hero-copy-in" data-reveal>
            <h1>
              {custom?.top?.trim() && <span className="h1-top">{custom.top}</span>}
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
            {/* القيمة جوّه ‎<span>‎ جوّه ‎<b>‎ زي الموقع القديم (وسم ‎bi‎ بيطبع span) — قاعدة
                ‎.hero-trust span‎ بتصغّرها وتخليها رمادي، ودي الصورة الفعلية في القديم. */}
            <ul className="hero-trust" aria-hidden="true">
              {trust.map((item, index) => (
                <li key={index}>
                  <b>
                    <span>{item.value}</span>
                  </b>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
