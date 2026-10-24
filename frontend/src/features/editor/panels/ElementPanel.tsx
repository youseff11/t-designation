import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AssetLibrary } from '../assets/AssetLibrary'
import { isPxSlot } from '../frame/interactions'
import { inspect, nameOf, nodeInfo } from '../imported/ops'
import { useElementActions } from '../imported/useElementActions'
import { useEditor } from '../store'
import type { DocBlock } from '../types'
import { ElementFields } from './ElementFields'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ed-field">
      <label>
        <span>{label}</span>
      </label>
      <div className="ed-ctrl-line">{children}</div>
    </div>
  )
}

/** الأسهم: اتجاه الإزاحة الفيزيائي (الـtransform فيزيائي حتى في RTL — زي اختصارات الكيبورد). */
const NUDGES: [string, number, number][] = [
  ['→', 1, 0],
  ['←', -1, 0],
  ['↑', 0, -1],
  ['↓', 0, 1],
]

/**
 * العنصر المحدَّد جوّه قسم مستورد: اسمه، محتواه وتنسيقه (S4a)، موضعه، إضافة نص/صورة، نسخ/لصق/تكرار،
 * الأب، الإخفاء والحذف (S3). الخريطة والعدّاد والفيديو والألوان في S4b.
 */
export function ElementPanel({ block }: { block: DocBlock }) {
  const { t } = useTranslation()
  const selEl = useEditor((s) => (s.selEl?.blockId === block.id ? s.selEl : null))
  const clear = useEditor((s) => s.selectElement)
  const hasClip = useEditor((s) => s.clip !== null)
  const nudge = useEditor((s) => s.nudgeLayout)
  const setLayout = useEditor((s) => s.setLayout)
  const actions = useElementActions()
  const [picking, setPicking] = useState(false)

  const html = typeof block.props.html === 'string' ? block.props.html : ''
  const slot = selEl?.slot ?? ''
  const structure = useMemo(() => (slot ? inspect(html, slot) : null), [html, slot])
  const info = useMemo(() => (slot ? nodeInfo(html, slot) : null), [html, slot])

  const pos = block.layout?.[slot] ?? { dx: 0, dy: 0 }
  const px = isPxSlot(slot)
  const step = px ? 1 : 0.25
  const name = info
    ? info.kind === 'image' || info.kind === 'video'
      ? t(`editorInline.layers.kind.${info.kind}`)
      : t(`editorInline.layers.name.${nameOf(info.tag)}`)
    : ''

  return (
    <details className="ed-group" open>
      <summary>
        <span>{t('editorInline.element.title')}</span>
      </summary>
      <div className="ed-group-body">
        {selEl ? (
          <>
            <p className="ed-el-name" data-element-slot={selEl.slot}>
              {info ? `${name}${info.className ? ` · ${info.className}` : ''} — ` : ''}
              {t('editorInline.element.slot')}: {selEl.slot}
            </p>

            {info && <ElementFields key={selEl.slot} blockId={block.id} slot={selEl.slot} info={info} />}

            <Row label={t(px ? 'editorInline.element.positionPx' : 'editorInline.element.positionPct', { dx: pos.dx, dy: pos.dy })}>
              <div className="ed-nudge">
                {NUDGES.map(([arrow, dx, dy]) => (
                  <button
                    key={arrow}
                    type="button"
                    className="ed-btn ed-btn--sm"
                    title={t(px ? 'editorInline.element.nudgePx' : 'editorInline.element.nudgeStep')}
                    onClick={() => nudge(block.id, selEl.slot, dx * step, dy * step)}
                  >
                    {arrow}
                  </button>
                ))}
                <button type="button" className="ed-btn ed-btn--sm" onClick={() => setLayout(block.id, selEl.slot, 0, 0)}>
                  {t('editorInline.element.reset')}
                </button>
              </div>
            </Row>

            <Row label={t('editorInline.element.addTitle')}>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!structure}
                title={structure?.canContain ? t('editorInline.element.addInside') : t('editorInline.element.addAfter')}
                onClick={() => setPicking(true)}
              >
                {t('editorInline.element.addImage')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!structure}
                title={structure?.canContain ? t('editorInline.element.addInside') : t('editorInline.element.addAfter')}
                onClick={() => actions.addText()}
              >
                {t('editorInline.element.addText')}
              </button>
            </Row>

            <Row label={t('editorInline.element.clipTitle')}>
              <button type="button" className="ed-btn ed-btn--sm" title="Ctrl+C" disabled={!structure} onClick={() => actions.copy()}>
                {t('editorInline.element.copy')}
              </button>
              <button type="button" className="ed-btn ed-btn--sm" title="Ctrl+D" disabled={!structure} onClick={() => actions.duplicate()}>
                {t('editorInline.element.duplicate')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                title={t('editorInline.element.pasteHint')}
                disabled={!structure || !hasClip}
                onClick={() => actions.paste(false)}
              >
                {t('editorInline.element.paste')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!structure?.canContain || !hasClip}
                onClick={() => actions.paste(true)}
              >
                {t('editorInline.element.pasteInside')}
              </button>
            </Row>

            <div className="ed-ctrl-line">
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                title={t('editorInline.element.parentHint')}
                disabled={!structure}
                onClick={() => actions.selectParent()}
              >
                {t('editorInline.element.parent')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!info}
                onClick={() => actions.edit({ kind: 'self', prop: 'display', value: info?.hidden ? '' : 'none' })}
              >
                {t(info?.hidden ? 'editorInline.element.show' : 'editorInline.element.hide')}
              </button>
              <button type="button" className="ed-btn ed-btn--sm" onClick={() => clear(block.id, null)}>
                {t('editorInline.element.clear')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm ed-btn--danger"
                title="Delete"
                disabled={!structure}
                onClick={() => actions.remove()}
              >
                {t('editorInline.element.delete')}
              </button>
            </div>
            <p className="ed-hint">{t('editorInline.element.keys')}</p>
            {picking && (
              <AssetLibrary kind="image" onPick={(url) => actions.addImage(url)} onClose={() => setPicking(false)} />
            )}
          </>
        ) : (
          <p className="ed-hint">{t('editorInline.element.hint')}</p>
        )}
      </div>
    </details>
  )
}
