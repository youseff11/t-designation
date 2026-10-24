import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useEditor } from './store'
import { useEditorUi } from './ui'

/** حقل كتابة؟ الحذف هنا بيمسح حروف مش أقسام. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** حفظ يدوي + تنبيه النجاح (الفشل بيتبلّغ عنه ‎useSaveFeedback‎ لأنه بيحصل من الحفظ التلقائي كمان). */
export function useSaveNow() {
  const { t } = useTranslation()
  const ui = useEditorUi()
  return useCallback(async () => {
    const ok = await useEditor.getState().save()
    if (ok) ui.toast(t('editor.toast.saved'), 'ok')
    return ok
  }, [t, ui])
}

/**
 * اختصارات المحرر: Ctrl+S حفظ، Ctrl+Z تراجع، Ctrl+Y / Ctrl+Shift+Z إعادة، Delete حذف القسم المحدد.
 * بيرجّع ‎handle‎ عشان نفس الاختصارات تشتغل لما تتضغط جوّه الـiframe (بتوصل برسالة).
 */
export function useEditorShortcuts() {
  const { t } = useTranslation()
  const ui = useEditorUi()
  const saveNow = useSaveNow()

  const handle = useCallback(
    (key: string, shiftKey: boolean, mod: boolean, target: EventTarget | null = null): boolean => {
      const state = useEditor.getState()
      const lower = key.toLowerCase()
      if (mod) {
        if (lower === 's') void saveNow()
        else if (lower === 'z' && !shiftKey) state.undo()
        else if (lower === 'y' || (lower === 'z' && shiftKey)) state.redo()
        else return false
        return true
      }
      if ((key === 'Delete' || key === 'Backspace') && !isTyping(target)) {
        const block = state.doc.blocks.find((b) => b.id === state.selected)
        if (!block || block.locked) return false
        state.remove(block.id)
        ui.toast(t('editor.toast.removed', { name: block.label || block.type }), 'ok')
        return true
      }
      return false
    },
    [saveNow, t, ui],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('.ed-modal')) return
      const mod = event.ctrlKey || event.metaKey
      if (handle(event.key, event.shiftKey, mod, event.target)) event.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handle])

  /** نسخة للرسائل الجاية من الـiframe: الـmod بنستنتجه من نوع المفتاح (بنبعت Ctrl+… وDelete بس). */
  return useCallback(
    (key: string, shiftKey: boolean) => handle(key, shiftKey, !['Delete', 'Backspace', 'Escape'].includes(key)),
    [handle],
  )
}

/** خطأ الحفظ (يدوي أو تلقائي) → تنبيه مرة واحدة؛ ولو حصل مع الرابط نوضّح إنه الرابط. */
export function useSaveFeedback() {
  const { t } = useTranslation()
  const ui = useEditorUi()
  useEffect(
    () =>
      useEditor.subscribe((state, previous) => {
        if (state.saveStatus !== 'error' || previous.saveStatus === 'error') return
        const slug = state.fieldErrors.slug
        ui.toast(slug ? t('editor.toast.slug', { message: slug }) : state.saveError || t('editor.toast.saveFailed'), 'error')
      }),
    [t, ui],
  )

  // تحذير قبل إغلاق الصفحة بتعديلات مش محفوظة
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (useEditor.getState().saveStatus === 'saved') return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
}
