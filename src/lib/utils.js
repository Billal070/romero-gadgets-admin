export const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-US')

export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const fmtTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const timeAgo = (d) => {
  if (!d) return '—'
  const seconds = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

export const debounce = (fn, delay) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export const getRangeDates = (range) => {
  const now = new Date()
  const start = new Date()
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    case '7d':
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    case '30d':
      start.setDate(now.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    default:
      return { start, end: now }
  }
}

export const downloadCSV = (data, filename) => {
  if (!data?.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}
