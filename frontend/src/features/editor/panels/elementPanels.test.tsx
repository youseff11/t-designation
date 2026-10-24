import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { initI18n } from '@/i18n'

import { resetEditor, useEditor } from '../store'
import type { Bootstrap, DocBlock } from '../types'
import { EditorUiProvider } from '../ui'
import { ElementPanel } from './ElementPanel'
import { LayersGroup } from './LayersGroup'

vi.mock('../hooks', () => ({
  useSchema: () => ({ data: { fonts: [{ value: "'Cairo', sans-serif", label: 'Cairo' }] } }),
}))

const HTML =
  '<div data-move="el-1"><h1 data-move="el-2">العريس والعروسة</h1><img data-move="el-3" src="/m/a.png">' +
  '<div data-move="el-4"><a data-move="el-5" href="#">سجّل حضورك</a></div></div>'

const section = (): DocBlock => ({
  id: 'a', type: 'custom_html', visible: true, locked: false, props: { html: HTML }, style: {},
})
const boot = (): Bootstrap => ({
  mode: 'template', id: 1, title: 't',
  document: { version: 1, theme: {}, settings: {}, blocks: [section()] },
  fields: null, features: [], assets: [], fonts: [], intros: [], music: [], categories: [],
  meta: { slug: 's', status: '', planName: '', templateName: '', publicUrl: '', clientFollowupUrl: '', backUrl: '' },
})

const s = () => useEditor.getState()
const current = () => s().doc.blocks[0]

function Panels() {
  const block = useEditor((st) => st.doc.blocks[0])
  return (
    <>
      <ElementPanel block={block} />
      <LayersGroup block={block} />
    </>
  )
}
const mount = () => render(<Panels />, { wrapper: EditorUiProvider })
const button = (name: string | RegExp) => screen.getByRole('button', { name })

beforeAll(() => {
  initI18n('ar')
})
beforeEach(() => {
  resetEditor()
  s().load(boot())
  s().select('a', 'preview')
})
afterEach(() => vi.restoreAllMocks())

