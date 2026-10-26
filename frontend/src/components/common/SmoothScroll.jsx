import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useLocation } from 'react-router-dom'

// Areas that scroll by themselves (or use the wheel for something else): Lenis leaves them alone
const OWN_SCROLL = '.filter-panel__body, #mobile-menu, .language-drawer, .leaflet-container, [role="listbox"], [role="menu"]'

/**
 * Smooth scrolling for the whole site (Lenis): the mouse wheel glides instead of jumping.
 * Touch scrolling stays native. Switched off for prefers-reduced-motion.
 * Also starts every page at the top. Renders nothing.
 */
export default function SmoothScroll() {
  const { pathname } = useLocation()
  const lenisRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const lenis = new Lenis({
      duration: 1.1,
      prevent: (node) => Boolean(node.closest(OWN_SCROLL)),
    })
    lenisRef.current = lenis

    let frame = requestAnimationFrame(function loop(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(loop)
    })

    // Menus and panels lock the page with body { overflow: hidden }: pause the smooth scroll meanwhile
    const syncLock = () => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start())
    const observer = new MutationObserver(syncLock)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Start every page at the top
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  return null
}
