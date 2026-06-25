'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MarketplaceUsageDimension } from '@/app/api/marketplace'
import { marketplaceMeterUnitPricesUsd } from '@/config/marketplacePlans'

interface UsageMeterTableProps {
  dimensions: MarketplaceUsageDimension[]
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
}: UsageMeterTableProps): React.JSX.Element {
  // The one-time setup fee is billed separately and is not surfaced as a
  // usage meter row.
  const meteredDimensions = dimensions.filter(
    (dimension) => dimension.dimension !== 'setup_fee',
  )

  if (!meteredDimensions.length) {
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {meteredDimensions.map((dimension) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
