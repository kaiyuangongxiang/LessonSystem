const STORAGE_KEY = 'lesson-prep-admin-sidebar-scroll-top'

let memoryScrollTop = 0

export function getAdminSidebarScrollTop() {
  if (typeof window === 'undefined') {
    return memoryScrollTop
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY)
  const parsedValue = rawValue ? Number(rawValue) : memoryScrollTop
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function setAdminSidebarScrollTop(value: number) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, value) : 0
  memoryScrollTop = normalizedValue

  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, String(normalizedValue))
}
