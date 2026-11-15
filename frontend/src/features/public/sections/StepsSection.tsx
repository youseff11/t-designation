import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

const STEPS = ['pick', 'send', 'design', 'link'] as const

/** أيقونة لكل خطوة (خطوط بس، بتاخد لون النص) */
const ICONS: Record<(typeof STEPS)[number], string> = {
  pick: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z',
  design: 'm14 4 6 6M3 21l3.5-1 12-12a2.1 2.1 0 0 0-3-3l-12 12L3 21Z',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
}

/**
 * «٤ خطوات وخلصنا»: كتلة تيل غامقة، الخطوات كروت زجاج متوصّلة بخط بيترسم
 * لما القسم يظهر، وكل كارت فيه أيقونة في دايرة ورقم كبير مفرّغ ورا.
 */
export function StepsSection() {
  const { t } = useTranslation()
  return (
    <section className="section flow" id="how">
      <div className="flow-bg" aria-hidden="true" />
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{t('public.steps.eyebrow')}</p>
          <h2>{t('public.steps.title')}</h2>
        </div>
        <ol className="flow-track" data-reveal>
          {STEPS.map((step, i) => (
            <li className="flow-step" key={step} style={{ '--i': i } as CSSProperties}>
              <span className="flow-num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flow-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d={ICONS[step]} />
                </svg>
              </span>
              <h3>{t(`public.steps.${step}.title`)}</h3>
              <p>{t(`public.steps.${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
