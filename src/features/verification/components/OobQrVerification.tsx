'use client'

import {
  AutoAccept,
  ProofRequestState,
  ProtocolVersion,
  RequestType,
} from '@/features/common/enum'
import {
  IPredicate,
  IRequestedAttributes,
  ISelectedAttributes,
} from '../type/interface'
import { JSX, useEffect, useState } from 'react'
import QrScanDialog, {
  type QrScanStatus,
} from '@/components/modal/QrScanDialog'
import { createOobProofRequest, getProofById } from '@/app/api/verification'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { DidMethod } from '@/common/enums'
import Loader from '@/components/Loader'
import { QrCode } from 'lucide-react'
import { apiStatusCodes } from '@/config/CommonConstant'
import { getOrganizationById } from '@/app/api/organization'
import { pathRoutes } from '@/config/pathRoutes'
import { resetAttributeData } from '@/lib/verificationSlice'
import { useRouter } from 'next/navigation'

// ─── Local types ──────────────────────────────────────────────────────────────

type GroupedSchema = {
  id: string
  name: string
  schema: { uri: string }[]
  constraints: { fields: { path: string }[] }
  purpose: string
}

interface OobProofResponse {
  invitationUrl: string
  deepLinkURL?: string
  /** Field names vary across agent versions — all candidates are tried */
  proofRecordId?: string
  presentationExchangeId?: string
  id?: string
}

interface ProofPollData {
  state?: string
  isVerified?: boolean
}

// ─── Module-level constants / helpers ────────────────────────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Stable status resolver for verification OOB polling.
 * Defined at module scope so the reference is constant across renders,
 * preventing the polling useEffect in QrScanDialog from restarting.
 */
const resolveProofStatus = (res: AxiosResponse): QrScanStatus => {
  const { state, isVerified } = (res?.data?.data ?? {}) as ProofPollData
  if (isVerified === true) {
    return 'verified'
  }
  if (state === ProofRequestState.done && isVerified === false) {
    return 'abandoned'
  }
  if (state === ProofRequestState.presentationReceived) {
    return 'presentation-received'
  }
  if (state === ProofRequestState.abandoned) {
    return 'abandoned'
  }
  return 'waiting'
}

// ─── Component ────────────────────────────────────────────────────────────────

