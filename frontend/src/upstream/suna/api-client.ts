import { backendApi } from '@/lib/api-client'

export const sunaClient = {
  get: backendApi.get,
  post: backendApi.post,
  put: backendApi.put,
  patch: backendApi.patch,
  delete: backendApi.delete,
  upload: backendApi.upload,
}

export type { ApiResponse } from '@/lib/api-client'

