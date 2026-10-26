// Filtering of the catalogue in the browser (a few hundred articles at most), with the option counts.

// The values of a product for one filter, as a list
const valuesOf = (product, key) =>
  ({
    category: [product.category],
    group: [product.group],
    color: product.colorCodes,
    size: product.sizes,
    material: product.materials,
    unit: [product.unit],
  })[key]

// True when the product passes every filter. skip = one filter to leave out (used for the option counts).
export function matchesFilters(product, filters, skip) {
  if (skip !== 'category' && filters.category && product.category !== filters.category) return false

  return ['group', 'color', 'size', 'material', 'unit'].every((key) => {
    // choosing another category also clears the groups, so both are left out together
    if (key === skip || (key === 'group' && skip === 'category')) return true
    return filters[key].length === 0 || valuesOf(product, key).some((value) => filters[key].includes(value))
  })
}

export const filterProducts = (products, filters) => products.filter((product) => matchesFilters(product, filters))

// How many products would be shown if this option were chosen (with all other filters as they are)
export const countOption = (products, filters, key, value) =>
  products.filter((product) => matchesFilters(product, filters, key) && valuesOf(product, key).includes(value)).length
