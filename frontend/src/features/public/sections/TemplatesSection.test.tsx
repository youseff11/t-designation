import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { initI18n } from '@/i18n'

import type { PublicTemplate } from '../types'
import { GalleryTemplateCard, HomeTemplateCard } from './TemplatesSection'

const template: PublicTemplate = {
  id: 1,
  slug: 'golden-night',
  name: 'ليلة ذهبية',
  nameEn: 'Golden Night',
  displayName: 'ليلة ذهبية',
  description: '',
  descriptionEn: '',
  displayDescription: '',
  category: 'none',
  categoryLabel: '',
  collection: '',
  cover: null,
}

beforeAll(() => initI18n('ar'))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('template card WhatsApp share', () => {
  it.each([
    ['home', <HomeTemplateCard key="h" template={template} />],
    ['gallery', <GalleryTemplateCard key="g" template={template} />],
  ])('the %s card shares the preview link on WhatsApp', (_name, card) => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<MemoryRouter>{card}</MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'مشاركة القالب على واتساب' }))
    expect(open).toHaveBeenCalledTimes(1)
    const [href, target] = open.mock.calls[0]
    expect(target).toBe('_blank')
    const url = new URL(String(href))
    expect(url.origin + url.pathname).toBe('https://wa.me/')
    const text = url.searchParams.get('text') ?? ''
    expect(text).toContain('ليلة ذهبية')
    expect(text).toContain(`${window.location.origin}/templates/golden-night/preview/`)
  })
})
