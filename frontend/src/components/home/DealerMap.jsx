import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Start view: the Erzgebirge region around Aue / Schwarzenberg
const START = { center: [50.565, 12.74], zoom: 12 }
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/**
 * Real, interactive map (Leaflet + OpenStreetMap tiles).
 * target = { lat, lon, label } moves the map there and sets a marker.
 * The map is only created once it scrolls into view, so no map tiles are requested before that.
 */
export default function DealerMap({ target, label }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const targetRef = useRef(target)

  // Shows the current target on the map (if the map already exists)
  const showTarget = () => {
    const map = mapRef.current
    const place = targetRef.current
    if (!map || !place) return

    markerRef.current?.remove()
    markerRef.current = L.circleMarker([place.lat, place.lon], {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: '#4a2413',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip(place.label, { direction: 'top', offset: [0, -8] })
    map.flyTo([place.lat, place.lon], 13, { duration: 1.2 })
  }

  // Create the map when the section becomes visible
  useEffect(() => {
    const container = containerRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || mapRef.current) return
        observer.disconnect()
        // Zoom with the +/- buttons (animated); the mouse wheel keeps scrolling the page. Dragging moves the map.
        const map = L.map(container, { ...START, scrollWheelZoom: false, zoomControl: true, dragging: true })
        L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map)
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

  // isolate: keeps Leaflet's internal z-indexes below the navbar and menus
  return <div ref={containerRef} role="region" aria-label={label} className="dealer-map isolate size-full" />
}
