import { useEffect, useRef } from 'react'

import { useInvite } from './context'
import type { MusicConfig } from './types'

declare global {
  interface Window {
    __lbMusic?: {
      play: () => void
      pause: () => void
      audio: HTMLAudioElement
      button: HTMLButtonElement | null
      destroy: () => void
    } | null
  }
}

/**
 * مشغّل الموسيقى — نفس ‎initMusic‎. مع شاشة افتتاحية: الأغنية **مابتبدأش** غير
 * لما الضيف يفتح الدعوة (أو يدوس تشغيل على فيديو الافتتاحية الصامت). الزر
 * مستقل عن التمرير التلقائي: الضغطة عليه ماتطلعش للـwindow.
 */
export function Music({ config }: { config: MusicConfig }) {
  const { t } = useInvite()
  // الترجمة بتتغيّر مع اللغة، بس المشغّل مايتعاد تشغيله بسبب كده
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const btn = useRef<HTMLButtonElement>(null)
  const hidden = config.player === 'hidden'

  useEffect(() => {
    const button = btn.current
    if (!config.url || hidden || !button) return
    const audio = new Audio(config.url)
    audio.loop = config.loop !== false
    audio.preload = 'none'
    let autoplayOnce: (() => void) | null = null
    let introOpenStart: (() => void) | null = null

    const setPlaying = (on: boolean) => {
      button.classList.toggle('is-playing', on)
      button.setAttribute('aria-label', on ? tRef.current('music.pause') : tRef.current('music.play'))
    }
    const play = () => {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          /* المتصفح منع التشغيل — ينتظر ضغطة المستخدم */
        })
    }
    const pause = () => {
      audio.pause()
      setPlaying(false)
    }

    const stop = (e: Event) => e.stopPropagation()
    const stopEvents = ['pointerdown', 'touchstart', 'click']
    stopEvents.forEach((name) => button.addEventListener(name, stop))
    const toggle = () => (audio.paused ? play() : pause())
    button.addEventListener('click', toggle)

    /* التشغيل التلقائي: بيشغّل، وبيسيب محاولة تانية عند أول تفاعل لو المتصفح رفض. */
    const beginAutoplay = () => {
      play()
      autoplayOnce = () => {
        if (audio.paused) play()
        document.removeEventListener('click', autoplayOnce!)
        document.removeEventListener('touchstart', autoplayOnce!)
        autoplayOnce = null
      }
      // تأخير تكّة: لو ربطنا المستمع دلوقتي نفس الضغطة (فتح الافتتاحية) هتصرفه
      window.setTimeout(() => {
        if (!autoplayOnce) return
        document.addEventListener('click', autoplayOnce, { once: true })
        document.addEventListener('touchstart', autoplayOnce, { once: true })
      }, 0)
    }

    if (config.autoplay) {
      const pendingIntro = document.querySelector('.lb-intro:not(.is-open)')
      if (pendingIntro) {
        // إشارتين، اللي يوصل الأول بيشغّل: lb:intro-play (ضغطة تشغيل الفيديو
        // الصامت) و lb:intro-open (الافتتاحية خلصت أو اتفتحت)
        introOpenStart = () => {
          document.removeEventListener('lb:intro-play', introOpenStart!)
          document.removeEventListener('lb:intro-open', introOpenStart!)
          introOpenStart = null
          beginAutoplay()
        }
        document.addEventListener('lb:intro-play', introOpenStart)
        document.addEventListener('lb:intro-open', introOpenStart)
      } else {
        beginAutoplay()
      }
    }

    const handle = {
      play,
      pause,
      audio,
      button,
      destroy() {
        audio.pause()
        if (autoplayOnce) {
          document.removeEventListener('click', autoplayOnce)
          document.removeEventListener('touchstart', autoplayOnce)
          autoplayOnce = null
        }
        if (introOpenStart) {
          document.removeEventListener('lb:intro-play', introOpenStart)
          document.removeEventListener('lb:intro-open', introOpenStart)
          introOpenStart = null
        }
        stopEvents.forEach((name) => button.removeEventListener(name, stop))
        button.removeEventListener('click', toggle)
        window.__lbMusic = null
      },
    }
    window.__lbMusic = handle
    return () => handle.destroy()
  }, [config.url, config.loop, config.autoplay, hidden])

  if (!config.url || hidden) return null
  const bar = config.player === 'bar'
  // الحالة (‎is-playing‎) بتتبدّل من المشغّل مباشرة على الزرار؛ الـCSS بيقلب
  // بين أيقونة النوتة (واقف) وأعمدة الصوت المتحركة (شغّال)
  return (
    <button ref={btn} type="button" className={`lb-music${bar ? ' lb-music--bar' : ''}`} aria-label={t('music.play')}>
      <span className="lb-music-disc" aria-hidden="true">
        <svg className="lb-music-note" viewBox="0 0 24 24" focusable="false">
          <path d="M9.5 17.2V5.8l9-2v11.1" />
          <circle cx="7" cy="17.2" r="2.5" />
          <circle cx="16" cy="14.9" r="2.5" />
        </svg>
        <span className="lb-music-eq">
          <i />
          <i />
          <i />
          <i />
        </span>
      </span>
      {bar && (
        <span className="lb-music-text" aria-hidden="true">
          <span className="lb-music-text-play">{t('music.play')}</span>
          <span className="lb-music-text-pause">{t('music.pause')}</span>
        </span>
      )}
    </button>
  )
}
