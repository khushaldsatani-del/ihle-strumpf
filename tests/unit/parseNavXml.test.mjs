// Unit tests: reading NAV's export files (no database needed).  Run: node --test tests/unit
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseNavXml, parseSku, shopLanguage } from '../../backend/src/integrations/nav/import/parseNavXml.js'

// One SKU in NAV's format; translations: [[languageCode, Description, Description2], …]
const item = (sku, { name = 'Diabetiker Socke klassisch', second = 'Umhängerand, ohne Gummi', color = 'schwarz', size = '35-38', price = '4.41', translations = [], blocked = '0' } = {}) => `
  <ShopItem>
    <SKU>${sku}</SKU>
    <Name>${name}\n${second}\nGröße: ${size}\nFarbe: ${color}\n(PAAR)</Name>
    ${translations.length ? `<Translations>${translations.map(([code, d, d2]) => `<Translation languageCode="${code}"><Description>${d}</Description><Description2>${d2}</Description2></Translation>`).join('')}</Translations>` : ''}
    <Blocked>${blocked}</Blocked>
    <ItemCategorie>DIABETES P</ItemCategorie>
    <ProductGroup>201-KLAS</ProductGroup>
    <ItemShortText><ItemTextLine value="80% Baumwolle" /></ItemShortText>
    <Pictures><Picture>${sku.replace(/ /g, '').slice(0, 5)}_001_01.jpg</Picture></Pictures>
    <ShopItemType><SubItem><NavItemNo>${sku}</NavItemNo><Price>${price}</Price><Price2>${price}</Price2><VatPercent>VAT19</VatPercent>
      <Attributes><Attribute name="Color" value="${sku.split(' ')[2]}" descriptionDE="" /><Attribute name="UnitOfMeasure" value="PAAR" /></Attributes>
    </SubItem></ShopItemType>
  </ShopItem>`
const file = (...items) => `<?xml version="1.0" encoding="UTF-8"?><ShopItems>${items.join('')}</ShopItems>`

describe('parseSku', () => {
  it('splits a full article number into article, colour and size code', () => {
    assert.deepEqual(parseSku('40 000 001 12'), { article: '40 000', color: '001', sizeCode: '12' })
  })
  it('rejects malformed numbers NAV sometimes exports', () => {
    assert.equal(parseSku('L1779'), null)
    assert.equal(parseSku('21 030 011 50 1046'), null)
    assert.equal(parseSku(''), null)
    assert.equal(parseSku(undefined), null)
  })
})

describe('shopLanguage', () => {
  it('maps NAV language codes to the shop codes and skips German', () => {
    assert.equal(shopLanguage('ENU'), 'en')
    assert.equal(shopLanguage('FRA'), 'fr')
    assert.equal(shopLanguage('ESP'), 'es')
    assert.equal(shopLanguage('DEU'), null)
    assert.equal(shopLanguage('XYZ'), 'xyz')
    assert.equal(shopLanguage(''), null)
  })
})

