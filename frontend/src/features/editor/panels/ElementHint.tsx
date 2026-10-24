import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AssetLibrary } from '../assets/AssetLibrary'
import { inspect } from '../imported/ops'
import { useElementActions } from '../imported/useElementActions'
import { useEditor } from '../store'
import type { DocBlock } from '../types'

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

/**
 * العنصر المحدَّد جوّه قسم مستورد: إضافة نص/صورة، نسخ/لصق/تكرار، الأب، الحذف (S3).
 * لوحة خصائصه الكاملة (تنسيق، صورة، خريطة…) في S4.
 */
export function ElementHint({ block }: { block: DocBlock }) {
  const { t } = useTranslation()
  const selEl = useEditor((s) => (s.selEl?.blockId === block.id ? s.selEl : null))
  const clear = useEditor((s) => s.selectElement)
  const hasClip = useEditor((s) => s.clip !== null)
  const actions = useElementActions()
  const [picking, setPicking] = useState(false)

  const html = typeof block.props.html === 'string' ? block.props.html : ''
  const info = useMemo(() => (selEl ? inspect(html, selEl.slot) : null), [html, selEl])

  return (
    <details className="ed-group" open>
      <summary>
        <span>{t('editorInline.element.title')}</span>
      </summary>
      <div className="ed-group-body">
        {selEl ? (
          <>
            <p className="ed-el-name" data-element-slot={selEl.slot}>
              {t('editorInline.element.slot')}: {selEl.slot}
            </p>

            <Row label={t('editorInline.element.addTitle')}>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!info}
                title={info?.canContain ? t('editorInline.element.addInside') : t('editorInline.element.addAfter')}
                onClick={() => setPicking(true)}
              >
                {t('editorInline.element.addImage')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!info}
                title={info?.canContain ? t('editorInline.element.addInside') : t('editorInline.element.addAfter')}
                onClick={() => actions.addText()}
              >
                {t('editorInline.element.addText')}
              </button>
            </Row>

            <Row label={t('editorInline.element.clipTitle')}>
              <button type="button" className="ed-btn ed-btn--sm" title="Ctrl+C" disabled={!info} onClick={() => actions.copy()}>
                {t('editorInline.element.copy')}
              </button>
              <button type="button" className="ed-btn ed-btn--sm" title="Ctrl+D" disabled={!info} onClick={() => actions.duplicate()}>
                {t('editorInline.element.duplicate')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                title={t('editorInline.element.pasteHint')}
                disabled={!info || !hasClip}
                onClick={() => actions.paste(false)}
              >
                {t('editorInline.element.paste')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm"
                disabled={!info?.canContain || !hasClip}
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
                disabled={!info}
                onClick={() => actions.selectParent()}
              >
                {t('editorInline.element.parent')}
              </button>
              <button type="button" className="ed-btn ed-btn--sm" onClick={() => clear(block.id, null)}>
                {t('editorInline.element.clear')}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn--sm ed-btn--danger"
                title="Delete"
                disabled={!info}
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
