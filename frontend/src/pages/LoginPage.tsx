import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useLogin, useMe } from '@/api/hooks'
import { ApiError } from '@/api/client'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: user } = useMe()
  const login = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useDocumentTitle(t('login.title'))

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  if (user) return <Navigate to={from} replace />

  function submit(event: FormEvent) {
    event.preventDefault()
    login.mutate({ username, password }, { onSuccess: () => navigate(from, { replace: true }) })
  }

  const error = login.error
  const fieldErrors = error instanceof ApiError ? error.fields : undefined

  return (
    <div className="page wrap">
      <form className="form-card" onSubmit={submit} noValidate>
        <h1>{t('login.title')}</h1>
        <label className="field">
          <span>{t('login.username')}</span>
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {fieldErrors?.username && <div className="field-error">{fieldErrors.username}</div>}
        </label>
        <label className="field">
          <span>{t('login.password')}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {fieldErrors?.password && <div className="field-error">{fieldErrors.password}</div>}
        </label>
        {error && (
          <p className="notice notice--error" role="alert">
            {error instanceof ApiError ? error.message || t('errors.generic') : t('errors.network')}
          </p>
        )}
        <button className="btn btn--gold btn--block" type="submit" disabled={login.isPending}>
          {login.isPending ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
    </div>
  )
}
