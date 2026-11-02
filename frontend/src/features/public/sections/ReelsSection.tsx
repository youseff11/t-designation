import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { prefersReducedMotion } from '../motion'
import { pick, useLang } from '../text'
import type { PublicReel } from '../types'

/** `#t=0.1` بيخلّي المتصفح يرسم أول فريم لو مفيش غلاف (من غير تشغيل). */
const still = (url: string) => `${url}#t=0.1`

function ReelCard({ reel, title, onOpen }: { reel: PublicReel; title: string; onOpen: () => void }) {
  const { t } = useTranslation()
  const card = useRef<HTMLButtonElement>(null)
  const video = useRef<HTMLVideoElement>(null)

  // موبايل: الكارت اللي في نص الشاشة يشتغل صامت. ماوس: يشتغل بالـhover (onPointerEnter).
  useEffect(() => {
    const el = card.current
    const media = video.current
    if (!el || !media || prefersReducedMotion() || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(hover: hover)').matches) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void media.play().catch(() => {})
        else media.pause()
      },
      { threshold: 0.75 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const hoverPlay = (on: boolean) => {
    const media = video.current
    if (!media || prefersReducedMotion()) return
    if (on) void media.play().catch(() => {})
    else {
      media.pause()
      media.currentTime = 0
    }
  }

  return (
    <button
      ref={card}
      type="button"
      className="reel-card"
      aria-label={title ? `${t('public.reels.play')}: ${title}` : t('public.reels.play')}
      onClick={onOpen}
      onPointerEnter={(e) => e.pointerType === 'mouse' && hoverPlay(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hoverPlay(false)}
    >
      <video
        ref={video}
        src={reel.poster ? reel.video : still(reel.video)}
        poster={reel.poster || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      />
      <span className="reel-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
        </svg>
      </span>
      {title && <span className="reel-title">{title}</span>}
    </button>
  )
}

/** عارض ملء الشاشة بصوت: أسهم/سحب بين الريلز، Esc للإغلاق، والضغط على الفيديو بيوقّف/يشغّل. */
function ReelViewer({
  reels,
  index,
  onIndex,
  onClose,
}: {
  reels: PublicReel[]
  index: number
  onIndex: (next: number) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const lang = useLang()
  const reel = reels[index]
  const video = useRef<HTMLVideoElement>(null)
  const touchY = useRef<number | null>(null)
  const [paused, setPaused] = useState(false)

  const go = useCallback(
    (step: number) => onIndex((index + step + reels.length) % reels.length),
    [index, onIndex, reels.length],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        // السهم لتحت/يمين = التالي، لفوق/شمال = السابق (بغضّ النظر عن اتجاه الصفحة)
        go(e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1)
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [go, onClose])

  useEffect(() => {
    void video.current?.play().catch(() => setPaused(true))
  }, [index])

  const toggle = () => {
    const media = video.current
    if (!media) return
    if (media.paused) void media.play().catch(() => {})
    else media.pause()
  }

  const title = pick(lang, reel.title, reel.titleEn)
  return createPortal(
    <div
      className="reel-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={title || t('public.reels.title')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchEnd={(e) => {
        const start = touchY.current
        touchY.current = null
        if (start === null) return
        const delta = e.changedTouches[0].clientY - start
        if (Math.abs(delta) > 60) go(delta < 0 ? 1 : -1)
      }}
    >
      <button type="button" className="reel-viewer-close" onClick={onClose} aria-label={t('public.reels.close')}>
        ×
      </button>
      {reels.length > 1 && (
        <>
          <button type="button" className="reel-viewer-nav reel-viewer-nav--prev" onClick={() => go(-1)} aria-label={t('public.reels.prev')}>
            ‹
          </button>
          <button type="button" className="reel-viewer-nav reel-viewer-nav--next" onClick={() => go(1)} aria-label={t('public.reels.next')}>
            ›
          </button>
        </>
      )}
      <div className="reel-viewer-stage">
        <video
          key={reel.id}
          ref={video}
          src={reel.video}
          poster={reel.poster || undefined}
          autoPlay
          loop
          playsInline
          onClick={toggle}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
        {paused && (
          <span className="reel-viewer-paused" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          </span>
        )}
        {title && <p className="reel-viewer-title">{title}</p>}
        {reels.length > 1 && (
          <span className="reel-viewer-count" dir="ltr">
            {index + 1} / {reels.length}
          </span>
        )}
      </div>
    </div>,
    document.body,
  )
}

/**
 * الريلز — صف كروت رأسية (9:16) بتشتغل بالـhover وبتتفتح ملء الشاشة.
 * اللينك في الترويسة ظاهر دايماً، فلو مفيش ريلز لسه بنعرض رسالة «قريباً» بدل قسم مخفي
 * (ومنعرضش حاجة قبل ما البيانات توصل عشان مايحصلش وميض).
 */
export function ReelsSection({ reels }: { reels: PublicReel[] | undefined }) {
  const { t } = useTranslation()
  const lang = useLang()
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  if (!reels) return null

  if (!reels.length) {
    return (
      <section className="section section--reels" id="reels">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">{t('public.reels.eyebrow')}</p>
            <h2>{t('public.reels.title')}</h2>
            <p>{t('public.reels.empty')}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section section--reels" id="reels">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{t('public.reels.eyebrow')}</p>
          <h2>{t('public.reels.title')}</h2>
          <p>{t('public.reels.sub')}</p>
        </div>
      </div>
      <div className="reel-rail" data-reveal>
        {reels.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} title={pick(lang, reel.title, reel.titleEn)} onOpen={() => setOpen(i)} />
        ))}
      </div>
      {open !== null && <ReelViewer reels={reels} index={open} onIndex={setOpen} onClose={close} />}
    </section>
  )
}
