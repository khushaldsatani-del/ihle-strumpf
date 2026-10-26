// Small fetch wrapper for the backend. /api is forwarded to the backend by Vite locally and by Vercel online,
// so the login cookie stays on the same site. Errors carry the backend's error code (e.g. "wrongCredentials").
export class ApiError extends Error {
  constructor(status, code) {
    super(code || `HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'offline')
  }
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new ApiError(response.status, data?.error)
  return data
}

// Product photo from the backend; ?v= changes when the photo is replaced, so browsers may cache it for long
export const photoUrl = (photo, size = 'thumb') => `/api/photos/${size}/${photo.name}.webp?v=${photo.v}`
