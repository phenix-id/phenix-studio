import { Dispatch, SetStateAction } from 'react'
import { SchemaTypes } from '@/common/enums'

export type QrStatus =
  | 'idle'
  | 'waiting'
  | 'offer-sent'
  | 'done'
  | 'abandoned'
  | 'expired'
  | 'error'

export interface IOobAttribute {
  name: string
  value: string
  dataType: string
  isRequired: boolean
}

/**
 * INDY OOB credential offer payload.
 * Confirmed from OOBIssueCredentialDto — flat top-level attributes array.
 * orgId is NOT included — backend sets it from the URL path param.
 */
export interface IOobIssuancePayload {
  credentialDefinitionId: string
  attributes: { name: string; value: string }[]
  isShortenUrl: true
  reuseConnection: true
  autoAcceptCredential: 'always'
  protocolVersion: 'v1'
}

/**
 * W3C / JSON-LD OOB credential offer payload.
 * protocolVersion MUST be 'v2' — backend defaults to v2 for JSONLD.
 * Do NOT use 'v1' here (that belongs to the INDY builder).
 * ⚠️ Exact credential body shape to be confirmed with backend before enabling W3C branch.
 */
export interface IOobW3cIssuancePayload {
  credential: {
    '@context': string[]
    type: string[]
    issuer: { id: string }
    issuanceDate: string
    credentialSubject: Record<string, string | number | boolean | null>
  }
  options: { proofType: string; proofPurpose: string }
  isShortenUrl: true
  autoAcceptCredential: 'always'
  reuseConnection: true
}

export interface IOobResponse {
  invitationUrl: string
  /**
   * The confirmed field name from the API response is `credentialExchangeRecordId`.
   * The others are kept as fallbacks in case the field name differs across agent versions.
   * GET /orgs/{orgId}/credentials/:id uses ParseUUIDPipe — value must be a UUID.
   */
  credentialExchangeRecordId?: string
  credentialExchangeId?: string
  id?: string
  credentialRecordId?: string
}

export interface IQrCodeDialogProps {
  open: boolean
  onClose: () => void
  invitationUrl: string
  /** Nullable — populated only when a valid UUID exchange ID is found in the response */
  exchangeId: string | null
  orgId: string
  onSuccess: () => void
  onRegenerate: () => void
}

export interface IOobSchemaDetails {
  schemaName: string
  version: string
  schemaId: string
  credDefId: string
  schemaAttributes?: IOobSchemaAttribute[]
}

export interface IOobSchemaAttribute {
  attributeName: string
  schemaDataType: string
  displayName: string
  isRequired: boolean
}

export interface IOobFormValues {
  attributes: IOobAttribute[]
}

export interface IOobIssuanceHeaderProps {
  handleBackClick: () => void
  isLoading: boolean
  success: string | null
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  setSuccess: Dispatch<SetStateAction<string | null>>
  schemaType: SchemaTypes | undefined
}
