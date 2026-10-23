/** أشكال بيانات واجهة ‎/api/v1/‎ — بتتطابق مع system/api/serializers.py. */

export type Lang = 'ar' | 'en'

export interface ApiUser {
  id: number
  username: string
  displayName: string
  isStaff: boolean
  isSuperuser: boolean
}

export interface SiteInfo {
  name: Record<Lang, string>
  tagline: Record<Lang, string>
  displayName: string
  displayTagline: string
  currency: string
  email: string
  ordersEnabled: boolean
  plansPublic: boolean
  whatsapp: {
    floatReady: boolean
    url: string
    base: string
    message: string
  }
  facebookUrl: string
  instagramUrl: string
  languages: { code: Lang; label: string }[]
}

export interface TemplateCard {
  id: number
  slug: string
  name: string
  nameEn: string
  displayName: string
  description: string
  descriptionEn: string
  displayDescription: string
  category: string
  collection: string
  cover: string | null
}

export interface TemplatesResponse {
  results: TemplateCard[]
  categories: { value: string; label: string }[]
}
