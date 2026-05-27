'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, Lock, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import React from 'react'

interface DeleteOrganizationCardProps {
  title?: string
  description?: string
  count?: number
  isDisabled?: boolean
  blockingReason?: string | null
  step?: number
  onDeleteClick: () => void
}

export function DeleteOrganizationCard({
  title,
  description,
  count,
  isDisabled = false,
  blockingReason,
  step,
  onDeleteClick,
}: Readonly<DeleteOrganizationCardProps>): React.JSX.Element {
  // count=undefined means the org card — it always has "content" (the org itself)
  const hasContent = count === undefined ? true : count > 0
  type CardState = 'active' | 'locked' | 'done'
  const state: CardState = !hasContent
    ? 'done'
    : isDisabled
      ? 'locked'
      : 'active'

  return (
    <Card
      className={`border-border relative w-full overflow-hidden rounded-xl border py-4 transition-all duration-300 ${
        state === 'active'
          ? 'border-l-destructive bg-card border-l-4 shadow-sm'
          : state === 'locked'
            ? 'bg-muted/10 border-l-4 border-l-amber-400'
            : 'bg-card border-l-4 border-l-green-500 opacity-60'
      }`}
    >
      <CardHeader className="px-6 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {step !== undefined && (
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  state === 'active'
                    ? 'bg-destructive text-white'
                    : state === 'locked'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-green-500 text-white'
                }`}
              >
                {state === 'done' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  step
                )}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {state === 'active' && (
                  <Badge className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10 text-xs">
                    Action required
                  </Badge>
                )}
                {state === 'locked' && (
                  <Badge className="border-amber-300 bg-amber-50 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    Locked
                  </Badge>
                )}
                {state === 'done' && (
                  <Badge className="border-green-300 bg-green-50 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:bg-green-950 dark:text-green-400">
                    Cleared
                  </Badge>
                )}
              </div>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>

          {state === 'active' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteClick}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : state === 'locked' ? (
            <div className="shrink-0 p-2 text-amber-400 opacity-60">
              <Lock className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0">
        {count !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Total:</span>
            {state === 'active' ? (
              <Badge variant="destructive">{count}</Badge>
            ) : state === 'done' ? (
              <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                {count}
              </Badge>
            ) : (
              <Badge variant="secondary">{count}</Badge>
            )}
          </div>
        )}

        {state === 'locked' && blockingReason && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Complete first: </span>
              {blockingReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
