import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { fetchPreview } from '../api'
import { useEditor } from '../store'
import type { FromFrame } from '../types'
import { useEditorUi } from '../ui'
import { parseMessage, sendToFrame } from './bridge'
import { useIntroBus } from './introBus'

/** وقفة بعد آخر تعديل قبل ما نطلب معاينة جديدة (السيرفر بيرندر المستند كله). */
export const PREVIEW_WAIT = 280

interface Props {
  /** اختصار لوحة مفاتيح اتضغط جوّه الـiframe */
  onKey: (key: string, shiftKey: boolean) => void
}

/**
 * المعاينة الحية: الـiframe (‎/editor-frame/‎) بيرسم الحمولة اللي هنا بنطلبها من السيرفر من المستند
 * الحالي (حتى غير المحفوظ). الرد القديم بيتلغي لو اتعدّل حاجة تاني، وأي طلب شغّال بيتقطع.
 */
export function PreviewPane({ onKey }: Props) {
  const { t } = useTranslation()
  const ui = useEditorUi()
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(0) // بيزيد كل ما الإطار يقول «جاهز» (بما فيه إعادة تحميله)
  const [busy, setBusy] = useState(false)
  const rev = useEditor((s) => s.rev)
  const device = useEditor((s) => s.device)
  const selected = useEditor((s) => s.selected)
  const selectSource = useEditor((s) => s.selectSource)
  const onKeyRef = useRef(onKey)
  onKeyRef.current = onKey

  // رسائل الإطار
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parseMessage<FromFrame>(event, frame.current?.contentWindow)
      if (!message) return
      if (message.type === 'lb-editor:ready') setReady((n) => n + 1)
      else if (message.type === 'lb-editor:select') useEditor.getState().select(message.id, 'preview')
      else if (message.type === 'lb-editor:key') onKeyRef.current(message.key, message.shiftKey)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // طلب المعاينة بعد كل تعديل
  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    const timer = setTimeout(
      async () => {
        setBusy(true)
        try {
          // بيانات المناسبة غير المحفوظة بتتبعت مع المستند: المعاينة تعكس تبويب «البيانات» قبل الحفظ
          const { mode, id, doc, fields, previewLang, selected: current } = useEditor.getState()
          const payload = await fetchPreview(mode, id, doc, previewLang, controller.signal, fields)
          sendToFrame(frame.current, { type: 'lb-editor:render', payload, selected: current })
          setBusy(false)
        } catch (error) {
          if (controller.signal.aborted) return
          setBusy(false)
          ui.toast(t('editor.toast.previewFailed'), 'error')
          console.error(error)
        }
      },
      rev === 0 ? 0 : PREVIEW_WAIT,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [rev, ready, t, ui])

  // زرار «الافتتاحية»: نبعت بس لما العدّاد يتغيّر بعد فتح المحرر (مش قيمته القديمة من فتحة سابقة)
  const introCount = useIntroBus((s) => s.count)
  const seenIntro = useRef(introCount)
  useEffect(() => {
    if (introCount === seenIntro.current) return
    seenIntro.current = introCount
    sendToFrame(frame.current, { type: 'lb-editor:intro' })
  }, [introCount])

  // التحديد بيتزامن من غير طلب جديد؛ التمرير للقسم بس لو الضغطة من القايمة
  useEffect(() => {
    sendToFrame(frame.current, { type: 'lb-editor:select', id: selected, scroll: selectSource === 'list' })
  }, [selected, selectSource, ready])

  return (
    <div className="ed-device" data-device={device}>
      <iframe ref={frame} src="/editor-frame/" title={t('editor.preview.title')} />
      <div className={`ed-loading${busy ? ' is-on' : ''}`}>{t('editor.preview.updating')}</div>
    </div>
  )
}
