'use client'

import { type ApiErrorResponse, createSchemas } from '@/app/api/schema'
import { DidMethod, SchemaType, SchemaTypeValue } from '@/common/enums'
import { FieldName, IAttributes, IFormData } from '../type/schemas-interface'
import { type FormikErrors, type FormikProps } from 'formik'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  W3C_SCHEMA_DEFAULT_VERSION,
  apiStatusCodes,
  optionsSchemaCreation as options,
} from '../../../config/CommonConstant'
import { AlertComponent } from '@/components/AlertComponent'
import { AlertTriangle } from 'lucide-react'
import type { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import FormikData from './FormikData'
import { getOrganizationById } from '@/app/api/organization'
import { hardNavigate } from '@/utils/navigation'
import { useAppSelector } from '@/lib/hooks'

type SetupStatus = 'loading' | 'no-wallet' | 'no-did' | 'ready'

export interface IPopup {
  show: boolean
  type: 'reset' | 'create'
}

const W3C_SCHEMA_CONFLICT_MESSAGE =
  'A schema with this name and version already exists. Use a different version to create a new iteration.'

const CreateSchema = (): React.JSX.Element => {
  const [failure, setFailure] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createLoader, setCreateLoader] = useState<boolean>(false)
  const [showPopup, setShowPopup] = useState<IPopup>({
    show: false,
    type: 'reset',
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [schemaTypeValues, setSchemaTypeValues] = useState<SchemaTypeValue>()
  const [type, setType] = useState<SchemaType>()
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('loading')
  const orgId = useAppSelector((state) => state.organization.orgId)
  const initialAttributeId = useId()

  const initFormData: IFormData = {
    schemaName: '',
    schemaVersion: '',
    attribute: [
      {
        id: initialAttributeId,
        attributeName: '',
        schemaDataType: 'string',
        displayName: '',
        isRequired: false,
      },
    ],
  }
  const fetchOrganizationDetails = useCallback(async (): Promise<void> => {
    if (!orgId) {
      return
    }

    setLoading(true)
    const response = await getOrganizationById(orgId as string)
    const { data } = response as AxiosResponse

    if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
      const agents = (data?.data?.org_agents ?? []) as {
        tenantId?: string | null
        walletName?: string | null
        orgDid?: string | null
      }[]
      const [agent] = agents

      const hasWallet = Boolean(agent?.tenantId || agent?.walletName)

      if (!agent || !hasWallet) {
        setSetupStatus('no-wallet')
      } else if (!agent.orgDid) {
        setSetupStatus('no-did')
      } else {
        const did = agent.orgDid
        if (did.includes(DidMethod.INDY)) {
          setSchemaTypeValues(SchemaTypeValue.INDY)
          setType(SchemaType.INDY)
        } else if (did.includes(DidMethod.POLYGON)) {
          setType(SchemaType.W3C)
          setSchemaTypeValues(SchemaTypeValue.POLYGON)
        } else if (did.includes(DidMethod.KEY) || did.includes(DidMethod.WEB)) {
          setType(SchemaType.W3C)
          setSchemaTypeValues(SchemaTypeValue.NO_LEDGER)
        }
        setSetupStatus('ready')
      }
    } else {
      setFailure(response as string)
      setSetupStatus('ready')
    }

    setLoading(false)
  }, [orgId])

  const [formData, setFormData] = useState(initFormData)

  useEffect(() => {
    fetchOrganizationDetails()
  }, [fetchOrganizationDetails])

  useEffect(() => {
    if (type !== SchemaType.W3C) {
      return
    }

    setFormData((previousFormData) => ({
      ...previousFormData,
      schemaVersion:
        previousFormData.schemaVersion?.trim() || W3C_SCHEMA_DEFAULT_VERSION,
    }))
  }, [type])

  const filledInputs = (formData: IFormData): boolean => {
    if (!type) {
      return false
    }

    const { schemaName, schemaVersion, attribute } = formData

    if (
      (type === SchemaType.INDY && (!schemaName || !schemaVersion)) ||
      (type === SchemaType.W3C && !schemaName)
    ) {
      return false
    }

    const isAtLeastOneRequired = attribute.some((attr) => attr.isRequired)
    if (!isAtLeastOneRequired) {
      return false
    }

    for (const attr of attribute) {
      if (!attr.attributeName || !attr.schemaDataType || !attr.displayName) {
        return false
      }
    }

    return true
  }

  const getCreateSchemaFailureMessage = (
    createSchema: AxiosResponse | ApiErrorResponse,
  ): string => {
    if (
      type === SchemaType.W3C &&
      'statusCode' in createSchema &&
      createSchema.statusCode === apiStatusCodes.API_STATUS_CONFLICT
    ) {
      return W3C_SCHEMA_CONFLICT_MESSAGE
    }

    if ('message' in createSchema) {
      return createSchema.message
    }

    return 'Failed to create schema.'
  }

  const submit = async (values: IFormData): Promise<void> => {
    setCreateLoader(true)
    if (!type) {
      setFailure('Schema type not determined.')
      setCreateLoader(false)
      return
    }

    const schemaVersion = values.schemaVersion?.trim()
    const schemaFieldName: FieldName = {
      type,
      schemaPayload: {
        schemaName: values.schemaName,
        ...(type === SchemaType.W3C && {
          schemaType: schemaTypeValues,
          ...(schemaVersion && { schemaVersion }),
        }),
        ...(type === SchemaType.INDY && {
          schemaVersion,
        }),
        attributes: values.attribute,
        description: values.schemaName,
        orgId,
      },
    }

    const createSchema = await createSchemas(
      schemaFieldName as unknown as Record<string, unknown>,
      orgId,
    )
    const { data } = createSchema as AxiosResponse

    if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
      setSuccess(data?.message)
      setCreateLoader(false)
      setLoading(true)
      // Close the dialog shortly after showing the success state,
      // then navigate away once the message has been seen.
      setTimeout(() => {
        setShowPopup({ type: 'create', show: false })
      }, 1000)
      setTimeout(() => {
        setSuccess(null)
        hardNavigate('/schemas')
      }, 1500)
    } else {
      // Close the confirmation dialog immediately — it was asking "do you want
      // to proceed?" and the answer is "you can't". Keeping the error inside
      // the dialog is confusing and the 2-second auto-dismiss meant the user
      // often missed it entirely.
      // Show the error on the page itself so the user can read it at their
      // own pace and take action (e.g. upgrading their plan).
      setShowPopup({ type: 'create', show: false })
      setFailure(getCreateSchemaFailureMessage(createSchema))
      setCreateLoader(false)
    }
  }

  const confirmCreateSchema = (): void => {
    formData.attribute.forEach((element: IAttributes) => {
      if (!element.schemaDataType) {
        const updatedElement = { ...element, schemaDataType: 'string' }
        Object.assign(element, updatedElement)
      }
    })

    submit(formData)
  }

  const validSameAttribute = (
    formikHandlers: FormikProps<IFormData>,
    index: number,
    field: 'attributeName' | 'displayName',
  ): boolean => {
    const attributeError = formikHandlers?.errors?.attribute
    const attributeTouched = formikHandlers?.touched?.attribute
    const attributeValue = formikHandlers?.values?.attribute

    const isError = (
      attributeError as FormikErrors<IAttributes>[] | undefined
    )?.[index]?.[field]
    const isTouched = attributeTouched?.[index]?.[field]
    const value = attributeValue?.[index]?.[field]

    if (!(isTouched && isError) && value) {
      const matchCount = attributeValue.filter((item) => {
        const itemAttr = item[field]?.trim()?.toLowerCase()
        const enteredAttr = value?.trim()?.toLowerCase()
        return itemAttr === enteredAttr
      }).length

      return matchCount > 1
    }
    return false
  }

  const inValidAttributes = (
    formikHandlers: FormikProps<IFormData>,
    propertyName: 'attributeName' | 'displayName',
  ): boolean => {
    const attributeValue = formikHandlers?.values?.attribute
    if (!attributeValue?.length) {
      return true
    }

    const seen: { [key: string]: boolean } = {}
    for (const obj of attributeValue) {
      if (seen[obj[propertyName]]) {
        return true
      }
      seen[obj[propertyName]] = true
    }

    return false
  }

  const filteredOptions = useMemo(() => {
    if (
      schemaTypeValues === SchemaTypeValue.POLYGON ||
      schemaTypeValues === SchemaTypeValue.NO_LEDGER
    ) {
      return options.filter(
        (opt) => opt.label === 'String' || opt.label === 'Number',
      )
    }
    return options
  }, [schemaTypeValues])

  const renderPrerequisiteGate = (): React.JSX.Element => {
    const isNoWallet = setupStatus === 'no-wallet'
    const heading = isNoWallet
      ? 'Wallet setup required'
      : 'DID configuration required'
    const description = isNoWallet
      ? 'Your organization does not have a wallet configured yet. You need to set up a wallet and create a DID before you can create schemas.'
      : 'Your organization wallet is set up, but a DID has not been created yet. Create a DID to define your schema signing method before proceeding.'
    const actionLabel = isNoWallet ? 'Set up wallet' : 'Create DID'
    const actionPath = isNoWallet
      ? `/wallet-setup?orgId=${orgId}`
      : `/create-did?orgId=${orgId}`

    return (
      <Card className="m-0 md:m-6">
        <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-foreground text-lg font-semibold">{heading}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button onClick={() => hardNavigate(actionPath)}>
              {actionLabel}
            </Button>
            <p className="text-muted-foreground text-xs">
              {isNoWallet
                ? 'After setting up your wallet, return here to create a DID and then your schema.'
                : 'After creating a DID, return here to create your schema.'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="pt-2">
      <h1 className="text-foreground ml-10 text-xl font-semibold">
        Create Schema
      </h1>

      {/* Page-level error — shown after the confirmation dialog closes on failure.
          No auto-dismiss: the user reads it and closes it manually. */}
      {failure && (
        <div className="mx-6 mt-4">
          <AlertComponent
            message={failure}
            type="failure"
            onAlertClose={() => setFailure(null)}
          />
        </div>
      )}

      {setupStatus === 'loading' ? null : setupStatus === 'no-wallet' ||
        setupStatus === 'no-did' ? (
        renderPrerequisiteGate()
      ) : (
        <Card className="m-0 px-4 py-8 md:m-6" id="createSchemaCard">
          <div>
            <FormikData
              formData={formData}
              type={type}
              setFormData={setFormData}
              setShowPopup={setShowPopup}
              validSameAttribute={validSameAttribute}
              filteredOptions={filteredOptions}
              filledInputs={filledInputs}
              createLoader={createLoader}
              inValidAttributes={inValidAttributes}
              success={success}
              failure={failure}
              showPopup={showPopup}
              confirmCreateSchema={confirmCreateSchema}
              initFormData={initFormData}
              setFailure={setFailure}
              setSuccess={setSuccess}
              loading={loading}
            />
          </div>
        </Card>
      )}
    </div>
  )
}

export default CreateSchema
