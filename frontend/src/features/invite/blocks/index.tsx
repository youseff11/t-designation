import type { ComponentType } from 'react'

import type { BlockData } from '../types'
import { Countdown } from './Countdown'
import {
  Agenda,
  Branding,
  Buttons,
  CustomHtml,
  Details,
  Divider,
  Hero,
  Hosts,
  ImageBlock,
  Location,
  Qr,
  Quote,
  Spacer,
  TextBlock,
  Wishes,
} from './content'
import { Gallery } from './Gallery'
import { Rsvp } from './Rsvp'
import { Share } from './Share'
import { Video } from './Video'

type BlockComponent = ComponentType<{ block: BlockData }>

/** نوع البلوك → المكوّن. نوع مش معروف بيتخطّى (زي ‎render_document‎ لما مفيش spec). */
const REGISTRY: Record<string, BlockComponent> = {
  hero: Hero,
  text: TextBlock,
  quote: Quote,
  hosts: Hosts,
  countdown: Countdown,
  details: Details,
  agenda: Agenda,
  location: Location,
  gallery: Gallery,
  image: ImageBlock,
  video: Video,
  rsvp: Rsvp,
  wishes: Wishes,
  qr: Qr,
  share: Share,
  divider: Divider,
  spacer: Spacer,
  buttons: Buttons,
  branding: Branding,
  custom_html: CustomHtml,
}

export function BlockView({ block }: { block: BlockData }) {
  const Component = Object.hasOwn(REGISTRY, block.type) ? REGISTRY[block.type] : null
  if (!Component) return null
  if (block.type === 'rsvp' && !block.rsvp) return null
  return <Component block={block} />
}
