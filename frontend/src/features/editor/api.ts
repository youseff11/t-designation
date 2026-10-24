import { api } from '@/api/client'
import type { RenderPayload } from '@/features/invite/types'

import type { Bootstrap, EditorDocument, EditorMode, EditorSchema, EventFields, SaveResponse } from './types'

const base = (mode: EditorMode, id: number) => `/editor/${mode === 'invitation' ? 'invitations' : 'templates'}/${id}`

export const fetchSchema = () => api<EditorSchema>('/editor/schema/')

export const fetchBootstrap = (mode: EditorMode, id: number) => api<Bootstrap>(`${base(mode, id)}/`)

/** حمولة المعاينة = حمولة عارض الدعوة + ‎editable‎ والأقسام المخفية/خارج الباقة معلَّمة. */
export type PreviewPayload = RenderPayload & { editable: true }

export const fetchPreview = (mode: EditorMode, id: number, document: EditorDocument, lang: string, signal?: AbortSignal) =>
  api<PreviewPayload>(`${base(mode, id)}/preview/`, { method: 'POST', body: { document, lang }, signal })

export const postSave = (mode: EditorMode, id: number, document: EditorDocument, fields: EventFields | null) =>
  api<SaveResponse>(`${base(mode, id)}/save/`, {
    method: 'POST',
    body: mode === 'invitation' ? { document, fields } : { document },
  })
