import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/api/client'
import type {
  AddonBody,
  AddonRow,
  AnalyticsResponse,
  ClipRow,
  FontRow,
  InvitationCreateBody,
  InvitationFilters,
  InvitationOptions,
  InvitationsResponse,
  OrdersResponse,
  OverviewResponse,
  PlanQuickBody,
  PlanRow,
  PlansResponse,
  SiteResponse,
  SiteValues,
  TemplateImportResult,
  TemplatesResponse,
  TrackRow,
  DedupeResult,
} from './types'

/** كل استعلامات اللوحة تحت ‎['dashboard']‎ — أي تعديل بيبطّلها كلها (البيانات صغيرة وشغّالة على نفس القاعدة). */
const ROOT = ['dashboard'] as const

export const dashKeys = {
  overview: [...ROOT, 'overview'] as const,
  analytics: [...ROOT, 'analytics'] as const,
  orders: (status: string) => [...ROOT, 'orders', status] as const,
  invitations: (filters: InvitationFilters) => [...ROOT, 'invitations', filters] as const,
  invitationOptions: [...ROOT, 'invitation-options'] as const,
  templates: [...ROOT, 'templates'] as const,
  library: (kind: LibraryKind) => [...ROOT, 'library', kind] as const,
  plans: [...ROOT, 'plans'] as const,
  site: [...ROOT, 'site'] as const,
}

function useInvalidatingMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  alsoInvalidate: readonly unknown[][] = [],
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ROOT }),
        ...alsoInvalidate.map((queryKey) => qc.invalidateQueries({ queryKey })),
      ])
    },
  })
}

// ---------------------------------------------------------------- القراءة
export function useOverview() {
  return useQuery({
    queryKey: dashKeys.overview,
    queryFn: () => api<OverviewResponse>('/dashboard/overview/'),
  })
}

export function useAnalytics() {
  return useQuery({
    queryKey: dashKeys.analytics,
    queryFn: () => api<AnalyticsResponse>('/dashboard/analytics/'),
  })
}

export function useOrders(status: string) {
  return useQuery({
    queryKey: dashKeys.orders(status),
    queryFn: () => api<OrdersResponse>('/dashboard/orders/', { query: { status } }),
    placeholderData: keepPreviousData,
  })
}

export function useInvitations(filters: InvitationFilters) {
  return useQuery({
    queryKey: dashKeys.invitations(filters),
    queryFn: () => api<InvitationsResponse>('/dashboard/invitations/', { query: { ...filters } }),
    placeholderData: keepPreviousData,
  })
}

export function useInvitationOptions() {
  return useQuery({
    queryKey: dashKeys.invitationOptions,
    queryFn: () => api<InvitationOptions>('/dashboard/invitations/options/'),
  })
}

export function useTemplatesList() {
  return useQuery({
    queryKey: dashKeys.templates,
    queryFn: () => api<TemplatesResponse>('/dashboard/templates/'),
  })
}

export function usePlans() {
  return useQuery({
    queryKey: dashKeys.plans,
    queryFn: () => api<PlansResponse>('/dashboard/plans/'),
  })
}

export function useSiteSettings() {
  return useQuery({
    queryKey: dashKeys.site,
    queryFn: () => api<SiteResponse>('/dashboard/site/'),
  })
}

// ---------------------------------------------------------------- الدعوات
export function useDuplicateInvitation() {
  return useInvalidatingMutation((id: number) =>
    api<{ id: number; title: string; sourceTitle: string }>(`/dashboard/invitations/${id}/duplicate/`, {
      method: 'POST',
    }),
  )
}

export function useDeleteInvitation() {
  return useInvalidatingMutation((id: number) =>
    api<{ deleted: boolean; title: string }>(`/dashboard/invitations/${id}/`, { method: 'DELETE' }),
  )
}

export function useCreateInvitation() {
  return useInvalidatingMutation((body: InvitationCreateBody) =>
    api<{ id: number; editorUrl: string }>('/dashboard/invitations/', { method: 'POST', body }),
  )
}

