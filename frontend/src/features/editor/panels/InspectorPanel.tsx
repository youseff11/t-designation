import { useTranslation } from 'react-i18next'

import { findBlock } from '../doc'
import { useEditor } from '../store'
import type { EditorSchema } from '../types'
import { FieldGroups, useOpenGroups } from './FieldGroups'

/** خصائص القسم المحدَّد: الاسم، ثم مجموعات حقول المحتوى ثم التنسيق — كلها مبنية من السكيما. */
export function InspectorPanel({ schema }: { schema: EditorSchema }) {
  const { t } = useTranslation()
  const block = useEditor((s) => findBlock(s.doc, s.selected))
  const features = useEditor((s) => s.features)
  const setTab = useEditor((s) => s.setTab)
  const rename = useEditor((s) => s.rename)
  const setProp = useEditor((s) => s.setProp)
  const setStyle = useEditor((s) => s.setStyle)
  const props = useOpenGroups()
  const style = useOpenGroups()

  if (!block) return <p className="ed-empty">{t('editor.inspector.empty')}</p>
  const spec = schema.blocks[block.type]
  if (!spec) return null
  const gated = !!spec.feature && !features.includes(spec.feature)

  return (
    <>
      <div className="ed-section-head">
        <div>
          <p className="ed-kicker">{t('editor.inspector.selected')}</p>
          <strong>{block.label || spec.label}</strong>
        </div>
        <button type="button" className="ed-btn ed-btn--sm" onClick={() => setTab('blocks')}>
          {t('editor.inspector.back')}
        </button>
      </div>

      <div className="ed-field">
        <label htmlFor="ed-block-name">
          <span>{t('editor.inspector.rename')}</span>
        </label>
        <input
          id="ed-block-name"
          className="ed-input"
          type="text"
          maxLength={60}
          placeholder={spec.label}
          value={block.label ?? ''}
          onChange={(e) => rename(block.id, e.target.value)}
        />
      </div>

      {spec.description && <p className="ed-hint">{spec.description}</p>}
      {gated && <p className="ed-hint ed-hint--danger">{t('editor.inspector.gated')}</p>}

      <FieldGroups
        specs={spec.props}
        get={(s) => block.props[s.key]}
        set={(s, v) => setProp(block.id, s.key, v)}
        open={props.open}
        onToggle={props.onToggle}
        openFirst
      />
      {spec.style.length > 0 && (
        <FieldGroups
          specs={spec.style}
          get={(s) => block.style[s.key]}
          set={(s, v) => setStyle(block.id, s.key, v)}
          open={style.open}
          onToggle={style.onToggle}
          openFirst={false}
        />
      )}
    </>
  )
}
