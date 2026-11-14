import { useId } from 'react'

// Stripes of the simple flags: [direction, ...colours]
const STRIPES = {
  de: ['rows', '#000000', '#dd0000', '#ffce00'],
  fr: ['columns', '#002654', '#ffffff', '#ce1126'],
  it: ['columns', '#009246', '#ffffff', '#ce2b37'],
  nl: ['rows', '#ae1c28', '#ffffff', '#21468b'],
  ru: ['rows', '#ffffff', '#0039a6', '#d52b1e'],
}

// Small flag with rounded corners (className sets its size)
export function Flag({ code, className = 'h-8 w-[2.9rem] rounded-md' }) {
  const clipId = useId()
  const base = { 'aria-hidden': true, className: `shrink-0 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] ${className}` }

  if (code === 'en') {
    return (
      <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" {...base}>
        <clipPath id={clipId}>
          <path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" />
        </clipPath>
        <path d="M0,0 h60 v40 h-60 z" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="7" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#c8102e" strokeWidth="4.5" clipPath={`url(#${clipId})`} />
        <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="12" />
        <path d="M30,0 v40 M0,20 h60" stroke="#c8102e" strokeWidth="7" />
      </svg>
    )
  }

  if (code === 'cs') {
    return (
      <svg viewBox="0 0 60 40" preserveAspectRatio="none" {...base}>
        <path d="M0,0 h60 v20 h-60 z" fill="#ffffff" />
        <path d="M0,20 h60 v20 h-60 z" fill="#d7141a" />
        <path d="M0,0 L30,20 L0,40 z" fill="#11457e" />
      </svg>
    )
  }

  if (code === 'sv') {
    return (
      <svg viewBox="0 0 60 40" preserveAspectRatio="none" {...base}>
        <path d="M0,0 h60 v40 h-60 z" fill="#006aa7" />
        <path d="M18,0 h8 v40 h-8 z M0,16 h60 v8 h-60 z" fill="#fecc00" />
      </svg>
    )
  }

  if (code === 'es') {
    return (
      <svg viewBox="0 0 60 40" preserveAspectRatio="none" {...base}>
        <path d="M0,0 h60 v40 h-60 z" fill="#aa151b" />
        <path d="M0,10 h60 v20 h-60 z" fill="#f1bf00" />
        {/* simplified coat of arms */}
        <path d="M15,15 h7 v7 a3.5,3.5 0 0 1 -7,0 z" fill="#aa151b" stroke="#8a6d00" strokeWidth="0.8" />
      </svg>
    )
  }

  const [direction, ...colors] = STRIPES[code]
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="none" {...base}>
      {colors.map((color, index) =>
        direction === 'rows' ? (
          <rect key={color} x="0" y={(40 / 3) * index} width="60" height={40 / 3 + 0.5} fill={color} />
        ) : (
          <rect key={color} x={20 * index} y="0" width="20.5" height="40" fill={color} />
        ),
      )}
    </svg>
  )
}
