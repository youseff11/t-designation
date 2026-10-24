import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { initI18n } from '@/i18n'

import { resetEditor, useEditor } from '../store'
import type { Bootstrap, PreviewPayload } from '../types'
import { EditorUiProvider } from '../ui'
import { IntroButton } from './IntroButton'
import { useIntroBus } from './introBus'
import { PreviewPane, PREVIEW_WAIT } from './PreviewPane'

vi.mock('../api', () => ({ fetchPreview: vi.fn() }))
import { fetchPreview } from '../api'

const preview = vi.mocked(fetchPreview)

const boot = (over: Partial<Bootstrap> = {}): Bootstrap => ({
  mode: 'invitation',
  id: 5,
  title: 't',
  document: { version: 1, theme: {}, settings: { intro_enabled: false }, blocks: [] },
  fields: {
    title: '', eventType: '', nameOne: 'ليلى', nameTwo: 'أحمد', eventDate: '', venue: '',
    address: '', mapUrl: '', whatsapp: '', status: 'draft', expiresAt: '', password: '', slug: 'laila',
  },
  features: [], assets: [], fonts: [], intros: [], music: [], categories: [],
  meta: { slug: 'laila', status: 'draft', planName: '', templateName: '', publicUrl: '', clientFollowupUrl: '', backUrl: '' },
  ...over,
})

function mount() {
  const view = render(
    <EditorUiProvider>
      <IntroButton />
      <PreviewPane onKey={() => {}} />
    </EditorUiProvider>,
  )
  const iframe = view.container.querySelector('iframe') as HTMLIFrameElement
  const ready = () =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'lb-editor:ready' }, origin: window.location.origin, source: iframe.contentWindow }),
      )
    })
  return { iframe, ready }
}

beforeAll(() => {
  initI18n('ar')
})
beforeEach(() => {
  resetEditor()
  preview.mockReset()
  preview.mockResolvedValue({ blocks: [] } as unknown as PreviewPayload)
  useEditor.getState().load(boot())
})
afterEach(() => vi.restoreAllMocks())

describe('PreviewPane', () => {
  it('asks for the first preview with the unsaved event fields once the frame is ready', async () => {
    const { ready } = mount()
    ready()
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1))
    const [mode, id, doc, lang, signal, fields] = preview.mock.calls[0]
    expect([mode, id, lang]).toEqual(['invitation', 5, ''])
    expect(doc).toBe(useEditor.getState().doc)
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(fields).toMatchObject({ nameOne: 'ليلى', nameTwo: 'أحمد' })
  })

  it('refreshes with the new name as soon as the event data is edited (before any save)', async () => {
    const { ready } = mount()
    ready()
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1))

    act(() => useEditor.getState().setEventField('nameOne', 'سارة'))
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(2), { timeout: PREVIEW_WAIT * 6 })
    expect(preview.mock.calls[1][5]).toMatchObject({ nameOne: 'سارة', nameTwo: 'أحمد' })
    expect(useEditor.getState().saveStatus).toBe('dirty') // لسه مااتحفظش
  })

  it('sends no event fields for a template', async () => {
    resetEditor()
    useEditor.getState().load(boot({ mode: 'template', fields: null }))
    const { ready } = mount()
    ready()
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1))
    expect(preview.mock.calls[0][0]).toBe('template')
    expect(preview.mock.calls[0][5]).toBeNull()
  })

  it('forwards the intro button to the frame, but only when the intro is turned on', async () => {
    const { iframe, ready } = mount()
    ready()
    const post = vi.spyOn(iframe.contentWindow!, 'postMessage')

    fireEvent.click(screen.getByRole('button', { name: 'الافتتاحية' }))
    expect(screen.getByText(/فعّل «شاشة افتتاحية»/)).toBeInTheDocument()
    expect(post).not.toHaveBeenCalledWith({ type: 'lb-editor:intro' }, expect.anything())

    act(() => useEditor.getState().setSetting('intro_enabled', true))
    fireEvent.click(screen.getByRole('button', { name: 'الافتتاحية' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith({ type: 'lb-editor:intro' }, window.location.origin))
    expect(useIntroBus.getState().count).toBeGreaterThan(0)
  })
})
