'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'
import { cn } from '@/lib/utils'

interface SetDomainValueInputProps {
  domainValue: string
  setDomainValue: (value: string) => void
  domainError?: string | null
}

const SetDomainValueInput = ({
  domainValue,
  setDomainValue,
  domainError,
}: SetDomainValueInputProps): React.JSX.Element => (
  <div className="relative mb-3">
    <div className="flex pt-4 pb-4">
      <Label htmlFor="domainValue">Enter Domain</Label>
      <span className="text-destructive text-xs">*</span>
    </div>

    <Input
      id="domainValue"
      value={domainValue}
      onChange={(e) => setDomainValue(e.target.value)}
      placeholder="example.com"
      className={cn(
        'block h-11 w-full truncate rounded-lg p-2.5 text-sm',
        domainError ? 'border-destructive' : '',
      )}
    />

    {domainError ? (
      <span className="text-destructive mt-1 block text-xs">{domainError}</span>
    ) : (
      <p className="text-muted-foreground mt-1 text-xs">
        Domain only — no protocol or path (e.g.,{' '}
        <span className="font-mono">example.com</span>)
      </p>
    )}

    {domainValue && !domainError && (
      <div className="mt-2 space-y-1">
        <p className="text-muted-foreground text-xs font-medium">Hosting URL</p>
        <p className="bg-muted rounded px-2 py-1.5 font-mono text-xs break-all">
          {`https://${domainValue}/.well-known/did.json`}
        </p>
      </div>
    )}
  </div>
)

export default SetDomainValueInput
