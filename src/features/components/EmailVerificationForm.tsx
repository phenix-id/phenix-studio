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
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [addFailure, setAddFailure] = useState<string | null>(null)
  const autoSentRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const clientAliasValue = searchParams?.get('clientAlias')
  const redirectTo = searchParams?.get('redirectTo')

  // Send an existing/fully-registered account to sign-in (preserving the marketplace
  // redirectTo + clientAlias) instead of dead-ending on an error or a redundant signup.
  const redirectToSignIn = (emailValue: string): void => {
    router.push(
      redirectTo && clientAliasValue
        ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}&clientAlias=${clientAliasValue}&email=${encodeURIComponent(emailValue)}`
        : `/sign-in?email=${encodeURIComponent(emailValue)}`,
    )
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
      }

      const userRsp = await sendVerificationMail(payload)
      const { data } = userRsp as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setEmailSuccess(data?.message)
        setAddFailure(null)
      } else {
        setAddFailure(userRsp as string)
        setEmailSuccess(null)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during sending verification email:', err)
      setAddFailure('An error occurred while sending verification email.')
      setEmailSuccess(null)
    } finally {
      setVerifyLoader(false)
    }
  }

  const handleVerifyEmail = async (emailValue: string): Promise<void> => {
    setLoading(true)
    setEmailSuccess(null)
    setAddFailure(null)

    try {
      const userRsp = await checkUserExist(emailValue)
      const { data } = userRsp as AxiosResponse
      const { isEmailVerified, isRegistrationCompleted } = data?.data ?? {}

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        if (isEmailVerified) {
          if (isRegistrationCompleted) {
            // In the marketplace funnel, send an existing/complete account to sign-in
            // (carrying the redirectTo) so they can continue onboarding. Outside that
            // funnel, preserve the original inline "already exists" message.
            if (redirectTo) {
              redirectToSignIn(emailValue)
            } else {
              setAddFailure(data?.data?.message)
            }
          } else {
            setEmail(emailValue)
            goToNext()
          }
        } else {
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
            {emailSuccess && (
              <div className="w-full" role="alert">
                <AlertComponent
                  message={emailSuccess}
                  type={'success'}
                  onAlertClose={() => {
                    if (emailSuccess) {
                      setEmailSuccess(null)
                    }
                  }}
                />
              </div>
            )}
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

            <div className="h-12">
              <Input
                placeholder="Enter your email"
                type="email"
                name="email"
                value={values.email}
                onChange={handleEmailChange}
                onBlur={handleBlur}
                readOnly={locked}
                className={locked ? 'bg-muted cursor-not-allowed' : undefined}
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
          </FormikForm>
        )
      }}
    </Formik>
  )
}
