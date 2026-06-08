export async function krogerApi(action, extra = {}) {
  const res = await fetch('/api/kroger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  })
  return res.json()
}
