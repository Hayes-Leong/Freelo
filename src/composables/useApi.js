const BASE = ''

export function useApi() {
  async function request(url, options = {}) {
    const res = await fetch(BASE + url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const data = await res.json()
    if (!res.ok && data.error) throw new Error(data.error)
    return data
  }

  return {
    get: (url) => request(url),
    post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
    del: (url) => request(url, { method: 'DELETE' }),
  }
}
