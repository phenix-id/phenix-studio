'use client'

import QrScanDialog, {
  type QrScanStatus,
} from '@/components/modal/QrScanDialog'
import { AxiosResponse } from 'axios'
import { IQrCodeDialogProps } from '../type/OobIssuance'
import { IssueCredential } from '@/common/enums'
import { getCredentialById } from '@/app/api/Issuance'

/**
 * Maps a credential-poll response to a QrScanStatus.
 * Defined at module scope so the reference is stable across renders
 * (prevents the polling effect from restarting on every parent re-render).
 */
const resolveIssuanceStatus = (res: AxiosResponse): QrScanStatus => {
  const state = res?.data?.data?.state as string | undefined
  if (state === IssueCredential.done) {
    return 'done'
  }
  if (state === IssueCredential.abandoned) {
    return 'abandoned'
  }
  if (
    state === IssueCredential.offerSent ||
    state === IssueCredential.credentialIssued
  ) {
    return 'offer-sent'
  }
  return 'waiting'
}

/**
 * Thin wrapper around QrScanDialog for the credential-issuance flow.
 * All state management (countdown, polling, status) lives in QrScanDialog.
 */
const QrCodeDialog = ({
  open,
  onClose,
  invitationUrl,
  exchangeId,
  orgId,
  onSuccess,
  onRegenerate,
}: IQrCodeDialogProps): JSX.Element => (
  <QrScanDialog
    open={open}
    onClose={onClose}
    invitationUrl={invitationUrl}
    exchangeId={exchangeId}
    orgId={orgId}
    onSuccess={onSuccess}
    onRegenerate={onRegenerate}
    mode="issuance"
    pollFn={getCredentialById}
    resolveStatus={resolveIssuanceStatus}
  />
)

export default QrCodeDialog