const OobQrVerification = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [w3cSchema, setW3cSchema] = useState<boolean>(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [deepLinkURL, setDeepLinkURL] = useState<string | null>(null)
  const [proofId, setProofId] = useState<string | null>(null)

  const router = useRouter()
  const dispatch = useAppDispatch()
  const orgId = useAppSelector((state) => state.organization.orgId)
  const attributeData = useAppSelector(
    (state) => state.verification.attributeData,
  )

  // ── Payload builders ────────────────────────────────────────────────────────

  const buildW3cPayload = (): object => {
    const groupedAttributes = attributeData
      .filter((attribute) => attribute.isChecked)
      .reduce<Record<string, GroupedSchema>>((acc, attribute) => {
        const schemaUri = attribute.schemaId
        if (!acc[schemaUri]) {
          acc[schemaUri] = {
            id: attribute.schemaId.split('/').pop() ?? '',
            name: attribute.schemaName,
            schema: [{ uri: schemaUri }],
            constraints: { fields: [] },
            purpose: 'Verify proof',
          }
        }
        acc[schemaUri].constraints.fields.push({
          path: `$.credentialSubject['${attribute.attributeName}']`,
        })
        return acc
      }, {})

    // Each attribute becomes its own Field Query Object with a single-element
    // path array — DIF PE spec: path is an array of alternative JSONPaths for
    // the same logical field, NOT a list of different fields merged together.
    const inputDescriptors = Object.values(groupedAttributes).map(
      (descriptor) => ({
        id: descriptor.id,
        name: descriptor.name,
        schema: descriptor.schema,
        purpose: descriptor.purpose,
        constraints: {
          fields: descriptor.constraints.fields.map((field) => ({
            path: [field.path],
          })),
        },
      }),
    )

    // presentationDefinition.name is required by the backend DTO and forwarded
    // to Credo-ts — fall back to 'Proof Request' when no schema name is set.
    const definitionName =
      Object.values(groupedAttributes)[0]?.name ?? 'Proof Request'

    return {
      goalCode: 'verification',
      protocolVersion: ProtocolVersion.V2,
      isShortenUrl: true,
      presentationDefinition: {
        id: crypto.randomUUID(),
        name: definitionName,
        // eslint-disable-next-line camelcase
        input_descriptors: inputDescriptors,
      },
      autoAcceptProof: AutoAccept.ALWAYS,
    }
  }

  const buildIndyPayload = (): object => {
    const selectedAttributesDetails = attributeData.filter(
      (attr: ISelectedAttributes) =>
        attr.isChecked && attr.dataType !== 'number',
    )
    const selectedPredicatesDetails = attributeData.filter(
      (attr) => attr.isChecked && attr.dataType === 'number',
    )

    const requestedAttributes: Record<string, IRequestedAttributes> = {}
    const requestedPredicates: Record<string, IPredicate> = {}

    const attributeGroups = selectedAttributesDetails.reduce<
      Record<string, string[]>
    >((acc, attr) => {
      const key = `${attr.attributeName}:${attr.schemaId}`
      if (!acc[key]) {
        acc[key] = []
      }
      if (attr.credDefId) {
        acc[key].push(attr.credDefId)
      }
      return acc
    }, {})

    Object.keys(attributeGroups).forEach((key) => {
      const [attributeName, ...schemaIdParts] = key.split(':')
      const schemaId = schemaIdParts.join(':')

      if (!requestedAttributes[attributeName]) {
        requestedAttributes[attributeName] = {
          name: attributeName,
          restrictions: [],
        }
      }
      requestedAttributes[attributeName].restrictions.push(
        ...attributeGroups[key].map((credDefId) => ({
          // eslint-disable-next-line camelcase
          schema_id: schemaId,
          // eslint-disable-next-line camelcase
          cred_def_id: credDefId,
        })),
      )
    })

    selectedPredicatesDetails.forEach((attr) => {
      if (
        attr.isChecked &&
        attr.dataType === 'number' &&
        attr.selectedOption !== '' &&
        Number(attr.value) !== 0 &&
        attr.credDefId
      ) {
        requestedPredicates[attr.attributeName] = {
          name: attr.attributeName,
          // eslint-disable-next-line camelcase
          p_type: attr.selectedOption,
          // eslint-disable-next-line camelcase
          p_value: Number(attr.value),
          restrictions: [
            {
              // eslint-disable-next-line camelcase
              schema_id: attr.schemaId,
              // eslint-disable-next-line camelcase
              cred_def_id: attr.credDefId,
            },
          ],
        }
      } else if (attr.credDefId) {
        if (!requestedAttributes[attr.attributeName]) {
          requestedAttributes[attr.attributeName] = {
            name: attr.attributeName,
            restrictions: [],
          }
        }
        requestedAttributes[attr.attributeName].restrictions.push({
          // eslint-disable-next-line camelcase
          schema_id: attr.schemaId,
          // eslint-disable-next-line camelcase
          cred_def_id: attr.credDefId,
        })
      }
    })

    return {
      goalCode: 'verification',
      reuseConnection: true,
      protocolVersion: ProtocolVersion.V1,
      isShortenUrl: true,
      autoAcceptProof: AutoAccept.ALWAYS,
      proofFormats: {
        indy: {
          name: 'proof-request',
          version: '1.0',
          // eslint-disable-next-line camelcase
          requested_attributes: requestedAttributes,
          // eslint-disable-next-line camelcase
          requested_predicates: requestedPredicates,
        },
      },
    }
  }

  // ── QR generation ───────────────────────────────────────────────────────────

  const generateQr = async (isW3c: boolean): Promise<void> => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const payload = isW3c ? buildW3cPayload() : buildIndyPayload()
      const requestType = isW3c
        ? RequestType.PRESENTATION_EXCHANGE
        : RequestType.INDY
      const response = await createOobProofRequest(payload, requestType, orgId)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        const responseData = data?.data as OobProofResponse | undefined
        const url = responseData?.invitationUrl

        if (!url) {
          setErrorMessage('No invitation URL returned. Please try again.')
          return
        }

        const deepLink = responseData?.deepLinkURL ?? null
        const rawId =
          responseData?.proofRecordId ??
          responseData?.presentationExchangeId ??
          responseData?.id ??
          null
        const validProofId =
          rawId !== null && UUID_REGEX.test(rawId) ? rawId : null

        setInvitationUrl(url)
        setDeepLinkURL(deepLink)
        setProofId(validProofId)
        setQrOpen(true)
      } else {
        setErrorMessage('Failed to create proof request. Please try again.')
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Initialisation: resolve org DID, then auto-generate ─────────────────────

  const initialize = async (): Promise<void> => {
    setLoading(true)
    let isW3c = false

    try {
      const orgResponse = await getOrganizationById(orgId)
      const { data: orgData } = orgResponse as AxiosResponse

      if (orgData?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const did = orgData?.data?.org_agents?.[0]?.orgDid as string | undefined
        if (did) {
          isW3c =
            did.includes(DidMethod.POLYGON) ||
            did.includes(DidMethod.KEY) ||
            did.includes(DidMethod.WEB)
          setW3cSchema(isW3c)
        }
      }
    } catch {
      setErrorMessage('Failed to load organization details.')
      setLoading(false)
      return
    }

    await generateQr(isW3c)
  }

  useEffect(() => {
    initialize()
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleRegenerate = async (): Promise<void> => {
    setQrOpen(false)
    await generateQr(w3cSchema)
  }

  const handleSuccess = (): void => {
    dispatch(resetAttributeData())
    router.push(pathRoutes.organizations.credentials)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-2">
      <div className="col-span-full mb-6 xl:mb-4">
        <h1 className="mt-4 ml-1 text-xl font-semibold sm:text-2xl">
          Generate QR Code for Proof Request
        </h1>
        <span className="text-md text-muted-foreground">
          The holder scans this QR code to submit their proof — no prior
          connection required.
        </span>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="mb-4">
          <AlertComponent
            message={errorMessage}
            type="failure"
            onAlertClose={() => setErrorMessage(null)}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => generateQr(w3cSchema)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <QrCode className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4">
          <Loader size={36} />
          <p className="text-muted-foreground text-sm">
            Generating proof request…
          </p>
        </div>
      )}

      {/* When dialog is closed manually — offer to regenerate */}
      {!loading && !errorMessage && invitationUrl && !qrOpen && (
        <div className="rounded-lg border px-4 py-6 text-center">
          <p className="text-muted-foreground mb-4 text-sm">
            The QR code was closed. Generate a new one to continue.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleRegenerate()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <QrCode className="h-4 w-4" />
              Generate QR Code
            </button>
          </div>
        </div>
      )}

      {/* QR dialog — opens automatically once invitationUrl is ready */}
      {invitationUrl && (
        <QrScanDialog
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          invitationUrl={invitationUrl}
          exchangeId={proofId}
          orgId={orgId}
          deepLinkURL={deepLinkURL ?? undefined}
          mode="verification"
          onSuccess={handleSuccess}
          onRegenerate={handleRegenerate}
          pollFn={getProofById}
          resolveStatus={resolveProofStatus}
        />
      )}
    </div>
  )
}

export default OobQrVerification
