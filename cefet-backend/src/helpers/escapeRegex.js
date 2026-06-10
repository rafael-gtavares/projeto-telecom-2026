// Escapa caracteres especiais para uso seguro dentro de new RegExp().
// Evita que input do usuário (ex.: busca por nome) quebre a query ou
// dispare regex custosa (ReDoS).
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
