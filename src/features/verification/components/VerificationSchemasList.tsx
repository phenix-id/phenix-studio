'use client'

import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { IAttributesDetails, ISchema, ISchemaData } from '../type/interface'
import { JSX, useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiStatusCodes, itemPerPage } from '@/config/CommonConstant'
import {
  fetchOrganizationDetails,
  handleW3CSchemaDetails,
} from './SchemaListUtils'
import { getAllSchemas, getAllSchemasByOrgId } from '@/app/api/schema'
import {
  setSchemaAttributes,
  setSchemaId,
  setSelectedSchemasData,
} from '@/lib/verificationSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { EmptyMessage } from '@/components/EmptyMessage'
import { Features } from '@/common/enums'
import { ISidebarSliderData } from '@/features/schemas/type/schemas-interface'
import { IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import Loader from '@/components/Loader'
import PageContainer from '@/components/layout/page-container'
import RoleViewButton from '@/components/RoleViewButton'
import SchemaListPagination from './SchemaListPagination'
import SidePanelComponent from '@/config/SidePanelCommon'
import VerificationSchemaCard from './VerificationSchemaCard'
import { pathRoutes } from '@/config/pathRoutes'
import { useRouter } from 'next/navigation'

const VerificationSchemasList = (): JSX.Element => {
  const [schemasList, setSchemasList] = useState<ISchemaData[]>([])
  const [schemasDetailsErr, setSchemasDetailsErr] = useState<string | null>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [allSchemasFlag, setAllSchemasFlag] = useState<boolean>(false)
  const [schemasListParameter, setSchemasListParameter] = useState({
    itemPerPage,
    page: 1,
    search: '',
    sortBy: 'id',
    sortingOrder: 'desc',
    allSearch: '',
  })
  const [walletStatus, setWalletStatus] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [selectedSchemas, setSelectedSchemas] = useState<ISchema[]>([])
  const [selectedSchemaArray, setSelectedSchemaArray] = useState<ISchema[]>([])
  const [w3cSchema, setW3cSchema] = useState<boolean>(false)
  const [, setIsNoLedger] = useState<boolean>(false)
  const [schemaType, setSchemaType] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [sideBarFields, setSideBarFields] = useState<ISidebarSliderData[]>([])

  const route = useRouter()
  const dispatch = useAppDispatch()
  const organizationId = useAppSelector((state) => state.organization.orgId)
  const ledgerId = useAppSelector((state) => state.organization.ledgerId)
  const selectedSchemaState = useAppSelector(
    (state) => state.verification.selectedSchemas,
  )

  const getSchemaListDetails = async (): Promise<void> => {
    try {
      setLoading(true)
      let schemasList = null
      if (allSchemasFlag) {
        schemasList = await getAllSchemas(
          schemasListParameter,
          schemaType,
          ledgerId,
        )
      } else {
        schemasList = await getAllSchemasByOrgId(
          schemasListParameter,
          organizationId,
        )
      }

      const { data } = schemasList as AxiosResponse

      if (schemasList === 'Schema records not found') {
        setLoading(false)
        setSchemasList([])
      }

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        if (data?.data?.data) {
          setTotalItems(data?.data?.lastPage)
          setSchemasList(data?.data?.data)
          setLoading(false)
        } else {
          setLoading(false)
          if (schemasList !== 'Schema records not found') {
            setSchemasDetailsErr(schemasList as string)
          }
        }
      } else {
        setLoading(false)
        if (schemasList !== 'Schema records not found') {
          setSchemasDetailsErr(schemasList as string)
        }
      }
      setTimeout(() => {
        setSchemasDetailsErr('')
      }, 3000)
    } catch (error) {
      console.error('Error while fetching schema list:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    getSchemaListDetails()
  }, [schemasListParameter, allSchemasFlag, organizationId])

  const onSchemaListParameterSearch = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    event.preventDefault()
    const inputValue = event.target.value
    setSearchValue(inputValue)
    setSchemasListParameter((prevParams) => ({
      ...prevParams,
      ...(allSchemasFlag ? { allSearch: inputValue } : { search: inputValue }),
      page: 1,
    }))
  }

  const handleSchemaSelection = (
    schemaId: string,
    attributes: IAttributesDetails[],
    issuerId: string,
    created: string,
    checked: boolean,
  ): void => {
    const schemaDetails = {
      schemaId,
      attributes,
      issuerId,
      createdDate: created,
    }
    if (checked) {
      setSelectedSchemas((prev) => [...prev, schemaDetails])
    } else {
      setSelectedSchemas((prev) =>
        prev.filter((schema) => schema.schemaId !== schemaId),
      )
    }
  }

  const handleW3cSchemas = async (
    checked: boolean,
    schemaData?: ISchemaData,
  ): Promise<void> => {
    const updateSchemas = (prevSchemas: ISchema[]): ISchema[] => {
      let updatedSchemas = [...prevSchemas]
      if (checked && schemaData) {
        const schema = {
          ...schemaData,
          schemaId: schemaData.schemaId ?? '',
          createdDate: schemaData.createDateTime,
        }
        updatedSchemas = [...updatedSchemas, schema]
      } else {
        updatedSchemas = updatedSchemas.filter(
          (schema) => schema?.schemaLedgerId !== schemaData?.schemaLedgerId,
        )
      }
      return updatedSchemas
    }

    setSelectedSchemas((prevSchemas) => {
      if (!Array.isArray(prevSchemas)) {
        console.error('Previous schemas is not an array:', prevSchemas)
        return []
      }
      return updateSchemas(prevSchemas)
    })
    setSelectedSchemaArray((prevSchemas) => updateSchemas(prevSchemas))
  }

  useEffect(() => {
    if (selectedSchemaArray.length > 0) {
      dispatch(setSelectedSchemasData(selectedSchemaArray))
    }
  }, [selectedSchemaArray])

  const handleContinue = async (): Promise<void> => {
    const schemaIds = selectedSchemas?.map((schema) => schema?.schemaId)
    dispatch(setSchemaId(schemaIds))
    const schemaAttributes = selectedSchemas.map((schema) => ({
      schemaId: schema.schemaId,
      attributes: schema.attributes,
    }))
    dispatch(setSchemaAttributes(schemaAttributes))
    route.push(`${pathRoutes.organizations.verification.emailCredDef}`)
  }

  const options = ['All schemas']
  const optionsWithDefault = ["Organization's schema", ...options]

  const handleFilter = async (value: string): Promise<void> => {
    setAllSchemasFlag(value === 'All schemas')
    setSchemasListParameter((prevParams) => ({
      ...prevParams,
      page: 1,
      search: '',
      allSearch: '',
    }))
    setSearchValue('')
  }

  useEffect(() => {
    fetchOrganizationDetails({
      setLoading,
      organizationId,
      setWalletStatus,
      setW3cSchema,
      setSchemaType,
      setIsNoLedger,
    })
    setSearchValue('')
  }, [])

  const createSchemaButtonTitle = {
    title: 'Create',
    svg: <Plus />,
    toolTip: 'Create new schema',
  }
  const emptySchemaListTitle = 'No Schemas'
  const emptySchemaListDescription = 'Get started by creating a new Schema'
  const emptySchemaListBtn = { title: 'Create Schema', svg: <Plus /> }

  return (
    <PageContainer>
      <div className="px-8 py-8">
        {schemasDetailsErr && (
          <div className="mb-4 flex flex-col space-y-4">
            <AlertComponent
              message={schemasDetailsErr}
              type="failure"
              onAlertClose={() => setSchemasDetailsErr('')}
            />
          </div>
        )}

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div className="mb-[22px] flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-[600] tracking-[0.08em] text-[#571DF7] uppercase">
              VERIFY CREDENTIAL
            </span>
            <h1 className="text-foreground font-serif text-[28px] leading-tight font-[700] tracking-[-0.025em] sm:text-[30px]">
              Choose a schema
            </h1>
            <p className="text-muted-foreground mt-0.5 max-w-xl text-[14px]">
              Select one or more schemas to build your proof request. Holders
              must have a matching credential to respond.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              route.push(pathRoutes.organizations.verification.requestProof)
            }
            className="flex shrink-0 items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* ── Controls: search · filter · create ──────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={onSchemaListParameterSearch}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent py-1 pr-4 pl-10 text-base shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
            <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          </div>

          <Select
            defaultValue="Organization's schema"
            onValueChange={handleFilter}
          >
            <SelectTrigger className="min-h-[36px] w-[200px] rounded-lg border p-2.5 text-sm">
              <SelectValue placeholder="Select schema type" />
            </SelectTrigger>
            <SelectContent>
              {optionsWithDefault.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="bg-primary text-foreground flex rounded-md">
            {walletStatus ? (
              <RoleViewButton
                title={createSchemaButtonTitle.toolTip}
                buttonTitle={createSchemaButtonTitle.title}
                feature={Features.CRETAE_SCHEMA}
                svgComponent={createSchemaButtonTitle.svg}
                onClickEvent={() => {
                  route.push(`${pathRoutes.organizations.createSchema}`)
                }}
              />
            ) : (
              <RoleViewButton
                buttonTitle={createSchemaButtonTitle.title}
                feature={Features.CRETAE_SCHEMA}
                svgComponent={createSchemaButtonTitle.svg}
                onClickEvent={() => {
                  route.push(`${pathRoutes.organizations}/${organizationId}`)
                }}
              />
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {schemasList && schemasList.length > 0 ? (
          <div>
            {/* Responsive 3-column schema grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schemasList.map((element) => {
                const elementId = element['schemaLedgerId'] as string
                // Check both schemaId and schemaLedgerId because W3C schemas store
                // schemaId from element.schemaId (the full URI) while elementId is
                // element.schemaLedgerId — they may differ, and handleW3cSchemas
                // removes entries by schemaLedgerId. Without checking both, isSelected
                // would always be false for W3C, causing every click to add a duplicate.
                const isSelected = selectedSchemas.some(
                  (s) =>
                    s.schemaId === elementId || s.schemaLedgerId === elementId,
                )
                return (
                  <VerificationSchemaCard
                    key={elementId}
                    schemaName={element['name']}
                    version={element['version']}
                    schemaId={elementId}
                    issuerName={element['organizationName'] ?? 'N/A'}
                    attributes={element['attributes']}
                    created={element['createDateTime']}
                    isSelected={isSelected}
                    isW3c={w3cSchema}
                    onSelect={() => {
                      if (w3cSchema) {
                        void handleW3cSchemas(!isSelected, element)
                      } else {
                        handleSchemaSelection(
                          elementId,
                          element['attributes'],
                          element['issuerId'],
                          element['createDateTime'],
                          !isSelected,
                        )
                      }
                    }}
                    onSchemaIdClick={(e) => {
                      e.stopPropagation()
                      setIsDrawerOpen(true)
                      setSideBarFields([
                        {
                          label: 'Schema ID',
                          value: element.schemaLedgerId,
                          copyable: true,
                        },
                        {
                          label: 'Publisher DID',
                          value: element.publisherDid,
                          copyable: true,
                        },
                        {
                          label: 'Issuer ID',
                          value: element.issuerId,
                          copyable: true,
                        },
                      ])
                    }}
                  />
                )
              })}
            </div>

            {/* Pagination + Continue */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              {totalItems > 1 && (
                <SchemaListPagination
                  {...{
                    schemasListParameter,
                    setSchemasListParameter,
                    totalItems,
                  }}
                />
              )}
              <Button
                onClick={async () => {
                  if (selectedSchemas.length === 0) {
                    return
                  }
                  setLoading(true)
                  try {
                    if (w3cSchema) {
                      await handleW3CSchemaDetails({
                        selectedSchemaState,
                        route,
                      })
                    } else {
                      await handleContinue()
                    }
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={selectedSchemas.length === 0 || loading}
                variant={selectedSchemas.length === 0 ? 'outline' : 'default'}
                className="ml-auto flex items-center gap-2 rounded-md px-6 py-4 text-base font-medium"
              >
                {loading ? (
                  <Loader size={20} />
                ) : (
                  <>
                    <ArrowRight />
                    Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader />
              </div>
            ) : (
              <div className="border-border bg-background rounded-lg border shadow-sm sm:p-6">
                <EmptyMessage
                  title={emptySchemaListTitle}
                  description={emptySchemaListDescription}
                  buttonContent={emptySchemaListBtn.title}
                  svgComponent={emptySchemaListBtn.svg}
                  onClick={() => {
                    route.push(`${pathRoutes.organizations.createSchema}`)
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <SidePanelComponent
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Schema Details"
        description="Detailed view of selected Schema"
        fields={sideBarFields}
      />
    </PageContainer>
  )
}

export default VerificationSchemasList
