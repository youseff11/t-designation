import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { block } from '@/features/invite/fixtures'
import type { BlockData } from '@/features/invite/types'

import type { PreviewPayload } from '../types'
import { parseMessage } from './bridge'
import { FrameApp } from './FrameApp'

const preview = (blocks: BlockData[], extra: Partial<PreviewPayload> = {}): PreviewPayload => ({
  kind: 'invitation',
  editable: true,
  lang: 'ar',
  dir: 'rtl',
  hasAlt: false,
  altLang: 'en',
  baseLang: 'ar',
  maxWidth: 760,
  bodyStyle: '--bg:#fff',
  css: { font: '', layout: '.x{}', shared: '', zero: '' },
  fontPreloads: [],
  stage: { runtime: false, rootAttrs: {}, full: false, pattern: '' },
  showBranding: true,
  intro: null,
  blocks,
  runtimeScripts: [],
  runtimeIsSpa: false,
  guest: null,
  siteName: 'T DESIGNATION',
  siteUrl: '/',
  ...extra,
})

const quote = (extra: Partial<BlockData> = {}) =>
  block('quote', { text: 'اقتباس', source: '' }, { id: 'q1', attrs: { id: 'q1', className: 'lb lb--quote', style: '' }, ...extra })

/** يبعت رسالة كأنها جاية من الصفحة الأم (نفس الأصل، والمصدر window.parent). */
function fromParent(data: unknown) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin: window.location.origin, source: window.parent }))
  })
}

describe('FrameApp', () => {
  let posted: unknown[]
  beforeEach(() => {
    posted = []
    vi.spyOn(window.parent, 'postMessage').mockImplementation((message: unknown) => {
      posted.push(message)
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.head.querySelectorAll('style[data-lb-layout-css]').forEach((n) => n.remove())
  })

  it('tells the parent it is ready, and renders nothing until a payload arrives', () => {
    const { container } = render(<FrameApp />)
    expect(posted).toContainEqual({ type: 'lb-editor:ready' })
    expect(container.querySelector('.lb-stage')).toBeNull()
  })

  it('renders the payload blocks with ids, hidden class and the plan warning', () => {
    const { container } = render(<FrameApp />)
    fromParent({
      type: 'lb-editor:render',
      selected: null,
      payload: preview([
        quote(),
        quote({
          id: 'q2',
          attrs: { id: 'q2', className: 'lb lb--quote lb--hidden', style: '' },
          hidden: true,
          gated: true,
        }),
      ]),
    })
    const sections = container.querySelectorAll('[data-block]')
    expect([...sections].map((n) => n.getAttribute('data-block'))).toEqual(['q1', 'q2'])
    expect(sections[1].className).toContain('lb--hidden')
    expect(sections[0].querySelector('.lb-gate')).toBeNull()
    expect(sections[1].querySelector('.lb-gate')?.textContent).toContain('باقة')
    expect(document.head.querySelector('style[data-lb-layout-css]')?.textContent).toBe('.x{}')
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')
    expect(document.body.getAttribute('style')).toBe('--bg:#fff')
  })

  it('marks the selected block and keeps the mark across a re-render', () => {
    const { container } = render(<FrameApp />)
    fromParent({ type: 'lb-editor:render', selected: 'q1', payload: preview([quote()]) })
    expect(container.querySelector('[data-block="q1"]')?.classList.contains('is-selected')).toBe(true)

    // نفس الحمولة بكلاس مختلف: React بيكتب className من جديد
    fromParent({
      type: 'lb-editor:render',
      selected: 'q1',
      payload: preview([quote({ attrs: { id: 'q1', className: 'lb lb--quote lb--w-wide', style: '' } })]),
    })
    expect(container.querySelector('[data-block="q1"]')?.classList.contains('is-selected')).toBe(true)

    fromParent({ type: 'lb-editor:select', id: null, scroll: false })
    expect(container.querySelector('.is-selected')).toBeNull()
  })

  it('reports a click on a block and blocks link navigation', () => {
    const { container } = render(<FrameApp />)
    const withLink = quote({ code: '' })
    fromParent({ type: 'lb-editor:render', selected: null, payload: preview([withLink]) })
    posted.length = 0

    fireEvent.click(container.querySelector('[data-block="q1"]')!)
    expect(posted).toEqual([{ type: 'lb-editor:select', id: 'q1' }])

    const anchor = document.createElement('a')
    anchor.href = '#somewhere'
    container.querySelector('[data-block="q1"]')!.appendChild(anchor)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    anchor.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('forwards editor shortcuts to the parent', () => {
    render(<FrameApp />)
    posted.length = 0
    fireEvent.keyDown(document.body, { key: 's', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'Delete' })
    fireEvent.keyDown(document.body, { key: 'a' })
    expect(posted).toEqual([
      { type: 'lb-editor:key', key: 's', shiftKey: false },
      { type: 'lb-editor:key', key: 'Delete', shiftKey: false },
    ])
  })

  it('ignores messages from other windows or origins', () => {
    const { container } = render(<FrameApp />)
    const payload = preview([quote()])
    const stranger = document.body.appendChild(document.createElement('iframe')).contentWindow!
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'lb-editor:render', payload, selected: null },
          origin: 'https://evil.example',
          source: window.parent,
        }),
      )
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'lb-editor:render', payload, selected: null },
          origin: window.location.origin,
          source: stranger,
        }),
      )
    })
    expect(container.querySelector('[data-block]')).toBeNull()
  })
})

describe('parseMessage', () => {
  const event = (data: unknown, origin = window.location.origin, source: MessageEventSource | null = window.parent) =>
    new MessageEvent('message', { data, origin, source })

  it('accepts only editor messages from the expected window and origin', () => {
    expect(parseMessage(event({ type: 'lb-editor:ready' }), window.parent)).toEqual({ type: 'lb-editor:ready' })
    expect(parseMessage(event({ type: 'other' }), window.parent)).toBeNull()
    expect(parseMessage(event(null), window.parent)).toBeNull()
    expect(parseMessage(event({ type: 'lb-editor:ready' }, 'https://x.example'), window.parent)).toBeNull()
    expect(parseMessage(event({ type: 'lb-editor:ready' }), null)).toBeNull()
    const stranger = document.body.appendChild(document.createElement('iframe')).contentWindow
    expect(parseMessage(event({ type: 'lb-editor:ready' }, window.location.origin, stranger), window.parent)).toBeNull()
  })
})
