import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { layersOf, type Layer } from '../imported/ops'
import { useElementActions } from '../imported/useElementActions'
import { useEditor } from '../store'
import type { DocBlock } from '../types'
import { useEditorUi } from '../ui'

/**
 * «الطبقات / Layers» لقسم مستورد: كل عنصر مرئي في القسم (اسم + أول نص)، ضغطة تحدّده، × تحذفه.
 * القايمة بتتبني من ‎props.html‎ المحفوظ (مش من المعاينة) ومابتتحسبش غير والمجموعة مفتوحة.
 */
export function LayersGroup({ block }: { block: DocBlock }) {
  const { t } = useTranslation()
  const ui = useEditorUi()
  const actions = useElementActions()
  const select = useEditor((s) => s.selectElement)
  const active = useEditor((s) => (s.selEl?.blockId === block.id ? s.selEl.slot : null))
  const [open, setOpen] = useState(false)

  const html = typeof block.props.html === 'string' ? block.props.html : ''
  const layers = useMemo(() => (open ? layersOf(html) : []), [open, html])

  const label = (layer: Layer) =>
    layer.kind === 'element' ? t(`editorInline.layers.name.${layer.name}`) : t(`editorInline.layers.kind.${layer.kind}`)

  const pick = (slot: string) => select(block.id, slot)
  const onKey = (event: KeyboardEvent, slot: string) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    pick(slot)
  }
  const remove = (event: MouseEvent, slot: string) => {
    event.preventDefault()
    event.stopPropagation()
    if (ui.confirm(t('editorInline.layers.removeConfirm'))) actions.remove(slot)
  }

  return (
    <details className="ed-group ed-layers-group" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <span>{t('editorInline.layers.title')}</span>
      </summary>
      <div className="ed-group-body ed-layers-list">
        {open && layers.length === 0 && <p className="ed-hint">{t('editorInline.layers.empty')}</p>}
        {layers.map((layer, index) => (
          <div
            key={layer.slot}
            className={`ed-layer-item${layer.slot === active ? ' is-active' : ''}`}
            role="button"
            tabIndex={0}
            data-layer-slot={layer.slot}
            onClick={() => pick(layer.slot)}
            onKeyDown={(e) => onKey(e, layer.slot)}
          >
            <span className="ed-layer-index">{index + 1}</span>
            <span className="ed-layer-name">{layer.text ? `${label(layer)} — ${layer.text}` : label(layer)}</span>
            <button
              type="button"
              className="ed-layer-remove"
              title={t('editorInline.layers.remove')}
              aria-label={t('editorInline.layers.remove')}
              onClick={(e) => remove(e, layer.slot)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </details>
  )
}
