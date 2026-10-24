import { findSlot } from './dom'
import { isTextual } from './units'

/**
 * تعديلات «لوحة العنصر» (S4): نص، تنسيق (style مضمّن)، صورة. نفس الدالة (‎applyNodeEdit‎) بتتطبّق مرتين:
 * على نص ‎props.html‎ في الصفحة الأم (المصدر اللي بيتحفظ)، وعلى DOM المعاينة الحي (عشان التغيير يبان لحظياً
 * قبل ما رد السيرفر يوصل) — فمفيش كتابة راجعة من المعاينة أبداً. القيمة الفاضية = شيل الخاصية.
 */
export type NodeEdit =
  /** ‎style‎ على «عقدة التنسيق»: الصورة/الفيديو لو فيه، وإلا وحدة النص اللي جوّه، وإلا العنصر نفسه */
  | { kind: 'style'; prop: string; value: string }
  /** ‎style‎ على العنصر المحدَّد نفسه (الإخفاء ‎display:none‎) */
  | { kind: 'self'; prop: string; value: string }
  | { kind: 'text'; value: string }
  /** مصدر الصورة: ‎src‎ جديد ومعاه شيل ‎srcset‎ (بيكسب على ‎src‎) */
  | { kind: 'src'; value: string }

const tagOf = (n: Element) => n.tagName.toUpperCase()

export const imageIn = (node: Element): Element | null => (tagOf(node) === 'IMG' ? node : node.querySelector('img'))
export const videoIn = (node: Element): Element | null => (tagOf(node) === 'VIDEO' ? node : node.querySelector('video'))

/** وحدة النص اللي العنصر هو نفسه أو أول واحدة جواه (من غير حد المقاس — مفيش layout في المستند الخامل). */
export function textUnitIn(node: Element): Element | null {
  if (isTextual(node)) return node
  return Array.from(node.querySelectorAll('*')).find(isTextual) ?? null
}

/** العقدة اللي بتتكتب عليها الخصائص: صورة ثم فيديو ثم وحدة نص ثم العنصر نفسه (ترتيب القديم). */
export function styleTarget(node: Element): Element {
  return imageIn(node) ?? videoIn(node) ?? textUnitIn(node) ?? node
}

function setProp(node: Element, prop: string, value: string) {
  const style = (node as HTMLElement).style
  if (!style) return
  if (value) style.setProperty(prop, value)
  else style.removeProperty(prop)
  if (!node.getAttribute('style')) node.removeAttribute('style') // ‎style=""‎ فاضي مالوش لازمة
}

/** بيطبّق تعديل على العنصر برقمه جوّه ‎root‎. بيرجّع ‎false‎ لو العنصر مش موجود. */
export function applyNodeEdit(root: Element, slot: string, edit: NodeEdit): boolean {
  const node = findSlot(root, slot)
  if (!node) return false
  switch (edit.kind) {
    case 'style':
      setProp(styleTarget(node), edit.prop, edit.value)
      return true
    case 'self':
      setProp(node, edit.prop, edit.value)
      return true
    case 'text': {
      const unit = textUnitIn(node)
      if (!unit) return false
      unit.textContent = edit.value
      return true
    }
    case 'src': {
      const image = imageIn(node)
      if (!image) return false
      image.setAttribute('src', edit.value)
      image.removeAttribute('srcset')
      return true
    }
  }
}

/** خصائص التنسيق اللي اللوحة بتقراها من العقدة. */
export const STYLE_PROPS = [
  'font-family', 'font-size', 'font-weight', 'text-align', 'color', 'background-color',
  'letter-spacing', 'line-height', 'width', 'border-radius',
] as const
export type StyleProp = (typeof STYLE_PROPS)[number]

export type NodeKind = 'image' | 'video' | 'text' | 'shape'

export interface NodeInfo {
  tag: string
  /** أول كلاس من القالب (من غير علاماتنا) — بيظهر جنب الاسم */
  className: string
  kind: NodeKind
  /** نص وحدة النص (‎<br>‎ بقت سطر جديد) — ‎null‎ لو مفيش وحدة نص */
  text: string | null
  /** مصدر الصورة — ‎null‎ لو مش صورة */
  src: string | null
  hidden: boolean
  /** القيم المضمّنة على عقدة التنسيق (فاضية = مفيش قيمة مضمّنة) */
  styles: Record<StyleProp, string>
}

const OWN_CLASSES = new Set(['lb-el-picked', 'lb-el-typing', 'lb-dragging', 'lb-el-swap'])

/** نص وحدة النص زي ما بيظهر: ‎<br>‎ سطر جديد، والوسوم تتشال، والمسافات/الأسطر اللي من تنسيق الـHTML بتتلم. */
function plainText(unit: Element): string {
  const clone = unit.cloneNode(true) as Element
  clone.querySelectorAll('br').forEach((br) => br.replaceWith(''))
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim().replace(/ ? ?/g, '\n')
}

/** يقرا حالة العنصر للوحة من ‎props.html‎ المحلّل (مش من المعاينة). */
export function readNode(root: Element, slot: string): NodeInfo | null {
  const node = findSlot(root, slot)
  if (!node) return null
  const image = imageIn(node)
  const video = videoIn(node)
  const unit = textUnitIn(node)
  const target = styleTarget(node) as HTMLElement
  const styles = Object.fromEntries(STYLE_PROPS.map((prop) => [prop, target.style?.getPropertyValue(prop) ?? ''])) as Record<
    StyleProp,
    string
  >
  const className = (node.getAttribute('class') ?? '').split(/\s+/).find((c) => c && !OWN_CLASSES.has(c)) ?? ''
  return {
    tag: tagOf(node),
    className,
    kind: image ? 'image' : video ? 'video' : unit ? 'text' : 'shape',
    text: unit ? plainText(unit) : null,
    src: image?.getAttribute('src') ?? null,
    hidden: (node as HTMLElement).style?.display === 'none',
    styles,
  }
}
