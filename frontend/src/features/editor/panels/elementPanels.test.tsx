import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { initI18n } from '@/i18n'

import { resetEditor, useEditor } from '../store'
import type { Bootstrap, DocBlock } from '../types'
import { EditorUiProvider } from '../ui'
import { ElementHint } from './ElementHint'
import { LayersGroup } from './LayersGroup'

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
      <ElementHint block={block} />
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

describe('ElementHint actions', () => {
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
