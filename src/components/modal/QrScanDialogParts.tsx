'use client'

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Link2,
  Loader,
  XCircle,
} from 'lucide-react'
import { IconBrandApple, IconBrandGooglePlay } from '@tabler/icons-react'
import { JSX } from 'react'

// ─── Local types ──────────────────────────────────────────────────────────────

export type RingVariant = 'purple' | 'green' | 'red'

export interface OverlayEntry {
  ring: RingVariant
  icon: 'link' | 'spinner' | 'check' | 'x' | 'clock' | 'alert'
  caption: string
  subtext: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

// TODO: Replace with real Phenix App store links before launch
export const GOOGLE_PLAY_URL = '#'
export const APP_STORE_URL = '#'

export const RING_CLASSES: Record<RingVariant, string> = {
  purple: [
    'bg-[#F2ECFF] border-[0.5px] border-[rgba(87,29,247,0.25)]',
    'dark:bg-[rgba(87,29,247,0.20)] dark:border-[rgba(154,107,251,0.35)]',
  ].join(' '),
  green: [
    'bg-[#EAFAF3] border-[0.5px] border-[rgba(90,201,148,0.35)]',
    'shadow-[0_0_30px_rgba(90,201,148,0.30)]',
  ].join(' '),
  red: 'bg-destructive/10 border-[0.5px] border-destructive/30',
}

export const ICON_COLOR: Record<RingVariant, string> = {
  purple: 'text-[#571DF7] dark:text-[#9E6BFB]',
  green: 'text-[#1E784B]',
  red: 'text-destructive',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Four L-shaped corner brackets — pure CSS, no SVG library required */
export const CornerBrackets = (): JSX.Element => (
  <>
    <div
      aria-hidden="true"
      className="absolute top-[9px] left-[9px] h-[26px] w-[26px] rounded-tl-[9px]"
      style={{
        borderTop: '3.5px solid #571DF7',
        borderLeft: '3.5px solid #571DF7',
      }}
    />
    <div
      aria-hidden="true"
      className="absolute top-[9px] right-[9px] h-[26px] w-[26px] rounded-tr-[9px]"
      style={{
        borderTop: '3.5px solid #571DF7',
        borderRight: '3.5px solid #571DF7',
      }}
    />
    <div
      aria-hidden="true"
      className="absolute bottom-[9px] left-[9px] h-[26px] w-[26px] rounded-bl-[9px]"
      style={{
        borderBottom: '3.5px solid #571DF7',
        borderLeft: '3.5px solid #571DF7',
      }}
    />
    <div
      aria-hidden="true"
      className="absolute right-[9px] bottom-[9px] h-[26px] w-[26px] rounded-br-[9px]"
      style={{
        borderBottom: '3.5px solid #571DF7',
        borderRight: '3.5px solid #571DF7',
      }}
    />
  </>
)

/** Icon inside the state-overlay ring */
export const OverlayIcon = ({
  icon,
  ring,
}: {
  icon: OverlayEntry['icon']
  ring: RingVariant
}): JSX.Element => {
  const cls = `h-8 w-8 ${ICON_COLOR[ring]}`
  if (icon === 'spinner') {
    return (
      <Loader className={`${cls} motion-safe:animate-spin`} strokeWidth={1.5} />
    )
  }
  if (icon === 'check') {
    return <CheckCircle className={cls} strokeWidth={1.5} />
  }
  if (icon === 'x') {
    return <XCircle className={cls} strokeWidth={1.5} />
  }
  if (icon === 'clock') {
    return <Clock className={cls} strokeWidth={1.5} />
  }
  if (icon === 'alert') {
    return <AlertTriangle className={cls} strokeWidth={1.5} />
  }
  return <Link2 className={cls} strokeWidth={1.5} />
}

/** Glassmorphic overlay that fades in over the QR for any non-waiting state */
export const StateOverlay = ({
  entry,
}: {
  entry: OverlayEntry
}): JSX.Element => (
  <div
    className={[
      'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[18px]',
      'bg-[rgba(255,255,255,0.82)] backdrop-blur-[6px]',
      'dark:bg-[rgba(15,15,29,0.65)] dark:backdrop-blur-[8px]',
      'animate-in fade-in-0 duration-[280ms]',
    ].join(' ')}
  >
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-full ${RING_CLASSES[entry.ring]}`}
    >
      <OverlayIcon icon={entry.icon} ring={entry.ring} />
    </div>
    <div className="text-center">
      <p className="text-foreground text-[13px] font-[600]">{entry.caption}</p>
      <p className="text-muted-foreground mt-[3px] text-[11.5px]">
        {entry.subtext}
      </p>
    </div>
  </div>
)

/** Pulsing purple pill — only visible in the waiting state */
export const StatusPill = (): JSX.Element => (
  <div className="self-center rounded-full border-[0.5px] border-[rgba(87,29,247,0.30)] bg-[#F2ECFF] px-[15px] py-[7px]">
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#571DF7] opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#571DF7]" />
      </span>
      <span className="text-[12.5px] font-[600] text-[#571DF7]">
        Waiting for scan...
      </span>
    </div>
  </div>
)

/** MM:SS countdown with a clock icon */
export const Countdown = ({ seconds }: { seconds: number }): JSX.Element => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return (
    <div className="flex items-center justify-center gap-1.5 text-[12px] text-[rgba(12,12,26,0.32)] dark:text-[rgba(255,255,255,0.30)]">
      <Clock className="h-[13px] w-[13px]" strokeWidth={1.5} />
      <span>
        Expires in{' '}
        <span className="font-[600] text-[rgba(12,12,26,0.55)] tabular-nums dark:text-[rgba(255,255,255,0.55)]">
          {m}:{s}
        </span>
      </span>
    </div>
  )
}

/** Ghost/outline action button (Download, Copy link) */
export const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  disabled?: boolean
}): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'flex flex-1 items-center justify-center gap-2 rounded-[10px] py-[9px]',
      'text-[13px] font-[500] text-[#0C0C1A] dark:text-white',
      'border-[0.5px] border-[rgba(87,29,247,0.10)] bg-white',
      'transition-colors duration-200 hover:bg-[#FAFAFD]',
      'dark:border-[rgba(255,255,255,0.16)] dark:bg-[rgba(255,255,255,0.05)]',
      'dark:backdrop-blur-[16px] dark:hover:bg-[rgba(255,255,255,0.09)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(87,29,247,0.6)] focus-visible:ring-offset-2',
      disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
    ].join(' ')}
  >
    <Icon className="h-4 w-4" strokeWidth={1.5} />
    {label}
  </button>
)

/** Premium dark badge for the app store CTA block */
export const StoreBadge = ({
  store,
  href,
}: {
  store: 'google' | 'apple'
  href: string
}): JSX.Element => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={[
      'flex flex-1 items-center gap-[11px] rounded-[12px] border-[0.5px] no-underline',
      'px-[14px] py-[10px]',
      'transition-all duration-200 hover:-translate-y-[1px]',
      'border-[rgba(255,255,255,0.10)] bg-[#161628] text-white',
      'shadow-[0_4px_16px_rgba(12,12,26,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]',
      'dark:border-[rgba(255,255,255,0.14)] dark:bg-[rgba(255,255,255,0.07)] dark:backdrop-blur-[20px]',
      'hover:border-[rgba(87,29,247,0.55)] hover:shadow-[0_4px_16px_rgba(87,29,247,0.18)]',
    ].join(' ')}
  >
    {store === 'google' ? (
      <IconBrandGooglePlay className="h-7 w-7 shrink-0 text-white" />
    ) : (
      <IconBrandApple className="h-7 w-7 shrink-0 text-white" />
    )}
    <div className="flex flex-col">
      <span className="text-[9px] leading-none font-[400] tracking-[0.05em] text-white/65 uppercase">
        {store === 'google' ? 'Get it on' : 'Download on the'}
      </span>
      <span className="font-serif text-[14px] leading-tight font-[600] text-white">
        {store === 'google' ? 'Google Play' : 'App Store'}
      </span>
    </div>
  </a>
)
