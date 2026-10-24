import type { FromFrame, PreviewPayload } from '../types'
import { numberElements } from './numbering'
import { serializeCustom } from './serialize'

/**
 * تحرير عناصر القسم المستورد (‎.lb-custom‎) جوّه إطار المعاينة — S1: التحديد، الترقيم، كتابة النص.
 * الـDOM هو المصدر (زي ‎editor.js‎ القديم): بعد أي تعديل بنرجّع ‎props.html‎ من الـDOM الحي
 * (‎serializeCustom‎) للصفحة الأم اللي بتحفظه في المستند. ضغطة = اختيار، ضغطتين = كتابة.
 */

const ROOT = '.lb-custom'
/** الكتابة بتتجمّع: آخر حالة كل ٢٠٠ مللي هي اللي بتتبعت (السيريالايز لقسم تقيل بياخد وقت) */
export const WRITE_WAIT = 200

type Send = (message: FromFrame) => void

const writes = new Map<Element, ReturnType<typeof setTimeout>>()

const blockIdOf = (root: Element) => root.closest('[data-block]')?.getAttribute('data-block') ?? null

function writeNow(root: Element, send: Send, silent: boolean) {
  const timer = writes.get(root)
  if (timer) clearTimeout(timer)
  writes.delete(root)
  const id = blockIdOf(root)
  if (id) send({ type: 'lb-editor:html', id, value: serializeCustom(root), silent })
}

/** يبعت ‎props.html‎ الحالي لجذر فوراً (خطوة تراجع واحدة) — بعد تبديل صورتين مثلاً. */
export function commitHtml(root: Element, send: Send) {
  writeNow(root, send, false)
}

/** يجدول كتابة راجعة لجذر (مرة واحدة لكل جذر، وآخر حالة هي اللي بتتسلسل). */
export function scheduleWrite(root: Element, send: Send, silent = false) {
  const timer = writes.get(root)
  if (timer) clearTimeout(timer)
  writes.set(
    root,
    setTimeout(() => writeNow(root, send, silent), WRITE_WAIT),
  )
}

export const isTranslated = (payload: PreviewPayload | null) => !!payload && payload.lang !== payload.baseLang

/** يجهّز كل أقسام ‎custom_html‎ بعد كل رسمة: علامات وحدات النص + ترقيم العناصر (ويحفظه لو اتضاف رقم جديد). */
export function prepareImported(payload: PreviewPayload, send: Send, root: ParentNode = document) {
  const translated = isTranslated(payload)
  root.querySelectorAll('[data-block-type="custom_html"]').forEach((section) => {
    const custom = section.querySelector(ROOT)
    if (!custom) return
    const { changed } = numberElements(custom)
    // الـDOM هنا نصه مترجَم لو المعاينة مترجَمة — مانحفظش حاجة منه
    if (changed && !translated) scheduleWrite(custom, send, true)
  })
}

/** علامة العنصر المحدَّد (‎.lb-el-picked‎) — React بيكتب ‎className‎ من جديد فبنعيدها بعد كل رسمة. */
export function markPicked(picked: { id: string; slot: string } | null, root: ParentNode = document) {
  root.querySelectorAll('.lb-el-picked').forEach((n) => n.classList.remove('lb-el-picked'))
  if (!picked) return
  const section = Array.from(root.querySelectorAll('[data-block]')).find((n) => n.getAttribute('data-block') === picked.id)
  const node = Array.from(section?.querySelectorAll(`${ROOT} [data-move]`) ?? []).find(
    (n) => n.getAttribute('data-move') === picked.slot,
  )
  node?.classList.add('lb-el-picked')
}

/** يفتح وحدة نص للكتابة (ضغطتين). المعاينة المترجَمة بترفض. */
export function beginTextEdit(node: HTMLElement, send: Send, translated: boolean) {
  if (translated) {
    send({ type: 'lb-editor:refused' })
    return
  }
  node.setAttribute('contenteditable', 'plaintext-only')
  node.classList.add('lb-el-typing')
  node.focus()
  const sel = node.ownerDocument.getSelection()
  if (sel && sel.rangeCount === 0) {
    const range = node.ownerDocument.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    sel.addRange(range)
  }
}

interface Options {
  payload: () => PreviewPayload | null
  send: Send
  /** العنصر المحدَّد دلوقتي — الضغطة بتحدّثه محلياً قبل ما الصفحة الأم تردّ */
  onPick: (picked: { id: string; slot: string }) => void
}

/** يربط تحديد العناصر وكتابتها على صفحة الإطار (تفويض مرة واحدة). بيرجّع دالة الفك. */
export function installImported({ payload, send, onPick }: Options): () => void {
  const inRoot = (target: EventTarget | null, selector: string) =>
    target instanceof Element ? target.closest<HTMLElement>(`${ROOT} ${selector}`) : null

  // ضغطة = اختيار أقرب عنصر مرقّم (اللي جوّه وحدة نص مابيترقّمش فالنص نفسه هو اللي بيتحدّد)
  const onClick = (e: MouseEvent) => {
    const node = inRoot(e.target, '[data-move]')
    if (!node || node.classList.contains('lb-el-typing')) return
    const root = node.closest(ROOT)
    const id = root && blockIdOf(root)
    const slot = node.getAttribute('data-move')
    if (!id || !slot) return
    onPick({ id, slot })
    send({ type: 'lb-editor:element', id, slot })
  }

  // ضغطتين على نص = كتابة (الضغطة الواحدة بتفضل للتحديد عشان Delete والأسهم وCtrl+C تفضل للعنصر)
  const onDblClick = (e: MouseEvent) => {
    const node = inRoot(e.target, '[data-lb-text]')
    if (!node) return
    e.preventDefault()
    e.stopPropagation()
    const slot = node.getAttribute('data-move')
    const root = node.closest(ROOT)
    const id = root && blockIdOf(root)
    if (id && slot) {
      onPick({ id, slot })
      send({ type: 'lb-editor:element', id, slot })
    }
    beginTextEdit(node, send, isTranslated(payload()))
  }

  const typing = (target: EventTarget | null) => {
    const node = inRoot(target, '[data-lb-text]')
    return node?.classList.contains('lb-el-typing') ? node : null
  }

  const onInput = (e: Event) => {
    const node = typing(e.target)
    const root = node?.closest(ROOT)
    if (root && !isTranslated(payload())) scheduleWrite(root, send)
  }

  const onFocusOut = (e: FocusEvent) => {
    const node = typing(e.target)
    if (!node) return
    node.removeAttribute('contenteditable')
    node.classList.remove('lb-el-typing')
    const root = node.closest(ROOT)
    if (root && !isTranslated(payload())) writeNow(root, send, false)
  }

  // Esc بيخرج من الكتابة بس — العنصر يفضل محدَّد
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    const node = typing(e.target)
    if (!node) return
    e.preventDefault()
    e.stopPropagation()
    node.blur()
  }

  document.addEventListener('click', onClick)
  document.addEventListener('dblclick', onDblClick, true)
  document.addEventListener('input', onInput)
  document.addEventListener('focusout', onFocusOut)
  document.addEventListener('keydown', onKeyDown, true)
  return () => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('dblclick', onDblClick, true)
    document.removeEventListener('input', onInput)
    document.removeEventListener('focusout', onFocusOut)
    document.removeEventListener('keydown', onKeyDown, true)
    writes.forEach((timer) => clearTimeout(timer))
    writes.clear()
  }
}
