import React, { JSX, useState } from 'react'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Loader from '@/components/Loader'
import { pathRoutes } from '@/config/pathRoutes'
import { useRouter } from 'next/navigation'

export const BackButton = (): JSX.Element => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = (): void => {
    setIsLoading(true)
    router.push(pathRoutes.organizations.Issuance.issue)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? <Loader size={20} /> : <ArrowLeft className="h-4 w-4" />}
      Back
    </Button>
  )
}
