import {
  appLogoAltText,
  appLogoHeight,
  appLogoPath,
  appLogoWidth,
} from '@/config/CommonConstant'

import Image from 'next/image'
import React from 'react'

function DynamicApplicationLogo(): React.JSX.Element {
  return (
    <div className="max-h-24">
      <Image
        height={appLogoHeight}
        width={appLogoWidth}
        alt={appLogoAltText}
        src={appLogoPath}
        className="mx-0 h-10 w-fit object-contain px-2 md:h-20 md:w-50"
      />
    </div>
  )
}

export default DynamicApplicationLogo
