/**
 * مقارنة البكسل بالموقع القديم بتشتغل على الصفحات اللي هنا بس (TARGET=react).
 * اضف id الصفحة (من pages.ts) لما تنقلها — كل جلسة في بلوكها عشان مفيش تعارض.
 */
export const PORTED: ReadonlySet<string> = new Set([
  // ---- B1: الموقع العام
  // 'home',

  // ---- B4: لوحة التحكم
  // 'dashboard-invitations',

  // ---- B2: الضيوف والحضور
  // 'dashboard-guests',

  // ---- B3: عارض الدعوة
  'invite-demo1234',
  'invite-demo1234-guest',
  'template-preview-golden-classic',
])
