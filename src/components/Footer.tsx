import React from 'react'

import { defaultFooterText } from '../config/CommonConstant'

interface IFooter {
  fixed?: boolean
}

const Footer: React.FC<IFooter> = ({ fixed = false }) => {
  const configuredFooterText = process.env.NEXT_PUBLIC_FOOTER_TEXT?.trim()
  const footerText =
    configuredFooterText && !configuredFooterText.startsWith('#')
      ? configuredFooterText
      : defaultFooterText

  return (
    <footer
      className={`text-muted-foreground mt-5 mb-1 text-center text-xs md:mb-4 md:text-sm ${
        fixed ? 'fixed bottom-0 w-full' : ''
      }`}
    >
      <div className="mt-1">
        © {new Date().getFullYear()} {footerText}
      </div>
    </footer>
  )
}

export default Footer
