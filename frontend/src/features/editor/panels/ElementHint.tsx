import { useTranslation } from 'react-i18next'

import { useEditor } from '../store'
import type { DocBlock } from '../types'

/** العنصر المحدَّد جوّه قسم مستورد. لوحة خصائصه الكاملة (S4)؛ هنا التحديد بس وإلغاؤه. */
export function ElementHint({ block }: { block: DocBlock }) {
  const { t } = useTranslation()
  const selEl = useEditor((s) => (s.selEl?.blockId === block.id ? s.selEl : null))
  const clear = useEditor((s) => s.selectElement)
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
            <button type="button" className="ed-btn ed-btn--sm" onClick={() => clear(block.id, null)}>
              {t('editorInline.element.clear')}
            </button>
          </>
        ) : (
          <p className="ed-hint">{t('editorInline.element.hint')}</p>
        )}
      </div>
    </details>
  )
}
