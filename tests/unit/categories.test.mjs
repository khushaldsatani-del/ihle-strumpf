// Unit tests: the shop's categories and product groups from the backend's list.  Run: node --test tests/unit
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CATEGORIES, buildCategories, categoryByNav, findCategory, nameOf } from '../../frontend/src/data/categories.js'

const t = (key) => `t:${key}`

describe('buildCategories', () => {
  it('keeps the fixed list when the backend sends none (older backend) or an empty one', () => {
    assert.equal(buildCategories(undefined), CATEGORIES)
    assert.equal(buildCategories([]), CATEGORIES)
  })

  it('shows only the listed categories and groups, known ones first with their colour and translation', () => {
    const categories = buildCategories([
      { code: 'ALLTAG', name: 'Katalog-Artikel Alltag & Sport', groups: [{ code: '401 KLAS', name: '401 KLAS' }] },
      { code: 'NEU', name: 'Neue Kategorie', groups: [] },
      { code: 'PROTHETIC', name: 'Katalog-Artikel Prothetic', groups: [{ code: '102 US PIN', name: 'x' }, { code: '101 US', name: 'y' }] },
    ])
    assert.deepEqual(categories.map((category) => category.code), ['PROTHETIC', 'ILO', 'NEU'])
    const prothetic = categories[0]
    assert.deepEqual(prothetic.groups.map((group) => group.code), ['101-US', '102-US-PIN'], 'known groups keep their order, empty ones are gone')
    assert.equal(nameOf(t, prothetic), 't:categories.PROTHETIC')
    assert.equal(nameOf(t, prothetic.groups[0]), 't:groups.101-US')

    const ilo = categories[1]
    assert.deepEqual(ilo.groups, [{ code: '401-KLAS', navCode: '401 KLAS', name: '401 KLAS' }])
    assert.equal(nameOf(t, ilo.groups[0]), '401 KLAS', 'a new group shows NAV’s name (here the code)')

    const added = categories[2]
    assert.equal(nameOf(t, added), 'Neue Kategorie')
    assert.match(added.color, /^#[0-9A-F]{6}$/i)
    assert.equal(categoryByNav('NEU', categories), added)
  })
})

describe('buildCategories with clashing NAV codes', () => {
  it('gives every category and group its own link code', () => {
    const categories = buildCategories([
      { code: 'ALLTAG', name: 'a', groups: [] },
      { code: 'ILO', name: 'ILO aus NAV', groups: [] }, // "ILO" is the shop's own code for ALLTAG
      { code: 'KART ALLTG', name: 'x', groups: [{ code: '1 A', name: 'g1' }, { code: '1  A', name: 'g2' }] },
      { code: 'KART  ALLTG', name: 'y', groups: [] },
      { code: 'PROTHETIC', name: 'p', groups: [{ code: '101 US', name: 'a' }, { code: '101-US', name: 'b' }] },
    ])
    const codes = categories.map((category) => category.code)
    assert.equal(new Set(codes).size, codes.length, `duplicate category codes: ${codes}`)
    assert.equal(findCategory('ILO', categories).navCode, 'ALLTAG', 'the shop’s ILO link keeps opening ALLTAG')
    assert.equal(categoryByNav('ILO', categories).code, 'ILO-2')
    for (const category of categories) {
      const groups = category.groups.map((group) => group.code)
      assert.equal(new Set(groups).size, groups.length, `duplicate group codes in ${category.code}: ${groups}`)
    }
    assert.deepEqual(findCategory('PROTHETIC', categories).groups.map((group) => [group.code, group.navCode]), [['101-US', '101 US'], ['101-US-2', '101-US']])
  })
})
