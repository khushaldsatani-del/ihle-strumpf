import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Asterisk, ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import RollText from '../common/RollText.jsx'

const IMAGES = '/images/hero'

// Cards rise in one after another
const grid = { visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }
const rise = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 26 } },
}

// Outline of a rounded card with a small step cut out of one top corner (smooth S-curve into the step).
function notchedPath(width, height, radius, side) {
  const depth = radius * 0.95 // how far the step drops
  const run = radius * 2.2 // horizontal length of the S-curve
  const notch = Math.max(width * 0.2, radius * 1.4) // length of the lowered part
  const mid = run / 2

  // Drawn for a step on the right; the left version is the mirror image
  const x = side === 'right' ? (value) => value : (value) => width - value
  const sweep = side === 'right' ? 1 : 0
  const start = width - notch - run
  const arc = (toX, toY) => `A ${radius} ${radius} 0 0 ${sweep} ${x(toX)} ${toY}`

  return [
    `M ${x(radius)} 0`,
    `L ${x(start)} 0`,
    `C ${x(start + mid)} 0 ${x(start + mid)} ${depth} ${x(start + run)} ${depth}`,
    `L ${x(width - radius)} ${depth}`,
    arc(width, depth + radius),
    `L ${x(width)} ${height - radius}`,
    arc(width - radius, height),
    `L ${x(radius)} ${height}`,
    arc(0, height - radius),
    `L ${x(0)} ${radius}`,
    arc(radius, 0),
    'Z',
  ].join(' ')
}

/**
 * One picture card. notch = 'left' | 'right' cuts a small step out of that top corner.
 * contain = product cut-out shown whole on the coloured card (instead of a photo filling it).
 * focus = which part of a filling photo stays visible when it is cropped (e.g. 'object-left').
 */
function Card({ src, tint, notch, contain = false, pad = 'p-[12%]', focus = '', style }) {
  const ref = useRef(null)

  // The notched outline is a clip-path in pixels, so it is redrawn whenever the card changes size
  useLayoutEffect(() => {
    const card = ref.current
    if (!notch || !card) return undefined

    const draw = () => {
      const radius = parseFloat(getComputedStyle(card).borderBottomLeftRadius) || 0
      const path = notchedPath(card.offsetWidth, card.offsetHeight, radius, notch)
      card.style.clipPath = `path("${path}")`
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(card)
    return () => observer.disconnect()
  }, [notch])

  // 3D tilt towards the mouse.
  // The outer element never moves, so its box is a stable reference for the pointer;
  // only the inner element tilts. Updates are bundled into one per frame.
  const tiltRef = useRef(null)
  const frame = useRef(0)

  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left - bounds.width / 2 // offset from the centre
    const y = event.clientY - bounds.top - bounds.height / 2
    const angle = Math.log(Math.max(Math.hypot(x, y), 1)) * 3.2 // tilt in degrees; grows with the distance from the centre

    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      tiltRef.current.classList.add('is-tilted')
      tiltRef.current.style.transform = `perspective(900px) scale3d(1.09, 1.09, 1.09) rotate3d(${y / 100}, ${-x / 100}, 0, ${angle}deg)`
    })
  }

  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current)
    tiltRef.current.classList.remove('is-tilted')
    tiltRef.current.style.transform = ''
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <div className="hero-tilt" style={style} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div ref={tiltRef} className="hero-tilt__inner">
        <div ref={ref} className={`hero-card ${tint}`}>
          <img
            src={`${IMAGES}/${src}`}
            alt=""
            loading="eager"
            className={`absolute inset-0 size-full ${contain ? `object-contain ${pad}` : `object-cover ${focus}`}`}
          />
        </div>
      </div>
    </div>
  )
}

// Round badge with text running around it
function CircleBadge({ text, label }) {
  return (
    <Link
      to="/about"
      aria-label={label}
      className="group relative flex size-16 shrink-0 items-center justify-center rounded-full text-heading transition-transform duration-300 hover:scale-110 active:scale-[0.96] lg:size-24"
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full animate-[spin_20s_linear_infinite]">
        <defs>
          <path id="hero-badge-path" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
        </defs>
        <text fontSize="9" fontWeight="700" fill="currentColor">
          <textPath href="#hero-badge-path" textLength="248" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="flex size-[42%] items-center justify-center rounded-full border border-current transition-colors duration-300 group-hover:bg-brand-dark group-hover:text-white">
        <ArrowUpRight aria-hidden="true" className="size-1/2" strokeWidth={2} />
      </span>
    </Link>
  )
}