describe('ElementPanel actions', () => {
  it('asks to pick an element first, then shows its number and the actions', () => {
    mount()
    expect(screen.getByText(/اضغط على أي حاجة/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'نسخ' })).toBeNull()
    act(() => s().selectElement('a', 'el-2'))
    expect(screen.getByText(/رقم العنصر: el-2/)).toBeTruthy()
    expect(button('نسخ')).toBeTruthy()
    expect(button('احذف')).toBeTruthy()
  })

  it('paste buttons wait for a copy; paste-inside is off for text units', () => {
    mount()
    act(() => s().selectElement('a', 'el-4'))
    expect((button('لصق') as HTMLButtonElement).disabled).toBe(true)
    expect((button('لصق جوّه') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(button('نسخ'))
    expect(s().clip).toContain('سجّل حضورك')
    expect((button('لصق') as HTMLButtonElement).disabled).toBe(false)
    expect((button('لصق جوّه') as HTMLButtonElement).disabled).toBe(false) // el-4 حاوية
    act(() => s().selectElement('a', 'el-2'))
    expect((button('لصق') as HTMLButtonElement).disabled).toBe(false)
    expect((button('لصق جوّه') as HTMLButtonElement).disabled).toBe(true) // el-2 وحدة نص
  })

  it('paste, duplicate and delete are one undo step each', () => {
    mount()
    act(() => s().selectElement('a', 'el-5'))
    fireEvent.click(button('كرّر'))
    expect(String(current().props.html).match(/سجّل حضورك/g)).toHaveLength(2)
    expect(s().selEl?.slot).toBe('el-6')
    fireEvent.click(button('احذف'))
    expect(String(current().props.html).match(/سجّل حضورك/g)).toHaveLength(1)
    expect(s().history).toHaveLength(2)
    expect(s().selEl).toBeNull()
  })

  it('"parent" selects the container and adding text puts a new paragraph inside it', () => {
    mount()
    act(() => s().selectElement('a', 'el-5'))
    fireEvent.click(button('↰ الأب'))
    expect(s().selEl?.slot).toBe('el-4')
    fireEvent.click(button('＋ نص'))
    expect(String(current().props.html)).toContain('نص جديد')
    expect(s().history).toHaveLength(1)
  })

  it('refuses structure edits in the translated preview and tells the user', () => {
    mount()
    act(() => {
      s().setRenderedLang('en')
      s().selectElement('a', 'el-5')
    })
    fireEvent.click(button('احذف'))
    expect(String(current().props.html)).toBe(HTML)
    expect(screen.getByText(/النسخة المترجَمة/)).toBeTruthy()
  })
})

describe('ElementPanel content and style (S4a)', () => {
  const html = () => String(current().props.html)
  const field = (container: HTMLElement, key: string) => container.querySelector(`[data-field-key="${key}"]`) as HTMLElement
  const gear = () => screen.getByRole('button', { name: 'تنسيق العنصر' })

  it('shows the text of a text unit and writes typing back to props.html as one undo step', () => {
    mount()
    act(() => s().selectElement('a', 'el-2'))
    const box = screen.getByPlaceholderText('اكتب محتوى النص هنا') as HTMLTextAreaElement
    expect(box.value).toBe('العريس والعروسة')
    fireEvent.change(box, { target: { value: 'عريس' } })
    fireEvent.change(box, { target: { value: 'عريس وعروسة' } })
    expect(html()).toContain('>عريس وعروسة</h1>')
    expect(s().history).toHaveLength(1)
    expect((screen.getByPlaceholderText('اكتب محتوى النص هنا') as HTMLTextAreaElement).value).toBe('عريس وعروسة')
  })

  it('keeps the style tools behind the gear, and sizes, weights and colours land in the inline style', () => {
    const { container } = mount()
    act(() => s().selectElement('a', 'el-2'))
    expect(container.querySelector('[data-field-key="font-size"]')).toBeNull()
    fireEvent.click(gear())

    const size = field(container, 'font-size').querySelector('input[type="number"]') as HTMLInputElement
    fireEvent.change(size, { target: { value: '34' } })
    expect(html()).toContain('font-size: 34px')

    fireEvent.change(field(container, 'font-weight').querySelector('select')!, { target: { value: '700' } })
    expect(html()).toContain('font-weight: 700')

    fireEvent.change(field(container, 'color').querySelector('input[type="text"]')!, { target: { value: '#112233' } })
    expect(html()).toMatch(/color: (#112233|rgb\(17, 34, 51\))/)
    fireEvent.click(within(field(container, 'color')).getByRole('button', { name: 'مسح' }))
    expect(html()).not.toMatch(/[^-]color:/)

    fireEvent.change(field(container, 'font-family').querySelector('select')!, { target: { value: "'Cairo', sans-serif" } })
    expect(html()).toMatch(/font-family: (&quot;)?Cairo/)
    // الأسهم مابتأثرش على ما اتكتب قبل كده
    expect(html()).toContain('font-size: 34px')
  })

  it('shows the current inline value when the element is selected again', () => {
    const { container } = mount()
    act(() => s().selectElement('a', 'el-2'))
    fireEvent.click(gear())
    fireEvent.change(field(container, 'font-size').querySelector('input[type="number"]')!, { target: { value: '40' } })
    act(() => s().selectElement('a', 'el-5'))
    act(() => s().selectElement('a', 'el-2'))
    fireEvent.click(gear())
    expect((field(container, 'font-size').querySelector('input[type="number"]') as HTMLInputElement).value).toBe('40')
  })

  it('an image gets its source, width, radius and background — never font tools', () => {
    const { container } = mount()
    act(() => s().selectElement('a', 'el-3'))
    expect(screen.queryByPlaceholderText('اكتب محتوى النص هنا')).toBeNull()
    fireEvent.click(gear())
    expect(field(container, 'font-size')).toBeNull()
    expect(field(container, 'font-family')).toBeNull()
    expect(field(container, 'width')).not.toBeNull()
    expect(field(container, 'border-radius')).not.toBeNull()
    expect(screen.getByText(/دي صورة/)).toBeTruthy()

    fireEvent.change(field(container, 'width').querySelector('input[type="number"]')!, { target: { value: '60' } })
    expect(html()).toContain('width: 60%')

    const src = field(container, 'src').querySelector('input[type="text"]') as HTMLInputElement
    expect(src.value).toBe('/m/a.png')
    fireEvent.change(src, { target: { value: '/m/b.png' } })
    expect(html()).toContain('src="/m/b.png"')
  })

  it('hide / show toggles display on the element itself', () => {
    mount()
    act(() => s().selectElement('a', 'el-4'))
    fireEvent.click(button('إخفاء'))
    expect(html()).toMatch(/data-move="el-4"[^>]*display: none|display: none[^>]*data-move="el-4"/)
    fireEvent.click(button('إظهار'))
    expect(html()).toBe(HTML)
  })

  it('nudge buttons move the element by a pixel (a quarter step for cqw slots) and "reset" puts it back', () => {
    mount()
    act(() => s().selectElement('a', 'el-3'))
    expect(screen.getByText(/الموضع \(0px \/ 0px\)/)).toBeTruthy()
    fireEvent.click(screen.getAllByTitle('تحريك بكسل واحد')[0]) // →
    fireEvent.click(screen.getAllByTitle('تحريك بكسل واحد')[3]) // ↓
    expect(current().layout).toEqual({ 'el-3': { dx: 1, dy: 1 } })
    expect(screen.getByText(/الموضع \(1px \/ 1px\)/)).toBeTruthy()
    fireEvent.click(button('للأصل'))
    expect(current().layout).toBeUndefined()
  })

  it('tells once when a change is refused in the translated preview', () => {
    mount()
    act(() => {
      s().setRenderedLang('en')
      s().selectElement('a', 'el-2')
    })
    fireEvent.change(screen.getByPlaceholderText('اكتب محتوى النص هنا'), { target: { value: 'x' } })
    fireEvent.change(screen.getByPlaceholderText('اكتب محتوى النص هنا'), { target: { value: 'xy' } })
    expect(html()).toBe(HTML)
    expect(screen.getAllByText(/النسخة المترجَمة/)).toHaveLength(1)
  })
})

describe('LayersGroup', () => {
  const open = (container: HTMLElement) => {
    const details = container.querySelector('details.ed-layers-group') as HTMLDetailsElement
    details.open = true
    fireEvent(details, new Event('toggle'))
  }

  it('builds nothing until opened, then lists the visible elements with names and text', () => {
    const { container } = mount()
    expect(container.querySelectorAll('.ed-layer-item')).toHaveLength(0)
    open(container)
    const rows = Array.from(container.querySelectorAll('.ed-layer-item')).map((r) => r.querySelector('.ed-layer-name')?.textContent)
    expect(rows).toEqual(['نص — العريس والعروسة', 'صورة', 'نص — سجّل حضورك'])
  })

  it('clicking a layer selects that element; the active one is marked', () => {
    const { container } = mount()
    open(container)
    fireEvent.click(container.querySelector('[data-layer-slot="el-3"]')!)
    expect(s().selEl).toEqual({ blockId: 'a', slot: 'el-3' })
    expect(container.querySelector('[data-layer-slot="el-3"]')?.classList.contains('is-active')).toBe(true)
    expect(container.querySelector('[data-layer-slot="el-2"]')?.classList.contains('is-active')).toBe(false)
  })

  it('Enter on a focused layer selects it too', () => {
    const { container } = mount()
    open(container)
    fireEvent.keyDown(container.querySelector('[data-layer-slot="el-5"]')!, { key: 'Enter' })
    expect(s().selEl?.slot).toBe('el-5')
  })

  it('the × deletes the layer after a confirm, and a "no" keeps it', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { container } = mount()
    open(container)
    const remove = () => within(container.querySelector('[data-layer-slot="el-3"]') as HTMLElement).getByRole('button', { name: 'حذف الطبقة' })
    fireEvent.click(remove())
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(String(current().props.html)).toBe(HTML)

    confirm.mockReturnValue(true)
    fireEvent.click(remove())
    expect(String(current().props.html)).not.toContain('<img')
    expect(container.querySelector('[data-layer-slot="el-3"]')).toBeNull() // القايمة اتحدّثت
    expect(s().history).toHaveLength(1)
    // الضغطة على × ماحدّدتش الطبقة قبل ما تتحذف
    expect(s().selEl).toBeNull()
  })

  it('says so when there is nothing selectable', () => {
    s().load({ ...boot(), document: { version: 1, theme: {}, settings: {}, blocks: [{ ...section(), props: { html: '<p>x</p>' } }] } })
    s().select('a', 'preview')
    const { container } = mount()
    open(container)
    expect(screen.getByText(/مفيش عناصر قابلة للاختيار/)).toBeTruthy()
  })
})
