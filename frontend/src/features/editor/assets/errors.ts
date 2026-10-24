import type { TFunction } from 'i18next'

import { ApiError } from '@/api/client'

/** رسالة الخطأ للمستخدم: رسالة السيرفر لو فيه، وإلا نص عام مترجم حسب نوع الفشل. */
export function errorText(error: unknown, t: TFunction, fallbackKey: string): string {
  if (error instanceof ApiError) {
    // أخطاء الحقول (امتداد الخط، اسم العائلة…) أدق من رسالة «راجع البيانات» العامة
    const detail = Object.values(error.fields ?? {}).filter(Boolean).join(' — ')
    if (detail) return detail
    if (error.message) return error.message
    if (error.status === 401) return t('editorAssets.errors.session')
    if (error.status === 413) return t('editorAssets.errors.tooLarge')
    if (error.status === 0) return t('editorAssets.errors.network')
  }
  return t(fallbackKey)
}
