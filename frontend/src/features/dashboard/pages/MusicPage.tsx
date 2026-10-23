import type { FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useLibrary } from '../api'
import { CheckField, ErrorList, FileField, MB, TextField, useFormErrors } from '../ui/forms'
import { LibraryActions } from '../ui/LibraryActions'
import { PageHead, Pill, usePageTitle } from '../ui/page'
import { QueryState, Table } from '../ui/table'
import { useToast } from '../ui/Toast'

/** مكتبة الموسيقى (‎templates/dashboard/music.html‎). */
export function MusicPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { list, create, toggle, remove } = useLibrary('music')
  const errors = useFormErrors()
  usePageTitle(t('dashboard.music.pageTitle'))

  const tracks = list.data?.results ?? []

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    errors.clear()
    create.mutate(new FormData(form), {
      onSuccess: (track) => {
        toast.success(t('dashboard.music.added', { name: track.name }))
        form.reset()
      },
      onError: (error) => {
        if (errors.fail(error)) toast.error(t('dashboard.music.reviewData'))
        else toast.fail(error)
      },
    })
  }

  return (
    <>
      <PageHead title={t('dashboard.music.title')}>
        <Link className="btn btn--ghost" to="/dashboard/invitations">
          {t('dashboard.common.backToInvitations')}
        </Link>
      </PageHead>

      <div className="card" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>{t('dashboard.common.howItWorks')}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          <Trans i18nKey="dashboard.music.how" components={{ strong: <strong /> }} />
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: 18 }}>{t('dashboard.music.listTitle', { n: tracks.length })}</h2>
          <QueryState loading={list.isPending} error={list.isError} />
          {list.data && (
            <Table
              head={[
                t('dashboard.music.cols.name'),
                t('dashboard.music.cols.listen'),
                t('dashboard.music.cols.order'),
                t('dashboard.music.cols.status'),
                null,
              ]}
              empty={t('dashboard.music.none')}
              isEmpty={tracks.length === 0}
            >
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td>
                    {track.name}
                    {track.note && (
                      <>
                        <br />
                        <span className="muted" style={{ fontSize: 12.5 }}>
                          {track.note}
                        </span>
                      </>
                    )}
                  </td>
                  <td>
                    {track.url ? (
                      <audio controls preload="none" src={track.url} style={{ maxWidth: 220, height: 34 }} />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>{track.order}</td>
                  <td>
                    {track.isActive ? (
                      <Pill kind="published">{t('dashboard.music.available')}</Pill>
                    ) : (
                      <Pill kind="archived">{t('dashboard.music.hidden')}</Pill>
                    )}
                  </td>
                  <td>
                    <LibraryActions kind="music" row={track} toggle={toggle} remove={remove} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        <aside className="card">
          <h2 style={{ fontSize: 17, marginTop: 0 }}>{t('dashboard.music.addTitle')}</h2>
          <form className="form" onSubmit={onSubmit} encType="multipart/form-data">
            <ErrorList message={errors.formError} nonField />
            <TextField
              name="name"
              label={t('dashboard.music.fields.name')}
              maxLength={120}
              required
              error={errors.fields.name}
            />
            <FileField
              name="file"
              label={t('dashboard.music.fields.file')}
              accept="audio/*"
              maxBytes={8 * MB}
              error={errors.fields.file}
            />
            <TextField
              name="externalUrl"
              type="url"
              label={t('dashboard.music.fields.externalUrl')}
              placeholder="https://.../song.mp3"
              maxLength={200}
              help={t('dashboard.music.externalUrlHelp')}
              helpSmall
              error={errors.fields.externalUrl}
            />
            <TextField
              name="note"
              label={t('dashboard.music.fields.note')}
              maxLength={200}
              error={errors.fields.note}
            />
            <CheckField name="isActive" label={t('dashboard.music.fields.isActive')} defaultChecked />
            <TextField
              name="order"
              type="number"
              label={t('dashboard.music.fields.order')}
              defaultValue={0}
              min={0}
              required
              error={errors.fields.order}
            />
            <button className="btn btn--gold btn--block" type="submit" disabled={create.isPending}>
              {t('dashboard.common.saveToLibrary')}
            </button>
          </form>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>
            {t('dashboard.music.footnote')}
          </p>
        </aside>
      </div>
    </>
  )
}
