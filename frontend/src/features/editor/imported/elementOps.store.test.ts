import { beforeEach, describe, expect, it } from 'vitest'

import { resetEditor, useEditor } from '../store'
import type { Bootstrap, DocBlock } from '../types'

const HTML =
  '<div data-move="el-1"><h1 data-move="el-2">عنوان</h1><img data-move="el-3" src="/m/a.png">' +
  '<div data-move="el-4"><a data-move="el-5" href="#">زر</a></div></div>'

const custom = (id: string, extra: Partial<DocBlock> = {}): DocBlock => ({
  id, type: 'custom_html', visible: true, locked: false, props: { html: HTML }, style: {},
  layout: { 'el-4': { dx: 10, dy: 5 }, 'el-5': { dx: 3, dy: 2 }, 'el-2': { dx: 1, dy: 1 } },
  ...extra,
})

const boot = (blocks: DocBlock[], lang = 'ar'): Bootstrap => ({
  mode: 'template', id: 1, title: 't',
  document: { version: 1, theme: { base_lang: lang }, settings: {}, blocks },
  fields: null, features: [], assets: [], fonts: [], intros: [], music: [], categories: [],
  meta: { slug: 's', status: '', planName: '', templateName: '', publicUrl: '', clientFollowupUrl: '', backUrl: '' },
})

const s = () => useEditor.getState()
const block = (id = 'a') => s().doc.blocks.find((b) => b.id === id)!
const html = (id = 'a') => String(block(id).props.html)
const slotsOf = (id = 'a') => Array.from(new DOMParser().parseFromString(html(id), 'text/html').querySelectorAll('[data-move]')).map((n) => n.getAttribute('data-move'))

beforeEach(() => {
  resetEditor()
  s().load(boot([custom('a'), custom('locked', { locked: true })]))
  s().select('a', 'preview')
})

describe('copy', () => {
  it('fills the clipboard with a clean copy and leaves the document alone', () => {
    s().selectElement('a', 'el-4')
    expect(s().copyElement()).toBe('ok')
    expect(s().clip).toContain('زر')
    expect(s().clip).not.toContain('data-move')
    expect(s().history).toHaveLength(0)
    expect(s().saveStatus).toBe('saved')
  })

  it('reports a missing element when nothing is selected', () => {
    s().selectElement('a', null)
    expect(s().copyElement()).toBe('missing')
    expect(s().clip).toBeNull()
  })
})

describe('paste and duplicate', () => {
  it('paste is one undo step, selects the new element, and keeps the clip for the next paste', () => {
    s().selectElement('a', 'el-2')
    s().copyElement()
    expect(s().pasteElement()).toBe('ok')
    expect(s().history).toHaveLength(1)
    expect(s().selEl).toEqual({ blockId: 'a', slot: 'el-6' })
    expect(slotsOf()).toEqual(['el-1', 'el-2', 'el-6', 'el-3', 'el-4', 'el-5'])
    expect(s().pasteElement()).toBe('ok')
    expect(s().selEl?.slot).toBe('el-7') // الحافظة لسه موجودة
    expect(s().history).toHaveLength(2)
  })

  it('paste with an empty clipboard says so and does nothing', () => {
    s().selectElement('a', 'el-2')
    expect(s().pasteElement()).toBe('empty')
    expect(s().history).toHaveLength(0)
  })

  it('paste inside puts the copy in the container', () => {
    s().selectElement('a', 'el-2')
    s().copyElement()
    s().selectElement('a', 'el-4')
    expect(s().pasteElement(true)).toBe('ok')
    const inner = new DOMParser().parseFromString(html(), 'text/html').querySelector('[data-move="el-4"]')!
    expect(inner.children).toHaveLength(2)
  })

  it('duplicate leaves the clipboard alone and selects the copy', () => {
    s().selectElement('a', 'el-2')
    s().copyElement()
    const clip = s().clip
    s().selectElement('a', 'el-5')
    expect(s().duplicateElement()).toBe('ok')
    expect(s().clip).toBe(clip)
    expect(s().selEl?.slot).toBe('el-6')
    expect(s().history).toHaveLength(1)
  })

  it('undo removes the pasted element and clears the now-dangling selection; redo brings the html back', () => {
    s().selectElement('a', 'el-2')
    s().copyElement()
    s().pasteElement()
    const pasted = html()
    s().undo()
    expect(html()).toBe(HTML)
    expect(s().selEl).toBeNull()
    s().redo()
    expect(html()).toBe(pasted)
  })
})

