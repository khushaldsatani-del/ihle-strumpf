import { useEffect, useRef } from 'react'

// Calls handler when the user presses outside of the element in ref (only while enabled).
export default function useClickOutside(ref, handler, enabled = true) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return undefined

    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handlerRef.current(event)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [ref, enabled])
}
