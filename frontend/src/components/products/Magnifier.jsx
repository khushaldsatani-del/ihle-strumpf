import { useEffect, useRef } from 'react'

const EASE = 0.18 // share of the remaining distance the glass covers per frame (lower = softer)

/**
 * Product picture with a round magnifying glass that follows the mouse.
 * The glass shows an enlarged copy of the picture. Its position is eased frame by frame and written
 * straight to the DOM (no React re-render), which keeps the movement smooth. Mouse only: touch is ignored.
 */
export default function Magnifier({ src, alt, zoom = 2.2, size = 190 }) {
  const rootRef = useRef(null)
  const lensRef = useRef(null)
  const copyRef = useRef(null)
  const state = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, frame: 0, active: false })

  useEffect(() => {
    const current = state.current
    return () => cancelAnimationFrame(current.frame)
  }, [])

  const draw = () => {
    const s = state.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ease = reduced ? 1 : EASE
    s.x += (s.targetX - s.x) * ease
    s.y += (s.targetY - s.y) * ease

    // the glass is centred on the pointer; the copy is shifted so the same spot sits in its middle
    lensRef.current.style.transform = `translate3d(${s.x - size / 2}px, ${s.y - size / 2}px, 0)`
    copyRef.current.style.transform = `translate3d(${size / 2 - s.x * zoom}px, ${size / 2 - s.y * zoom}px, 0) scale(${zoom})`

    const moving = Math.abs(s.targetX - s.x) > 0.1 || Math.abs(s.targetY - s.y) > 0.1
    s.frame = s.active && moving ? requestAnimationFrame(draw) : 0
  }

  const track = (event, enter = false) => {
    if (event.pointerType !== 'mouse') return
    const s = state.current
    const rect = rootRef.current.getBoundingClientRect()
    s.targetX = event.clientX - rect.left
    s.targetY = event.clientY - rect.top

    if (enter) {
      // start exactly under the pointer and match the copy to the current size of the picture
      s.x = s.targetX
      s.y = s.targetY
      s.active = true
      copyRef.current.style.width = `${rect.width}px`
      copyRef.current.style.height = `${rect.height}px`
      rootRef.current.dataset.zoom = 'on'
    }
    if (!s.frame) s.frame = requestAnimationFrame(draw)
  }

  const leave = () => {
    state.current.active = false
    delete rootRef.current.dataset.zoom
  }

  return (
    <div
      ref={rootRef}
      className="magnifier"
      onPointerEnter={(event) => track(event, true)}
      onPointerMove={(event) => track(event)}
      onPointerLeave={leave}
    >
      <div className="product-stage">
        <img src={src} alt={alt} width="750" height="900" fetchPriority="high" className="size-full object-contain p-[10%]" />
      </div>

      {/* The glass: purely visual, the picture above carries the description */}
      <div ref={lensRef} aria-hidden="true" className="magnifier__lens" style={{ width: size, height: size }}>
        <div className="magnifier__glass">
          <div ref={copyRef} className="magnifier__copy">
            <img src={src} alt="" className="size-full object-contain p-[10%]" />
          </div>
        </div>
      </div>
    </div>
  )
}
