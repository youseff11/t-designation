import type { RouteObject } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { RequireStaff } from '@/components/RequireStaff'
import { DashboardPage } from '@/pages/DashboardPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * خريطة المسارات. كل مرحلة بتضيف مساراتها هنا؛ المسارات نسبية لـ basename
 * (‎/app‎ أثناء الترحيل، وفاضي بعد التحويل النهائي).
 */
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'dashboard',
        element: <RequireStaff />,
        children: [{ index: true, element: <DashboardPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
