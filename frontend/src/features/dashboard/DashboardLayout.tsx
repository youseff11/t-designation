import { Outlet } from 'react-router-dom'

/**
 * صاحب الملف: B4. هيكل لوحة التحكم (الترويسة وقايمة التنقل بتاعة اللوحة).
 * دلوقتي مجرد غلاف مؤقت — B4 بيستبدله بالتصميم الحقيقي. باقي الجلسات بتكتب
 * صفحاتها كأبناء ‎<Outlet />‎ ومابتعتمدش على شكل الغلاف.
 */
export function DashboardLayout() {
  return <Outlet />
}