// ---------------------------------------------------------------- القوالب
export function useToggleTemplate() {
  return useInvalidatingMutation((id: number) =>
    api<{ id: number; name: string; isActive: boolean }>(`/dashboard/templates/${id}/toggle/`, {
      method: 'POST',
    }),
  )
}

export function useDeleteTemplate() {
  return useInvalidatingMutation((id: number) =>
    api<{ deleted: boolean; name: string }>(`/dashboard/templates/${id}/`, { method: 'DELETE' }),
  )
}

export function useCreateTemplate() {
  return useInvalidatingMutation((body: FormData) =>
    api<{ id: number; name: string; editorUrl: string }>('/dashboard/templates/', {
      method: 'POST',
      body,
    }),
  )
}

export function useImportTemplate() {
  return useInvalidatingMutation((body: FormData) =>
    api<TemplateImportResult>('/dashboard/templates/import/', { method: 'POST', body }),
  )
}

// ---------------------------------------------------------------- المكتبات (خطوط / موسيقى / افتتاحيات)
export type LibraryKind = 'fonts' | 'music' | 'intros'

interface LibraryRows {
  fonts: FontRow
  music: TrackRow
  intros: ClipRow
}

export function useLibrary<K extends LibraryKind>(kind: K) {
  const path = `/dashboard/${kind}/`
  type Row = LibraryRows[K]
  const list = useQuery({
    queryKey: dashKeys.library(kind),
    // ‎duplicateExtra‎: تلميح بعدد النسخ الزيادة بالاسم (مكتبة الموسيقى بس)
    queryFn: () => api<{ results: Row[]; duplicateExtra?: number }>(path),
  })
  const create = useInvalidatingMutation((body: FormData) => api<Row>(path, { method: 'POST', body }))
  const toggle = useInvalidatingMutation((id: number) =>
    api<Row>(`${path}${id}/toggle/`, { method: 'POST' }),
  )
  const remove = useInvalidatingMutation((id: number) =>
    api<{ deleted: boolean; name: string }>(`${path}${id}/`, { method: 'DELETE' }),
  )
  return { list, create, toggle, remove }
}

/** مسح المقطوعات المكررة: ‎dryRun=true‎ بيرجّع الخطة من غير تغيير، وبعده التنفيذ الفعلي. */
export function useDedupeMusic() {
  return useInvalidatingMutation((dryRun: boolean) =>
    api<DedupeResult>('/dashboard/music/dedupe/', { method: 'POST', body: { dryRun } }),
  )
}

// ---------------------------------------------------------------- الباقات والإضافات
export function useSavePlan() {
  return useInvalidatingMutation(({ id, body }: { id: number; body: PlanQuickBody }) =>
    api<PlanRow>(`/dashboard/plans/${id}/`, { method: 'PATCH', body }),
  )
}

export function useSaveAddon() {
  return useInvalidatingMutation(({ id, body }: { id: number | null; body: AddonBody }) =>
    id === null
      ? api<AddonRow>('/dashboard/addons/', { method: 'POST', body })
      : api<AddonRow>(`/dashboard/addons/${id}/`, { method: 'PATCH', body }),
  )
}

export function useToggleAddon() {
  return useInvalidatingMutation((id: number) =>
    api<AddonRow>(`/dashboard/addons/${id}/toggle/`, { method: 'POST' }),
  )
}

export function useDeleteAddon() {
  return useInvalidatingMutation((id: number) =>
    api<{ deleted: boolean; deactivated: boolean; name: string }>(`/dashboard/addons/${id}/`, {
      method: 'DELETE',
    }),
  )
}

// ---------------------------------------------------------------- إعدادات الموقع
export function useSaveSiteSettings() {
  // الإعدادات العامة (شريط الواتساب والروابط…) بتتقرا من ‎['site']‎ كمان — نبطّلها
  return useInvalidatingMutation(
    (body: SiteValues) => api<SiteResponse>('/dashboard/site/', { method: 'PUT', body }),
    [['site']],
  )
}
