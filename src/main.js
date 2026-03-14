// tauri
const { invoke } = window.__TAURI__.core;
const { fs, opener } = window.__TAURI__;

// alpine
const alp = Alpine

// sane aliases
window.$ = document.querySelector.bind(document)
window.$$ = document.querySelectorAll.bind(document)

// ── Sidebar resize ─────────────────────────────────────────────────────────────
function initSidebarWidth() {
  const saved = localStorage.getItem('sidebarWidth')
  if (saved) document.documentElement.style.setProperty('--sidebar-width', saved)
}

function sidebarResizeStart(e) {
  const startX = e.clientX
  const startW = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')
  )
  document.body.classList.add('is-resizing')

  function onMove(e) {
    const w = Math.max(160, Math.min(600, startW + e.clientX - startX))
    document.documentElement.style.setProperty('--sidebar-width', w + 'px')
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.classList.remove('is-resizing')
    const w = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim()
    localStorage.setItem('sidebarWidth', w)
    window.dispatchEvent(new Event('resize'))
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
