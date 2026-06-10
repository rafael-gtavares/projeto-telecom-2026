// Sanitização contra injeção de operadores NoSQL.
// Remove recursivamente chaves que começam com "$" (operadores do MongoDB,
// ex.: { email: { $gt: "" } }) ou que contêm "." (notação de caminho).
// Sem dependências externas — seguro para Express 4.
const FORBIDDEN_KEY = /^\$|\./;

const scrub = (value) => {
  if (Array.isArray(value)) {
    value.forEach(scrub);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEY.test(key)) {
        delete value[key];
      } else {
        scrub(value[key]);
      }
    }
  }
  return value;
};

const sanitizeMongo = (req, res, next) => {
  if (req.body) scrub(req.body);
  if (req.query) scrub(req.query);
  if (req.params) scrub(req.params);
  next();
};

module.exports = sanitizeMongo;
