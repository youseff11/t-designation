import { useInvite } from './context'
import { SocialLink } from './svg'
import type { InviteLang, PreviewCta } from './types'

/**
 * زرار اللغة — بيظهر بس لو المصمّم كتب نسخة تانية فعلاً. الرابط (‎?lang=‎) يفضل
 * موجود عشان المشاركة والفتح المباشر يشتغلوا بنفس اللغة؛ والضغطة بتبدّل المحتوى
 * في الصفحة من غير إعادة تحميل.
 */
export function LangToggle({
  altLang,
  onSwitch,
  busy,
}: {
  altLang: InviteLang
  onSwitch: (lang: InviteLang) => void
  busy: boolean
}) {
  const { lang, t } = useInvite()
  return (
    <a
      className="lb-lang"
      data-lang-toggle
      href={`?lang=${altLang}`}
      hrefLang={altLang}
      aria-label={lang === 'en' ? t('lang.toAr') : t('lang.toEn')}
      aria-busy={busy || undefined}
      onClick={(e) => {
        e.preventDefault()
        if (!busy) onSwitch(altLang)
      }}
    >
      {lang === 'en' ? 'ع' : 'EN'}
    </a>
  )
}

/** زرار مشاركة معاينة القالب على واتساب — جوّه شريط المعاينة العلوي. */
function PreviewShare({ name }: { name: string }) {
  const { t } = useInvite()
  const label = t('templateShare.label')
  const share = () => {
    // الرابط من غير ‎#‎ عشان اللي بيفتحه يبدأ من أول الصفحة
    const url = `${location.origin}${location.pathname}${location.search}`
    const text = name ? t('templateShare.text', { name }) : t('templateShare.textPlain')
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}
${url}`)}`, '_blank', 'noopener')
  }
  return (
    <button type="button" className="lb-pv-share" data-template-share aria-label={label} title={label} onClick={share}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="18" cy="5" r="2.6" />
        <circle cx="6" cy="12" r="2.6" />
        <circle cx="18" cy="19" r="2.6" />
        <path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3" />
      </svg>
      <span className="lb-pv-share-text">{t('templateShare.short')}</span>
    </button>
  )
}

/**
 * زرار الرجوع للموقع في معاينة القالب. لو الضيف جه من صفحة جوّه التطبيق بنرجّعه لها بالظبط
 * (مكان السكرول محفوظ)، وإلا (فتح مباشر / رابط مشترك) بنودّيه للرئيسية.
 */
function PreviewBack({ siteUrl }: { siteUrl: string }) {
  const { t } = useInvite()
  const href = siteUrl || '/'
  return (
    <a
      className="lb-pv-back"
      data-template-back
      href={href}
      onClick={(e) => {
        // ‎idx‎ بتحطه react-router على كل تنقّل جوّه التطبيق؛ صفر/مفيش = دخول مباشر
        const idx = (window.history.state as { idx?: number } | null)?.idx
        if (typeof idx === 'number' && idx > 0) {
          e.preventDefault()
          window.history.back()
        }
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m9 6 6 6-6 6" />
      </svg>
      <span>{t('templateBack.label')}</span>
    </a>
  )
}

/**
 * شريط المعاينة العلوي: «رجوع للموقع» والمشاركة في كبسولة زجاجية واحدة
 * (بدل زرارين سايبين)، فوق الافتتاحية كمان.
 */
export function PreviewNav({ siteUrl, name }: { siteUrl: string; name: string }) {
  return (
    <nav className="lb-pv-nav" data-template-nav>
      <PreviewBack siteUrl={siteUrl} />
      <span className="lb-pv-sep" aria-hidden="true" />
      <PreviewShare name={name} />
    </nav>
  )
}

/** شريط «عجبك القالب؟» — بيظهر في معاينة القالب بس. */
export function PreviewCtaBar({ cta }: { cta: PreviewCta }) {
  const { t } = useInvite()
  return (
    <div className="lb-cta" data-preview-cta>
      <div className="lb-cta-inner">
        <p className="lb-cta-text">
          {cta.text}
          {cta.template_name && (
            <>
              {' '}
              <strong className="lb-cta-name">{cta.template_name}</strong>
            </>
          )}
        </p>
        <div className="lb-cta-links">
          {cta.whatsapp && (
            <SocialLink name="whatsapp" href={cta.whatsapp} color="#25D366" size={30} label={t('cta.whatsapp')} />
          )}
          {cta.facebook && (
            <SocialLink name="facebook" href={cta.facebook} color="#1877F2" size={30} label={t('cta.facebook')} />
          )}
        </div>
      </div>
    </div>
  )
}
