const errorHandler = (err, req, res, next) => {
  // Erro de validação do Mongoose → 400 com as mensagens dos campos
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(' ') });
  }

  // ID malformado (ex.: ObjectId inválido) → 400
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Identificador inválido: ${err.value}` });
  }

  // Violação de índice único (ex.: e-mail/inscrição duplicada) → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({ success: false, message: `Valor duplicado para "${field}"` });
  }

  // Demais erros: loga o stack e devolve o status apropriado
  console.error(err.stack);
  const status = err.status || 500;

  // Em 500 sob produção, não expõe a mensagem interna (pode vazar detalhes
  // de implementação/stack). Erros 4xx intencionais mantêm sua mensagem.
  const isServerError = status >= 500;
  const message = isServerError && process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : (err.message || 'Erro interno do servidor');

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
