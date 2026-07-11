const KEY = 'cefet_visitor_id'

export const getVisitorId = () => {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null
  }
}
