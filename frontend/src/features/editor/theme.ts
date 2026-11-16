import { create } from 'zustand'

/**
 * مظهر المحرر (فاتح/غامق) — خاص بالمحرر بس. بيتحط كـclass على ‎.ed-root‎
 * (مش ‎data-theme‎ على ‎<html>‎) عشان مايأثرش على الموقع ولا اللوحة، ولا على
 * الدعوة نفسها جوّه الكانفس. الاختيار بيتحفظ في المتصفح.
 */
export type EditorTheme = 'light' | 'dark'

const STORAGE_KEY = 'td:editor-theme'

function initial(): EditorTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* تخزين ممنوع: نرجع لتفضيل الجهاز */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface EditorThemeState {
  theme: EditorTheme
  toggle: () => void
}

export const useEditorTheme = create<EditorThemeState>((set, get) => ({
  theme: initial(),
  toggle: () => {
    const theme: EditorTheme = get().theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* الاختيار بيفضل للجلسة بس */
    }
    set({ theme })
  },
}))
