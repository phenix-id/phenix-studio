import { appLogoPath, defaultFooterText } from '../config/CommonConstant'
import Image from 'next/image'
import React from 'react'

interface IFooter {
  fixed?: boolean
}

const Footer: React.FC<IFooter> = ({ fixed = false }) => {
  const activeTheme = (process.env.NEXT_PUBLIC_ACTIVE_THEME || '').toUpperCase()
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
      {/* Powered By section */}
      {activeTheme && activeTheme !== 'CREDEBL' && (
        <div className="mt-1 mb-1 flex items-center justify-center gap-2">
          <span>Powered by</span>
          <Image
            src={appLogoPath}
            alt="Powered by Phenix"
            width={90}
            height={30}
            className="h-5 w-auto object-contain"
          />
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-1">
        © {new Date().getFullYear()} {footerText}
      </div>
    </footer>
  )
}

export default Footer
