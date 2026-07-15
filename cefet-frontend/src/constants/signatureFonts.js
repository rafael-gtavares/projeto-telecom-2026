// Fontes de assinatura disponíveis. `value` bate com as chaves do backend
// (constants/signatureFonts.js) e `cssFamily` com os @font-face de index.css.
export const SIGNATURE_FONTS = [
  { value: 'great_vibes', label: 'Great Vibes', cssFamily: "'Great Vibes', cursive" },
  { value: 'allura', label: 'Allura', cssFamily: "'Allura', cursive" },
  { value: 'sacramento', label: 'Sacramento', cssFamily: "'Sacramento', cursive" },
  { value: 'alex_brush', label: 'Alex Brush', cssFamily: "'Alex Brush', cursive" },
]

// value -> cssFamily, para renderizar uma assinatura já salva.
export const signatureFontFamily = (value) =>
  SIGNATURE_FONTS.find((f) => f.value === value)?.cssFamily || 'inherit'
