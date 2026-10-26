// Small fetch wrapper for the backend. /api is forwarded to the backend by Vite locally and by Vercel online,
// so the login cookie stays on the same site. Errors carry the backend's error code (e.g. "wrongCredentials").
export class ApiError extends Error {
  constructor(status, code) {
    super(code || `HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: form || (body ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'offline')
  }
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new ApiError(response.status, data?.error)
  return data
}

// Uploads a form with real progress (fetch can't report upload progress, XMLHttpRequest can).
// onProgress(0…1) follows the bytes sent; the answer is parsed like api().
export function upload(path, form, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `/api${path}`)
    request.withCredentials = true
    request.upload.onprogress = (event) => event.lengthComputable && onProgress?.(event.loaded / event.total)
    request.onerror = () => reject(new ApiError(0, 'offline'))
    request.onload = () => {
      let data = null
      try {
        data = JSON.parse(request.responseText)
      } catch {
        // not JSON (e.g. a proxy error page)
      }
      if (request.status >= 200 && request.status < 300) resolve(data)
      else reject(new ApiError(request.status, data?.error))
    }
    request.send(form)
  })
}

// Downloads a file the backend sends (e.g. an order XML) under the given name
export async function download(path, fileName) {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin' })
  if (!response.ok) throw new ApiError(response.status)
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
