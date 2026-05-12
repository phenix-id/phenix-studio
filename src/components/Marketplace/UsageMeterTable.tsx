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

interface UsageMeterTableProps {
  dimensions: MarketplaceUsageDimension[]
  events?: MarketplaceMeteringEvent[]
}

const formatNumber = (value?: number): string =>
  new Intl.NumberFormat('en').format(value || 0)

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meter</TableHead>
            <TableHead>Included</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Overage</TableHead>
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
              <TableCell>{formatNumber(dimension.included)}</TableCell>
              <TableCell>{formatNumber(dimension.used)}</TableCell>
              <TableCell>{formatNumber(dimension.overage)}</TableCell>
              <TableCell>{formatNumber(dimension.pendingSubmission)}</TableCell>
              <TableCell>
                {formatNumber(dimension.acceptedByMicrosoft)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {events.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted hour</TableHead>
              <TableHead>Dimension</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.usageStartTime}</TableCell>
                <TableCell>{event.dimension}</TableCell>
                <TableCell>{formatNumber(event.quantity)}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>{event.marketplaceMessage || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
