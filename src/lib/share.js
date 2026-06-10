import { Capacitor } from '@capacitor/core'

const slug = s => (s || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)

// Share a recipe PDF: native share sheet where available, download as fallback.
// Returns 'shared' | 'downloaded'.
export async function shareRecipePdf(blob, recipeName) {
  const filename = `${slug(recipeName)}-nutriq.pdf`
  const file = new File([blob], filename, { type: 'application/pdf' })

  // Native (iOS/Android via Capacitor): write to filesystem then Share plugin
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Share } = await import('@capacitor/share')
      const base64 = await blobToBase64(blob)
      const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache })
      await Share.share({ title: recipeName, text: `${recipeName} — a recipe from Nutriq`, url: written.uri })
      return 'shared'
    } catch (e) { /* fall through to web */ }
  }

  // Web Share API with file (iOS Safari 15+, Android Chrome)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: recipeName, text: `${recipeName} — a recipe from Nutriq`, files: [file] })
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return 'shared' // user cancelled — not an error
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click()
  a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(String(fr.result).split(',')[1])
    fr.onerror = rej
    fr.readAsDataURL(blob)
  })
}
