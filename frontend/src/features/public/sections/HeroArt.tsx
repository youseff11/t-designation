import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

/*
 * رسمة الهيرو: «طقم دعوة» كامل مرسوم بالـCSS/SVG من غير صور —
 * قوس ذهبي ورا، فروع ورق شجر بخط رفيع، كارت دعوة ورقي بختم شمع، وموبايل عليه
 * نفس الدعوة إلكترونية (أسماء — العريس فوق والعروسة تحت، تاريخ، عدّاد، زر تأكيد الحضور)، وكروت صغيرة
 * عايمة (تأكيدات الحضور، موسيقى الدعوة). كل الكلام من الترجمة (ar/en)
 * وكله ‎aria-hidden‎ لأنه زينة.
 */

const f = (n: number) => Number(n.toFixed(1))

interface Leaf {
  x: number
  y: number
  angle: number
  size: number
}

/** ورقة على شكل عدسة بعرق في النص، متّجهة ناحية +x ومبدأها (0,0). */
function leafPath(length: number): string {
  const w = length * 0.3
  return (
    `M0 0C${f(length * 0.3)} ${f(-w)} ${f(length * 0.72)} ${f(-w)} ${f(length)} 0` +
    `C${f(length * 0.72)} ${f(w)} ${f(length * 0.3)} ${f(w)} 0 0Z` +
    `M${f(length * 0.08)} 0H${f(length * 0.78)}`
  )
}

/** فرع: ساق منحنية (bezier تربيعي) والورق متبادل على الجنبين وبيصغر ناحية الطرف. */
function makeSprig(length: number, bend: number, count: number, leaf: number) {
  const at = (t: number) => {
    const x = 2 * (1 - t) * t * (length / 2) + t * t * length
    const y = 2 * (1 - t) * t * -bend
    const angle = (Math.atan2(-2 * bend * (1 - 2 * t), length) * 180) / Math.PI
    return { x, y, angle }
  }
  const leaves: Leaf[] = []
  for (let i = 0; i < count; i++) {
    const t = 0.1 + (0.82 * i) / count
    const p = at(t)
    const side = i % 2 ? 1 : -1
    leaves.push({ x: p.x, y: p.y, angle: p.angle + side * 42, size: leaf * (1 - 0.42 * t) })
  }
  const tip = at(1)
  leaves.push({ x: tip.x, y: tip.y, angle: tip.angle, size: leaf * 0.62 })
  const pad = leaf
  return {
    stem: `M0 0Q${f(length / 2)} ${f(-bend)} ${f(length)} 0`,
    leaves,
    berries: [at(0.34), at(0.62)].map((p, i) => ({ x: p.x + (i ? -6 : 7), y: p.y + (i ? 9 : -8) })),
    viewBox: `${-pad} ${f(-bend - pad)} ${f(length + pad * 2)} ${f(bend + pad * 2)}`,
  }
}

const SPRIG_LONG = makeSprig(260, 46, 11, 34)
const SPRIG_SHORT = makeSprig(150, 26, 7, 26)

function Sprig({ kind, className }: { kind: 'long' | 'short'; className: string }) {
  const s = kind === 'long' ? SPRIG_LONG : SPRIG_SHORT
  return (
    <svg className={'wh-sprig ' + className} viewBox={s.viewBox} focusable="false">
      <path className="wh-sprig-stem" d={s.stem} />
      {s.leaves.map((l, i) => (
        <path
          key={i}
          className={i % 3 === 1 ? 'wh-leaf wh-leaf--solid' : 'wh-leaf'}
          d={leafPath(l.size)}
          transform={`translate(${f(l.x)} ${f(l.y)}) rotate(${f(l.angle)})`}
        />
      ))}
      {s.berries.map((b, i) => (
        <circle key={i} className="wh-berry" cx={f(b.x)} cy={f(b.y)} r="3" />
      ))}
    </svg>
  )
}

/** نجمة لمعة رباعية */
function Sparkle({ className }: { className: string }) {
  return (
    <svg className={'wh-spark ' + className} viewBox="0 0 24 24" focusable="false">
      <path d="M12 0C12.9 7.6 16.4 11.1 24 12 16.4 12.9 12.9 16.4 12 24 11.1 16.4 7.6 12.9 0 12 7.6 11.1 11.1 7.6 12 0Z" />
    </svg>
  )
}

/** فاصل صغير: خطين وبينهم معيّن */
function Flourish({ className = '' }: { className?: string }) {
  return (
    <svg className={'wh-flourish ' + className} viewBox="0 0 120 12" focusable="false">
      <path d="M2 6h44M74 6h44" />
      <path className="wh-fill" d="M60 1.5 64.5 6 60 10.5 55.5 6Z" />
      <circle className="wh-fill" cx="50" cy="6" r="1.3" />
      <circle className="wh-fill" cx="70" cy="6" r="1.3" />
    </svg>
  )
}

