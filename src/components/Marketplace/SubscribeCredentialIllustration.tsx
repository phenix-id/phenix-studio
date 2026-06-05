'use client'

import { CheckCircle2 } from 'lucide-react'
import React from 'react'

const sf = 'var(--font-serif)'
const ss = 'var(--font-sans)'
const sm = 'var(--font-mono)'

/**
 * Decorative credential card illustration used in the right panel of the
 * SubscribeRequired screen. Rendered aria-hidden in the parent — purely visual.
 */
export function SubscribeCredentialIllustration(): React.JSX.Element {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        top: '44%',
        transform: 'translate(-50%,-50%)',
        width: '440px',
        height: '440px',
      }}
    >
      {/* Concentric rings */}
      {([440, 320, 220] as const).map((s, i) => (
        <div
          key={s}
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: `${s}px`,
            height: `${s}px`,
            transform: 'translate(-50%,-50%)',
            border: `0.5px solid rgba(255,255,255,${[0.1, 0.07, 0.05][i]})`,
          }}
        />
      ))}

      {/* Credential card */}
      <div
        className="absolute top-1/2 left-1/2 overflow-hidden"
        style={{
          transform: 'translate(-50%,-50%) rotate(-8deg)',
          width: '320px',
          aspectRatio: '300/188',
          borderRadius: '22px',
          background:
            'linear-gradient(140deg,#2A1C5C 0%,#16102E 55%,#0C0A1A 100%)',
          border: '0.5px solid rgba(255,255,255,0.16)',
          boxShadow:
            '0 34px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.14)',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Sweep highlight */}
        <div
          className="pointer-events-none absolute top-0 left-0 h-1/2 w-full"
          style={{
            background:
              'radial-gradient(ellipse 120% 80% at 30% -10%,rgba(255,255,255,0.08) 0%,transparent 70%)',
          }}
        />

        {/* Top row: verified badge */}
        <div className="relative flex items-start justify-end">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'rgba(90,201,148,0.2)',
              border: '0.5px solid rgba(90,201,148,0.5)',
            }}
          >
            <CheckCircle2
              style={{ width: '14px', height: '14px', color: '#5ac994' }}
              strokeWidth={2}
            />
          </div>
        </div>

        {/* Bottom row: holder name + expiry */}
        <div className="relative flex items-end justify-between">
          <div>
            <p
              style={{
                fontFamily: sf,
                fontWeight: 700,
                fontSize: '18px',
                color: '#fff',
                letterSpacing: '-0.01em',
              }}
            >
              John Dophu
            </p>
            <p
              style={{
                fontFamily: ss,
                fontSize: '9px',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.12em',
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              VERIFIABLE CREDENTIAL
            </p>
          </div>
          <p
            style={{
              fontFamily: sm,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.10em',
            }}
          >
            05/29
          </p>
        </div>
      </div>

      {/* Glass "Proof verified" chip */}
      <div
        className="absolute"
        style={{
          right: '8px',
          top: '50%',
          transform: 'translateY(-20%) rotate(6deg)',
          padding: '11px 16px',
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.12)',
          border: '0.5px solid rgba(255,255,255,0.28)',
          backdropFilter: 'blur(30px) saturate(160%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.35),0 14px 30px rgba(0,0,0,0.40)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: ss,
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'rgba(90,201,148,0.3)',
            border: '0.5px solid rgba(90,201,148,0.6)',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1.5 4L3.5 6L6.5 2"
              stroke="#5ac994"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        Proof verified
      </div>
    </div>
  )
}
