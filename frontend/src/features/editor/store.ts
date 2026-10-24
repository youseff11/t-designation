import { create } from 'zustand'

import { ApiError } from '@/api/client'

import { postSave } from './api'
import * as ops from './doc'
import type {
  AssetRow,
  BlockSpec,
  Bootstrap,
  Device,
  EditorDocument,
  EditorMeta,
  EditorMode,
  EventFields,
  FieldOption,
  FontRow,
  IntroRow,
  MusicRow,
} from './types'

export const HISTORY_MAX = 60
/** تعديلات متتالية على نفس الحقل خلال المدة دي = خطوة تراجع واحدة */
export const COALESCE_MS = 900

export type Tab = 'blocks' | 'inspector' | 'theme' | 'data' | 'i18n' | 'settings'
export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'
/** مصدر التحديد: ضغطة في قايمة الأقسام بتمرّر المعاينة للقسم، وضغطة في المعاينة لأ. */
export type SelectSource = 'list' | 'preview' | null

export interface Libraries {
  assets: AssetRow[]
  fonts: FontRow[]
  intros: IntroRow[]
  music: MusicRow[]
  categories: { value: string; label: string }[]
}

interface Data {
  loaded: boolean
  mode: EditorMode
  id: number
  title: string
  meta: EditorMeta | null
  features: string[]
  lib: Libraries
  /** خيارات حالة الدعوة لتبويب «البيانات» */
  statusChoices: FieldOption[]

  doc: EditorDocument
  fields: EventFields | null
  /** أخطاء التحقق من آخر حفظ (بالحقل) — بتتمسح لما الحقل يتعدّل */
  fieldErrors: Record<string, string>

  selected: string | null
  selectSource: SelectSource
  tab: Tab
  device: Device
  /** لغة المعاينة المطلوبة؛ فاضي = لغة الدعوة الأساسية */
  previewLang: string

  history: EditorDocument[]
  future: EditorDocument[]
  coalesce: { key: string; at: number } | null
  /** بيزيد مع أي تعديل في المستند أو بيانات المناسبة — المعاينة والحفظ بيراقبوه */
  rev: number

  saveStatus: SaveStatus
  savedAt: string
  saveError: string
}

interface Actions {
  load: (boot: Bootstrap) => void
  /** نقطة التعديل الوحيدة للمستند: بتحفظ لقطة للتراجع وتعلّم «غير محفوظ» */
  commit: (change: (doc: EditorDocument) => EditorDocument, opts?: { coalesce?: string }) => void
  select: (id: string | null, source?: SelectSource) => void
  setTab: (tab: Tab) => void
  setDevice: (device: Device) => void
  setPreviewLang: (lang: string) => void

  addBlock: (spec: BlockSpec) => boolean
  duplicate: (id: string) => boolean
  remove: (id: string) => void
  move: (fromId: string, toId: string) => void
  toggleVisible: (id: string) => void
  rename: (id: string, label: string) => void
  setProp: (id: string, key: string, value: unknown) => void
  setStyle: (id: string, key: string, value: unknown) => void
  setTheme: (key: string, value: unknown) => void
  setSetting: (key: string, value: unknown) => void
  setEventField: (key: keyof EventFields, value: string) => void

  /** المكتبات (C3): بتتحدّث بعد الرفع/القص/الحذف من غير ما تحسب تعديل في المستند */
  setAssets: (assets: AssetRow[]) => void
  addAsset: (asset: AssetRow) => void
  removeAssets: (ids: number[]) => void
  addFont: (font: FontRow) => void

  undo: () => void
  redo: () => void
  save: () => Promise<boolean>
}

export type EditorState = Data & Actions

const emptyDoc = (): EditorDocument => ({ version: 1, theme: {}, settings: {}, blocks: [] })

const initial = (): Data => ({
  loaded: false,
  mode: 'invitation',
  id: 0,
  title: '',
  meta: null,
  features: [],
  lib: { assets: [], fonts: [], intros: [], music: [], categories: [] },
  statusChoices: [],
  doc: emptyDoc(),
  fields: null,
  fieldErrors: {},
  selected: null,
  selectSource: null,
  tab: 'blocks',
  device: 'mobile',
  previewLang: '',
  history: [],
  future: [],
  coalesce: null,
  rev: 0,
  saveStatus: 'saved',
  savedAt: '',
  saveError: '',
})

/** التحديد لازم يفضل على قسم موجود (بعد حذف/تراجع). */
const keepSelection = (doc: EditorDocument, selected: string | null) =>
  selected && doc.blocks.some((b) => b.id === selected) ? selected : null