describe('delete', () => {
  it('removes the element and everything inside it, drops their positions, in one step', () => {
    s().selectElement('a', 'el-4')
    expect(s().deleteElement()).toBe('ok')
    expect(slotsOf()).toEqual(['el-1', 'el-2', 'el-3'])
    expect(block().layout).toEqual({ 'el-2': { dx: 1, dy: 1 } })
    expect(s().selEl).toBeNull()
    expect(s().history).toHaveLength(1)
    // خطوة تراجع واحدة بترجّع النص والمواضع مع بعض
    s().undo()
    expect(html()).toBe(HTML)
    expect(block().layout).toEqual({ 'el-4': { dx: 10, dy: 5 }, 'el-5': { dx: 3, dy: 2 }, 'el-2': { dx: 1, dy: 1 } })
  })

  it('removes the last layout entry and the layout key itself', () => {
    s().load(boot([custom('a', { layout: { 'el-3': { dx: 4, dy: 4 } } })]))
    s().selectElement('a', 'el-3')
    s().deleteElement()
    expect(block().layout).toBeUndefined()
  })

  it('deleting a layer by its number (from the layers list) clears the selection', () => {
    s().selectElement('a', 'el-2')
    expect(s().deleteElement('el-5')).toBe('ok')
    expect(slotsOf()).toEqual(['el-1', 'el-2', 'el-3', 'el-4'])
    expect(s().selEl).toBeNull() // الطبقة اتحذفت من الطبقات: التحديد بيتصفّر (زي القديم)
  })

  it('never removes the section itself', () => {
    s().selectElement('a', 'el-1')
    s().deleteElement()
    expect(s().doc.blocks.map((b) => b.id)).toEqual(['a', 'locked'])
    expect(html()).toBe('')
  })

  it('a missing element is reported, not thrown', () => {
    s().selectElement('a', 'el-99')
    expect(s().deleteElement()).toBe('missing')
    expect(s().history).toHaveLength(0)
  })
})

describe('add', () => {
  it('adds a text element inside a container as one step and selects it', () => {
    s().selectElement('a', 'el-4')
    expect(s().addElement('text', 'نص جديد')).toBe('ok')
    expect(s().selEl?.slot).toBe('el-6')
    expect(html()).toContain('نص جديد')
    expect(s().history).toHaveLength(1)
  })

  it('adds an image by url', () => {
    s().selectElement('a', 'el-4')
    s().addElement('image', '/m/new.png')
    expect(html()).toContain('src="/m/new.png"')
  })
})

describe('select parent', () => {
  it('moves the selection up to the nearest numbered ancestor without touching the document', () => {
    s().selectElement('a', 'el-5')
    expect(s().selectParentElement()).toBe('ok')
    expect(s().selEl).toEqual({ blockId: 'a', slot: 'el-4' })
    expect(s().history).toHaveLength(0)
    s().selectElement('a', 'el-1')
    expect(s().selectParentElement()).toBe('top')
    expect(s().selEl?.slot).toBe('el-1')
  })
})

describe('guards', () => {
  it('refuses structure edits while the translated preview is shown (nothing is written)', () => {
    s().setRenderedLang('en')
    s().selectElement('a', 'el-2')
    s().copyElement() // القراءة مسموحة (من النص المحفوظ مش من المعاينة)
    expect(s().deleteElement()).toBe('translated')
    expect(s().pasteElement()).toBe('translated')
    expect(s().duplicateElement()).toBe('translated')
    expect(s().addElement('text', 'x')).toBe('translated')
    expect(html()).toBe(HTML)
    expect(s().history).toHaveLength(0)
    expect(s().saveStatus).toBe('saved')
  })

  it('edits work again once the base language is shown', () => {
    s().setRenderedLang('en')
    s().setRenderedLang('ar')
    s().selectElement('a', 'el-2')
    expect(s().deleteElement()).toBe('ok')
  })

  it('a document whose base language is English shows English as the real one', () => {
    s().load(boot([custom('a')], 'en'))
    s().setRenderedLang('en')
    s().selectElement('a', 'el-2')
    expect(s().deleteElement()).toBe('ok')
  })

  it('refuses a locked section', () => {
    s().selectElement('locked', 'el-2')
    expect(s().deleteElement()).toBe('locked')
    expect(html('locked')).toBe(HTML)
  })

  it('a section that is not an imported one (no html) is not an element target', () => {
    s().load(boot([custom('plain', { props: {} })]))
    s().selectElement('plain', 'el-2')
    expect(s().deleteElement()).toBe('missing')
  })
})
