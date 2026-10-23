import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ShootingStars, StarField } from '../fx'
import { useHeroIdle } from '../useHeroIdle'

export function HeroSection({ plansPublic }: { plansPublic: boolean }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLElement>(null)
  const idle = useHeroIdle(ref)

  return (
    <section className="hero" ref={ref}>
      <div className="hero-art">
        <span className="sr-only">{t('public.hero.alt')}</span>
        {/* نجوم بتقع فوق صورة الهيرو + شهاب بيعدّي كل شوية. جوّه ‎.hero-art‎ عن
            قصد: على التليفون الكلام بينزل تحت الصورة، فكده المؤثرات تفضل على
            الصورة بس ومتعديش على النص. */}
        <StarField className="hero-sparks" count={30} idle={idle} />
        <ShootingStars idle={idle} />
      </div>
      <div className="hero-copy">
        <div className="hero-copy-in" data-reveal>
          <span className="orn orn--crown" aria-hidden="true">
            <svg viewBox="0 0 180 34" focusable="false">
              <path d="M14 26c22 0 40-6 55-16" />
              <path d="M166 26c-22 0-40-6-55-16" />
              <path d="M42 26c14 0 26-4 36-10" />
              <path d="M138 26c-14 0-26-4-36-10" />
              <path
                className="orn-fill"
                d="M90 2c1.7 5.4 4.6 8.3 10 10-5.4 1.7-8.3 4.6-10 10-1.7-5.4-4.6-8.3-10-10 5.4-1.7 8.3-4.6 10-10Z"
              />
              <circle className="orn-fill" cx="11" cy="26" r="1.7" />
              <circle className="orn-fill" cx="169" cy="26" r="1.7" />
            </svg>
          </span>
          <h1>
            <span className="h1-top">{t('public.hero.top')}</span>
            <span className="h1-main">{t('public.hero.main')}</span>
          </h1>
          <div className="hero-rule" aria-hidden="true">
            <i />
            <svg className="orn-diamond" viewBox="0 0 34 18" focusable="false">
              <path
                d="M17 1c1.6 5.2 5 8 11 8-6 0-9.4 2.8-11 8-1.6-5.2-5-8-11-8 6 0 9.4-2.8 11-8Z"
                className="orn-fill"
              />
            </svg>
            <i />
          </div>
          <p className="hero-sub">{t('public.hero.sub')}</p>
          <div className="hero-actions">
            <Link className="btn btn--gold btn--lg btn--shine" to="/templates">
              <span>{t('public.hero.start')}</span>
              <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h13m0 0-5-5m5 5-5 5" />
              </svg>
            </Link>
            {plansPublic && (
              <Link className="btn btn--outline btn--lg" to={{ pathname: '/', hash: '#plans' }}>
                <span>{t('public.hero.plans')}</span>
              </Link>
            )}
          </div>
          {/* القيمة جوّه ‎<span>‎ جوّه ‎<b>‎ زي الموقع القديم (وسم ‎bi‎ بيطبع span) — قاعدة
              ‎.hero-trust span‎ بتصغّرها وتخليها رمادي، ودي الصورة الفعلية في القديم. */}
          <ul className="hero-trust" aria-hidden="true">
            <li>
              <b>
                <span>{t('public.hero.trust.templatesValue')}</span>
              </b>
              <span>{t('public.hero.trust.templatesLabel')}</span>
            </li>
            <li>
              <b>
                <span>{t('public.hero.trust.deliveryValue')}</span>
              </b>
              <span>{t('public.hero.trust.deliveryLabel')}</span>
            </li>
            <li>
              <b>
                <span>{t('public.hero.trust.editableValue')}</span>
              </b>
              <span>{t('public.hero.trust.editableLabel')}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
