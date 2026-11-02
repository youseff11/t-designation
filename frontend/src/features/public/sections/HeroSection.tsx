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

/** أقواس متداخلة (شباك الدعوة / قوس القاعة) بخطوط رفيعة وشمس صغيرة جوّاها */
function DecoArches({ className }: { className: string }) {
  return (
    <svg className={'hero-deco-arch ' + className} viewBox="0 0 300 400" focusable="false">
      <path d="M20 400V150a130 130 0 0 1 260 0v250" />
      <path d="M60 400V152a90 90 0 0 1 180 0v248" />
      <path d="M100 400V154a50 50 0 0 1 100 0v246" />
      <circle className="hero-deco-fill" cx="150" cy="154" r="9" />
    </svg>
  )
}

/** حلقتين متقاطعتين (خاتمين) */
function DecoRings({ className }: { className: string }) {
  return (
    <svg className={'hero-deco-rings ' + className} viewBox="0 0 200 120" focusable="false">
      <circle cx="72" cy="60" r="50" />
      <circle cx="128" cy="60" r="50" />
      <circle className="hero-deco-fill" cx="100" cy="60" r="4" />
    </svg>
  )
}

/** خطين متموّجين */
function DecoWave({ className }: { className: string }) {
  return (
    <svg className={'hero-deco-wave ' + className} viewBox="0 0 160 40" focusable="false">
      <path d="M0 12q10-12 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" />
      <path d="M0 30q10-12 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" />
    </svg>
  )
}

/** علامات صغيرة متناثرة بتطفو: زائد، حلقة، مربع مائل، نقطة */
function DecoMark({ kind, className }: { kind: 'plus' | 'ring' | 'diamond' | 'dot'; className: string }) {
  return (
    <svg className={`hero-deco-mark hero-deco-mark--${kind} ${className}`} viewBox="0 0 24 24" focusable="false">
      {kind === 'plus' && <path d="M12 4v16M4 12h16" />}
      {kind === 'ring' && <circle cx="12" cy="12" r="8" />}
      {kind === 'diamond' && <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" />}
      {kind === 'dot' && <circle className="hero-deco-fill" cx="12" cy="12" r="6" />}
    </svg>
  )
}

/** زخارف المساحة الفاضية في الهيرو: أقواس، خاتمين، موجة، نقط وعلامات صغيرة — كلها SVG/CSS بلا صور. */
function HeroDeco() {
  return (
    <div className="hero-deco">
      <DecoArches className="hero-deco-arch--a" />
      <DecoRings className="hero-deco-rings--a" />
      <DecoWave className="hero-deco-wave--a" />
      <i className="hero-deco-dots hero-deco-dots--a" />
      <i className="hero-deco-dots hero-deco-dots--b" />
      <DecoMark kind="plus" className="hero-deco-mark--1" />
      <DecoMark kind="ring" className="hero-deco-mark--2" />
      <DecoMark kind="diamond" className="hero-deco-mark--3" />
      <DecoMark kind="plus" className="hero-deco-mark--4" />
      <DecoMark kind="dot" className="hero-deco-mark--5" />
      <DecoMark kind="ring" className="hero-deco-mark--6" />
    </div>
  )
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
        <HeroDeco />
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
