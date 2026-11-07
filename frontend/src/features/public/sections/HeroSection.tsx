import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { HeroInfo } from '@/api/types'

import { useLang } from '../text'
import { useHeroIdle } from '../useHeroIdle'
import { Flourish, HeroArt, HeroBackdrop } from './HeroArt'

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

/**
 * خطوط الأسماء في رسمة الهيرو (خط رقعة للعربي وخط يد للإنجليزي): بتتحمّل مرة واحدة
 * بس لما الرئيسية تفتح، مش في كل صفحات الموقع. لو ماوصلتش الأسماء بتترسم بخط العناوين.
 */
const SCRIPT_FONTS = 'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Pinyon+Script&display=swap'
function useScriptFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${SCRIPT_FONTS}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = SCRIPT_FONTS
    document.head.appendChild(link)
  }, [])
}

export function HeroSection({ plansPublic, hero }: { plansPublic: boolean; hero?: HeroInfo }) {
  const { t } = useTranslation()
  const lang = useLang()
  const ref = useRef<HTMLElement>(null)
  const idle = useHeroIdle(ref)
  useScriptFonts()
  // أي حقل فاضي في اللوحة بيرجع للنص الافتراضي المترجم
  const custom = hero?.text[lang]
  const text = (value: string | undefined, key: string) => value?.trim() || t(`public.hero.${key}`)
  const imagesCss = heroImagesCss(hero?.images)
  const top = custom?.top?.trim()

  return (
    <section ref={ref} className={'hero wh' + (idle ? ' is-idle' : '')}>
      {imagesCss && <style>{imagesCss}</style>}
      <HeroBackdrop />
      <div className="wrap wh-grid">
        <div className="wh-copy" data-reveal>
          {/* السطر الصغير فوق العنوان: من اللوحة لو متكتب، وإلا وصف ثابت للموقع */}
          {!top && (
            <p className="wh-kicker">
              <Flourish className="wh-kicker-orn" />
              <span>{t('public.hero.kicker')}</span>
            </p>
          )}
          <h1>
            {top && (
              <span className="h1-top wh-kicker">
                <Flourish className="wh-kicker-orn" />
                <span>{top}</span>
              </span>
            )}
            <span className="h1-main">{text(custom?.main, 'main')}</span>
          </h1>
          <Flourish className="wh-rule" />
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
          {/* توقيع صغير مكان شريط الأرقام القديم */}
          <p className="wh-sign">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
            </svg>
            <span>{t('public.hero.signedBy')}</span>
            <b dir="ltr">T DESIGNATION</b>
          </p>
        </div>
        <div className="wh-art" aria-hidden="true">
          <HeroArt />
        </div>
      </div>
    </section>
  )
}
