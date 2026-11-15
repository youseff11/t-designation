import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type Key = 'countdown' | 'gallery' | 'rsvp' | 'whatsapp' | 'music' | 'maps' | 'qr' | 'calendar' | 'venueQr'

const ICONS: Record<Key, ReactNode> = {
  countdown: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  gallery: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m5 17 4.5-4 3 2.5 2-2 4.5 3.5" />
    </>
  ),
  rsvp: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12 2.5 2.5L16.5 9" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20 4 4.5 10.2c-.8.3-.8 1.4 0 1.7l5.1 1.9 1.9 5.1c.3.8 1.4.8 1.7 0L20 4Z" />
      <path d="m9.7 13.8 4.2-4.2" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  maps: (
    <>
      <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <path d="M14 14h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z" />
    </>
  ),
  calendar: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h3" />
    </>
  ),
  venueQr: (
    <>
      <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z" />
    </>
  ),
}

/** ترتيب الكروت في الشبكة (المساحات متحددة في الـCSS بالاسم) */
const ORDER: Key[] = ['countdown', 'rsvp', 'music', 'gallery', 'whatsapp', 'qr', 'maps', 'calendar', 'venueQr']

/** عدّاد حقيقي بيعدّ لفرح بعد ٤٧ يوم من فتح الصفحة */
function useCountdown(): number[] {
  const [target] = useState(() => Date.now() + (47 * 24 + 12) * 3600e3 + 8 * 60e3)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor((target - now) / 1000))
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]
}

function Countdown() {
  const { t } = useTranslation()
  const parts = useCountdown()
  const units = ['days', 'hours', 'minutes', 'seconds'] as const
  return (
    <div className="lux-clock" aria-hidden="true">
      {parts.map((value, i) => (
        <span key={units[i]} className="lux-clock-cell">
          <b>{String(value).padStart(2, '0')}</b>
          <small>{t(`public.features.mini.${units[i]}`)}</small>
        </span>
      ))}
    </div>
  )
}

function Rsvp() {
  const { t } = useTranslation()
  return (
    <div className="lux-rsvp" aria-hidden="true">
      <svg className="lux-ring" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="50" pathLength="100" />
      </svg>
      <span className="lux-ring-label">
        <b>128</b>
        <small>{t('public.features.mini.coming')}</small>
      </span>
      <span className="lux-faces">
        {['م', 'س', 'ن', 'ع'].map((letter) => (
          <i key={letter}>{letter}</i>
        ))}
        <i>+</i>
      </span>
    </div>
  )
}

function Route() {
  return (
    <svg className="lux-route" viewBox="0 0 300 90" aria-hidden="true">
      <path d="M10 70 C 60 70, 70 20, 120 30 S 190 80, 230 50 S 270 20, 285 22" />
      <circle cx="10" cy="70" r="5" />
      <g transform="translate(285 22)">
        <path d="M0 0c0-9 7-14 7-20a7 7 0 1 0-14 0c0 6 7 11 7 20Z" />
      </g>
    </svg>
  )
}

function Equalizer() {
  return (
    <span className="lux-eq" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${-i * 0.17}s` }} />
      ))}
    </span>
  )
}

const MINI: Partial<Record<Key, () => ReactNode>> = {
  countdown: () => <Countdown />,
  rsvp: () => <Rsvp />,
  maps: () => <Route />,
  music: () => <Equalizer />,
}

/**
 * «كل حاجة في مكانها»: شبكة بينتو فخمة. كروت بإطار شعرة متدرّج (تركواز ← دهبي)،
 * أكبرهم فيهم معاينة حيّة (عدّاد بيعدّ، حلقة تأكيد الحضور، سكة اللوكيشن، مزيكا)،
 * ونور خفيف بيمشي مع الماوس فوق الكارت.
 */
export function FeaturesSection() {
  const { t } = useTranslation()

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.lux-card')
    if (!card) return
    const box = card.getBoundingClientRect()
    card.style.setProperty('--x', `${e.clientX - box.left}px`)
    card.style.setProperty('--y', `${e.clientY - box.top}px`)
  }

  return (
    <section className="section section--features lux" id="features">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{t('public.features.eyebrow')}</p>
          <h2>{t('public.features.title')}</h2>
          <p>{t('public.features.sub')}</p>
        </div>
        <div className="lux-grid" onPointerMove={onMove}>
          {ORDER.map((key) => {
            const mini = MINI[key]
            return (
              <article key={key} className={`lux-card lux-card--${key}`} data-reveal data-reveal-stagger>
                <span className="lux-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {ICONS[key]}
                  </svg>
                </span>
                <div className="lux-text">
                  <h3>{t(`public.features.${key}.title`)}</h3>
                  <p>{t(`public.features.${key}.text`)}</p>
                </div>
                {mini && <div className="lux-mini">{mini()}</div>}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
