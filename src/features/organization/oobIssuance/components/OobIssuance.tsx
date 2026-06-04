'use client'

import * as Yup from 'yup'

import { ArrowLeft, QrCode } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  CredentialType,
  DidMethod,
  Features,
  SchemaTypeValue,
  SchemaTypes,
} from '@/common/enums'
import { Field, FieldArray, Form, Formik } from 'formik'
import {
  IOobAttribute,
  IOobFormValues,
  IOobSchemaDetails,
} from '../type/OobIssuance'
import React, { useEffect, useState } from 'react'
import {
  apiStatusCodes,
  issuanceApiParameter,
  schemaDetailsInitialState,
} from '@/config/CommonConstant'
import {
  buildIndyPayload,
  buildW3cPayload,
  extractExchangeId,
} from './OobIssuanceFunctions'
import getAllSchemaHelperUtil, {
  GetAllSchemaHelperReturn,
} from '../../emailIssuance/components/GetAllSchemaForIssuance'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { AlertComponent } from '@/components/AlertComponent'
import type { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { EmptyListMessage } from '@/components/EmptyListComponent'
import Loader from '@/components/Loader'
import PageContainer from '@/components/layout/page-container'
import QrCodeDialog from './QrCodeDialog'
import RoleViewButton from '@/components/RoleViewButton'
import { RootState } from '@/lib/store'
import { SearchableSelect } from '@/components/SearchableSelect'
import SummaryCard from '@/components/SummaryCard'
import SummaryCardW3c from '@/components/SummaryCardW3c'
import { createAttributeValidationSchema } from '../../connectionIssuance/components/IssuanceFunctions'
import { getOrganizationById } from '@/app/api/organization'
import { getSchemaCredDef } from '@/app/api/schema'
import { issueOobQrCredential } from '@/app/api/Issuance'
import { pathRoutes } from '@/config/pathRoutes'
import { resetSchemaDetails } from '@/lib/schemaStorageSlice'
import { useRouter } from 'next/navigation'

/* ---------- Attribute field helpers ---------- */
function formatName(attr: string): string {
  return attr
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const schemaDetailsEmpty: IOobSchemaDetails = {
  ...schemaDetailsInitialState,
  schemaAttributes: [],
}

/* ---------- Main component ---------- */
const OobIssuance = (): React.JSX.Element => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const orgId = useAppSelector((state: RootState) => state.organization.orgId)
  const ledgerId = useAppSelector(
    (state: RootState) => state.organization.ledgerId,
  )
  const allSchema = useAppSelector(
    (state: RootState) => state.storageKeys.ALL_SCHEMAS,
  )
  const schemaDetailsSlice = useAppSelector(
    (state: RootState) => state.schemaStorage,
  )

  const [schemaDetails, setSchemaDetails] =
    useState<IOobSchemaDetails>(schemaDetailsEmpty)
  const [schemaListAPIParameter, setSchemaListAPIParameter] =
    useState(issuanceApiParameter)
  const [credentialOptions, setCredentialOptions] = useState<
    GetAllSchemaHelperReturn[]
  >([])
  const [selectValue, setSelectValue] = useState<string>('')
  const [w3cSchema, setW3cSchema] = useState<boolean>(false)
  const [schemaTypeValue, setSchemaTypeValue] = useState<SchemaTypeValue>()
  const [orgDid, setOrgDid] = useState<string>('')

  const [generateLoading, setGenerateLoading] = useState(false)
  const [isBackLoading, setIsBackLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // QR dialog state
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState('')
  const [exchangeId, setExchangeId] = useState<string | null>(null)
  // Keep last submitted values so Regenerate re-calls without re-filling
  const [lastFormValues, setLastFormValues] = useState<IOobFormValues | null>(
    null,
  )

  /* ---- Detect org DID / schema type ---- */
  const fetchOrganizationDetails = async (): Promise<boolean | null> => {
    if (!orgId) {
      return null
    }
    const response = await getOrganizationById(orgId)
    const { data } = response as AxiosResponse
    if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
      const did: string = data?.data?.org_agents?.[0]?.orgDid ?? ''
      setOrgDid(did)
      if (did.includes(DidMethod.POLYGON)) {
        setW3cSchema(true)
        setSchemaTypeValue(SchemaTypeValue.POLYGON)
        return true
      } else if (did.includes(DidMethod.KEY) || did.includes(DidMethod.WEB)) {
        setW3cSchema(true)
        setSchemaTypeValue(SchemaTypeValue.NO_LEDGER)
        return true
      } else if (did.includes(DidMethod.INDY)) {
        setW3cSchema(false)
        return false
      }
    }
    return null
  }

  /* ---- Load credential options after DID detection ---- */
  useEffect(() => {
    const execute = async (): Promise<void> => {
      const isW3c = await fetchOrganizationDetails()
      if (isW3c === null) {
        return
      }

      if (isW3c && allSchema) {
        const options = await getAllSchemaHelperUtil({
          schemaListAPIParameter,
          ledgerId,
          currentSchemaType: SchemaTypes.schema_W3C,
        })
        setCredentialOptions(options)
      } else {
        const schemaValue = isW3c
          ? SchemaTypes.schema_W3C
          : SchemaTypes.schema_INDY
        const res = (await getSchemaCredDef(
          schemaValue,
          orgId,
        )) as AxiosResponse
        setCredentialOptions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (res.data?.data ?? []).map((value: any, index: number) => ({
            schemaVersion: value.schemaVersion,
            value: value.schemaAttributes,
            label: value.schemaCredDefName,
            id: index,
            schemaId: isW3c ? value.schemaIdentifier : value.schemaLedgerId,
            credentialId: value.credentialDefinitionId,
            schemaName: value.schemaName,
          })),
        )
      }
    }
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, allSchema, schemaListAPIParameter.allSearch])

  /* ---- Pre-selection bridge (navigating from Schemas page) ---- */
  useEffect(() => {
    if (!credentialOptions.length) {
      return
    }

    if (
      schemaDetailsSlice.type === 'CREDENTIAL_DEFINITION' &&
      schemaDetailsSlice.nonW3cSchema
    ) {
      const found = credentialOptions.find(
        (o) => o.credentialId === schemaDetailsSlice.nonW3cSchema,
      )
      if (!found) {
        return
      }
      const attrs = JSON.parse(found.value as string)
      setSchemaDetails({
        schemaName: found.schemaName,
        version: found.schemaVersion,
        schemaId: found.schemaId,
        credDefId: found.credentialId,
        schemaAttributes: attrs,
      })
      setSelectValue(found.label)
    } else if (
      schemaDetailsSlice.type === 'W3C_SCHEMA' &&
      schemaDetailsSlice.w3cSchema
    ) {
      const w3c = schemaDetailsSlice.w3cSchema
      const attrs = JSON.parse(w3c.value)
      setSchemaDetails({
        schemaName: w3c.schemaName,
        version: w3c.schemaVersion,
        schemaId: w3c.schemaIdentifier,
        credDefId: w3c.credentialId,
        schemaAttributes: attrs,
      })
      setSelectValue(w3c.label)
    }
  }, [credentialOptions, schemaDetailsSlice])

  /* ---- Build initial Formik values from selected schema attributes ---- */
  const buildInitialAttributes = (): IOobAttribute[] =>
    (schemaDetails.schemaAttributes ?? []).map((attr) => ({
      name: attr.attributeName,
      value: '',
      dataType: attr.schemaDataType,
      isRequired: attr.isRequired,
    }))

  /* ---- Handle credential definition / schema selection ---- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelect = (value: any): void => {
    dispatch(resetSchemaDetails())
    if (w3cSchema && allSchema) {
      setSchemaDetails({
        schemaName: value.schemaName,
        version: value.schemaVersion,
        schemaId: value.schemaIdentifier ?? '',
        credDefId: value.credentialId,
        schemaAttributes: value.attributes ?? [],
      })
    } else {
      const data = JSON.parse(value.value)
      setSchemaDetails({
        schemaName: value.schemaName,
        version: value.schemaVersion,
        schemaId: value.schemaId,
        credDefId: value.credentialId,
        schemaAttributes: data,
      })
    }
  }

  /* ---- Generate QR: call API and open dialog ---- */
  const generateQrCode = async (values: IOobFormValues): Promise<void> => {
    setGenerateLoading(true)
    setError(null)
    try {
      const payload = w3cSchema
        ? buildW3cPayload(
            values.attributes,
            schemaDetails,
            orgDid,
            schemaTypeValue,
          )
        : buildIndyPayload(values.attributes, schemaDetails.credDefId)

      const credType = w3cSchema ? CredentialType.JSONLD : CredentialType.INDY
      const response = await issueOobQrCredential(payload, credType, orgId)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        const responseData = data?.data
        const url: string = responseData?.invitationUrl ?? ''
        if (!url) {
          setError('No invitation URL returned from the server.')
          return
        }
        setInvitationUrl(url)
        setExchangeId(extractExchangeId(responseData))
        setLastFormValues(values)
        setQrDialogOpen(true)
      } else {
        setError(
          typeof response === 'string'
            ? response
            : 'Failed to generate QR code. Please try again.',
        )
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setGenerateLoading(false)
    }
  }

  /* ---- Regenerate: re-call API with the same form values ---- */
  const handleRegenerate = async (): Promise<void> => {
    if (!lastFormValues) {
      return
    }
    setQrDialogOpen(false)
    await generateQrCode(lastFormValues)
  }

  /* ---- Success: close dialog + navigate to credentials list ---- */
  const handleSuccess = (): void => {
    setQrDialogOpen(false)
    router.push(pathRoutes.organizations.issuedCredentials)
  }

  const handleBackClick = (): void => {
    setIsBackLoading(true)
    router.push(pathRoutes.back.issuance.connectionOob)
  }

  const validationSchema = Yup.object().shape({
    attributes: Yup.array().of(
      Yup.lazy((attr) =>
        createAttributeValidationSchema(
          attr?.name,
          attr?.value,
          attr?.isRequired,
        ),
      ),
    ),
  })

  const hasAttributes = Boolean(schemaDetails.schemaAttributes?.length)

  return (
    <PageContainer>
      <div className="px-4 pt-2">
        {/* ---- Page header ---- */}
        <div className="col-span-full mb-4 xl:mb-2">
          <div className="flex items-center justify-between px-4 pr-5">
            <h1 className="ml-1 text-xl font-semibold sm:text-2xl">
              Issue via QR Code
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                disabled={isBackLoading}
              >
                {isBackLoading ? (
                  <Loader size={20} />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                Back
              </Button>
              <RoleViewButton
                buttonTitle="View Schemas"
                feature={Features.CRETAE_SCHEMA}
                svgComponent={<div />}
                onClickEvent={() => {
                  setCreateLoading(true)
                  router.push(pathRoutes.organizations.schemas)
                }}
                loading={createLoading}
              />
            </div>
          </div>

          {(success || error) && (
            <AlertComponent
              message={success ?? error}
              type={success ? 'success' : 'failure'}
              onAlertClose={() => {
                setError(null)
                setSuccess(null)
              }}
            />
          )}
        </div>

        {/* ---- Schema / Credential Definition selector ---- */}
        <Card>
          <CardContent className="p-4">
            <p className="pb-6 text-xl font-semibold">
              {w3cSchema ? 'Select Schema' : 'Select Credential Definition'}
            </p>
            <div className="flex gap-6">
              <SearchableSelect
                className="border-muted max-w-lg border-1"
                options={credentialOptions}
                value={selectValue}
                onValueChange={handleSelect}
                onSearchChange={(v) =>
                  setSchemaListAPIParameter((p) => ({ ...p, allSearch: v }))
                }
                enableInternalSearch={!(w3cSchema && allSchema)}
                placeholder={
                  w3cSchema ? 'Select Schema' : 'Select Credential Definition'
                }
              />
            </div>

            {schemaDetails.schemaId && (
              <>
                {w3cSchema ? (
                  <SummaryCardW3c
                    schemaName={schemaDetails.schemaName}
                    schemaId={schemaDetails.schemaId}
                    version={schemaDetails.version}
                    hideCredDefId={false}
                    schemaAttributes={schemaDetails.schemaAttributes}
                  />
                ) : (
                  <SummaryCard
                    schemaName={schemaDetails.schemaName}
                    schemaId={schemaDetails.schemaId}
                    version={schemaDetails.version}
                    credDefId={schemaDetails.credDefId}
                    hideCredDefId={false}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ---- Attribute form ---- */}
        {hasAttributes ? (
          <Card className="mt-6 rounded-lg p-4 shadow-sm sm:p-6">
            <Formik
              initialValues={{ attributes: buildInitialAttributes() }}
              validationSchema={validationSchema}
              onSubmit={generateQrCode}
              enableReinitialize
              validateOnMount
            >
              {({ values, errors, touched, isValid }) => (
                <Form>
                  <FieldArray name="attributes">
                    {() => (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {values.attributes.map((attr, idx) => {
                          const path = `attributes.${idx}.value`
                          const attrErrors = errors.attributes
                          const attrTouched = touched.attributes

                          const attrError =
                            Array.isArray(attrErrors) &&
                            typeof attrErrors[idx] === 'object'
                              ? (
                                  attrErrors[idx] as {
                                    value?: string
                                  }
                                )?.value
                              : undefined

                          const fieldTouched = Array.isArray(attrTouched)
                            ? attrTouched[idx]?.value
                            : undefined

                          return (
                            <div
                              key={attr.name}
                              className="relative grid w-full grid-cols-[1fr_3fr] items-center gap-2"
                            >
                              <label
                                htmlFor={path}
                                className="text-end text-base break-words"
                              >
                                {formatName(attr.name)}
                                {attr.isRequired && (
                                  <span className="text-destructive">*</span>
                                )}{' '}
                                :
                              </label>
                              <div className="w-3/5">
                                <Field
                                  type={
                                    attr.dataType === 'date'
                                      ? 'date'
                                      : attr.dataType
                                  }
                                  placeholder={attr.name}
                                  id={path}
                                  name={path}
                                  className="border-input placeholder:text-muted-foreground/50 focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                />
                                {attrError && fieldTouched && (
                                  <div className="text-destructive mt-1 text-xs">
                                    {attrError}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </FieldArray>

                  <div className="mt-6 flex justify-end">
                    <Button
                      type="submit"
                      disabled={generateLoading || !isValid}
                      className="gap-2"
                    >
                      {generateLoading ? (
                        <Loader size={20} />
                      ) : (
                        <>
                          <QrCode className="h-4 w-4" />
                          <span>Generate QR Code</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        ) : (
          <div className="mt-6 flex items-center justify-center">
            <EmptyListMessage
              message="Select Schema and Credential Definition"
              description="Get started by selecting a credential definition above"
            />
          </div>
        )}

        {/* ---- QR code dialog ---- */}
        <QrCodeDialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          invitationUrl={invitationUrl}
          exchangeId={exchangeId}
          orgId={orgId}
          onSuccess={handleSuccess}
          onRegenerate={handleRegenerate}
        />
      </div>
    </PageContainer>
  )
}

export default OobIssuance
