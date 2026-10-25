import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageHead, usePageTitle } from '@/features/dashboard/ui/page'
import { QueryState } from '@/features/dashboard/ui/table'

import { useCatalog } from './api'
import './dataadmin.css'

/** إدارة البيانات: كل جداول الموقع (بديل صفحة ‎/admin/‎ الرئيسية). */
export function DataHomePage() {
  const { t } = useTranslation()
  const { data, isPending, isError } = useCatalog()
  const [filter, setFilter] = useState('')
  usePageTitle(t('dataadmin.title'))

  const needle = filter.trim().toLowerCase()
  return (
    <>
      <PageHead title={t('dataadmin.title')} subtitle={t('dataadmin.subtitle')}>
        <input
          className="da-filter"
          type="search"
          value={filter}
          placeholder={t('dataadmin.filterTables')}
          aria-label={t('dataadmin.filterTables')}
          onChange={(event) => setFilter(event.target.value)}
        />
      </PageHead>
      <QueryState loading={isPending} error={isError} />
      {data?.apps.map((app) => {
        const models = app.models.filter((m) => !needle || m.name.toLowerCase().includes(needle) || m.singular.toLowerCase().includes(needle))
        if (models.length === 0) return null
        return (
          <section key={app.app} className="da-app">
            <h2>{t(`dataadmin.apps.${app.app}`, { defaultValue: app.label })}</h2>
            <div className="da-grid">
              {models.map((model) => (
                <article key={model.key} className="da-model card">
                  <Link className="da-model-main" to={`/dashboard/data/${model.key}`}>
                    <strong>{model.name}</strong>
                    <span className="da-count">{t('dataadmin.records', { count: model.count })}</span>
                  </Link>
                  {model.perms.add && !model.single && (
                    <Link className="btn btn--ghost btn--sm" to={`/dashboard/data/${model.key}/new`}>
                      + {t('dataadmin.add')}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        )
      })}
      {data && data.apps.length === 0 && <p className="empty">{t('dataadmin.noTables')}</p>}
    </>
  )
}
