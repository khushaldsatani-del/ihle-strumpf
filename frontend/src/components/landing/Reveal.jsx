import { motion } from 'motion/react'

// Fades its content up once it scrolls into view (switched off for prefers-reduced-motion by MotionConfig in App).
export default function Reveal({ as = 'div', delay = 0, className = '', children, ...props }) {
  const Component = motion[as]
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </Component>
  )
}
