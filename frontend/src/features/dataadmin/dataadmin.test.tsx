import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { initI18n } from '@/i18n'
import { ToastProvider } from '@/features/dashboard/ui/Toast'

import { DataFormPage } from './DataFormPage'
import { DataHomePage } from './DataHomePage'
import { DataListPage } from './DataListPage'
import type { ListResponse, ObjectResponse, SchemaResponse } from './types'

const PERMS = { view: true, add: true, change: true, delete: true }
const MODEL = { key: 'system.customer', name: 'العملاء', singular: 'عميل' }

const FIELDS: SchemaResponse['fields'] = [
  { name: 'name', label: 'الاسم', kind: 'text', required: true, help: '', readonly: false, maxLength: 120 },
  { name: 'vip', label: 'مميز', kind: 'bool', required: false, help: '', readonly: false },
  { name: 'tier', label: 'الفئة', kind: 'choice', required: false, help: '', readonly: false, blank: true, choices: [{ value: 'a', label: 'ذهبية' }, { value: 'b', label: 'فضية' }] },
  { name: 'plan', label: 'الباقة', kind: 'fk', required: false, help: '', readonly: false, related: 'system.plan', blank: true },
  { name: 'tags', label: 'وسوم', kind: 'json', required: false, help: '', readonly: false },
  { name: 'created', label: 'اتسجّل', kind: 'readonly', required: false, help: '', readonly: true },
]
const SCHEMA: SchemaResponse = {
  model: MODEL,
  perms: PERMS,
  fields: FIELDS,
  fieldsets: [{ title: '', description: '', fields: FIELDS.map((f) => f.name) }],
  defaults: { name: '', vip: false, tier: '', plan: null, tags: '[]' },
}
const OBJECT: ObjectResponse = {
  ...SCHEMA,
  id: 5,
  title: 'منى',
  values: { name: 'منى', vip: true, tier: 'a', plan: { id: 2, label: 'ذهبية' }, tags: '["x"]' },
  readonly: { created: { k: 'date', v: '2026-10-25T10:00:00' } },
  inlines: [],
}
const LIST: ListResponse = {
  model: MODEL,
  perms: PERMS,
  columns: [
    { name: 'name', label: 'الاسم', sortable: true },
    { name: 'vip', label: 'مميز', sortable: false },
  ],
  filters: [{ name: 'tier', label: 'الفئة', kind: 'choice', options: [{ value: 'a', label: 'ذهبية' }] }],
  searchable: true,
  rows: [
    { id: 5, title: 'منى', cells: [{ k: 'text', v: 'منى' }, { k: 'bool', v: true }] },
    { id: 6, title: 'سارة', cells: [{ k: 'text', v: 'سارة' }, { k: 'bool', v: false }] },
  ],
  total: 2,
  page: 1,
  pages: 1,
  size: 25,
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

interface Call {
  method: string
  url: string
  body: unknown
}
let calls: Call[]
let respond: (call: Call) => Response | undefined

function stubFetch() {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const raw = init?.body
      const call: Call = { method: init?.method ?? 'GET', url, body: typeof raw === 'string' ? JSON.parse(raw) : raw }
      if (url.includes('/site/')) return json({ name: { ar: 'تي', en: 'T' } })
      calls.push(call)
      return respond(call) ?? json({})
    }),
  )
}

function Probe() {
  const location = useLocation()
  return <output data-testid="at">{location.pathname + location.search}</output>
}

function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/dashboard/data" element={<DataHomePage />} />
            <Route path="/dashboard/data/:model" element={<DataListPage />} />
            <Route path="/dashboard/data/:model/new" element={<DataFormPage />} />
            <Route path="/dashboard/data/:model/:id" element={<DataFormPage />} />
          </Routes>
          <Probe />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeAll(() => initI18n('ar'))
beforeEach(() => {
  document.cookie = 'csrftoken=t'
  stubFetch()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('data admin home', () => {
  it('lists the tables by app, filters them, and links to list and add', async () => {
    respond = (c) =>
      c.url.endsWith('/data/')
        ? json({
            apps: [
              {
                app: 'system',
                label: 'النظام',
                models: [
                  { key: 'system.customer', name: 'العملاء', singular: 'عميل', count: 3, perms: PERMS, single: false },
                  { key: 'system.faq', name: 'الأسئلة', singular: 'سؤال', count: 1, perms: { ...PERMS, add: false }, single: false },
                ],
              },
            ],
          })
        : undefined
    mount('/dashboard/data')
    expect(await screen.findByText('العملاء')).toBeInTheDocument()
    expect(screen.getByText('3 سجل')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /العملاء/ })).toHaveAttribute('href', '/dashboard/data/system.customer')
    expect(screen.getAllByRole('link', { name: /إضافة/ })).toHaveLength(1) // الأسئلة من غير صلاحية إضافة

    fireEvent.change(screen.getByLabelText('ابحث عن جدول…'), { target: { value: 'أسئلة' } })
    expect(screen.queryByText('العملاء')).toBeNull()
    expect(screen.getByText('الأسئلة')).toBeInTheDocument()
  })
})

