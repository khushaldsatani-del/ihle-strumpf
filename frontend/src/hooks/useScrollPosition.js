import { useEffect, useState } from 'react'

const readY = () => Math.max(window.scrollY, 0)

// Vertical scroll position and direction ('up' | 'down'), updated at most once per frame.
export default function useScrollPosition() {
  const [position, setPosition] = useState(() => ({ y: readY(), direction: 'up' }))

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const y = readY()
      setPosition((prev) => (y === prev.y ? prev : { y, direction: y > prev.y ? 'down' : 'up' }))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return position
}
