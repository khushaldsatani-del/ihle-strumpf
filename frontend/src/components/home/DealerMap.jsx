import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LocateFixed, LoaderCircle } from 'lucide-react'

// OpenFreeMap "Liberty": a modern vector map (OpenStreetMap data), free, no API key, drawn sharp on every screen
const STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

// Escapes text for the small pieces of HTML Leaflet needs (pins, info window)
const escape = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

// A map pin (drawn in CSS, see .map-pin in global.css); variant: 'outlet' (Ihle red, pulsing), 'place' (Ihle blue)
const pin = (variant) =>
  L.divIcon({
    className: '',
    html: `<span class="map-pin map-pin--${variant}"><span class="map-pin__pulse"></span><span class="map-pin__head"></span></span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
    tooltipAnchor: [0, -40],
  })

// Your own position: a blue dot with a soft halo
const youAreHere = L.divIcon({ className: '', html: '<span class="map-you"></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

/**
 * Real, interactive map (Leaflet with the OpenFreeMap "Liberty" vector map, OpenStreetMap data).
 * - outlet = { lat, lon, name, lines: [..], routeLabel }: a red pin with an info window (address, opening hours and a
 *   link that opens the route in Google Maps)
 * - target = { lat, lon, label }: the place someone searched for; the map flies there and sets a blue pin
 * - locateLabel / locateError: the "my location" button (asks the browser for the position)
 * The map is only created once it scrolls into view, so no map data is requested before that.
 */
export default function DealerMap({ target, label, start, outlet, locateLabel, locateError }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const placeRef = useRef(null)
  const youRef = useRef(null)
  const targetRef = useRef(target)
  // the start view and the outlet only matter when the map is created
  const setupRef = useRef({ start, outlet })
  const [locating, setLocating] = useState('idle') // 'idle' | 'busy' | 'error'

  // Shows the searched place on the map (if the map already exists)
  const showTarget = () => {
    const map = mapRef.current
    const place = targetRef.current
    if (!map || !place) return
    placeRef.current?.remove()
    placeRef.current = L.marker([place.lat, place.lon], { icon: pin('place'), keyboard: false })
      .addTo(map)
      .bindTooltip(escape(place.label), { direction: 'top', className: 'map-tooltip' })
    map.flyTo([place.lat, place.lon], 12, { duration: 1.2 })
  }

  // Create the map when the section becomes visible
  useEffect(() => {
    const container = containerRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || mapRef.current) return
        observer.disconnect()
        const { start: view, outlet: shop } = setupRef.current
        // Zoom with the buttons; the mouse wheel keeps scrolling the page. Dragging moves the map.
        const map = L.map(container, { ...view, minZoom: 5, maxZoom: 18, scrollWheelZoom: false, zoomControl: false, dragging: true })
        L.control.zoom({ position: 'topleft', zoomInText: '+', zoomOutText: '−' }).addTo(map)
        maplibreGL({ style: STYLE, attribution: ATTRIBUTION }).addTo(map)

        if (shop) {
          const route = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}`
          L.marker([shop.lat, shop.lon], { icon: pin('outlet'), title: shop.name })
            .addTo(map)
            .bindPopup(
              `<p class="map-popup__title">${escape(shop.name)}</p>` +
                shop.lines.map((line) => `<p class="map-popup__line">${escape(line)}</p>`).join('') +
                `<a class="map-popup__route" href="${route}" target="_blank" rel="noopener noreferrer">${escape(shop.routeLabel)} →</a>`,
              { className: 'map-popup', closeButton: true, maxWidth: 260 },
            )
        }
        mapRef.current = map
        showTarget()
      },
      { rootMargin: '200px' },
    )
    observer.observe(container)

    return () => {
      observer.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    targetRef.current = target
    showTarget()
  }, [target])

  // "My location": asks the browser for the position and flies there
  const locate = () => {
    const map = mapRef.current
    if (!map || !navigator.geolocation) {
      setLocating('error')
      return
    }
    setLocating('busy')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        youRef.current?.remove()
        youRef.current = L.marker([coords.latitude, coords.longitude], { icon: youAreHere, keyboard: false }).addTo(map)
        map.flyTo([coords.latitude, coords.longitude], 11, { duration: 1.2 })
        setLocating('idle')
      },
      () => setLocating('error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  return (
    <div className="relative size-full">
      {/* isolate: keeps Leaflet's internal z-indexes below the header and menus */}
      <div ref={containerRef} role="region" aria-label={label} className="dealer-map isolate size-full" />
      <button
        type="button"
        onClick={locate}
        disabled={locating === 'busy'}
        className="absolute right-3 top-3 z-[500] inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-ihle-blue shadow-[0_6px_18px_-8px_rgb(22_53_91/0.45)] transition-colors hover:bg-ihle-mist"
      >
        {locating === 'busy' ? (
          <LoaderCircle size={16} strokeWidth={2} aria-hidden="true" className="animate-spin" />
        ) : (
          <LocateFixed size={16} strokeWidth={2} aria-hidden="true" />
        )}
        {locateLabel}
      </button>
      <p aria-live="polite" className="sr-only">
        {locating === 'error' ? locateError : ''}
      </p>
      {locating === 'error' && (
        <p className="absolute right-3 top-15 z-[500] rounded-full bg-white px-3 py-1.5 text-xs text-[#b64558] shadow">{locateError}</p>
      )}
    </div>
  )
}
