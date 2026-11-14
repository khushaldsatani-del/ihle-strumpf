import { useEffect, useState } from 'react'

// The page's root font size in px (1rem). It changes with the window on very small and very big screens (see the
// responsive scale in styles/global.css), so sizes that must be given in px (e.g. animated widths) can follow it.
const read = () => (typeof window === 'undefined' ? 16 : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)

export default function useRootFontSize() {
  const [size, setSize] = useState(read)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setSize(read()))
    }
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
    }
  }, [])

  return size
}
