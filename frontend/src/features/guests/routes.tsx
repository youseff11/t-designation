import type { RouteObject } from 'react-router-dom'

/**
 * صاحب الملف: B2 (الضيوف والحضور).
 *
 * guestDashboardRoutes: أبناء ‎/dashboard‎ (جوّه DashboardLayout بتاع B1):
 *   ‎invitations/:id/guests‎، ‎guests/qr-sheet‎، ‎checkin‎.
 * guestPublicRoutes: صفحات مستقلة من غير ترويسة الموقع:
 *   ‎i/:slug/venue/:token‎، ‎i/:slug/client/:token‎، ‎i/:slug/g/:token/pass‎.
 */
export const guestDashboardRoutes: RouteObject[] = []
export const guestPublicRoutes: RouteObject[] = []
