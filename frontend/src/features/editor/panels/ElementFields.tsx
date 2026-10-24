import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FieldRenderer } from '../fields'
import { useSchema } from '../hooks'
import { cssNumber, fontKey, lineRatio, toHex } from '../imported/css'
import { computedValue } from '../imported/live'
import type { NodeInfo, StyleProp } from '../imported/nodeEdit'
import { useElementActions } from '../imported/useElementActions'
import { useEditor } from '../store'
import type { FieldSpec, FieldType } from '../types'

const field = (key: string, type: FieldType, label: string, extra: Partial<FieldSpec> = {}): FieldSpec => ({
  key,
  label,
  type,
  default: '',
  group: '',
  ...extra,
})

interface StyleField {
  prop: StyleProp
  spec: FieldSpec
  /** وحدة الأرقام (‎px‎، ‎%‎، أو فاضي) — للشرائط بس */
  unit: string
}

const WEIGHTS = ['', '300', '400', '500', '600', '700']
const ALIGNS = ['', 'right', 'center', 'left']

/**
 * حقول تنسيق العنصر حسب نوعه: النص والأشكال بيقبلوا الخط والألوان والمسافات، والصورة بتاخد مقاسها
 * واستدارتها ولون خلفيتها بس (الخط مالوش تأثير عليها)، والفيديو لون الخلفية.
 */
function styleFields(t: (key: string) => string, kind: NodeInfo['kind']): StyleField[] {
  const k = (key: string) => t(`editorInline.element.fields.${key}`)
  const color = (prop: 'color' | 'background-color', label: string): StyleField => ({
    prop,
    unit: '',
    spec: field(prop, 'color', label, { clearable: true }),
  })
  const range = (prop: StyleProp, label: string, min: number, max: number, step: number, unit: string): StyleField => ({
    prop,
    unit,
    spec: field(prop, 'range', label, { min, max, step, unit }),
  })
  const select = (prop: StyleProp, label: string, values: string[], names: string): StyleField => ({
    prop,
    unit: '',
    spec: field(prop, 'select', label, { options: values.map((v) => ({ value: v, label: k(`${names}.${v || 'inherit'}`) })) }),
  })
  if (kind === 'image') {
    return [
      color('background-color', k('background')),
      range('width', k('imageWidth'), 10, 100, 1, '%'),
      range('border-radius', k('imageRadius'), 0, 200, 2, 'px'),
    ]
  }
  if (kind === 'video') return [color('background-color', k('background'))]
  return [
    { prop: 'font-family', unit: '', spec: field('font-family', 'font', k('font')) },
    range('font-size', k('size'), 8, 120, 1, 'px'),
    select('font-weight', k('weight'), WEIGHTS, 'weights'),
    select('text-align', k('align'), ALIGNS, 'aligns'),
    color('color', k('color')),
    color('background-color', k('background')),
    range('letter-spacing', k('letter'), -3, 16, 0.5, 'px'),
    range('line-height', k('line'), 0.8, 3.2, 0.05, ''),
  ]
}

interface Props {
  blockId: string
  slot: string
  info: NodeInfo
}

/**
 * محتوى العنصر المحدَّد وتنسيقه (S4a): نص + ترس تنسيق، أو (لصورة) مصدرها بالمُنتقي والقص ومقاسها.
 * كل تعديل بيروح للـstore (‎editElement‎) فيتحفظ في ‎props.html‎ وبيتطبّق على المعاينة لحظياً.
 */
export function ElementFields({ blockId, slot, info }: Props) {
  const { t } = useTranslation()
  const actions = useElementActions()
  const textId = useId()
  const [gear, setGear] = useState(false)
  const { data: schema } = useSchema()
  const library = useEditor((s) => s.lib.fonts)
  const fields = useMemo(() => styleFields(t, info.kind), [t, info.kind])

  const computed = (prop: string) => computedValue(blockId, slot, prop)
  const number = (prop: StyleProp): number => {
    const inline = cssNumber(info.styles[prop])
    if (inline !== null) return inline
    const size = cssNumber(computed('font-size')) ?? 16
    switch (prop) {
      case 'font-size':
        return Math.round(size)
      case 'letter-spacing':
        return cssNumber(computed('letter-spacing')) ?? 0
      case 'line-height': {
        const px = cssNumber(computed('line-height'))
        return px === null ? 1.2 : lineRatio(px, size)
      }
      case 'width':
        return 100
      case 'border-radius':
        return Math.round(cssNumber(computed('border-top-left-radius')) ?? 0)
      default:
        return 0
    }
  }

  const fontValue = (raw: string) => {
    if (!raw) return ''
    const known = [...(schema?.fonts ?? []), ...library].map((f) => f.value)
    return known.find((v) => v && fontKey(v) === fontKey(raw)) ?? raw
  }

  const value = ({ prop, spec }: StyleField): unknown => {
    if (spec.type === 'range') return number(prop)
    if (spec.type === 'color') return toHex(info.styles[prop])
    if (prop === 'font-family') return fontValue(info.styles[prop])
    return info.styles[prop]
  }

  const write = (item: StyleField, next: unknown) => {
    const css = next === '' || next == null ? '' : `${next}${item.spec.type === 'range' ? item.unit : ''}`
    actions.edit({ kind: 'style', prop: item.prop, value: css }, `el-style:${slot}:${item.prop}`)
  }

  const panel = gear && (
    <div className="ed-inline-font-panel">
      {info.kind === 'image' && <p className="ed-hint">{t('editorInline.element.fields.imageHint')}</p>}
      {fields.map((item) => (
        <FieldRenderer key={item.prop} spec={item.spec} value={value(item)} onChange={(next) => write(item, next)} />
      ))}
    </div>
  )

  const gearButton = (
    <button
      type="button"
      className="ed-font-gear"
      aria-expanded={gear}
      aria-label={t('editorInline.element.fields.style')}
      title={t('editorInline.element.fields.styleHint')}
      onClick={() => setGear((open) => !open)}
    >
      ⚙
    </button>
  )

  return (
    <>
      {info.text !== null ? (
        <div className="ed-field" data-field-key="element-text">
          <label htmlFor={textId}>
            <span>{t('editorInline.element.fields.text')}</span>
          </label>
          <div className="ed-text-control-row">
            <textarea
              id={textId}
              className="ed-input"
              rows={4}
              value={info.text}
              placeholder={t('editorInline.element.fields.textPlaceholder')}
              onChange={(e) => actions.edit({ kind: 'text', value: e.target.value }, `el-text:${slot}`)}
            />
            {gearButton}
          </div>
          {panel}
        </div>
      ) : (
        <div className="ed-field" data-field-key="element-style">
          <label>
            <span>{t('editorInline.element.fields.style')}</span>
          </label>
          <div className="ed-ctrl-line">{gearButton}</div>
          {panel}
        </div>
      )}

      {info.kind === 'image' && (
        <FieldRenderer
          spec={field('src', 'image', t('editorInline.element.fields.image'), { media_kind: 'image' })}
          value={info.src ?? ''}
          onChange={(next) => actions.edit({ kind: 'src', value: String(next ?? '') }, `el-src:${slot}`)}
        />
      )}
    </>
  )
}
