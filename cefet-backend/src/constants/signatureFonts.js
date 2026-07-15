// Fontes de assinatura disponíveis no sistema (estilo manuscrito).
// A chave é o que fica salvo no perfil do usuário e trafega na API; o valor em
// SIGNATURE_FONT_FILES aponta para o arquivo .ttf usado pelo pdfkit ao gerar o
// certificado. O frontend usa as mesmas chaves nos @font-face (ver
// src/constants/signatureFonts.js do frontend).
const SIGNATURE_FONTS = {
  GREAT_VIBES: 'great_vibes',
  ALLURA: 'allura',
  SACRAMENTO: 'sacramento',
  ALEX_BRUSH: 'alex_brush',
};

// chave -> arquivo em src/assets/fonts
const SIGNATURE_FONT_FILES = {
  [SIGNATURE_FONTS.GREAT_VIBES]: 'GreatVibes-Regular.ttf',
  [SIGNATURE_FONTS.ALLURA]: 'Allura-Regular.ttf',
  [SIGNATURE_FONTS.SACRAMENTO]: 'Sacramento-Regular.ttf',
  [SIGNATURE_FONTS.ALEX_BRUSH]: 'AlexBrush-Regular.ttf',
};

module.exports = { SIGNATURE_FONTS, SIGNATURE_FONT_FILES };
