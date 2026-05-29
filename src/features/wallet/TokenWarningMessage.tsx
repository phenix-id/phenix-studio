import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import React from 'react'

interface Props {
  mode: 'generated' | 'existing'
}

const TokenWarningMessage = ({ mode }: Props): React.JSX.Element => (
  <Alert variant="warning" className="mt-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Token Required</AlertTitle>
    <AlertDescription>
      {mode === 'generated'
        ? 'This wallet address needs POL tokens on the Polygon testnet before the DID can be created. Copy the address above and fund it before proceeding.'
        : 'Ensure the wallet for this private key has POL tokens on the Polygon testnet before creating the DID.'}
    </AlertDescription>
  </Alert>
)

export default TokenWarningMessage
