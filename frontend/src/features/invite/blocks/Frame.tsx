import type { CSSProperties, ReactNode } from 'react'

import { Raw } from '../Raw'
import { parseStyle } from '../style'
import { DividerOrnament } from '../svg'
import type { BlockData } from '../types'

interface FrameProps {
  block: BlockData
  children: ReactNode
  /** إضافات فوق متغيّرات القسم (ستايل inline) */
  style?: CSSProperties
  /** مكان الزخرفة العلوية/السفلية؛ ‎false‎ = القالب مابيرسمهاش (فاصل، قسم مستورد…) */
  ornaments?: boolean
  innerClass?: string
}

/** عناصر «فوق القسم» و«كود متقدّم»: بيتحقنوا آخر حاجة في القسم (زي ‎render_document‎). */
export function Tail({ block }: { block: BlockData }) {
  return <Raw html={block.overlays + block.code} />
}

/**
 * هيكل القسم العادي (‎<section>‎ ثم ‎.lb-inner‎) — نفس اللي بتكتبه قوالب
 * ‎templates/blocks/*.html‎. ‎attrs‎ جاهزة من السيرفر (الكلاسات والمتغيّرات).
 */
export function Frame({ block, children, style, ornaments = true, innerClass = 'lb-inner' }: FrameProps) {
  const { attrs } = block
  return (
    <section
      id={attrs.id}
      className={attrs.className}
      style={{ ...parseStyle(attrs.style), ...style }}
      data-block={block.id}
      data-block-type={block.type}
    >
      {ornaments && <DividerOrnament variant={block.dividerTop} slot="ornament_top" />}
      <div className={innerClass}>{children}</div>
      {ornaments && <DividerOrnament variant={block.dividerBottom} slot="ornament_bottom" />}
      <Tail block={block} />
    </section>
  )
}
