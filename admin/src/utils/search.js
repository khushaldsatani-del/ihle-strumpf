// Search in the admin lists: case-insensitive, and spaces don't matter, so "4000" finds article "40 000"
// and "4000000112" the SKU "40 000 001 12" (NAV writes numbers with spaces, people type them without)
const squeeze = (text) => String(text).toLowerCase().replace(/\s+/g, '')

export function matchesSearch(values, query) {
  const needle = squeeze(query)
  return !needle || values.some((value) => value != null && squeeze(value).includes(needle))
}
