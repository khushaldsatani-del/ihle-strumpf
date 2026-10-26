import { useCallback, useEffect, useRef, useState } from 'react'
import { upload } from '../utils/api.js'

// The XML is gzipped in the browser before upload: NAV exports shrink to about a tenth, which keeps even the
// big customer file far below Vercel's ~4.5 MB request limit. The backend recognises and unpacks it.
async function formWith(file) {
  let packed = file
  if ('CompressionStream' in window) {
    const blob = await new Response(file.stream().pipeThrough(new CompressionStream('gzip'))).blob()
    packed = new File([blob], `${file.name}.gz`, { type: 'application/gzip' })
  }
  const form = new FormData()
  form.append('file', packed, packed.name)
  return form
}

// Progress 0–100 % for sending a NAV file: compress (0–10), upload with real byte progress (10–60), then the
// server checks or saves it (60–95, eased because the server can't report its own progress), 100 when answered.
export default function useUploadProgress() {
  const [progress, setProgress] = useState(null)
  const timer = useRef(null)

  const stopEasing = () => {
    clearInterval(timer.current)
    timer.current = null
  }
  useEffect(() => stopEasing, [])

  // serverStep: 'check' (preview) or 'save' (confirm), shown while the server works
  const send = useCallback(async (path, file, serverStep) => {
    stopEasing()
    setProgress({ step: 'compress', percent: 2 })
    try {
      const form = await formWith(file)
      setProgress({ step: 'upload', percent: 10 })
      const result = await upload(path, form, (sent) => {
        if (sent < 1) return setProgress({ step: 'upload', percent: 10 + sent * 50 })
        // Everything is sent: the server is working now; creep towards 95 % until it answers
        if (!timer.current) {
          setProgress({ step: serverStep, percent: 60 })
          timer.current = setInterval(
            () => setProgress((current) => current && { ...current, percent: current.percent + (95 - current.percent) * 0.08 }),
            150,
          )
        }
      })
      stopEasing()
      setProgress({ step: 'done', percent: 100 })
      setTimeout(() => setProgress(null), 700)
      return result
    } catch (error) {
      stopEasing()
      setProgress(null)
      throw error
    }
  }, [])

  return { progress, send }
}
