'use client'

import {
  appLogoAltText,
  appLogoDarkPath,
  appLogoHeight,
  appLogoPath,
  appLogoWidth,
} from '@/config/CommonConstant'
// eslint-disable-next-line sort-imports
import React, { useEffect, useState } from 'react'

import Image from 'next/image'
import { useTheme } from 'next-themes'

function DynamicApplicationLogo(): React.JSX.Element {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc =
    mounted && resolvedTheme === 'dark' ? appLogoDarkPath : appLogoPath

  return (
    <div className="max-h-24">
      <Image
        height={appLogoHeight}
        width={appLogoWidth}
        alt={appLogoAltText}
        src={logoSrc}
        className="mx-0 h-10 w-fit object-contain px-2 md:h-20 md:w-50"
      />
    </div>
  )
}

export default DynamicApplicationLogo
