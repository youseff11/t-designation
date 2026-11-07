import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { HeroInfo } from '@/api/types'
import i18n, { initI18n } from '@/i18n'

import { HeroSection } from './HeroSection'

const EMPTY: HeroInfo = {
  images: { lightAr: '', lightEn: '', darkAr: '', darkEn: '' },
  text: {
    ar: { top: '', main: '', sub: '', cta: '', plans: '', trust: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }] },
    en: { top: '', main: '', sub: '', cta: '', plans: '', trust: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }] },
  },
}

const show = (hero?: HeroInfo) =>
  render(
    <MemoryRouter>
      <HeroSection plansPublic hero={hero} />
    </MemoryRouter>,
  )

beforeAll(() => initI18n('ar'))
afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('ar')
})

describe('HeroSection settings', () => {
  it('falls back to the translated defaults when nothing is set', () => {
    show(EMPTY)
    expect(screen.getByText('دعوتك بطابعك أنت')).toBeInTheDocument()
    expect(screen.getByText('اختر قالبك')).toBeInTheDocument()
    expect(document.querySelector('style')).toBeNull()
  })

  it('uses only the fields that were filled and keeps the default for the rest', () => {
    const hero: HeroInfo = {
      ...EMPTY,
      text: { ...EMPTY.text, ar: { ...EMPTY.text.ar, main: 'عنوان مخصص', cta: 'ابدأ الآن' } },
    }
    show(hero)
    expect(screen.getByText('عنوان مخصص')).toBeInTheDocument()
    expect(screen.queryByText('دعوتك بطابعك أنت')).toBeNull()
    expect(screen.getByText('ابدأ الآن')).toBeInTheDocument()
    expect(screen.getByText('الأسعار')).toBeInTheDocument() // زر الأسعار فاضي → الافتراضي
    // السطر الصغير: من غير قيمة في اللوحة بيظهر الوصف الثابت برّه العنوان
    expect(document.querySelector('.h1-top')).toBeNull()
    expect(screen.getByText('دعوات زفاف وخطوبة إلكترونية')).toBeInTheDocument()
  })

  it('shows the panel kicker inside the heading instead of the default one', () => {
    show({ ...EMPTY, text: { ...EMPTY.text, ar: { ...EMPTY.text.ar, top: 'سطر من اللوحة' } } })
    expect(document.querySelector('h1 .h1-top')?.textContent).toBe('سطر من اللوحة')
    expect(screen.queryByText('دعوات زفاف وخطوبة إلكترونية')).toBeNull()
  })

  it('writes the groom first and the bride under him on the card and the phone', () => {
    show(EMPTY)
    const names = [...document.querySelectorAll('.wh-names')].map((el) => [...el.querySelectorAll('b')].map((b) => b.textContent))
    expect(names).toEqual([
      ['عمر', 'ليلى'],
      ['عمر', 'ليلى'],
    ])
  })

  it('replaces the numbers strip with the designed-by line', () => {
    show(EMPTY)
    expect(screen.queryByText('قالب متاح')).toBeNull()
    expect(screen.getByText('صُممت بكل حب بواسطة')).toBeInTheDocument()
    expect(screen.getByText('T DESIGNATION')).toBeInTheDocument()
  })

  it('shows the text of the current language', async () => {
    await i18n.changeLanguage('en')
    const hero: HeroInfo = {
      ...EMPTY,
      text: { ...EMPTY.text, ar: { ...EMPTY.text.ar, main: 'عربي' }, en: { ...EMPTY.text.en, main: 'Your love story' } },
    }
    show(hero)
    expect(screen.getByText('Your love story')).toBeInTheDocument()
    expect(screen.queryByText('عربي')).toBeNull()
  })

  it('emits a background rule per filled image with the same selectors as the stylesheet', () => {
    show({ ...EMPTY, images: { lightAr: '/media/home/a/l.webp', lightEn: '', darkAr: '/media/home/b/d ar.webp', darkEn: '/media/home/c/de.webp' } })
    const css = document.querySelector('style')?.textContent ?? ''
    expect(css).toContain('.hero-art{--hero-img:url("/media/home/a/l.webp")}')
    expect(css).toContain('[data-theme="dark"] .hero-art{--hero-img:url("/media/home/b/d%20ar.webp")}')
    expect(css).toContain('html[lang="en"][data-theme="dark"] .hero-art{--hero-img:url("/media/home/c/de.webp")}')
    expect(css).not.toContain('html[lang="en"] .hero-art{')
  })
})
