import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { firstChar, pick, truncateChars, useLang } from '../text'
import type { PublicTemplate } from '../types'

/** رابط واتساب جاهز: نص قصير + رابط معاينة القالب (wa.me بيفتح التطبيق على الموبايل وواتساب ويب على الكمبيوتر). */
function whatsappShareUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text}
${url}`)}`
}

/** زرار مشاركة على ركن الغلاف — مش جوّه رابط فالضغطة عليه ماتفتحش المعاينة. */
function ShareButton({ template, name }: { template: PublicTemplate; name: string }) {
  const { t } = useTranslation()
  const label = t('public.templates.share')
  const onShare = () => {
    const url = `${window.location.origin}${previewPath(template)}`
    window.open(whatsappShareUrl(t('public.templates.shareText', { name }), url), '_blank', 'noopener')
  }
  return (
    <button type="button" className="tpl-share" aria-label={label} title={label} onClick={onShare}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="18" cy="5" r="2.6" />
        <circle cx="6" cy="12" r="2.6" />
        <circle cx="18" cy="19" r="2.6" />
        <path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3" />
      </svg>
    </button>
  )
}

/** الغلاف: صورة لو فيه، وإلا أول حرف من الاسم. ‎JSON.stringify‎ بيهرّب أي علامة اقتباس في الرابط. */
function Cover({ template, name }: { template: PublicTemplate; name: string }) {
  return (
    <div
      className="tpl-cover"
      style={template.cover ? { backgroundImage: `url(${JSON.stringify(template.cover)})` } : undefined}
    >
      {!template.cover && firstChar(name)}
      <ShareButton template={template} name={name} />
    </div>
  )
}

function Meta({ template }: { template: PublicTemplate }) {
  // «بدون» تصنيف ومن غير مجموعة = مفيش سطر خالص تحت الاسم
  if (template.category === 'none' && !template.collection) return null
  return (
    <span className="tpl-meta">
      {template.category !== 'none' && (
        <>
          {template.categoryLabel}
          {template.collection && ' · '}
        </>
      )}
      {template.collection}
    </span>
  )
}

const previewPath = (template: PublicTemplate) => `/templates/${template.slug}/preview/`

/** كارت القالب في الرئيسية: زرار واحد بيفتح معاينة القالب. */
export function HomeTemplateCard({ template }: { template: PublicTemplate }) {
  const { t } = useTranslation()
  const lang = useLang()
  const name = pick(lang, template.name, template.nameEn)
  const hasDescription = !!(template.description || template.descriptionEn)
  return (
    <article className="tpl-card" data-reveal data-reveal-stagger>
      <Cover template={template} name={name} />
      <div className="tpl-body">
        <h3>{name}</h3>
        <Meta template={template} />
        {hasDescription && <p className="tpl-desc">{pick(lang, template.description, template.descriptionEn)}</p>}
        <div className="tpl-actions">
          <Link className="btn btn--gold btn--sm" to={previewPath(template)} target="_blank" rel="noopener">
            {t('public.templates.preview')}
          </Link>
        </div>
      </div>
    </article>
  )
}

/** كارت القالب في معرض القوالب: معاينة حية + «اطلبه». */
export function GalleryTemplateCard({ template }: { template: PublicTemplate }) {
  const { t } = useTranslation()
  const lang = useLang()
  const name = pick(lang, template.name, template.nameEn)
  const hasDescription = !!(template.description || template.descriptionEn)
  return (
    <article className="tpl-card">
      <Cover template={template} name={name} />
      <div className="tpl-body">
        <h3>{name}</h3>
        <Meta template={template} />
        {hasDescription && (
          <p className="muted tpl-desc--sm">
            {pick(lang, truncateChars(template.description, 80), truncateChars(template.descriptionEn, 80))}
          </p>
        )}
        <div className="tpl-actions">
          <Link className="btn btn--ghost btn--sm" to={previewPath(template)} target="_blank" rel="noopener">
            {t('public.gallery.live')}
          </Link>
          <Link className="btn btn--gold btn--sm" to={{ pathname: '/', hash: '#order' }}>
            {t('public.gallery.order')}
          </Link>
        </div>
      </div>
    </article>
  )
}

interface Props {
  templates: PublicTemplate[] | undefined
  error: unknown
  /** عدد القوالب في الصف على التليفون — من إعدادات الموقع (الافتراضي واحد) */
  perRow?: 1 | 2
}

export function TemplatesSection({ templates, error, perRow = 1 }: Props) {
  const { t } = useTranslation()
  return (
    <section className="section" id="templates">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{t('public.templates.eyebrow')}</p>
          <h2>{t('public.templates.title')}</h2>
          <p>{t('public.templates.sub')}</p>
        </div>
        <div className="grid grid--4" data-per-row={perRow}>
          {templates?.map((template) => <HomeTemplateCard key={template.id} template={template} />)}
          {templates?.length === 0 && <p className="empty">{t('public.templates.empty')}</p>}
          {!!error && (
            <p className="empty" role="alert">
              {error instanceof ApiError && error.message ? error.message : t('public.loadError')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
