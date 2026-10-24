import { FRAME_PREFIX, type FromFrame, type ToFrame } from '../types'

/**
 * قناة الصفحة الأم ↔ iframe المعاينة. نفس الأصل دايماً (‎/editor-frame/‎) فبنقفل على
 * ‎location.origin‎، وبنتأكد إن المرسل هو النافذة المتوقعة — أي رسالة تانية بتتجاهل.
 */
export function parseMessage<T extends ToFrame | FromFrame>(event: MessageEvent, from: Window | null | undefined): T | null {
  if (event.origin !== window.location.origin || !from || event.source !== from) return null
  const data = event.data as { type?: unknown } | null
  if (!data || typeof data.type !== 'string' || !data.type.startsWith(FRAME_PREFIX)) return null
  return data as T
}

export function sendToFrame(frame: HTMLIFrameElement | null, message: ToFrame) {
  frame?.contentWindow?.postMessage(message, window.location.origin)
}

export function sendToParent(message: FromFrame) {
  window.parent.postMessage(message, window.location.origin)
}