describe('data admin list', () => {
  beforeEach(() => {
    respond = (c) => (c.url.includes('/system.customer/') && c.method === 'GET' ? json(LIST) : undefined)
  })

  it('renders the admin columns, links rows to the form, and searches and filters through the URL', async () => {
    mount('/dashboard/data/system.customer')
    expect(await screen.findByRole('link', { name: 'منى' })).toHaveAttribute('href', '/dashboard/data/system.customer/5')
    expect(screen.getByText('سارة')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('بحث…'), { target: { value: 'سار' } })
    fireEvent.click(screen.getByRole('button', { name: 'بحث' }))
    await waitFor(() => expect(screen.getByTestId('at').textContent).toContain('q=%D8%B3%D8%A7%D8%B1'))
    fireEvent.change(screen.getByLabelText('الفئة'), { target: { value: 'a' } })
    await waitFor(() => expect(screen.getByTestId('at').textContent).toContain('f_tier=a'))
    await waitFor(() => expect(calls.at(-1)?.url).toContain('f_tier=a'))
    fireEvent.click(screen.getByRole('button', { name: 'الاسم' }))
    await waitFor(() => expect(screen.getByTestId('at').textContent).toContain('o=name'))
  })

  it('deletes the selected rows after showing what goes with them', async () => {
    respond = (c) => {
      if (c.url.endsWith('/delete-preview/')) return json({ items: [{ text: 'عميل: منى', depth: 0 }, { text: 'دعوة: س', depth: 1 }], counts: { عملاء: 1, دعوات: 1 }, protected: [], permsNeeded: [] })
      if (c.url.endsWith('/delete/')) return json({ deleted: 1 })
      return c.url.includes('/system.customer/') && c.method === 'GET' ? json(LIST) : undefined
    }
    mount('/dashboard/data/system.customer')
    fireEvent.click(await screen.findByLabelText('منى'))
    fireEvent.click(screen.getByRole('button', { name: 'حذف المحدد' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(await within(dialog).findByText('دعوة: س')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'نعم، احذف' }))
    await waitFor(() => expect(calls.some((c) => c.url.endsWith('/delete/'))).toBe(true))
    expect(calls.find((c) => c.url.endsWith('/delete/'))?.body).toEqual({ ids: [5] })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('blocks deletion when protected records are involved', async () => {
    respond = (c) => {
      if (c.url.endsWith('/delete-preview/')) return json({ items: [], counts: {}, protected: ['دعوة محمية'], permsNeeded: [] })
      return c.url.includes('/system.customer/') && c.method === 'GET' ? json(LIST) : undefined
    }
    mount('/dashboard/data/system.customer')
    fireEvent.click(await screen.findByLabelText('منى'))
    fireEvent.click(screen.getByRole('button', { name: 'حذف المحدد' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(await within(dialog).findByText('دعوة محمية')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'نعم، احذف' })).toBeDisabled()
  })

  it('opens a single-record table straight on its form', async () => {
    respond = (c) =>
      c.url.includes('/system.customer/') && c.method === 'GET'
        ? json({ ...LIST, total: 1, perms: { ...PERMS, add: false }, rows: [LIST.rows[0]] })
        : undefined
    mount('/dashboard/data/system.customer')
    await waitFor(() => expect(screen.getByTestId('at').textContent).toBe('/dashboard/data/system.customer/5'))
  })
})

describe('data admin form', () => {
  it('creates a record from the defaults and goes to its page', async () => {
    respond = (c) => {
      if (c.url.endsWith('/schema/')) return json(SCHEMA)
      if (c.method === 'POST') return json({ id: 9, title: 'جديدة' })
      return undefined
    }
    mount('/dashboard/data/system.customer/new')
    fireEvent.change(await screen.findByLabelText(/الاسم/), { target: { value: 'جديدة' } })
    fireEvent.click(screen.getByLabelText('مميز'))
    fireEvent.change(screen.getByLabelText('الفئة'), { target: { value: 'b' } })
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.url).toContain('/data/system.customer/')
    expect(post.body).toMatchObject({ name: 'جديدة', vip: true, tier: 'b', plan: null, tags: '[]' })
    await waitFor(() => expect(screen.getByTestId('at').textContent).toBe('/dashboard/data/system.customer/9'))
  })

  it('shows the values, sends only what changed, and refreshes after saving', async () => {
    respond = (c) => {
      if (c.method === 'POST') return json({ id: 5, title: 'منى ٢' })
      return c.url.endsWith('/system.customer/5/') ? json(OBJECT) : undefined
    }
    mount('/dashboard/data/system.customer/5')
    const name = (await screen.findByLabelText(/الاسم/)) as HTMLInputElement
    expect(name.value).toBe('منى')
    expect(screen.getByLabelText('مميز')).toBeChecked()
    expect(screen.getByText('ذهبية', { selector: '.da-chip' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'حفظ' })).toBeDisabled() // مفيش تغيير لسه

    fireEvent.change(name, { target: { value: 'منى ٢' } })
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ name: 'منى ٢' })
  })

  it('puts the server field errors under their fields', async () => {
    respond = (c) => {
      if (c.method === 'POST') return json({ error: { code: 'invalid', message: 'راجع البيانات', fields: { name: 'الاسم مطلوب' } } }, 400)
      return c.url.endsWith('/system.customer/5/') ? json(OBJECT) : undefined
    }
    mount('/dashboard/data/system.customer/5')
    fireEvent.change(await screen.findByLabelText(/الاسم/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    expect(await screen.findByText('الاسم مطلوب')).toBeInTheDocument()
  })

  it('picks a related record through the lookup', async () => {
    respond = (c) => {
      if (c.url.includes('/lookup/plan/')) return json({ results: [{ id: 7, label: 'فضية' }, { id: 2, label: 'ذهبية' }] })
      if (c.method === 'POST') return json({ id: 5, title: 'منى' })
      return c.url.endsWith('/system.customer/5/') ? json(OBJECT) : undefined
    }
    mount('/dashboard/data/system.customer/5')
    const picker = await screen.findByPlaceholderText('غيّر…')
    fireEvent.focus(picker)
    const list = await screen.findByRole('listbox')
    expect(within(list).queryByRole('option', { name: 'ذهبية' })).toBeNull() // الحالي مش بيتعرض تاني
    fireEvent.click(await within(list).findByRole('option', { name: 'فضية' }))
    expect(screen.queryByRole('listbox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ plan: { id: 7, label: 'فضية' } })
  })

  it('validates JSON live and formats it', async () => {
    respond = (c) => (c.url.endsWith('/system.customer/5/') ? json(OBJECT) : undefined)
    mount('/dashboard/data/system.customer/5')
    const box = (await screen.findByLabelText('وسوم')) as HTMLTextAreaElement
    expect(screen.getByText('JSON صالح')).toBeInTheDocument()
    fireEvent.change(box, { target: { value: '{bad' } })
    expect(screen.getByText('JSON غير صالح')).toBeInTheDocument()
    fireEvent.change(box, { target: { value: '{"a":1}' } })
    fireEvent.click(screen.getByRole('button', { name: 'تنسيق' }))
    expect(box.value).toBe('{\n  "a": 1\n}')
  })

  it('deletes from the form after confirmation and returns to the list', async () => {
    respond = (c) => {
      if (c.url.endsWith('/delete-preview/')) return json({ items: [{ text: 'عميل: منى', depth: 0 }], counts: {}, protected: [], permsNeeded: [] })
      if (c.url.endsWith('/delete/')) return json({ deleted: 1 })
      return c.url.endsWith('/system.customer/5/') ? json(OBJECT) : undefined
    }
    mount('/dashboard/data/system.customer/5')
    fireEvent.click(await screen.findByRole('button', { name: 'حذف' }))
    const dialog = await screen.findByRole('alertdialog')
    await within(dialog).findByText('عميل: منى')
    fireEvent.click(within(dialog).getByRole('button', { name: 'نعم، احذف' }))
    await waitFor(() => expect(screen.getByTestId('at').textContent).toBe('/dashboard/data/system.customer'))
  })

  it('hides save and delete without the permissions', async () => {
    respond = (c) =>
      c.url.endsWith('/system.customer/5/') ? json({ ...OBJECT, perms: { view: true, add: false, change: false, delete: false } }) : undefined
    mount('/dashboard/data/system.customer/5')
    await screen.findByLabelText(/الاسم/)
    expect(screen.queryByRole('button', { name: 'حفظ' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'حذف' })).toBeNull()
  })
})
