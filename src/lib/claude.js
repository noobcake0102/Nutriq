// model: 'haiku' (default, fast/cheap) or 'sonnet' (higher quality generation)
export async function streamClaude(sys, usr, cb, model) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: sys, messages: [{ role: 'user', content: usr }], model }),
  })
  if (!res.ok) { const err = await res.text(); throw new Error('API error: ' + err) }
  const data = await res.json()
  if (data.content?.length > 0) {
    for (const block of data.content) { if (block.type === 'text' && block.text) cb(block.text) }
  } else if (data.error) {
    throw new Error(data.error.message || 'Claude API error')
  }
}
