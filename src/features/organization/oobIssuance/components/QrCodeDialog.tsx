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
  // requestReceived means the holder's wallet scanned the QR and accepted the offer.
  // credentialIssued / credentialReceived are subsequent stages after the wallet engages.
  // Only these post-scan states should show "Wallet connected".
  if (
    state === IssueCredential.requestReceived ||
    state === IssueCredential.credentialIssued ||
    state === IssueCredential.credentialReceived
  ) {
    return 'offer-sent'
  }
  // offerSent is the initial OOB state set immediately when the invitation is created
  // — the holder has NOT scanned yet. Fall through to 'waiting'.
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
