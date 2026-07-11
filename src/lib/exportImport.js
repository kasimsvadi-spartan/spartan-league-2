// Full-season JSON backup/restore.

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spartan-league-2-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function parseImportFile(file) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Couldn't read that file — make sure it's a backup JSON exported from this app.")
  }
  if (!parsed || !Array.isArray(parsed.teams) || !Array.isArray(parsed.slots)) {
    throw new Error("Couldn't read that file — make sure it's a backup JSON exported from this app.")
  }
  return parsed
}
