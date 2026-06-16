'use client'

import {
  MarketplaceMeteringEvent,
  MarketplaceUsageDimension,
} from '@/app/api/marketplace'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { marketplaceMeterUnitPricesUsd } from '@/config/marketplacePlans'

interface UsageMeterTableProps {
  dimensions: MarketplaceUsageDimension[]
  events?: MarketplaceMeteringEvent[]
}

const formatNumber = (value?: number): string =>
  new Intl.NumberFormat('en').format(value || 0)

const formatUsd = (value?: number): string => {
  if (value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 2 : 0,
  }).format(value)
}

export function UsageMeterTable({
  dimensions,
  events = [],
}: UsageMeterTableProps): React.JSX.Element {
  if (!dimensions.length) {
    return (
      <div className="text-muted-foreground rounded-md border p-6 text-sm">
        No Marketplace usage has been reported for this billing period.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meter</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Included</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Accepted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dimensions.map((dimension) => (
              <TableRow key={dimension.dimension}>
                <TableCell>
                  <div className="font-medium">{dimension.displayName}</div>
                  <div className="text-muted-foreground text-xs">
                    {dimension.dimension}
                  </div>
                </TableCell>
                <TableCell>
                  {formatUsd(
                    marketplaceMeterUnitPricesUsd[dimension.dimension],
                  )}
                </TableCell>
                <TableCell>{formatNumber(dimension.included)}</TableCell>
                <TableCell>{formatNumber(dimension.used)}</TableCell>
                <TableCell>
                  {formatNumber(dimension.pendingSubmission)}
                </TableCell>
                <TableCell>
                  {formatNumber(dimension.acceptedByMicrosoft)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {events.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  Submitted hour
                </TableHead>
                <TableHead>Dimension</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap">
                    {event.usageStartTime}
                  </TableCell>
                  <TableCell>{event.dimension}</TableCell>
                  <TableCell>{formatNumber(event.quantity)}</TableCell>
                  <TableCell>{event.status}</TableCell>
                  {/* Truncate long API messages — hover to read the full string */}
                  <TableCell className="max-w-[280px]">
                    <p
                      className="truncate text-sm"
                      title={event.marketplaceMessage || undefined}
                    >
                      {event.marketplaceMessage || '-'}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
