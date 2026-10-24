/**
 * أنواع المحرر — بتطابق ‎system/api/editor.py‎ و‎system/blocks.py‎.
 *
 * مستند الدعوة والسكيما بيوصلوا بمفاتيح المحرك (‎snake_case‎) زي ما هم: دي بيانات
 * المحرك نفسه مش واجهة، والمستند بيرجع للسيرفر كما هو. الأغلفة (‎Bootstrap‎ …) camelCase.
 */

export type EditorMode = 'invitation' | 'template'
export type Device = 'mobile' | 'tablet' | 'desktop'

// ---------------------------------------------------------------- السكيما
export type FieldType =
  | 'text'
  | 'textarea'
  | 'html'
  | 'number'
  | 'range'
  | 'color'
  | 'select'
  | 'toggle'
  | 'image'
  | 'media'
  | 'url'
  | 'date'
  | 'datetime'
  | 'font'
  | 'align'
  | 'list'
  | 'gradient'
  | 'icon'

export interface FieldOption {
  value: string
  label: string
}

export interface AddVariant {
  key: string
  value: string
  label: string
  seed?: Record<string, unknown>
}

export interface FieldSpec {
  key: string
  label: string
  type: FieldType
  default: unknown
  group: string
  media_kind?: 'image' | 'audio' | 'video'
  help?: string
  options?: FieldOption[]
  fields?: FieldSpec[]
  add_label?: string
  add_variants?: AddVariant[]
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  feature?: string
  translate?: boolean
  translate_units?: boolean
  editor_hidden?: boolean
  group_open?: boolean
  /** حقول عنصر القايمة اللي بتظهر لأنواع معيّنة بس (نص/صورة/زرار) */
  show_kind?: string[]
  style_of?: string
  style_role?: string
}

export interface BlockSpec {
  type: string
  label: string
  icon: string
  description: string
  category: string
  props: FieldSpec[]
  style: FieldSpec[]
  feature: string
  singleton: boolean
}

export interface EditorSchema {
  version: number
  blocks: Record<string, BlockSpec>
  theme_fields: FieldSpec[]
  settings_fields: FieldSpec[]
  fonts: FieldOption[]
  animations: FieldOption[]
  dividers: FieldOption[]
  layout_max: { x: number; y: number }
}

// ---------------------------------------------------------------- المستند
export type Props = Record<string, unknown>

export interface DocBlock {
  id: string
  type: string
  visible: boolean
  locked: boolean
  /** اسم كتبه المستخدم — بيظهر في قايمة الأقسام بدل اسم النوع */
  label?: string
  props: Props
  style: Props
  /** إزاحات النصوص (C4) — بيتحفظ كما هو */
  layout?: Props
}

export interface EditorDocument {
  version: number
  theme: Props
  settings: Props
  blocks: DocBlock[]
  [extra: string]: unknown
}

// ---------------------------------------------------------------- الواجهة
/** بيانات المناسبة (camelCase) — تتحفظ مع المستند. ‎null‎ في محرر القالب. */
export interface EventFields {
  title: string
  eventType: string
  nameOne: string
  nameTwo: string
  eventDate: string
  venue: string
  address: string
  mapUrl: string
  whatsapp: string
  status: string
  expiresAt: string
  password: string
  slug: string
}

export interface AssetRow {
  id: number
  url: string
  thumb: string
  source: string
  name: string
  kind: 'image' | 'audio' | 'video'
  used: boolean
}

export interface IntroRow {
  id: number
  name: string
  url: string
  poster: string
  seconds: number
  note: string
}

export interface MusicRow {
  id: number
  name: string
  url: string
  note: string
}

export interface FontRow {
  id: number
  name: string
  nameEn: string
  label: string
  value: string
  family: string
  url: string
  weight: string
  style: string
}

export interface EditorMeta {
  slug: string
  status: string
  planName: string
  templateName: string
  publicUrl: string
  clientFollowupUrl: string
  backUrl: string
}

export interface Bootstrap {
  mode: EditorMode
  id: number
  title: string
  document: EditorDocument
  fields: EventFields | null
  features: string[]
  assets: AssetRow[]
  fonts: FontRow[]
  intros: IntroRow[]
  music: MusicRow[]
  categories: { value: string; label: string }[]
  meta: EditorMeta
}

export interface SaveResponse {
  savedAt: string
  slug: string
  status: string
  publicUrl: string
  clientFollowupUrl: string
}

/** رسائل الـiframe ↔ الصفحة الأم (‎postMessage‎، نفس الأصل) */
export const FRAME_PREFIX = 'lb-editor:'
export type ToFrame =
  | { type: 'lb-editor:render'; payload: unknown; selected: string | null }
  | { type: 'lb-editor:select'; id: string | null; scroll: boolean }
export type FromFrame =
  | { type: 'lb-editor:ready' }
  | { type: 'lb-editor:select'; id: string }
