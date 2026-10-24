import type { BlockSpec, DocBlock, EditorDocument, FieldSpec, Props } from './types'

/**
 * عمليات المستند — دوال نقية (من غير تعديل في المكان) عشان التاريخ يبقى لقطات رخيصة.
 * المنطق مطابق لـ‎editor.js‎ القديم: ‎uid‎، ‎defaultsFor‎، ‎addBlock‎، التكرار، السحب.
 */

export function newBlockId(type: string): string {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`
}

const clone = <T,>(value: T): T => (value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T))

/** القيم الافتراضية لقايمة حقول — نسخة جديدة لكل قسم (القوايم والكائنات ما تتشاركش). */
export function defaultsFor(specs: FieldSpec[] | undefined): Props {
  const out: Props = {}
  for (const spec of specs ?? []) out[spec.key] = clone(spec.default)
  return out
}

export function makeBlock(spec: BlockSpec): DocBlock {
  return {
    id: newBlockId(spec.type),
    type: spec.type,
    visible: true,
    locked: false,
    props: defaultsFor(spec.props),
    style: defaultsFor(spec.style),
  }
}

export const blockIndex = (doc: EditorDocument, id: string) => doc.blocks.findIndex((b) => b.id === id)

export const findBlock = (doc: EditorDocument, id: string | null | undefined): DocBlock | null =>
  (id && doc.blocks.find((b) => b.id === id)) || null

function withBlocks(doc: EditorDocument, blocks: DocBlock[]): EditorDocument {
  return { ...doc, blocks }
}

function mapBlock(doc: EditorDocument, id: string, change: (block: DocBlock) => DocBlock): EditorDocument {
  let touched = false
  const blocks = doc.blocks.map((block) => {
    if (block.id !== id) return block
    touched = true
    return change(block)
  })
  return touched ? withBlocks(doc, blocks) : doc
}

/** يضيف القسم بعد القسم المحدد (أو في الآخر لو مفيش تحديد) — زي ‎addBlock‎ القديمة. */
export function insertBlock(doc: EditorDocument, block: DocBlock, afterId?: string | null): EditorDocument {
  const after = afterId ? blockIndex(doc, afterId) : -1
  const at = after >= 0 ? after + 1 : doc.blocks.length
  const blocks = doc.blocks.slice()
  blocks.splice(at, 0, block)
  return withBlocks(doc, blocks)
}

/** نسخة بمعرّف جديد بعد الأصل مباشرة. ‎null‎ لو القسم مش موجود. */
export function duplicateBlock(doc: EditorDocument, id: string): { doc: EditorDocument; id: string } | null {
  const at = blockIndex(doc, id)
  if (at < 0) return null
  const source = doc.blocks[at]
  const copy: DocBlock = { ...clone(source), id: newBlockId(source.type) }
  const blocks = doc.blocks.slice()
  blocks.splice(at + 1, 0, copy)
  return { doc: withBlocks(doc, blocks), id: copy.id }
}

export function removeBlock(doc: EditorDocument, id: string): EditorDocument {
  const at = blockIndex(doc, id)
  if (at < 0) return doc
  return withBlocks(doc, doc.blocks.filter((b) => b.id !== id))
}

/** ينقل القسم من مكانه لمكان قسم تاني (نفس ‎splice(to, 0, splice(from, 1))‎ القديمة). */
export function moveBlock(doc: EditorDocument, fromId: string, toId: string): EditorDocument {
  const from = blockIndex(doc, fromId)
  const to = blockIndex(doc, toId)
  if (from < 0 || to < 0 || from === to) return doc
  const blocks = doc.blocks.slice()
  blocks.splice(to, 0, blocks.splice(from, 1)[0])
  return withBlocks(doc, blocks)
}

export const toggleVisible = (doc: EditorDocument, id: string) =>
  mapBlock(doc, id, (block) => ({ ...block, visible: !block.visible }))

export const setBlockLabel = (doc: EditorDocument, id: string, label: string) =>
  mapBlock(doc, id, (block) => {
    const next = { ...block }
    if (label) next.label = label
    else delete next.label
    return next
  })

export const setBlockProp = (doc: EditorDocument, id: string, key: string, value: unknown) =>
  mapBlock(doc, id, (block) => ({ ...block, props: { ...block.props, [key]: value } }))

export const setBlockStyle = (doc: EditorDocument, id: string, key: string, value: unknown) =>
  mapBlock(doc, id, (block) => ({ ...block, style: { ...block.style, [key]: value } }))

export const setTheme = (doc: EditorDocument, key: string, value: unknown): EditorDocument => ({
  ...doc,
  theme: { ...doc.theme, [key]: value },
})

export const setSetting = (doc: EditorDocument, key: string, value: unknown): EditorDocument => ({
  ...doc,
  settings: { ...doc.settings, [key]: value },
})