describe('parseNavXml: articles', () => {
  it('groups SKUs into articles with name, description and variants', () => {
    const result = parseNavXml(file(item('40 000 001 12'), item('40 000 001 13', { size: '39-42' }), item('40 000 002 12', { color: 'marine' })))
    assert.equal(result.type, 'items')
    assert.equal(result.records.length, 1)
    const [article] = result.records
    assert.equal(article.articleNo, '40 000')
    assert.equal(article.name, 'Diabetiker Socke klassisch')
    assert.equal(article.description, 'Umhängerand, ohne Gummi')
    assert.equal(article.variants.length, 3)
    assert.deepEqual(article.translations, {})
  })

  it('takes the shared part of per-colour translations as the article name', () => {
    const result = parseNavXml(
      file(
        item('06 200 001 12', { translations: [['ENU', 'ABS Sock Frottee, black', 'non-slip sole'], ['DEU', 'ABS-Socke Frottee, schw', 'x']] }),
        item('06 200 004 12', { translations: [['ENU', 'ABS Sock Frottee, beige', 'non-slip sole']] }),
      ),
    )
    const [article] = result.records
    assert.deepEqual(article.translations.en, { name: 'ABS Sock Frottee', description: 'non-slip sole' })
    // German never comes from the (30-character, cut off) translation
    assert.equal(article.translations.de, undefined)
    assert.equal(article.name, 'Diabetiker Socke klassisch')
  })

  it('falls back to the most common name when the colours share no part', () => {
    const result = parseNavXml(
      file(
        item('21 002 001 12', { translations: [['ENU', 'Cotton Tube', '']] }),
        item('21 002 001 13', { translations: [['ENU', 'Cotton Tube', '']] }),
        item('21 002 002 12', { translations: [['ENU', 'Trikotschlauch Baumwolle, Lieg', '']] }),
      ),
    )
    assert.equal(result.records[0].translations.en.name, 'Cotton Tube')
  })

  it('reports malformed SKUs as errors and keeps the rest', () => {
    const result = parseNavXml(file(item('40 000 001 12'), item('L1779')))
    assert.equal(result.records.length, 1)
    assert.deepEqual(result.errors.map((error) => error.message), ['invalidSku'])
  })

  it('handles a single item (NAV writes no list) and special characters', () => {
    const result = parseNavXml(file(item('40 000 001 12', { name: 'Socke &amp; Strumpf "extra"', translations: [['ENU', 'Sock &amp; Stocking', '']] })))
    assert.equal(result.records[0].name, 'Socke & Strumpf "extra"')
    assert.equal(result.records[0].translations.en.name, 'Sock & Stocking')
  })
})

describe('parseNavXml: robustness', () => {
  it('rejects broken XML and unknown files without throwing', () => {
    assert.equal(parseNavXml('<ShopItems><ShopItem>').type, null)
    assert.equal(parseNavXml('<Something/>').error, 'unknownFile')
    assert.equal(parseNavXml('').type, null)
  })

  it('does not expand entity bombs ("billion laughs")', () => {
    const bomb = `<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;"><!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;"><!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;"><!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;"><!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">]><ShopItems>${item('40 000 001 12', { name: '&lol6;' })}</ShopItems>`
    const started = Date.now()
    const result = parseNavXml(bomb)
    assert.ok(Date.now() - started < 2000, 'parsing must stay fast')
    const name = result.records?.[0]?.name ?? ''
    assert.ok(name.length < 10_000, `entity expanded to ${name.length} characters`)
  })

  it('does not read local files through external entities (XXE)', () => {
    const xxe = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY secret SYSTEM "file:///C:/Windows/win.ini">]><ShopItems>${item('40 000 001 12', { name: '&secret;' })}</ShopItems>`
    const name = parseNavXml(xxe).records?.[0]?.name ?? ''
    assert.ok(!/fonts|extensions/i.test(name))
  })
})

describe('parseNavXml: customers', () => {
  it('reads customers with billing and delivery addresses', () => {
    const xml = `<Customers><Customer><Number>ZZTEST1</Number><Email>a@b.de</Email><Pricegroup>VK02</Pricegroup>
      <BillingAddresses><BillingAddress><Default>1</Default><Firstname>Muster GmbH</Firstname><Lastname>.</Lastname><Street>Weg 1</Street><Postcode>01234</Postcode><City>Ort</City><Country>DE</Country></BillingAddress></BillingAddresses>
      </Customer></Customers>`
    const result = parseNavXml(xml)
    assert.equal(result.type, 'customers')
    assert.equal(result.records[0].priceGroup, 'VK02')
    assert.equal(result.records[0].billing.postcode, '01234', 'postcodes keep their leading zero')
    assert.equal(result.records[0].billing.lastName, '', 'NAV writes "." for an empty second name line')
  })
})
