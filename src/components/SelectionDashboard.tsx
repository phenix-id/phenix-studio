'use client'

import { IDashboard, IOptions } from './types/Dashboard'
import BackButton from '@/components/BackButton'
import { Button } from '@/components/ui/button'
import { JSX } from 'react'
import { Layers } from 'lucide-react'
import { hardNavigate } from '@/utils/navigation'
import { setVerificationRouteType } from '@/lib/verificationSlice'
import { useAppDispatch } from '@/lib/hooks'

// ─── Tag pill style map ───────────────────────────────────────────────────────

const TAG_CLASS_MAP: Record<string, string> = {
  neutral: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]',
  purple: 'bg-[var(--badge-info-bg)] text-[var(--badge-info-text)]',
  green: 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]',
}

// ─── MethodCard ───────────────────────────────────────────────────────────────

interface MethodCardProps {
  option: IOptions
  onClick: () => void
}

const MethodCard = ({ option, onClick }: MethodCardProps): JSX.Element => {
  const Icon = option.icon
  const isDisabled = !option.path
  const tagClass = TAG_CLASS_MAP[option.tagVariant ?? 'neutral']

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={[
        'method-card group relative flex flex-col rounded-[14px]',
        'border-[0.5px] p-[22px] text-left',
        'bg-card text-card-foreground',
        'focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-[rgba(87,29,247,0.6)] focus-visible:ring-offset-2',
        option.isRecommended
          ? 'border-[rgba(87,29,247,0.30)]'
          : 'border-[var(--border)]',
        isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
      ].join(' ')}
    >
      {/* Radial purple wash — fades in on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 55% 65% at 100% 0%, rgba(87,29,247,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Top row: icon tile + optional FASTEST flag */}
      <div className="relative flex items-start justify-between">
        {/* Icon tile */}
        <div
          className={[
            'flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[12px]',
            'transition-all duration-200',
            'bg-[#F2ECFF] group-hover:bg-[#571DF7]',
            'dark:border-[0.5px] dark:border-[rgba(154,107,251,0.35)]',
            'dark:bg-[rgba(87,29,247,0.20)] dark:group-hover:bg-[#571DF7]',
          ].join(' ')}
        >
          {Icon && (
            <Icon
              className="h-5 w-5 text-[#571DF7] transition-colors duration-200 group-hover:text-white dark:text-[#9E6BFB] dark:group-hover:text-white"
              strokeWidth={1.5}
            />
          )}
        </div>

        {/* FASTEST flag — only on recommended cards */}
        {option.isRecommended && (
          <span className="rounded-full bg-[#F2ECFF] px-2 py-[3px] text-[9.5px] font-[700] tracking-[0.06em] text-[#571DF7] uppercase dark:bg-[rgba(87,29,247,0.20)] dark:text-[#9E6BFB]">
            FASTEST
          </span>
        )}
      </div>

      {/* Title — Sora */}
      <h3 className="text-foreground relative mt-4 font-serif text-[17px] leading-tight font-[700] tracking-[-0.01em]">
        {option.heading}
      </h3>

      {/* Description — flex-1 pushes footer down */}
      <p className="text-muted-foreground relative mt-1.5 flex-1 text-[12.5px] leading-[1.55]">
        {option.description}
      </p>

      {/* Footer */}
      <div className="relative mt-[18px] flex items-center justify-between border-t border-[rgba(87,29,247,0.08)] pt-[14px]">
        {option.tag && (
          <span
            className={`rounded-full px-2 py-[3px] text-[10.5px] font-[600] ${tagClass}`}
          >
            {option.tag}
          </span>
        )}
        <span className="text-muted-foreground/50 ml-auto flex items-center gap-0.5 text-[12.5px] font-[600] transition-colors duration-200 group-hover:text-[#571DF7]">
          Select
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
            &nbsp;→
          </span>
        </span>
      </div>
    </button>
  )
}

// ─── SelectionDashboard ───────────────────────────────────────────────────────

const SelectionDashboard = ({
  eyebrow,
  title,
  subtitle,
  options,
  backButtonPath,
  viewSchemasPath,
  gridCols = 4,
}: IDashboard): JSX.Element => {
  const dispatch = useAppDispatch()

  const handleCardClick = (option: IOptions): void => {
    if (option.path) {
      dispatch(setVerificationRouteType(option.heading))
      hardNavigate(option.path)
    }
  }

  return (
    <div className="relative px-8 py-8">
      {/* ── Page header ── */}
      <div className="mb-[22px] flex items-start justify-between gap-6">
        {/* Left: eyebrow + H1 + subtitle */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-[600] tracking-[0.08em] text-[#571DF7] uppercase">
            {eyebrow}
          </span>
          <h1 className="text-foreground font-serif text-[30px] leading-tight font-[700] tracking-[-0.025em]">
            {title}
          </h1>
          <p className="text-muted-foreground mt-0.5 max-w-xl text-[14px]">
            {subtitle}
          </p>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-shrink-0 items-center gap-[10px] pt-1">
          <BackButton path={backButtonPath} />
          {viewSchemasPath && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => hardNavigate(viewSchemasPath)}
            >
              <Layers className="h-4 w-4" strokeWidth={1.5} />
              View Schemas
            </Button>
          )}
        </div>
      </div>

      {/* ── Method grid ── */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
        }`}
      >
        {options.map((option) => (
          <MethodCard
            key={option.heading}
            option={option}
            onClick={() => handleCardClick(option)}
          />
        ))}
      </div>
    </div>
  )
}

export default SelectionDashboard
