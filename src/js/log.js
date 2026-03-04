// Log store — non-persistent, in-memory only
alp.store('logs', {
  entries: [],

  push(level, args) {
    if (!alp.store('settings')?.showLogs) return
    this.entries.push({
      id: Date.now() + Math.random(),
      level,
      time: new Date().toLocaleTimeString(),
      text: args.map(a => {
        if (a === null) return 'null'
        if (a === undefined) return 'undefined'
        if (typeof a === 'object') {
          try { return JSON.stringify(a, null, 2) } catch { return String(a) }
        }
        return String(a)
      }).join(' '),
    })
  },

  clear() {
    this.entries = []
  },
})

// Intercept all console methods and forward to the store
;(function patchConsole() {
  const methods = ['log', 'error', 'warn', 'info', 'table']

  methods.forEach(level => {
    const original = console[level].bind(console)
    console[level] = (...args) => {
      original(...args)
      alp.store('logs').push(level, args)
    }
  })
})()

// window.log — same API as before, but now routes through patched console
window.log = (...args) => console.log(...args)
log.error = (...args) => console.error(...args)
log.warn  = (...args) => console.warn(...args)
log.info  = (...args) => console.info(...args)
log.table = (...args) => console.table(...args)
