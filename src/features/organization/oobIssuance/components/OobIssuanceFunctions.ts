import { CREDENTIAL_CONTEXT_VALUE, proofPurpose } from '@/config/CommonConstant'
import {
  IOobAttribute,
  IOobIssuancePayload,
  IOobSchemaDetails,
  IOobW3cIssuancePayload,
} from '../type/OobIssuance'
import { ProofType, SchemaTypeValue } from '@/common/enums'

/**
 * Build the INDY OOB credential offer payload.
 *
 * Confirmed shape from OOBIssueCredentialDto:
 *   - flat top-level `attributes` array (NOT nested in credentialData)
 *   - orgId omitted — backend sets it from the URL :orgId path param
 *   - isShortenUrl always true for compact, scannable QR codes
 */
export const buildIndyPayload = (
  attributes: IOobAttribute[],
  credDefId: string,
): IOobIssuancePayload => ({
  credentialDefinitionId: credDefId,
  attributes: attributes.map((a) => ({
    name: a.name,
    value: String(a.value ?? ''),
  })),
  isShortenUrl: true,
  reuseConnection: true,
  autoAcceptCredential: 'always',
  protocolVersion: 'v1',
})

/**
 * Build the W3C / JSON-LD OOB credential offer payload.
 *
 * protocolVersion MUST remain 'v2' — backend issuance.service.ts defaults
 * to v2 for JSONLD. Do NOT bleed 'v1' from buildIndyPayload here.
 *
 * ⚠️ The exact credential body shape still needs backend confirmation.
 *    Implement the INDY path first and enable this once confirmed.
 */
export const buildW3cPayload = (
  attributes: IOobAttribute[],
  schemaDetails: IOobSchemaDetails,
  orgDid: string,
  schemaTypeValue: SchemaTypeValue | undefined,
): IOobW3cIssuancePayload => {
  const credentialSubject = attributes.reduce<
    Record<string, string | number | boolean | null>
  >((acc, attr) => {
    const { value } = attr
    if (attr.dataType === 'number') {
      const num = Number(value)
      acc[attr.name] = isNaN(num) ? 0 : num
    } else if (attr.dataType === 'boolean') {
      acc[attr.name] = value === 'true'
    } else if (attr.dataType === 'date') {
      acc[attr.name] = value ? new Date(value).toISOString() : null
    } else {
      acc[attr.name] = value ?? ''
    }
    return acc
  }, {})

  return {
    credential: {
      '@context': [CREDENTIAL_CONTEXT_VALUE, schemaDetails.schemaId],
      type: ['VerifiableCredential', schemaDetails.schemaName],
      issuer: { id: orgDid },
      issuanceDate: new Date().toISOString(),
      credentialSubject,
    },
    options: {
      proofType:
        schemaTypeValue === SchemaTypeValue.POLYGON
          ? ProofType.polygon
          : ProofType.no_ledger,
      proofPurpose,
    },
    isShortenUrl: true,
    reuseConnection: true,
    protocolVersion: 'v2',
  }
}

/**
 * Extract a valid UUID exchange ID from the OOB offer API response.
 * The raw ACA-Py agent response may use different field names; we try all.
 * Returns null if no UUID is found — polling will be skipped in that case.
 */
export const extractExchangeId = (
  data: Record<string, string | undefined> | null | undefined,
): string | null => {
  const candidate =
    data?.credentialExchangeRecordId ??
    data?.credentialExchangeId ??
    data?.id ??
    data?.credentialRecordId ??
    null

  if (!candidate) {
    return null
  }

  // Validate it's a UUID (ParseUUIDPipe on the backend requires this)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(candidate) ? candidate : null
}
