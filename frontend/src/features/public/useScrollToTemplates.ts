import { useEffect } from 'react'

import { prefersReducedMotion } from './motion'

const DELAY_MS = 3200
const DURATION_MS = 1800
const SEEN_KEY = 'td:auto-tour'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * نزول تلقائي هادي من الهيرو لحد القوالب، مرة واحدة في الجلسة:
 * - بيستنى شوية بعد ما الصفحة تفتح (الزائر يلحق يقرا الهيرو).
 * - أي تفاعل (عجلة، لمس، ضغطة، كيبورد) قبل أو أثناء النزول بيلغيه نهائياً.
 * - مايشتغلش لو الرابط فيه ‎#‎ أو الصفحة متنزّلة أصلاً (رجوع من معاينة قالب) أو مع تقليل الحركة.
 */
export function useScrollToTemplates(ready: boolean) {
  useEffect(() => {
    if (!ready || location.hash || prefersReducedMotion()) return
    const seen = (mark?: boolean) => {
      try {
        if (mark) sessionStorage.setItem(SEEN_KEY, '1')
        return Boolean(sessionStorage.getItem(SEEN_KEY))
      } catch {
        return false // التخزين مقفول — نكمّل عادي
      }
    }
    if (seen()) return

    let raf = 0
    let timer = 0
    let cancelled = false
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    const cancel = () => {
      cancelled = true
      seen(true)
      window.clearTimeout(timer)
      window.cancelAnimationFrame(raf)
      events.forEach((ev) => window.removeEventListener(ev, cancel))
    }
    events.forEach((ev) => window.addEventListener(ev, cancel, { passive: true }))

    const run = () => {
      const target = document.getElementById('templates')
      if (cancelled || !target || window.scrollY > 40) return cancel()
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-space')) || 84
      const from = window.scrollY
      const to = Math.max(0, target.getBoundingClientRect().top + from - nav + 8)
      const start = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const p = Math.min(1, (now - start) / DURATION_MS)
        // ‎instant‎: الموقع عامل ‎scroll-behavior: smooth‎ وده بيبوّظ الحركة فريم بفريم
        window.scrollTo({ top: from + (to - from) * ease(p), behavior: 'instant' })
        if (p < 1) raf = window.requestAnimationFrame(step)
        else cancel()
      }
      raf = window.requestAnimationFrame(step)
    }
    timer = window.setTimeout(run, DELAY_MS)
    // فكّ التركيب (تنقّل لصفحة تانية) مش «شافه» — المرة الجاية يشتغل عادي
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.cancelAnimationFrame(raf)
      events.forEach((ev) => window.removeEventListener(ev, cancel))
    }
  }, [ready])
}
