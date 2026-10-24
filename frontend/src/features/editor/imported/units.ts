/**
 * محدّدات عناصر القسم المستورد (Tilda…) — منقولة من ‎editor.js‎ القديم (‎isTextUnit‎ وإخوتها).
 * كلها دوال على الـDOM الحي: «وحدة نص» = عنصر نصه بس (أبناؤه سطريين)، فبنفتحه للكتابة،
 * وأي عنصر ليه حجم حقيقي بياخد رقم (‎data-move="el-N"‎) ويتحدّد ويتحرّك.
 */

const TEXTY = new Set([
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'TD', 'TH', 'STRONG', 'EM', 'B', 'I', 'SMALL',
  'FIGCAPTION', 'BLOCKQUOTE', 'TIME', 'MARK',
])

// أبناء سطريين مابيمنعوش العنصر إنه يبقى «نص واحد» (‎<h1>ليلى<span>&</span>كريم</h1>‎ شكل شائع)
const INLINE = new Set(['SPAN', 'EM', 'I', 'B', 'STRONG', 'SMALL', 'U', 'S', 'MARK', 'SUP', 'SUB', 'BR', 'TIME', 'ABBR'])

const COUNTDOWN_MARK =
  /(countdown|time-block|number-wrap|section-countdown|\bcd-(?:num|days?|hours?|mins?|minutes?|secs?|seconds?)\b)/i

const MEDIA = 'img, video, iframe, input, textarea, select'

const classOf = (n: Element) => n.getAttribute('class') ?? ''
const hasText = (n: Element) => !!(n.textContent ?? '').trim()

/** جزء من عدّاد القالب المستورد (سكربته هو اللي بيكتب أرقامه — مانفتحوش للكتابة). */
export function isImportedCountdownPart(n: Element | null): boolean {
  const root = n?.closest('.lb-custom')
  if (!n || !root) return false
  for (let cur: Element | null = n; cur && cur !== root; cur = cur.parentElement) {
    if (COUNTDOWN_MARK.test(`${cur.id} ${classOf(cur)}`)) return true
  }
  return false
}

/** عنصر Tilda النصي (‎.tn-atom‎) — أبناؤه سطريين ومفيش وسايط جواه. */
export function isTildaTextUnit(n: Element): boolean {
  if (!n.classList.contains('tn-atom') || !hasText(n) || n.querySelector(MEDIA)) return false
  return Array.from(n.children).every((c) => INLINE.has(c.tagName))
}

/** وحدة نص عادية: وسم نصي، أبناؤه سطريين من غير أحفاد، وخارج العدّاد. */
export function isTextUnit(n: Element): boolean {
  if (isImportedCountdownPart(n) || !TEXTY.has(n.tagName) || !hasText(n)) return false
  return Array.from(n.children).every((c) => INLINE.has(c.tagName) && c.children.length === 0)
}

/** تسمية «.label» جوّه عدّاد مستورد (نص الأيام/الساعات…) — بتتعدّل مع إنها جزء من العدّاد. */
export function isCountdownLabel(n: Element): boolean {
  return n.classList.contains('label') && isImportedCountdownPart(n) && !n.querySelector(MEDIA)
}

export const isTextual = (n: Element) => isTextUnit(n) || isTildaTextUnit(n) || isCountdownLabel(n)

/** العناصر اللي ينفع تتحرّك: أي حاجة ليها حجم حقيقي (>٦px) — غير ‎BR/HR‎. */
export function movableIn(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).filter((n) => {
    if (n.tagName === 'BR' || n.tagName === 'HR') return false
    const r = n.getBoundingClientRect()
    return r.width > 6 && r.height > 6
  })
}
