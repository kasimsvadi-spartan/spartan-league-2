import { supabase } from './supabaseClient'
import { uid } from './uid'

// Resize a picked image file client-side to a small JPEG (same 220px/0.78-quality target as
// the original artifact's fileToPhotoDataUrl), returning a Blob instead of a data URL — the
// blob is what gets uploaded to Supabase Storage so photos never bloat the season JSON.
export function resizeImageToBlob(file, maxDim = 220, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        let w = img.width, h = img.height
        if (w > h && w > maxDim) { h = Math.round(h * (maxDim / w)); w = maxDim }
        else if (h >= w && h > maxDim) { w = Math.round(w * (maxDim / h)); h = maxDim }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// Resizes then uploads to the public `photos` bucket, returning the public URL to store on
// the player/team record. Requires an authenticated (admin) Supabase session — see useAdmin.
export async function uploadPhoto(file, folder = 'players') {
  const blob = await resizeImageToBlob(file)
  const path = `${folder}/${uid('photo')}.jpg`
  const { error } = await supabase.storage.from('photos').upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  })
  if (error) throw error
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}
