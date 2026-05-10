import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

export type ApiResponse<T> = {
  code: string | number
  message: string
  data: T
}

const normalizeApiResponse = <T>(payload: unknown): ApiResponse<T> => {
  const body = (payload || {}) as Partial<ApiResponse<T>>
  const hasStandardFields =
    Object.prototype.hasOwnProperty.call(body, 'code') &&
    Object.prototype.hasOwnProperty.call(body, 'message') &&
    Object.prototype.hasOwnProperty.call(body, 'data')

  if (hasStandardFields) {
    return {
      code: body.code as string | number,
      message: String(body.message ?? ''),
      data: body.data as T,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: payload as T,
  }
}

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string | number }>) => {
    const message =
      error?.response?.data?.message || error?.message || '请求失败，请稍后重试'
    const code = error?.response?.data?.code ?? error?.response?.status ?? -1
    return Promise.reject(
      new Error(`[${code}] ${message}`),
    )
  },
)

export const apiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await httpClient.get(url, config)
  return normalizeApiResponse<T>(response.data)
}

export const apiPost = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await httpClient.post(url, data, config)
  return normalizeApiResponse<T>(response.data)
}

const buildUrlWithParams = (
  url: string,
  params: AxiosRequestConfig['params'] = {},
): string => {
  return httpClient.getUri({
    url,
    method: 'get',
    params,
  })
}

type CreateSseConnectionArgs = {
  url: string
  params?: AxiosRequestConfig['params']
  onOpen?: () => void
  onMessage?: (data: string) => void
  onError?: (event: Event) => void
}

export const createSseConnection = ({
  url,
  params,
  onOpen,
  onMessage,
  onError,
}: CreateSseConnectionArgs) => {
  const fullUrl = buildUrlWithParams(url, params)
  const eventSource = new EventSource(fullUrl)

  eventSource.onopen = () => {
    onOpen?.()
  }

  eventSource.onmessage = (event) => {
    onMessage?.(event.data)
  }

  eventSource.onerror = (event) => {
    onError?.(event)
    eventSource.close()
  }

  return {
    close: () => {
      eventSource.close()
    },
  }
}
