import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { initI18n } from '@/i18n'

import { resetEditor, useEditor } from './store'
import { useEditorShortcuts } from './shortcuts'
import type { Bootstrap, DocBlock } from './types'
import { EditorUiProvider } from './ui'

const block = (id: string, extra: Partial<DocBlock> = {}): DocBlock => ({
  id, type: 'custom_html', visible: true, locked: false, props: { html: '<p>x</p>' }, style: {}, ...extra,
})
const boot = (blocks: DocBlock[]): Bootstrap => ({
  mode: 'template', id: 1, title: 't',
  document: { version: 1, theme: {}, settings: {}, blocks },
  fields: null, features: [], assets: [], fonts: [], intros: [], music: [], categories: [],
  meta: { slug: 's', status: '', planName: '', templateName: '', publicUrl: '', clientFollowupUrl: '', backUrl: '' },
})

const wrapper = ({ children }: { children: ReactNode }) => <EditorUiProvider>{children}</EditorUiProvider>

beforeAll(() => {
  initI18n('ar')
})
beforeEach(() => {
  resetEditor()
  useEditor.getState().load(boot([block('a'), block('b', { locked: true })]))
})

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}
const layoutOf = (id: string) => useEditor.getState().doc.blocks.find((b) => b.id === id)?.layout

describe('element keys (imported sections)', () => {
  it('arrows nudge the selected element by 1px (4px with Shift) for pixel slots', () => {
    renderHook(() => useEditorShortcuts(), { wrapper })
    useEditor.getState().selectElement('a', 'el-3')
    expect(press('ArrowRight').defaultPrevented).toBe(true)
    press('ArrowDown')
    press('ArrowLeft', { shiftKey: true })
    expect(layoutOf('a')).toEqual({ 'el-3': { dx: -3, dy: 1 } })
  })

  it('arrows move cqw slots by a quarter step (a full step with Shift), physically', () => {
    renderHook(() => useEditorShortcuts(), { wrapper })
    useEditor.getState().selectElement('a', 'subtitle')
    press('ArrowRight')
    press('ArrowRight', { shiftKey: true })
    press('ArrowUp')
    expect(layoutOf('a')).toEqual({ subtitle: { dx: 1.25, dy: -0.25 } })
  })

  it('one undo step per burst of nudges', () => {
    renderHook(() => useEditorShortcuts(), { wrapper })
    useEditor.getState().selectElement('a', 'el-3')
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(useEditor.getState().history).toHaveLength(1)
    useEditor.getState().undo()
    expect(layoutOf('a')).toBeUndefined()
  })

  it('leaves arrows alone with no selected element, in a field, or on a locked section', () => {
    renderHook(() => useEditorShortcuts(), { wrapper })
    expect(press('ArrowRight').defaultPrevented).toBe(false)
    useEditor.getState().selectElement('a', 'el-3')
    const input = document.body.appendChild(document.createElement('input'))
    expect(press('ArrowRight', {}, input).defaultPrevented).toBe(false)
    input.remove()
    expect(layoutOf('a')).toBeUndefined()
    useEditor.getState().selectElement('b', 'el-3')
    press('ArrowRight')
    expect(layoutOf('b')).toBeUndefined()
  })

  it('Delete never removes the whole section while an element is selected', () => {
    renderHook(() => useEditorShortcuts(), { wrapper })
    useEditor.getState().select('a', 'preview')
    useEditor.getState().selectElement('a', 'el-3')
    press('Delete')
    press('Backspace')
    expect(useEditor.getState().doc.blocks.map((b) => b.id)).toEqual(['a', 'b'])
    // من غير عنصر محدَّد، Delete بيحذف القسم زي ما كان
    useEditor.getState().selectElement('a', null)
    press('Delete')
    expect(useEditor.getState().doc.blocks.map((b) => b.id)).toEqual(['b'])
  })

  it('Escape deselects the element but keeps the section selected', () => {
    renderHook(() => useEditorShortcuts(), { wrapper })
    useEditor.getState().selectElement('a', 'el-3')
    press('Escape')
    expect(useEditor.getState().selEl).toBeNull()
    expect(useEditor.getState().selected).toBe('a')
  })

  it('keys forwarded from the preview frame behave the same, with the Ctrl state they carry', () => {
    const { result } = renderHook(() => useEditorShortcuts(), { wrapper })
    useEditor.getState().selectElement('a', 'el-3')
    expect(result.current('ArrowDown', false, false)).toBe(true)
    expect(layoutOf('a')).toEqual({ 'el-3': { dx: 0, dy: 1 } })
    result.current('z', false, true) // Ctrl+Z
    expect(layoutOf('a')).toBeUndefined()
  })
})
