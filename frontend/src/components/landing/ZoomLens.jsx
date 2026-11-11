import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import BrandText from './BrandText.jsx'

// Where the pop-up sits above the picture: centred, or flush with its left / right edge (pictures near an edge)
const ALIGN = {
  start: { box: 'left-0', arrow: 'left-8' },
  center: { box: 'left-1/2 -translate-x-1/2', arrow: 'left-1/2 -translate-x-1/2' },
  end: { box: 'right-0', arrow: 'right-8' },
}

/**
 * A picture with a round magnifier that follows the pointer (the same picture, enlarged), and a pop-up above it
 * with the main details: title, subtitle and text. Keyboard focus shows the pop-up too.
 * Used by the knit swatches on the material page.
 */
export default function ZoomLens({
  src,
  width,
  height,
  label,
  title,
  subtitle,
  text,
  lens = 150,
  zoom = 2.6,
  align = 'center',
  className = '',
}) {
  const id = useId()
  const boxRef = useRef(null)
  const [pointer, setPointer] = useState(null) // { x, y, width, height } while the pointer is over the picture
  const [focused, setFocused] = useState(false)
  const showInfo = Boolean(pointer) || focused
  const place = ALIGN[align] ?? ALIGN.center

  const move = (event) => {
    const box = boxRef.current.getBoundingClientRect()
    setPointer({ x: event.clientX - box.left, y: event.clientY - box.top, width: box.width, height: box.height })
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={boxRef}
        tabIndex={0}
        role="img"
        aria-label={label}
        aria-describedby={`${id}-info`}
        className="relative cursor-zoom-in rounded-2xl outline-offset-4"
        onPointerEnter={move}
        onPointerMove={move}
        onPointerLeave={() => setPointer(null)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <img
          src={src}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          draggable="false"
          className="block h-auto w-full select-none"
        />

        {/* the magnifier: the same picture, enlarged and shifted so the point under the pointer sits in its middle
            (the 4px white border is taken into account) */}
        <AnimatePresence>
          {pointer && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute z-10 rounded-full border-4 border-white bg-white bg-no-repeat shadow-[0_18px_40px_-14px_rgb(22_53_91/0.6),0_0_0_1px_rgb(22_53_91/0.12)]"
              style={{
                width: lens,
                height: lens,
                left: pointer.x - lens / 2,
                top: pointer.y - lens / 2,
                backgroundImage: `url(${src})`,
                backgroundSize: `${pointer.width * zoom}px ${pointer.height * zoom}px`,
                backgroundPosition: `${-(pointer.x * zoom - lens / 2 + 4)}px ${-(pointer.y * zoom - lens / 2 + 4)}px`,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* pop-up with the main details */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            id={`${id}-info`}
            role="tooltip"
            className={`pointer-events-none absolute bottom-full z-20 mb-4 w-[min(20rem,80vw)] rounded-2xl bg-white p-5 text-left shadow-[0_24px_50px_-20px_rgb(22_53_91/0.55),0_0_0_1px_rgb(22_53_91/0.08)] ${place.box}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-base font-medium not-italic text-ihle-blue">{title}</p>
            {subtitle && <p className="mt-1 text-[0.8125rem] font-medium text-ihle-accent-ink">{subtitle}</p>}
            {text && (
              <p className="mt-2 text-sm leading-relaxed text-ihle-ink">
                <BrandText>{text}</BrandText>
              </p>
            )}
            <span aria-hidden="true" className={`absolute -bottom-1.5 size-3 rotate-45 bg-white ${place.arrow}`} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* the details stay readable for screen readers when the pop-up is closed */}
      {!showInfo && (
        <p id={`${id}-info`} className="sr-only">
          {[subtitle, text].filter(Boolean).join('. ')}
        </p>
      )}
    </div>
  )
}
