const { SIGNATURE_FONTS, DEFAULT_SIGNATURE_FONT } = require('../constants/signatureFonts');

const VALID_FONTS = Object.values(SIGNATURE_FONTS);
const SIGNATURE_MAX_LENGTH = 60; // mesmo limite do schema do User

// Assinatura "efetiva" de um usuário — NUNCA depende de configuração prévia:
//  - texto: o que ele salvou no perfil; senão, o próprio nome
//  - fonte: a do curso (fontOverride) → a salva no perfil → a fonte padrão
const resolveSignature = (user, fontOverride = null) => {
  const name = user?.name || null;
  const text = String(user?.signature?.text || '').trim() || String(name || '').trim();
  const font = [fontOverride, user?.signature?.font].find((f) => VALID_FONTS.includes(f))
    || DEFAULT_SIGNATURE_FONT;

  return {
    name,
    text: text ? text.slice(0, SIGNATURE_MAX_LENGTH) : null,
    font,
  };
};

module.exports = { resolveSignature, VALID_FONTS };