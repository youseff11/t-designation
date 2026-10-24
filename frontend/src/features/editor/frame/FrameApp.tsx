import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { BlockView } from '@/features/invite/blocks'
import { prefetchBlocks } from '@/features/invite/blocks/lazy'
import { InviteContext } from '@/features/invite/context'
import { syncHeadStyles } from '@/features/invite/head'
import { makeT } from '@/features/invite/strings'

import type { PreviewPayload, ToFrame } from '../types'
import { parseMessage, sendToParent } from './bridge'

/** ‎data-block‎ للقسم اللي اتضغط عليه (أو أقرب أب ليه). */
export function blockIdAt(target: EventTarget | null): string | null {
  const node = target instanceof Element ? target.closest('[data-block]') : null
  return node?.getAttribute('data-block') ?? null
}

/** لغة الصفحة واتجاهها ومتغيّرات الثيم على ‎<body>‎ — نسخة ‎applyPageMeta‎ من غير عنوان/وصف الدعوة. */
function applyBody(payload: PreviewPayload) {
  document.documentElement.setAttribute('lang', payload.lang)
  document.documentElement.setAttribute('dir', payload.dir)
  if ((document.body.getAttribute('style') || '') !== payload.bodyStyle) {
    document.body.setAttribute('style', payload.bodyStyle)
  }
}

function markSelected(id: string | null) {
  for (const node of document.querySelectorAll('[data-block]')) {
    node.classList.toggle('is-selected', node.getAttribute('data-block') === id)
  }
}

/**
 * المعاينة جوّه المحرر. الصفحة الأم بتبعت الحمولة (‎lb-editor:render‎) والـframe بيرسمها بنفس
 * مكوّنات عارض الدعوة، وبيرجّع الضغطات (تحديد قسم) واختصارات لوحة المفاتيح. مفيش شبكة هنا.
 * C1: من غير الافتتاحية ولا الموسيقى ولا runtime القوالب المستوردة (C2/C4/C5).
 */
export function FrameApp() {
  const [state, setState] = useState<{ payload: PreviewPayload; selected: string | null } | null>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parseMessage<ToFrame>(event, window.parent)
      if (!message) return
      if (message.type === 'lb-editor:render') {
        setState({ payload: message.payload as PreviewPayload, selected: message.selected })
      } else if (message.type === 'lb-editor:select') {
        setState((current) => (current ? { ...current, selected: message.id } : current))
        if (message.scroll && message.id) {
          const node = Array.from(document.querySelectorAll('[data-block]')).find(
            (n) => n.getAttribute('data-block') === message.id,
          )
          node?.scrollIntoView({ block: 'center' })
        }
      }
    }
    window.addEventListener('message', onMessage)
    sendToParent({ type: 'lb-editor:ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ضغطة على قسم = تحديده، ومفيش تنقّل ولا إرسال فورم جوّه المحرر
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href], button[type="submit"]')) event.preventDefault()
      const id = blockIdAt(event.target)
      if (id) sendToParent({ type: 'lb-editor:select', id })
    }
    const onSubmit = (event: Event) => event.preventDefault()
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.isContentEditable
      const mod = event.ctrlKey || event.metaKey
      if (!mod && (typing || !['Delete', 'Backspace', 'Escape'].includes(event.key))) return
      if (mod) event.preventDefault()
      sendToParent({ type: 'lb-editor:key', key: event.key, shiftKey: event.shiftKey })
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const payload = state?.payload
  const ctx = useMemo(
    () =>
      payload
        ? { lang: payload.lang, t: makeT(payload.lang), maxWidth: payload.maxWidth, demo: true, hasIntro: false }
        : null,
    [payload],
  )

  // الستايل والتحديد بعد كل رسمة: React بيكتب ‎className‎ كاملة لو اتغيّرت فبيمسح ‎is-selected‎ و‎is-in‎
  useLayoutEffect(() => {
    if (!payload) return
    if (payload.css) syncHeadStyles(payload.css)
    applyBody(payload)
    document.querySelectorAll('.lb-anim').forEach((node) => node.classList.add('is-in')) // من غير حركة ظهور في المحرر
    markSelected(state.selected)
  }, [payload, state?.selected])

  useEffect(() => {
    if (payload) prefetchBlocks(new Set(payload.blocks.map((b) => b.type)))
  }, [payload])

  if (!payload || !ctx) return null
  const { stage } = payload
  const stageClass = ['lb-stage', stage.full && 'lb-stage--full', stage.pattern && `lb-pattern lb-pattern--${stage.pattern}`]
    .filter(Boolean)
    .join(' ')

  return (
    <InviteContext.Provider value={ctx}>
      <div className={stageClass}>
        {payload.blocks.map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
        {payload.showBranding && (
          <footer className="lb-footer">
            {ctx.t('footer.designedBy')} <span>{payload.siteName}</span>
          </footer>
        )}
      </div>
    </InviteContext.Provider>
  )
}
