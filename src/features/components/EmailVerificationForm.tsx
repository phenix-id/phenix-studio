'use client'

import * as Yup from 'yup'

import { Formik, Form as FormikForm } from 'formik'
import React, { useEffect, useRef, useState } from 'react'
import { apiStatusCodes, emailRegex } from '@/config/CommonConstant'
import { checkUserExist, sendVerificationMail } from '@/app/api/Auth'
import { useRouter, useSearchParams } from 'next/navigation'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StepEmailProps {
  readonly email: string
  readonly setEmail: (value: string) => void
  readonly goToNext: () => void
  // When true the email is fixed (e.g. the Microsoft Marketplace purchaser email):
  // the field is read-only and the verification mail is sent automatically on mount.
  readonly locked?: boolean
}

export default function EmailVerificationForm({
  email,
  setEmail,
  goToNext,
  locked = false,
}: StepEmailProps): React.ReactElement {
  const [loading, setLoading] = useState(false)
  const [verifyLoader, setVerifyLoader] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [addFailure, setAddFailure] = useState<string | null>(null)
  const autoSentRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const clientAliasValue = searchParams?.get('clientAlias')
  const redirectTo = searchParams?.get('redirectTo')
  const invitationId = searchParams?.get('invitationId')

  // Send an existing/fully-registered account to sign-in (preserving the marketplace
  // redirectTo + clientAlias, or the invitation redirectTo) instead of dead-ending on
  // an error or a redundant signup.
  const redirectToSignIn = (emailValue: string): void => {
    if (redirectTo && clientAliasValue) {
      router.push(
        `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}&clientAlias=${clientAliasValue}&email=${encodeURIComponent(emailValue)}`,
      )
    } else if (invitationId) {
      router.push(
        `/sign-in?redirectTo=${encodeURIComponent('/invitations')}&email=${encodeURIComponent(emailValue)}`,
      )
    } else {
      router.push(`/sign-in?email=${encodeURIComponent(emailValue)}`)
    }
  }

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required')
      .matches(emailRegex, 'Invalid email address '),
  })

  const handleSendVerificationEmail = async (email: string): Promise<void> => {
    try {
      setVerifyLoader(true)

      const payload = {
        email,
        clientAlias: clientAliasValue
          ? clientAliasValue
          : process.env.NEXT_PUBLIC_PLATFORM_NAME,
        // Pass the return path so the backend bakes it into the verification email link
        // and the marketplace token survives the round-trip back to onboarding.
        ...(redirectTo ? { redirectTo } : {}),
        // Pass the invitation ID so the backend bakes it into the verification email link
        // and the gate bypass survives the email round-trip for new invited users.
        ...(invitationId ? { invitationId } : {}),
      }

      const userRsp = await sendVerificationMail(payload)
      const { data } = userRsp as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setEmailSent(true)
        setAddFailure(null)
      } else {
        setAddFailure(userRsp as string)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during sending verification email:', err)
      setAddFailure('An error occurred while sending verification email.')
    } finally {
      setVerifyLoader(false)
    }
  }

  const handleVerifyEmail = async (emailValue: string): Promise<void> => {
    setLoading(true)
    setAddFailure(null)

    try {
      const userRsp = await checkUserExist(emailValue)
      const { data } = userRsp as AxiosResponse
      const { isEmailVerified, isRegistrationCompleted, userId } =
        data?.data ?? {}

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        if (isEmailVerified) {
          if (isRegistrationCompleted) {
            // In the marketplace funnel, send an existing/complete account to sign-in
            // (carrying the redirectTo) so they can continue onboarding. Outside that
            // funnel, preserve the original inline "already exists" message.
            if (redirectTo || invitationId) {
              redirectToSignIn(emailValue)
            } else {
              setAddFailure(data?.data?.message)
            }
          } else {
            setEmail(emailValue)
            goToNext()
          }
        } else if (userId) {
          // A user record already exists but is unverified, so a verification link was
          // already sent on a previous attempt. The backend refuses to send a second one
          // (409), so don't re-POST — just show the "check your inbox" state. This is what
          // caused the confusing "verification already sent" error when a buyer clicked
          // "Continue with email" twice or returned to this step before verifying.
          setEmailSent(true)
        } else {
          // Brand-new address (no record yet): send the initial verification mail.
          await handleSendVerificationEmail(emailValue)
        }
      } else {
        setAddFailure(data?.data?.message ?? 'Something went wrong.')
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error during email verification:', err)
      setAddFailure('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // For the marketplace path the email is the fixed purchaser address. Resolve the right
  // next step on mount instead of blindly sending a mail: an existing account → sign-in,
  // an already-verified address (returning from the email link) → straight to step 2,
  // and a brand-new address → send the verification mail so it is waiting in their inbox.
  useEffect(() => {
    if (locked && email && !autoSentRef.current) {
      autoSentRef.current = true
      void handleVerifyEmail(email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, email])

  return (
    <Formik
      initialValues={{ email }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        await handleVerifyEmail(values.email)
      }}
      validateOnChange
      validateOnBlur
    >
      {({ errors, touched, handleChange, handleBlur, values }) => {
        const handleEmailChange = (
          e: React.ChangeEvent<HTMLInputElement>,
        ): void => {
          handleChange(e)
          setEmail(e.target.value)
        }

        return (
          <FormikForm className="space-y-4">
            {addFailure && (
              <div className="w-full" role="alert">
                <AlertComponent
                  message={addFailure}
                  type={'failure'}
                  onAlertClose={() => {
                    if (addFailure) {
                      setAddFailure(null)
                    }
                  }}
                />
              </div>
            )}

            {emailSent ? (
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <p className="font-medium">Check your inbox</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    We sent a verification link to{' '}
                    <span className="text-foreground font-medium">
                      {values.email}
                    </span>
                    . Open it to continue creating your account — this page
                    reopens automatically when you return.
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Don&apos;t see it? Check your spam folder.
                  </p>
                </div>
                {!locked && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEmailSent(false)
                      setAddFailure(null)
                    }}
                  >
                    Use a different email
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="h-12">
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleEmailChange}
                    onBlur={handleBlur}
                    readOnly={locked}
                    className={
                      locked ? 'bg-muted cursor-not-allowed' : undefined
                    }
                  />
                  {touched.email && errors.email && (
                    <div className="text-destructive mt-1 text-sm">
                      {errors.email}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="mt-6 w-full"
                  disabled={loading || verifyLoader}
                >
                  {loading || verifyLoader
                    ? 'Processing...'
                    : 'Continue with email'}
                </Button>
              </>
            )}
          </FormikForm>
        )
      }}
    </Formik>
  )
}
