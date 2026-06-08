'use client'
/* eslint-disable sort-imports */

import {
  Connection,
  ConnectionApiSortFields,
  ConnectionState,
  ConnectionStateUserText,
} from '../types/connections-interface'
import {
  IColumnData,
  ITableMetadata,
  SortActions,
  TableStyling,
  getColumns,
} from '../../../components/ui/generic-table-component/columns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { JSX, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DataTable } from '../../../components/ui/generic-table-component/data-table'
import { DateCell } from '@/features/organization/connectionIssuance/components/CredentialTableCells'
import CustomQRCode from '@/features/wallet/CustomQRCode'
import Loader from '@/components/Loader'
import { QrCode } from 'lucide-react'
import PageContainer from '@/components/layout/page-container'
import SidePanelComponent from '@/config/SidePanelCommon'
import { createConnection } from '@/app/api/organization'
import { dateConversion } from '@/utils/DateConversion'
import { getConnectionsByOrg } from '@/app/api/connection'
import { useAppSelector } from '@/lib/hooks'
import type { AxiosResponse } from 'axios'
import { apiStatusCodes } from '@/config/CommonConstant'

export default function Connections(): JSX.Element {
  const metadata: ITableMetadata = {
    enableSelection: false,
  }
  const orgId = useAppSelector((state) => state.organization.orgId)
  const orgInfo = useAppSelector((state) => state.organization.orgInfo)

  const [isLoading, setIsLoading] = useState(false)
  const [connectionData, setConnectionData] = useState<Connection[]>([])

  // QR dialog state
  const [openQrModal, setOpenQrModal] = useState(false)
  const [qrInvitation, setQrInvitation] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(false)

  const createQrConnection = async (): Promise<void> => {
    if (!orgId) {
      return
    }
    setIsQrLoading(true)
    try {
      const response = await createConnection(
        orgId,
        (orgInfo as { name?: string })?.name || '',
      )
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setQrInvitation(data?.data?.connectionInvitation as string)
      }
    } catch (error) {
      console.error('Failed to create QR connection:', error)
    } finally {
      setIsQrLoading(false)
    }
  }

  const handleOpenQrModal = (): void => {
    setQrInvitation(null)
    setOpenQrModal(true)
    createQrConnection()
  }

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 1,
    searchTerm: '',
    sortBy: 'createDateTime',
    sortOrder: 'desc' as SortActions,
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null)

  const openDrawer = (connection: Connection): void => {
    setSelectedConnection(connection)
    setIsDrawerOpen(true)
  }

  const fields = selectedConnection
    ? [
        { label: 'Their Label', value: selectedConnection.theirLabel },
        { label: 'Connection ID', value: selectedConnection.connectionId },
        { label: 'Created By', value: selectedConnection.createdBy },
        { label: 'Status', value: selectedConnection.state },
        {
          label: 'Created At',
          value: dateConversion(selectedConnection.createDateTime),
        },
      ]
    : []

  useEffect(() => {
    if (!orgId) {
      return
    }

    async function fetchConnections(): Promise<void> {
      try {
        setIsLoading(true)

        const { pageIndex, pageSize, searchTerm, sortBy, sortOrder } =
          paginationState

        const connectionList = await getConnectionsByOrg({
          itemPerPage: pageSize,
          page: pageIndex + 1,
          search: searchTerm,
          sortBy,
          sortingOrder: sortOrder,
          orgId,
        })

        if (connectionList && Array.isArray(connectionList.data)) {
          setConnectionData(connectionList.data ?? [])
          setPaginationState((prev) => ({
            ...prev,
            pageCount: connectionList.lastPage ?? 1,
          }))
        } else {
          setConnectionData([])
          setPaginationState((prev) => ({
            ...prev,
            pageCount: 1,
          }))
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error)
        setConnectionData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchConnections()
  }, [
    orgId,
    paginationState.pageIndex,
    paginationState.pageSize,
    paginationState.sortBy,
    paginationState.sortOrder,
    paginationState.searchTerm,
  ])

  useEffect(() => {
    if (!orgId) {
      return
    }

    setPaginationState({
      pageIndex: 0,
      pageSize: 10,
      pageCount: 1,
      sortBy: 'createDateTime',
      searchTerm: '',
      sortOrder: 'desc',
    })
  }, [orgId])

  const connectionsCell = ({
    row,
  }: {
    row: { original: Connection }
  }): JSX.Element => {
    const connection = row.original
    return (
      <Button
        variant="link"
        className="text-foreground url-link p-0 text-left"
        onClick={() => openDrawer(connection)}
      >
        {connection.theirLabel || 'N/A'}
      </Button>
    )
  }

  const createdDateCell = ({
    row,
  }: {
    row: { original: { createDateTime: string } }
  }): JSX.Element => <DateCell date={row.original.createDateTime} />

  const stateInfoCell = ({
    row,
  }: {
    row: { original: { state: string } }
  }): JSX.Element => {
    const { state } = row.original
    return (
      <span
        className={` ${
          state === ConnectionState.completed &&
          'badges-success text-foreground'
        } mr-0.5 flex w-fit items-center justify-center rounded-md px-0.5 px-2 py-0.5 text-xs font-medium`}
      >
        {state === ConnectionState.completed &&
          ConnectionStateUserText.completed}
      </span>
    )
  }

  const columnData: IColumnData[] = [
    {
      id: 'theirLabel',
      title: 'Their Label',
      accessorKey: 'theirLabel',
      columnFunction: [
        {
          sortCallBack: async (order): Promise<void> => {
            setPaginationState((prev) => ({
              ...prev,
              sortBy: ConnectionApiSortFields.THEIR_LABEL,
              sortOrder: order,
            }))
          },
        },
      ],
      cell: connectionsCell,
    },
    {
      id: 'createDateTime',
      title: 'Created On',
      accessorKey: 'createDateTime',
      columnFunction: [
        {
          sortCallBack: async (order): Promise<void> => {
            setPaginationState((prev) => ({
              ...prev,
              sortBy: ConnectionApiSortFields.CREATE_DATE_TIME,
              sortOrder: order,
            }))
          },
        },
      ],
      cell: createdDateCell,
    },

    {
      id: 'state',
      title: 'Status',
      accessorKey: 'state',
      columnFunction: [],
      cell: stateInfoCell,
    },
  ]

  const tableStyling: TableStyling = { metadata, columnData }
  const column = getColumns<Connection>(tableStyling)

  const scanQrButton = (
    <Button variant="outline" size="sm" onClick={handleOpenQrModal}>
      <QrCode className="mr-2 h-4 w-4" />
      Create Connection
    </Button>
  )

  return (
    <PageContainer>
      <div className="mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of Connection
          </p>
        </div>
      </div>
      <div className="-mx-4 flex-1 overflow-auto rounded-lg px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        <DataTable
          isLoading={isLoading}
          placeHolder="Filter by wallet name"
          data={connectionData}
          columns={column}
          index={'connectionId'}
          pageIndex={paginationState.pageIndex}
          pageSize={paginationState.pageSize}
          pageCount={paginationState.pageCount}
          toolbarActions={scanQrButton}
          onPageChange={(index) =>
            setPaginationState((prev) => ({ ...prev, pageIndex: index }))
          }
          onPageSizeChange={(size) =>
            setPaginationState((prev) => ({
              ...prev,
              pageSize: size,
              pageIndex: 0,
            }))
          }
          onSearchTerm={(term) =>
            setPaginationState((prev) => ({
              ...prev,
              searchTerm: term,
              pageIndex: 0,
            }))
          }
        />
        <SidePanelComponent
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          fields={fields}
        />
      </div>

      {/* Scan QR dialog */}
      <Dialog open={openQrModal} onOpenChange={setOpenQrModal}>
        <DialogContent
          className="sm:max-w-sm"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center">Scan QR</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-48 items-center justify-center">
            {isQrLoading ? (
              <Loader />
            ) : qrInvitation ? (
              <CustomQRCode value={qrInvitation} size={180} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Failed to generate QR code. Please try again.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