// Overlapping round thumbnails with a "+" (link to the customer login)
function CustomerStack({ label }) {
  return (
    <Link
      to="/login"
      aria-label={label}
      className="group flex shrink-0 items-center rounded-full transition-transform active:scale-[0.96]"
    >
      {[
        ['socks-red.webp', 'bg-orange-200'],
        ['socks-purple.webp', 'bg-violet-200'],
      ].map(([src, tint]) => (
        <span
          key={src}
          className={`-ml-2.5 size-9 overflow-hidden rounded-full ring-2 ring-white transition-[margin] duration-300 first:ml-0 group-hover:-ml-1 group-hover:first:ml-0 lg:size-11 ${tint}`}
        >
          <img src={`${IMAGES}/${src}`} alt="" className="size-full object-contain p-1.5" />
        </span>
      ))}
      <span className="-ml-2.5 flex size-9 items-center justify-center rounded-full bg-brand-dark text-white ring-2 ring-white transition-[margin,rotate] duration-300 group-hover:-ml-1 group-hover:rotate-90 lg:size-11">
        <Plus aria-hidden="true" size={18} strokeWidth={2.5} />
      </span>
    </Link>
  )
}

// Home hero: headline with badge and customer stack, then five staggered columns of picture cards.
export default function Hero() {
  const { t } = useTranslation()

  return (
    // White band across the full width, directly under the navbar
    <section className="bg-white">
      <div className="mx-auto max-w-[96rem] px-4 pb-6 pt-6 sm:px-8 sm:pb-10 sm:pt-8 lg:px-16 lg:pb-14 lg:pt-10">
        {/* Badge | headline | customers (phones: badge and customers share the row above the headline) */}
        <div className="grid grid-cols-2 items-start gap-y-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="lg:pl-6 lg:pt-1">
            <CircleBadge text={t('home.hero.badge')} label={t('nav.about')} />
          </div>
          <h1 className="order-3 col-span-2 text-balance text-center text-[clamp(1.75rem,4.8vw,4rem)] font-bold leading-[1.08] tracking-tight text-heading lg:order-2 lg:col-span-1">
            {/* Two fixed lines from tablet up; phones wrap freely */}
            <span className="sm:block">{t('home.hero.titleLine1')}</span>{' '}
            <span className="sm:block">{t('home.hero.titleLine2')}</span>
          </h1>
          <div className="order-2 flex justify-end self-center lg:order-3 lg:self-start lg:pr-6 lg:pt-6">
            <CustomerStack label={t('nav.login')} />
          </div>
        </div>

        {/* Five columns with aligned bottoms; the numbers are the proportions of the design */}
        <motion.div
          variants={grid}
          initial="hidden"
          animate="visible"
          className="hero-grid mt-5 grid aspect-[286/200] grid-cols-3 gap-2 sm:aspect-[483/187] sm:grid-cols-5 sm:gap-3 lg:mt-1 lg:gap-4"
        >
          <motion.div variants={rise} className="hidden flex-col gap-2 sm:flex sm:gap-3 lg:gap-4">
            <Card src="prosthesis-purple.webp" tint="bg-violet-300" notch="right" focus="object-[50%_70%]" style={{ flex: 122 }} />
            <Card src="stack.webp" tint="bg-amber-100" style={{ flex: 57 }} />
          </motion.div>

          <motion.div variants={rise} className="flex flex-col">
            <div style={{ flex: 24 }} />
            <Card src="pink-crossed.webp" tint="bg-rose-200" notch="right" style={{ flex: 163 }} />
          </motion.div>

          <motion.div variants={rise} className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-end justify-center" style={{ flex: 38 }}>
              <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 lg:size-7">
                <Asterisk aria-hidden="true" className="size-3/4" strokeWidth={2.5} />
              </span>
            </div>
            <Card src="wheelchair.webp" tint="bg-amber-50" style={{ flex: 102 }} />
            <Link
              to="/products"
              className="flex min-h-11 shrink-0 items-center justify-center gap-1 group rounded-full bg-brand-dark px-3 text-center text-xs font-semibold text-white transition-[transform,background-color] duration-300 hover:bg-brand active:scale-[0.96] sm:text-sm lg:min-h-13 lg:text-base"
            >
              <RollText>{t('home.hero.cta')}</RollText>
              <ChevronRight aria-hidden="true" size={16} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div variants={rise} className="flex flex-col">
            <div style={{ flex: 24 }} />
            <Card src="relaxation.webp" tint="bg-violet-300" notch="left" focus="object-[42%_50%]" style={{ flex: 163 }} />
          </motion.div>

          <motion.div variants={rise} className="hidden flex-col gap-2 sm:flex sm:gap-3 lg:gap-4">
            <Card src="white-socks-purple.webp" tint="bg-violet-300" notch="left" focus="object-[50%_70%]" style={{ flex: 122 }} />
            <Card src="socks-stone.webp" tint="bg-emerald-100" style={{ flex: 57 }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
