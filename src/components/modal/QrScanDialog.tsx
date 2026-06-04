'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  APP_STORE_URL,
  ActionButton,
  CornerBrackets,
  Countdown,
  GOOGLE_PLAY_URL,
  type OverlayEntry,
  StateOverlay,
  StatusPill,
  StoreBadge,
} from './QrScanDialogParts'
import { Copy, Download, X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'
import { JSX, useEffect, useRef, useState } from 'react'
import { AxiosResponse } from 'axios'
import QRCode from 'react-qr-code'

// ─── Types ────────────────────────────────────────────────────────────────────

export type QrScanStatus =
  | 'idle'
  | 'waiting'
  | 'offer-sent' // issuance: credential offer dispatched / wallet connected
  | 'presentation-received' // verification: proof submitted, being verified
  | 'done' // issuance success
  | 'verified' // verification success
  | 'abandoned'
  | 'expired'
  | 'error'

export interface IQrScanDialogProps {
  open: boolean
  onClose: () => void
  /** Encoded into the QR code */
  invitationUrl: string
  /** UUID of the exchange record to poll; polling is skipped when null */
  exchangeId: string | null
  orgId: string
  /** When present, renders a "Copy link" action button */
  deepLinkURL?: string
  /** Override the modal title */
  title?: string
  /** Override the full intro paragraph */
  description?: string
  /**
   * Adjusts default status overlay copy.
   * 'issuance' = credential language; 'verification' = proof language.
   * Default: 'issuance'.
   */
  mode?: 'issuance' | 'verification'
  onSuccess: () => void
  onRegenerate: () => void
  /** Called every POLL_INTERVAL_MS; return value is mapped by resolveStatus */
  pollFn: (exchangeId: string, orgId: string) => Promise<AxiosResponse | string>
  /** Maps a poll response to the next QrScanStatus */
  resolveStatus: (response: AxiosResponse) => QrScanStatus
  /** Override caption and/or subtext for any specific status */
  statusMessages?: Partial<
    Record<QrScanStatus, { caption: string; subtext: string }>
  >
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPIRY_SECONDS = 300
const POLL_INTERVAL_MS = 4000
const SUCCESS_DELAY_MS = 2000
const COPY_RESET_MS = 2000

const TERMINAL_STATES: QrScanStatus[] = [
  'done',
  'verified',
  'abandoned',
  'expired',
  'error',
]
const SUCCESS_STATES: QrScanStatus[] = ['done', 'verified']

const BASE_OVERLAY_CONFIG: Partial<Record<QrScanStatus, OverlayEntry>> = {
  'offer-sent': {
    ring: 'purple',
    icon: 'link',
    caption: 'Wallet connected',
    subtext: 'Holder accepted the connection',
  },
  'presentation-received': {
    ring: 'purple',
    icon: 'spinner',
    caption: 'Proof received',
    subtext: 'Verifying…',
  },
  done: {
    ring: 'green',
    icon: 'check',
    caption: 'Credential received',
    subtext: 'Stored in the Phenix App',
  },
  verified: {
    ring: 'green',
    icon: 'check',
    caption: 'Proof verified',
    subtext: 'Successfully verified',
  },
  abandoned: {
    ring: 'red',
    icon: 'x',
    caption: 'Declined',
    subtext: 'The holder declined or did not respond',
  },
  expired: {
    ring: 'red',
    icon: 'clock',
    caption: 'QR expired',
    subtext: 'Generate a new code to try again',
  },
  error: {
    ring: 'red',
    icon: 'alert',
    caption: 'Something went wrong',
    subtext: 'Tap Regenerate to try again',
  },
}

// ─── Main component ───────────────────────────────────────────────────────────

const QrScanDialog = ({
  open,
  onClose,
  invitationUrl,
  exchangeId,
  orgId,
  deepLinkURL,
  title,
  description,
  mode = 'issuance',
  onSuccess,
  onRegenerate,
  pollFn,
  resolveStatus,
  statusMessages,
}: IQrScanDialogProps): JSX.Element => {
  const [status, setStatus] = useState<QrScanStatus>('waiting')
  const [secondsLeft, setSecondsLeft] = useState<number>(EXPIRY_SECONDS)
  const [copied, setCopied] = useState<boolean>(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const resolvedTitle =
    title ??
    (mode === 'verification' ? 'Scan to Verify' : 'Scan to Receive Credential')
  const resolvedIntro =
    description ??
    (mode === 'verification'
      ? 'respond to the proof request'
      : 'receive the credential offer')

  const getOverlayEntry = (s: QrScanStatus): OverlayEntry | undefined => {
    const base = BASE_OVERLAY_CONFIG[s]
    if (!base) {
      return undefined
    }
    const override = statusMessages?.[s]
    if (!override) {
      return base
    }
    return { ...base, ...override }
  }

  const overlayEntry =
    status !== 'waiting' && status !== 'idle'
      ? getOverlayEntry(status)
      : undefined
  const isTerminal = TERMINAL_STATES.includes(status)
  const showRegenerate = status === 'expired' || status === 'error'

  // Reset state whenever the dialog opens with a fresh invitation URL
  useEffect(() => {
    if (open) {
      setStatus('waiting')
      setSecondsLeft(EXPIRY_SECONDS)
    }
  }, [open, invitationUrl])

  // Countdown — ticks every second; stops on terminal states
  useEffect(() => {
    if (!open || isTerminal) {
      return
    }
    if (secondsLeft <= 0) {
      setStatus('expired')
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [open, secondsLeft, isTerminal])

  // Polling — only when a valid exchange UUID is available
  useEffect(() => {
    if (!open || !exchangeId || isTerminal) {
      return
    }
    const interval = setInterval(async () => {
      try {
        const res = await pollFn(exchangeId, orgId)
        if (typeof res === 'string') {
          return
        }
        const next = resolveStatus(res)
        if (next === status) {
          return
        }
        setStatus(next)
        if (SUCCESS_STATES.includes(next)) {
          setTimeout(onSuccess, SUCCESS_DELAY_MS)
        }
      } catch {
        // Transient network error — keep polling until the QR expires
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [
    open,
    exchangeId,
    orgId,
    status,
    isTerminal,
    pollFn,
    resolveStatus,
    onSuccess,
  ])

  const handleCopyLink = async (): Promise<void> => {
    if (!deepLinkURL) {
      return
    }
    await navigator.clipboard.writeText(deepLinkURL)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_RESET_MS)
  }

  const handleDownload = (): void => {
    if (!qrRef.current) {
      return
    }
    const svg = qrRef.current.querySelector('svg')
    if (!svg) {
      return
    }
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'phenix-qr.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
        }
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(12,12,26,0.42)] backdrop-blur-[3px] dark:bg-[rgba(7,7,14,0.55)]" />

        {/* Modal shell — uses DialogPrimitive.Content directly to avoid shadcn's
            built-in close button, so we can place our own in the header row. */}
        <DialogPrimitive.Content
          aria-label={resolvedTitle}
          className={[
            'fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-full max-w-[min(420px,calc(100vw-2rem))]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'qr-modal-content overflow-hidden rounded-[20px] p-0 duration-200',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[22px] pt-[20px] pb-[16px]">
            <DialogTitle className="font-serif text-[17px] leading-tight font-[700] tracking-[-0.01em] text-[#0C0C1A] dark:text-white">
              {resolvedTitle}
            </DialogTitle>
            <DialogClose className="ml-2 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-[rgba(12,12,26,0.55)] transition-colors duration-200 hover:bg-[rgba(12,12,26,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(87,29,247,0.6)] focus-visible:ring-offset-2 dark:text-[rgba(255,255,255,0.55)] dark:hover:bg-[rgba(255,255,255,0.08)]">
              <X className="h-[14px] w-[14px]" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-[18px] px-[22px] pt-0 pb-[22px]">
            {/* ① Intro */}
            {description ? (
              <p className="text-[13px] leading-[1.55] text-[rgba(12,12,26,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                {description}
              </p>
            ) : (
              <p className="text-[13px] leading-[1.55] text-[rgba(12,12,26,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Open your{' '}
                <strong className="font-[600] text-[#0C0C1A] dark:text-white">
                  Phenix App
                </strong>
                , tap{' '}
                <strong className="font-[600] text-[#0C0C1A] dark:text-white">
                  Scan
                </strong>
                , and point it at this code to {resolvedIntro}.
              </p>
            )}

            {/* ② QR Frame — always white, even in dark mode */}
            <div
              ref={qrRef}
              className="relative mx-auto flex h-[244px] w-[244px] shrink-0 items-center justify-center rounded-[18px] bg-white p-[18px]"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 22px rgba(87,29,247,0.10), 0 0 40px rgba(87,29,247,0.08)',
              }}
            >
              <CornerBrackets />
              <QRCode
                value={invitationUrl}
                size={208}
                fgColor="#0F0F1D"
                bgColor="transparent"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
              {/* Center logo — 58×58 white circle, absolutely centered */}
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  filter: 'drop-shadow(0 2px 12px rgba(12,12,26,0.20))',
                }}
              >
                <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white p-[5px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/favicon.png"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full rounded-full object-contain"
                  />
                </div>
              </div>
              {overlayEntry && <StateOverlay entry={overlayEntry} />}
            </div>

            {/* ③ Status pill — waiting state only */}
            {status === 'waiting' && <StatusPill />}

            {/* ④ Countdown */}
            {!isTerminal && secondsLeft > 0 && (
              <Countdown seconds={secondsLeft} />
            )}

            {/* ⑤ Action row */}
            <div className="flex gap-[10px]">
              <ActionButton
                icon={Download}
                label="Download"
                onClick={handleDownload}
              />
              {deepLinkURL && (
                <ActionButton
                  icon={Copy}
                  label={copied ? 'Copied!' : 'Copy link'}
                  onClick={() => {
                    void handleCopyLink()
                  }}
                />
              )}
            </div>

            {/* Regenerate — expired / error only */}
            {showRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center justify-center gap-2 rounded-[10px] border-[0.5px] border-[rgba(87,29,247,0.25)] bg-[#F2ECFF] px-4 py-2 text-[13px] font-[600] text-[#571DF7] transition-colors duration-200 hover:bg-[rgba(87,29,247,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(87,29,247,0.6)] focus-visible:ring-offset-2"
              >
                Generate new QR
              </button>
            )}

            {/* ⑥ App Store CTA */}
            <div className="flex flex-col gap-[12px] border-t border-[rgba(87,29,247,0.08)] pt-[16px] dark:border-[rgba(255,255,255,0.08)]">
              <p className="text-center text-[12.5px] text-[rgba(12,12,26,0.55)] dark:text-[rgba(255,255,255,0.45)]">
                {"Don't have the "}
                <strong className="font-[600] text-[#0C0C1A] dark:text-white">
                  Phenix App
                </strong>
                {'? Get it free to hold your credentials.'}
              </p>
              <div className="flex gap-[10px]">
                <StoreBadge store="google" href={GOOGLE_PLAY_URL} />
                <StoreBadge store="apple" href={APP_STORE_URL} />
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export default QrScanDialog
