const GEOCODER = 'https://nominatim.openstreetmap.org/search'

// Looks up a postcode or place name with the OpenStreetMap geocoder. Returns { lat, lon, label } or null.
export async function findPlace(query, language) {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', 'accept-language': language })
  // A bare 5-digit number is treated as a German postcode
  if (/^\d{5}$/.test(query)) params.set('countrycodes', 'de')

  const response = await fetch(`${GEOCODER}?${params}`)
  if (!response.ok) throw new Error(`Geocoder answered ${response.status}`)
  const [place] = await response.json()
  return place ? { lat: Number(place.lat), lon: Number(place.lon), label: place.display_name } : null
}
