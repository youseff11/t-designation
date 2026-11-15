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
    expect(screen.getByText('اعزم حبايبك بلينك')).toBeInTheDocument()
    expect(screen.getByText('اختار تصميمك')).toBeInTheDocument()
    expect(document.querySelector('style')).toBeNull()
  })

  it('uses only the fields that were filled and keeps the default for the rest', () => {
    const hero: HeroInfo = {
      ...EMPTY,
      text: { ...EMPTY.text, ar: { ...EMPTY.text.ar, main: 'عنوان مخصص', cta: 'ابدأ الآن' } },
    }
    show(hero)
    expect(screen.getByText('عنوان مخصص')).toBeInTheDocument()
    expect(screen.queryByText('اعزم حبايبك بلينك')).toBeNull()
    expect(screen.getByText('ابدأ الآن')).toBeInTheDocument()
    expect(screen.getByText('الأسعار')).toBeInTheDocument() // زر الأسعار فاضي → الافتراضي
    // السطر الصغير: من غير قيمة في اللوحة بيظهر الوصف الثابت برّه العنوان
    expect(document.querySelector('.h1-top')).toBeNull()
    expect(screen.getByText('دعوات فرح أونلاين')).toBeInTheDocument()
  })

  it('shows the panel kicker inside the heading instead of the default one', () => {
    show({ ...EMPTY, text: { ...EMPTY.text, ar: { ...EMPTY.text.ar, top: 'سطر من اللوحة' } } })
    expect(document.querySelector('h1 .h1-top')?.textContent).toBe('سطر من اللوحة')
    expect(screen.queryByText('دعوات فرح أونلاين')).toBeNull()
  })

  it('shows the feature ticker twice so the loop is seamless', () => {
    show(EMPTY)
    expect(document.querySelectorAll('.nx-ticker-set')).toHaveLength(2)
    expect(screen.getAllByText('لينك واحد للكل')).toHaveLength(2)
  })

  it('has no numbers strip and no designed-by line (that one lives in the footer)', () => {
    show(EMPTY)
    expect(screen.queryByText('قالب متاح')).toBeNull()
    expect(screen.queryByText('صُممت بكل حب بواسطة')).toBeNull()
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

  it('emits a background rule per filled light image and ignores the old dark ones', () => {
    show({ ...EMPTY, images: { lightAr: '/media/home/a/l.webp', lightEn: '', darkAr: '/media/home/b/d ar.webp', darkEn: '/media/home/c/de.webp' } })
    const css = document.querySelector('style')?.textContent ?? ''
    expect(css).toContain('.nx-media{--hero-img:url("/media/home/a/l.webp")}')
    expect(css).not.toContain('data-theme')
    expect(css).not.toContain('d%20ar.webp')
    expect(css).not.toContain('html[lang="en"] .nx-media{')
  })
})