export function HeroArt() {
  const { t } = useTranslation()
  const a = (key: string) => t(`public.hero.art.${key}`)

  return (
    <div className="wh-stage">
      <span className="wh-halo" />
      <span className="wh-arch-outer" />
      <div className="wh-arch" />
      <Sprig kind="long" className="wh-sprig--a" />
      <Sprig kind="short" className="wh-sprig--b" />
      <Sprig kind="short" className="wh-sprig--c" />

      {/* كارت الدعوة الورقي */}
      <div className="wh-card">
        <div className="wh-card-in">
          <Sprig kind="short" className="wh-card-sprig" />
          <span className="wh-card-pre">{a('invite')}</span>
          <span className="wh-names wh-names--card">
            <b>{a('groom')}</b>
            <i>&amp;</i>
            <b>{a('bride')}</b>
          </span>
          <Flourish className="wh-card-rule" />
          <span className="wh-card-date">{a('dateShort')}</span>
          <span className="wh-card-venue">{a('venue')}</span>
        </div>
        <span className="wh-seal">
          <span>{a('monogram')}</span>
        </span>
      </div>

      {/* الموبايل وعليه الدعوة الإلكترونية */}
      <div className="wh-phone">
        <div className="wh-screen">
          <div className="wh-screen-arch">
            <Sprig kind="short" className="wh-screen-sprig wh-screen-sprig--a" />
            <Sprig kind="short" className="wh-screen-sprig wh-screen-sprig--b" />
            <span className="wh-screen-pre">{a('wedding')}</span>
            <span className="wh-names wh-names--screen">
              <b>{a('groom')}</b>
              <i>&amp;</i>
              <b>{a('bride')}</b>
            </span>
          </div>
          <span className="wh-screen-date">{a('date')}</span>
          <div className="wh-count">
            {(['days', 'hours', 'minutes'] as const).map((unit) => (
              <span key={unit}>
                <b>{a(`${unit}Value`)}</b>
                <small>{a(unit)}</small>
              </span>
            ))}
          </div>
          <span className="wh-screen-venue">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
              <circle cx="12" cy="10" r="2.3" />
            </svg>
            {a('venue')}
          </span>
          <span className="wh-screen-btn">{a('rsvpBtn')}</span>
        </div>
      </div>

      {/* كروت عايمة */}
      <div className="wh-chip wh-chip--rsvp">
        <span className="wh-avatars">
          <i />
          <i />
          <i />
        </span>
        <span className="wh-chip-text">
          <b>{a('rsvpChip')}</b>
          <small>{a('rsvpChipSub')}</small>
        </span>
        <span className="wh-chip-check">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="m5 12.5 4.2 4.2L19 7" />
          </svg>
        </span>
      </div>
      <div className="wh-chip wh-chip--music">
        <span className="wh-chip-play">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M9 18V6l10-2v12" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="16.5" cy="16" r="2.5" />
          </svg>
        </span>
        <span className="wh-chip-text">
          <b>{a('music')}</b>
          <small>{a('musicSub')}</small>
        </span>
        <span className="wh-eq">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>

      <Sparkle className="wh-spark--1" />
      <Sparkle className="wh-spark--2" />
      <Sparkle className="wh-spark--3" />
      <Sparkle className="wh-spark--4" />
    </div>
  )
}

/** بتلات بتنزل ببطء في الهيرو كله: المكان الأفقي (٪)، المدة والتأخير (ث)، المقاس (px)، الميلان واللون. */
const PETALS: { x: number; d: number; delay: number; s: number; sway: number; rose?: boolean }[] = [
  { x: 4, d: 17, delay: -3, s: 13, sway: 40 },
  { x: 13, d: 21, delay: -11, s: 10, sway: -30, rose: true },
  { x: 24, d: 18, delay: -7, s: 15, sway: 50 },
  { x: 33, d: 23, delay: -16, s: 9, sway: -45 },
  { x: 44, d: 19, delay: -1, s: 12, sway: 35, rose: true },
  { x: 52, d: 24, delay: -13, s: 10, sway: -40 },
  { x: 63, d: 20, delay: -5, s: 14, sway: 45 },
  { x: 74, d: 22, delay: -18, s: 11, sway: -35, rose: true },
  { x: 85, d: 18, delay: -9, s: 13, sway: 30 },
  { x: 95, d: 25, delay: -14, s: 9, sway: -50 },
]

/**
 * خلفية الهيرو كله (ورا الكلام والرسمة): توهّج، دواير ذهبي رفيعة بتلف ببطء ورا الكلام،
 * فروع ورق في ركن البداية فوق وتحت، لمعات صغيرة، وبتلات بتنزل.
 */
export function HeroBackdrop() {
  return (
    <div className="wh-bg" aria-hidden="true">
      <span className="wh-ring wh-ring--a" />
      <span className="wh-ring wh-ring--b" />
      <span className="wh-corner wh-corner--top">
        <Sprig kind="long" className="wh-corner-sprig" />
      </span>
      <span className="wh-corner wh-corner--bottom">
        <Sprig kind="short" className="wh-corner-sprig" />
      </span>
      <Sparkle className="wh-dust wh-dust--1" />
      <Sparkle className="wh-dust wh-dust--2" />
      <Sparkle className="wh-dust wh-dust--3" />
      <Sparkle className="wh-dust wh-dust--4" />
      <Sparkle className="wh-dust wh-dust--5" />
      {PETALS.map((p, i) => (
        <i
          key={i}
          className={'wh-petal' + (p.rose ? ' wh-petal--rose' : '')}
          style={
            {
              '--x': `${p.x}%`,
              '--d': `${p.d}s`,
              '--delay': `${p.delay}s`,
              '--s': `${p.s}px`,
              '--sway': `${p.sway}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export { Flourish }