export const useEditor = create<EditorState>()((set, get) => ({
  ...initial(),

  load: (boot) =>
    set({
      ...initial(),
      loaded: true,
      mode: boot.mode,
      id: boot.id,
      title: boot.title,
      meta: boot.meta,
      features: boot.features,
      lib: {
        assets: boot.assets,
        fonts: boot.fonts,
        intros: boot.intros,
        music: boot.music,
        categories: boot.categories,
      },
      statusChoices: boot.statusChoices ?? [],
      doc: boot.document,
      fields: boot.fields,
    }),

  commit: (change, opts) => {
    const state = get()
    const next = change(state.doc)
    if (next === state.doc) return
    const now = Date.now()
    const burst = !!opts?.coalesce && state.coalesce?.key === opts.coalesce && now - state.coalesce.at < COALESCE_MS
    set({
      doc: next,
      history: burst ? state.history : [...state.history, state.doc].slice(-HISTORY_MAX),
      future: [],
      coalesce: opts?.coalesce ? { key: opts.coalesce, at: now } : null,
      selected: keepSelection(next, state.selected),
      saveStatus: state.saveStatus === 'saving' ? 'saving' : 'dirty',
      rev: state.rev + 1,
    })
  },

  select: (id, source = 'list') =>
    set((state) => ({
      selected: id,
      selectSource: id ? source : null,
      tab: id && source === 'list' ? 'inspector' : state.tab,
    })),
  setTab: (tab) => set({ tab }),
  setDevice: (device) => set({ device }),
  setPreviewLang: (previewLang) => set((state) => ({ previewLang, rev: state.rev + 1 })),

  addBlock: (spec) => {
    const { doc, selected, commit } = get()
    if (spec.singleton && doc.blocks.some((b) => b.type === spec.type)) return false
    const block = ops.makeBlock(spec)
    commit((d) => ops.insertBlock(d, block, selected))
    set({ selected: block.id, selectSource: 'list', tab: 'inspector' })
    return true
  },

  duplicate: (id) => {
    let newId: string | null = null
    get().commit((d) => {
      const result = ops.duplicateBlock(d, id)
      if (!result) return d
      newId = result.id
      return result.doc
    })
    if (newId) set({ selected: newId, selectSource: 'list' })
    return !!newId
  },

  remove: (id) => get().commit((d) => ops.removeBlock(d, id)),
  move: (fromId, toId) => get().commit((d) => ops.moveBlock(d, fromId, toId)),
  toggleVisible: (id) => get().commit((d) => ops.toggleVisible(d, id)),
  rename: (id, label) => get().commit((d) => ops.setBlockLabel(d, id, label), { coalesce: `label:${id}` }),
  setProp: (id, key, value) => get().commit((d) => ops.setBlockProp(d, id, key, value), { coalesce: `prop:${id}:${key}` }),
  setStyle: (id, key, value) => get().commit((d) => ops.setBlockStyle(d, id, key, value), { coalesce: `style:${id}:${key}` }),
  setTheme: (key, value) => get().commit((d) => ops.setTheme(d, key, value), { coalesce: `theme:${key}` }),
  setSetting: (key, value) => get().commit((d) => ops.setSetting(d, key, value), { coalesce: `setting:${key}` }),

  setEventField: (key, value) =>
    set((state) => {
      if (!state.fields || state.fields[key] === value) return {}
      const { [key]: _cleared, ...errors } = state.fieldErrors
      return {
        fields: { ...state.fields, [key]: value },
        fieldErrors: errors,
        saveStatus: state.saveStatus === 'saving' ? 'saving' : 'dirty',
        rev: state.rev + 1,
      }
    }),

  setAssets: (assets) => set((state) => ({ lib: { ...state.lib, assets } })),
  addAsset: (asset) =>
    set((state) => ({ lib: { ...state.lib, assets: [asset, ...state.lib.assets.filter((a) => a.id !== asset.id)] } })),
  removeAssets: (ids) =>
    set((state) => ({ lib: { ...state.lib, assets: state.lib.assets.filter((a) => !ids.includes(a.id)) } })),
  addFont: (font) =>
    set((state) => ({ lib: { ...state.lib, fonts: [...state.lib.fonts.filter((f) => f.id !== font.id), font] } })),

  undo: () =>
    set((state) => {
      const previous = state.history.at(-1)
      if (!previous) return {}
      return {
        doc: previous,
        history: state.history.slice(0, -1),
        future: [...state.future, state.doc],
        coalesce: null,
        selected: keepSelection(previous, state.selected),
        saveStatus: state.saveStatus === 'saving' ? 'saving' : 'dirty',
        rev: state.rev + 1,
      }
    }),

  redo: () =>
    set((state) => {
      const next = state.future.at(-1)
      if (!next) return {}
      return {
        doc: next,
        history: [...state.history, state.doc],
        future: state.future.slice(0, -1),
        coalesce: null,
        selected: keepSelection(next, state.selected),
        saveStatus: state.saveStatus === 'saving' ? 'saving' : 'dirty',
        rev: state.rev + 1,
      }
    }),

  save: async () => {
    const start = get()
    if (!start.loaded || start.saveStatus === 'saving') return false
    set({ saveStatus: 'saving', saveError: '', fieldErrors: {} })
    try {
      const res = await postSave(start.mode, start.id, start.doc, start.fields)
      const now = get()
      // اتعدّل حاجة أثناء الحفظ؟ يفضل «غير محفوظ» والحفظ التلقائي الجاي بيلحقها
      const changed = now.rev !== start.rev
      set({
        saveStatus: changed ? 'dirty' : 'saved',
        savedAt: res.savedAt,
        meta: now.meta
          ? { ...now.meta, slug: res.slug, status: res.status || now.meta.status, publicUrl: res.publicUrl, clientFollowupUrl: res.clientFollowupUrl }
          : now.meta,
        // الرابط ممكن يتنضّف على السيرفر (مسافات/حروف كبيرة) — إلا لو اتغيّر أثناء الحفظ (زرار «تغيير الرابط»)
        fields: now.fields && now.fields.slug === start.fields?.slug ? { ...now.fields, slug: res.slug } : now.fields,
      })
      return true
    } catch (error) {
      const api = error instanceof ApiError ? error : null
      set({
        saveStatus: 'error',
        // رسالة السيرفر لو فيه؛ فاضي = الواجهة بتعرض نصها العام المترجم
        saveError: api?.message ?? '',
        fieldErrors: api?.fields ?? {},
      })
      return false
    }
  },
}))

/** يرجّع الستور لحالته الأولى (للاختبارات ولما المحرر يتقفل). */
export const resetEditor = () => useEditor.setState(initial(), false)
