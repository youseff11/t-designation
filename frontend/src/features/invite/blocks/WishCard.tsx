import type { WishItem } from '../types'

/** أول حرف من الاسم للدايرة الصغيرة (‎Array.from‎ عشان الحروف المركّبة والإيموجي). */
function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? '♥'
}

/**
 * كارت رسالة تهنئة واحدة — نفس الشكل في بلوك «سجل التهاني» وتحت فورم التأكيد:
 * علامة اقتباس كبيرة باهتة، الرسالة، وتحتها دايرة بأول حرف واسم صاحبها.
 */
export function WishCard({ wish, className }: { wish: WishItem; className: string }) {
  return (
    <article className={className}>
      <span className="lb-wish-mark" aria-hidden="true">
        ”
      </span>
      <p className="lb-wish-msg">{wish.message}</p>
      <footer className="lb-wish-by">
        <span className="lb-wish-avatar" aria-hidden="true">
          {initialOf(wish.name)}
        </span>
        <cite>{wish.name}</cite>
      </footer>
    </article>
  )
}
