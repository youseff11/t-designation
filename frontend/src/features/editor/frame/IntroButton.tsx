import { useTranslation } from 'react-i18next'

import { useEditor } from '../store'
import { useEditorUi } from '../ui'
import { useIntroBus } from './introBus'

/** «الافتتاحية» في شريط المعاينة: يعيد عرض الشاشة الافتتاحية فوق المعاينة (لو مفعّلة في الإعدادات). */
export function IntroButton() {
  const { t } = useTranslation()
  const ui = useEditorUi()
  const show = useIntroBus((s) => s.show)
  return (
    <button
      type="button"
      className="ed-btn ed-btn--sm"
      title={t('editorSettings.intro.title')}
      onClick={() => (useEditor.getState().doc.settings.intro_enabled ? show() : ui.toast(t('editorSettings.intro.disabled'), 'error'))}
    >
      {t('editorSettings.intro.button')}
    </button>
  )
}
