/**
 * Admin API utilities
 */

export function getAdminApiUrl(path: string): string {
  // Use the backend URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://prophet-milo-f3hr5.ondigitalocean.app/api'
  
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Remove /api from baseUrl if path already starts with api/
  const finalBase = cleanPath.startsWith('api/') && baseUrl.endsWith('/api') 
    ? baseUrl.slice(0, -4)
    : baseUrl
  
  return `${finalBase}/${cleanPath}`
}

export async function fetchAdminApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getAdminApiUrl(path)
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}