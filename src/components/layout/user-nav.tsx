'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { IUserProfile } from '../profile/interfaces'
import { apiRoutes } from '@/config/apiRoutes'
import { apiStatusCodes } from '@/config/CommonConstant'
import { getUserProfile } from '@/app/api/Auth'
import { hardNavigate } from '@/utils/navigation'
import { pathRoutes } from '@/config/pathRoutes'
import { persistor } from '@/lib/store'
import { setUserProfileDetails } from '@/lib/userSlice'
import { signOut } from 'next-auth/react'
import { useAppSelector } from '@/lib/hooks'
import { useDispatch } from 'react-redux'

export function UserNav(): React.JSX.Element | null {
  const dispatch = useDispatch()

  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null)
  const token = useAppSelector((state) => state.auth.token)
  const sessionId = useAppSelector((state) => state.auth.sessionId)

  useEffect(() => {
    async function fetchProfile(): Promise<void> {
      if (!token) {
        return
      }
      try {
        const response = await getUserProfile(token)
        if (
          typeof response !== 'string' &&
          response?.data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
        ) {
          setUserProfile(response.data.data)
          dispatch(setUserProfileDetails(response.data.data))
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching user profile:', error)
      }
    }

    fetchProfile()
  }, [token, dispatch])

  if (!token) {
    return null
  }

  const handleLogout = async (): Promise<void> => {
    // 1. Best-effort backend session invalidation.
    //    We proceed with local logout regardless of the response — a failed
    //    API call (e.g. expired token, network error) must never block sign-out.
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}${apiRoutes.auth.signOut}`,
        {
          method: 'POST',
          body: JSON.stringify({ sessions: [sessionId] }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )
    } catch {
      // Backend logout failed — continue with local logout
    }

    // 2. Wipe persisted Redux state so the next page load starts clean.
    //    removeItem is synchronous; purge() flushes redux-persist's write queue.
    localStorage.removeItem('persist:root')
    await persistor.purge()

    // 3. Clear the NextAuth session cookie (server-side) without relying on
    //    NextAuth's redirect callback to navigate us. redirect:false means
    //    NextAuth invalidates the cookie and returns — we drive navigation.
    try {
      await signOut({ redirect: false })
    } catch {
      // If NextAuth signOut fails, still force-navigate below
    }

    // 4. Hard navigate — bypasses SPA routing entirely so no React component
    //    re-renders between now and the sign-in page appearing.
    //    IMPORTANT: do NOT dispatch any Redux actions before this point.
    //    Any state mutation here re-renders the still-mounted page, causing
    //    the visible "dashboard with no tokens" flash. Redux state is destroyed
    //    automatically when the page reloads, so no manual cleanup is needed.
    window.location.href = '/sign-in'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="">
            <AvatarImage src={userProfile?.profileImg} alt="profileImg" />
            <AvatarFallback className="text-md">
              {userProfile?.email?.[0]?.toUpperCase() ?? ''}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 border"
        align="end"
        sideOffset={10}
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {userProfile?.firstName} {userProfile?.lastName}
            </p>
            <p className="text-sm leading-none font-medium">
              {userProfile?.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => hardNavigate('/profile')}>
            Profile
          </DropdownMenuItem>

          {/* Developer Settings — hidden until ready for release
          <DropdownMenuItem onClick={() => hardNavigate('/developers-setting')}>
            Developer Settings
          </DropdownMenuItem>
          */}

          {process.env.NEXT_PUBLIC_ENABLE_BILLING_OPTION?.toLowerCase() ===
            'true' && (
            <DropdownMenuItem
              onClick={() => hardNavigate(pathRoutes.organizations.billing)}
            >
              Billing
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
