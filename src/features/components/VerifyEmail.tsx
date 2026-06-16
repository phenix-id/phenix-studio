'use client'

import { ArrowRight, CheckCircle } from 'lucide-react'
import { IEmailVerifyData, verifyUserMail } from '@/app/api/Auth'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { apiStatusCodes } from '@/config/CommonConstant'
import { validEmail } from '@/utils/TextTransform'

export default function VerifyEmailPage(): React.JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [, setLoading] = useState<boolean>(true)
  const [, setMessage] = useState<string>('')
  const [, setError] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')

  const hasVerifiedRef = useRef(false)
  useEffect(() => {
    if (hasVerifiedRef.current) {
      return
    }
    hasVerifiedRef.current = true

    const verificationCode = searchParams.get('verificationCode') || ''
    const rawEmail = searchParams.get('email') || ''
    const validatedEmail = validEmail(rawEmail)

    const payload: IEmailVerifyData = {
      verificationCode,
      email: validatedEmail,
    }

    setEmail(validatedEmail)

    const verifyEmail = async (): Promise<void> => {
      try {
        const response = await verifyUserMail(payload)
        const { data } = response as AxiosResponse

        if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
          setError(false)
          setMessage(data?.message)
        } else {
          setError(true)
          setMessage(data?.message || 'Verification failed. Please try again.')
        }
      } catch (err) {
        setError(true)
        setMessage(
          'An error occurred during verification. Please try again later.',
        )
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleRedirect = (): void => {
    const redirectTo = searchParams.get('redirectTo')
    const clientAlias = searchParams.get('clientAlias')
    const invitationId = searchParams.get('invitationId')

    const params = new URLSearchParams({ email })
    if (redirectTo) {
      params.set('redirectTo', redirectTo)
    }
    if (clientAlias) {
      params.set('clientAlias', clientAlias)
    }
    if (invitationId) {
      params.set('invitationId', invitationId)
    }

    router.push(`/sign-up?${params.toString()}`)
  }

  return (
    <div className="flex h-screen items-center justify-center overflow-y-auto bg-[image:var(--card-gradient)] p-4">
      <div className="bg-card border-border w-full max-w-md overflow-hidden rounded-xl border p-8 shadow-xl">
        <div className="text-center">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="inline-block rounded-full p-3">
                <CheckCircle
                  className="h-16 w-16 text-[var(--color-green)]"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Congratulations!</h1>
            <h2 className="text-muted-foreground text-xl">
              Email verified successfully
            </h2>
            <Button
              onClick={handleRedirect}
              className="flex w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 font-medium"
            >
              Continue to Sign Up
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
