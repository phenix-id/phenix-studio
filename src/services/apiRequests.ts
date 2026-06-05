import axios, { type AxiosError, type AxiosResponse } from 'axios'
import {
  instance as axiosUser,
  EcosystemInstance as ecosystemAxiosUser,
} from './axiosIntercepter'

import {
  isMarketplaceToastCode,
  marketplaceCodeMessage,
} from '@/config/marketplaceErrors'

import { HeaderConfig } from '@/config/GetHeaderConfigs'
import { store } from '@/lib/store'
import { toast } from 'sonner'

const MARKETPLACE_MANAGE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_MANAGE_URL

// Surface a single "manage subscription" CTA for mid-workflow marketplace gates
// (issuance / verification / schema limits, suspended/unsubscribed, …) that don't have a
// dedicated inline notice in their flow. Deduped per code so repeated attempts replace
// rather than stack. Org/user/subscribe codes are handled inline and skipped here.
const notifyMarketplaceGate = (code?: string, message?: string): void => {
  if (!isMarketplaceToastCode(code)) {
    return
  }

  toast.error(marketplaceCodeMessage(code, message), {
    id: code,
    duration: 8000,
    action: MARKETPLACE_MANAGE_URL
      ? {
          label: 'Manage subscription',
          onClick: () =>
            window.open(
              MARKETPLACE_MANAGE_URL,
              '_blank',
              'noopener,noreferrer',
            ),
        }
      : undefined,
  })
}

export interface APIParameters {
  url: string
  payload?: Record<never, unknown>
  config?: HeaderConfig
}

const HandleResponse = (
  responseData: AxiosResponse | undefined,
): Promise<AxiosResponse> => {
  if (responseData) {
    const body = responseData.data as { message?: string; code?: string }
    const errorMessage =
      body?.message || 'Something went wrong, please try later...'
    // Attach the HTTP status and any backend error code so callers can branch on them
    // instead of matching message text (which is brittle to wording changes).
    const error = new Error(errorMessage) as Error & {
      statusCode?: number
      code?: string
    }
    error.statusCode = responseData.status
    error.code = body?.code
    notifyMarketplaceGate(body?.code, body?.message)
    return Promise.reject(error)
  }
  return Promise.reject(
    new Error('Please check your internet connectivity and try again'),
  )
}

const publicAxiosUser = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
})
const publicEcosystemAxiosUser = axios.create({
  baseURL: process.env.PUBLIC_ECOSYSTEM_BASE_URL,
})

publicAxiosUser.interceptors.request.use((config) => {
  const token = store.getState().auth?.token

  if (!token) {
    return config
  }

  return {
    ...config,
    headers: new axios.AxiosHeaders({
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }),
  }
})

export const axiosGet = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await axiosUser.get(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}
export const axiosPublicUserGet = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await publicAxiosUser.get(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosPublicUserPost = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await publicAxiosUser.post(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosPublicUserPut = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await publicAxiosUser.put(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosPublicOrganisationGet = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await publicAxiosUser.get(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosPost = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await axiosUser.post(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosPatch = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await axiosUser.patch(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosPut = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await axiosUser.put(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const axiosDelete = async ({
  url,
  config,
  payload = {},
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const requestConfig =
      Object.keys(payload).length > 0 ? { ...config, data: payload } : config

    const response = await axiosUser.delete(url, requestConfig)
    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}
export const ecosystemAxiosGet = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await ecosystemAxiosUser.get(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}
export const ecosystemAxiosPublicUserGet = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await publicEcosystemAxiosUser.get(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const ecosystemAxiosPublicOrganisationGet = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await publicEcosystemAxiosUser.get(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const ecosystemAxiosPost = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await ecosystemAxiosUser.post(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const ecosystemAxiosPatch = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await ecosystemAxiosUser.patch(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const ecosystemAxiosPut = async ({
  url,
  payload,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await ecosystemAxiosUser.put(url, payload, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}

export const ecosystemAxiosDelete = async ({
  url,
  config,
}: APIParameters): Promise<AxiosResponse> => {
  try {
    const response = await ecosystemAxiosUser.delete(url, config)

    return response
  } catch (error) {
    const err = error as AxiosError
    return HandleResponse(err.response)
  }
}
