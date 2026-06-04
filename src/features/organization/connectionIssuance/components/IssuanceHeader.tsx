import React, { JSX } from 'react'

import { AlertComponent } from '@/components/AlertComponent'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IIssuanceHeaderProps } from '../type/Issuance'
import Loader from '@/components/Loader'
import { pathRoutes } from '@/config/pathRoutes'
import { useRouter } from 'next/navigation'

function IssuanceHeader({
  handleBackClick,
  isLoading,
  success,
  error,
  setError,
  setSuccess,
  setCreateLoading,
  createLoading,
}: IIssuanceHeaderProps): JSX.Element {
  const router = useRouter()
  return (
    <div className="col-span-full mb-4 xl:mb-2">
      <div className="flex items-center justify-between px-4 pr-5">
        <h1 className="ml-1 text-xl font-semibold sm:text-2xl">Issuance</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader size={20} />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            Back
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCreateLoading(true)
              router.push(pathRoutes.organizations.schemas)
            }}
            disabled={createLoading}
          >
            {createLoading && <Loader size={20} />}
            View Schemas
          </Button>
        </div>
      </div>
      <AlertComponent
        message={success ?? error}
        type={success ? 'success' : 'failure'}
        onAlertClose={() => {
          setError(null)
          setSuccess(null)
        }}
      />
    </div>
  )
}

export default IssuanceHeader
