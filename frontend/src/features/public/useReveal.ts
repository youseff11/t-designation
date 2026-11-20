import { useLayoutEffect } from 'react'

/**
 * كان ظهور تدريجي بالسكرول — اتلغى: كل عناصر ‎[data-reveal]‎ جوّه ‎#main‎ بتاخد
 * ‎is-in‎ على طول (بما فيها اللي بتتضاف بعد وصول البيانات)، فالمحتوى ظاهر عادي.
 * الكلاس لسه مستخدم في لمسات ثابتة (حلقة الباقات، ظرف الختام، سطور الهيرو).
 *
 * كلاس ‎js‎ على ‎<html>‎ بيتحط قبل أول رسم (layout effect) زي الأول.
 */
export function useReveal() {
  useLayoutEffect(() => {
    document.documentElement.classList.add('js')
    const root = document.getElementById('main') ?? document.body
    const showAll = () =>
      root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => el.classList.add('is-in'))
    showAll()
    const mutations = new MutationObserver(showAll)
    mutations.observe(root, { childList: true, subtree: true })
    return () => mutations.disconnect()
  }, [])
}
