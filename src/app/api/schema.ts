import {
  CreateCredDeffFieldName,
  GetAllSchemaListParameter,
} from '@/features/dashboard/type/schema'
import { axiosGet, axiosPost } from '@/services/apiRequests'

import { AxiosResponse } from 'axios'
import { SchemaTypes } from '@/common/enums'
import apiRoutes from './apiRoutes'
import { getHeaderConfigs } from '@/config/GetHeaderConfigs'

const config = getHeaderConfigs()
export interface ApiErrorResponse {
  message: string
  statusCode?: number
  code?: string
}

const getApiErrorResponse = (error: unknown): ApiErrorResponse => {
  const err = error as Error & { statusCode?: number; code?: string }

  return {
    message: err?.message || 'Something went wrong, please try later...',
    statusCode: err?.statusCode,
    code: err?.code,
  }
}

export const createSchemas = async (
  payload: Record<string, unknown>,
  orgId: string,
): Promise<AxiosResponse | ApiErrorResponse> => {
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.create}`,
    payload,
    config,
  }

  try {
    const response = await axiosPost(details)
    return response
  } catch (error) {
    return getApiErrorResponse(error)
  }
}

export const getSchemaById = async (
  schemaId: string,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const encodedSchemaId = encodeURIComponent(schemaId)
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.getSchemaById}/${encodedSchemaId}`,
    config,
  }

  try {
    const response = await axiosGet(details)
    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const createCredentialDefinition = async (
  payload: CreateCredDeffFieldName,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.createCredentialDefinition}`,
    payload,
    config,
  }

  try {
    const response = await axiosPost(details)

    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getAllSchemas = async (
  { itemPerPage, page, allSearch }: GetAllSchemaListParameter,
  schemaType: string,
  ledgerId: string,
): Promise<AxiosResponse | string> => {
  const axiosPayload = {
    url: `${apiRoutes.Platform.getAllSchemaFromPlatform}?pageSize=${itemPerPage}&searchByText=${allSearch}&pageNumber=${page}&ledgerId=${ledgerId}&schemaType=${schemaType}`,
    config,
  }

  try {
    const response = await axiosGet(axiosPayload)
    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getAllSchemasByOrgId = async (
  { search, itemPerPage, page }: GetAllSchemaListParameter,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.getAll}?pageNumber=${page}&pageSize=${itemPerPage}&searchByText=${search}`,
    config,
  }

  try {
    const response = await axiosGet(details)
    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getAllCredDef = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.createCredentialDefinition}`
  const axiosPayload = {
    url,
    config: getHeaderConfigs(),
  }

  try {
    return await axiosGet(axiosPayload)
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getCredDeffById = async (
  schemaId: string,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const encodedSchemaId = encodeURIComponent(schemaId)
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.getCredDefBySchemaId}/${encodedSchemaId}/cred-defs`,
    config,
  }

  try {
    const response = await axiosGet(details)
    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getCredDefDetailsByCredDefId = async (
  credDefId: string,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.createCredentialDefinition}/${credDefId}`,
    config,
  }

  try {
    const response = await axiosGet(details)
    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getSchemaCredDef = async (
  schemaType: SchemaTypes,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Issuance.bulk.credefList}?schemaType=${schemaType}`
  const axiosPayload = {
    url,
    config: getHeaderConfigs(),
  }

  try {
    return await axiosGet(axiosPayload)
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getCredDefDetailsByRecordId = async (
  credDefId: string,
  orgId: string,
): Promise<AxiosResponse | string> => {
  const details = {
    url: `${apiRoutes.organizations.root}/${orgId}${apiRoutes.schema.credentialRecordId}/${credDefId}`,
    config,
  }

  try {
    const response = await axiosGet(details)
    return response
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}
