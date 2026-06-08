// Calls the Netlify Kroger function. Hard 9s client timeout so a stuck request
// can never freeze the matching loop — on timeout we resolve to a soft error
// and the caller simply treats that item as "no match" and moves on.
export async function krogerApi(action, extra = {}, timeoutMs = 9000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/kroger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
      signal: controller.signal,
    })
    return await res.json()
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'timeout' : e.message, timed_out: true }
  } finally {
    clearTimeout(t)
  }
}
