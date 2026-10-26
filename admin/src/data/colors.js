// Swatch colours for NAV's colour codes. The names come from the product data itself ("Farbe: marine"),
// so only the dot colour is kept here; codes not listed show a neutral grey dot.
const HEX = {
  '001': '#111111', // schwarz
  '002': '#1f2a4d', // marine
  '003': '#8a8d91', // grau
  '004': '#d8c3a5', // beige
  '005': '#3d4045', // anthrazit
  '007': '#4a4d52', // graphit
  '008': '#6b4a32', // braun
  '011': '#ffffff', // weiß
  '013': '#c0c3c7', // silber
  '015': '#8b7d6b', // morchel
  '021': '#e8dcc5', // natur
  '025': '#ece6da', // perle
  '027': '#e6d6b0', // chinin
  '038': '#e9c84a', // gelb
  '039': '#3fb0b0', // türkis
  '040': '#b8322f', // rot
  '041': '#2a4bb3', // königsblau
  '042': '#4a8f5a', // grün
  '043': '#8a5aa8', // lila
  '044': '#e8a6b8', // rosa
  '052': '#cdb99c', // beige meliert
  '053': '#5a76a0', // jeansblau meliert
  '058': '#55585c', // dunkelgrau meliert
  '059': '#b5b8bb', // hellgrau meliert
  102: '#4b4f8f', // blueberry
  103: '#a8a294', // stone
  139: '#a8dcc8', // mint
  140: '#a3203a', // cherry
  142: '#8db33c', // kiwi
  143: '#b9a2d6', // lilac
  144: '#e0457b', // pitaya
  145: '#6d1f2c', // bordeaux
}

export const colorHex = (code) => HEX[code] || '#cccccc'
