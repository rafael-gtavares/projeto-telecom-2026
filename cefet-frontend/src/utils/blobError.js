// Requisições com responseType:'blob' recebem o corpo de erro (JSON) como Blob,
// então err.response.data.message fica indefinido. Este helper extrai a mensagem
// legível do erro, seja ele um Blob de JSON, um erro comum ou de rede.
export const readBlobError = async (err, fallback = 'Erro inesperado') => {
  const data = err?.response?.data
  try {
    if (data instanceof Blob) {
      const text = await data.text()
      try { return JSON.parse(text).message || fallback } catch { return text || fallback }
    }
    if (data?.message) return data.message
  } catch {
    /* cai no fallback abaixo */
  }
  return err?.message || fallback
}
