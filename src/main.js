// tauri
const { invoke } = window.__TAURI__.core;
const { dialog, fs, opener } = window.__TAURI__;

// alpine
const alp = Alpine

// logger
window.log = console.log
log.error = console.error
log.warn = console.warn
log.info = console.info
log.table = console.table

// sane aliases
window.$ = document.querySelector.bind(document)
window.$$ = document.querySelectorAll.bind(document)


// utils
function isPathAllowed(allowedPaths, testPath) {
  // Normalize test path (remove trailing slash)
  const normalizedTest = testPath.replace(/\/$/, '');

  // Check exact match first
  if (allowedPaths[normalizedTest]) {
    return true;
  }

  // Check if testPath is a subpath of any allowed path
  for (const [allowedPath, value] of Object.entries(allowedPaths)) {
    if (value !== true) continue; // Skip non-allowed entries

    const normalizedAllowed = allowedPath.replace(/\/$/, '');

    // Test if allowedPath is a prefix of testPath
    // e.g. allowed: 'a/b' matches test: 'a/b/c' or 'a/b'
    if (normalizedTest === normalizedAllowed ||
      normalizedTest.startsWith(normalizedAllowed + '/')) {
      return true;
    }
  }

  return false;
}


function isAndroid() {
  return navigator.userAgent?.toLowerCase?.()?.includes?.('android')
}