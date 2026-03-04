// window.prompt polyfill — not available in Tauri WebView
window.prompt = async function(message, defaultValue = '') {
  return new Promise((resolve, reject) => {
    alp.store('prompt').showPromptDialog(message, defaultValue, resolve, reject)
  })
}

alp.store('prompt', {
  showPrompt: false,
  promptMessage: '',
  promptValue: '',

  promptResolve(value) {
    this.showPrompt = false
    this.resolve?.(value)
    this.promptValue = ''
    this.resolve = null
    this.reject = null
  },

  showPromptDialog(message, defaultValue, resolve, reject) {
    this.showPrompt = true
    this.promptMessage = message
    this.promptValue = defaultValue
    this.resolve = resolve
    this.reject = reject
  },

  promptReject() {
    this.showPrompt = false
    this.reject?.()
    this.promptValue = ''
    this.resolve = null
    this.reject = null
  },
})


// Confirm dialog store
alp.store('confirm', {
  isOpen: false,
  message: '',
  _resolve: null,

  show(message) {
    this.isOpen = true
    this.message = message
    return new Promise(resolve => { this._resolve = resolve })
  },

  accept() {
    this.isOpen = false
    this._resolve?.({ roles: { confirm: true } })
    this._resolve = null
  },

  cancel() {
    this.isOpen = false
    this._resolve?.({ roles: { cancel: true } })
    this._resolve = null
  },
})


// ionAlert — API-compatible replacement for Ionic's ion-alert
window.ionAlert = function({ message, header } = {}) {
  return alp.store('confirm').show(message || header || '')
}

// ionPrompt — API-compatible replacement for Ionic's ionPrompt
window.ionPrompt = function({ header, message } = {}) {
  return new Promise((resolve) => {
    alp.store('prompt').showPromptDialog(
      header || message || '',
      '',
      (value) => resolve({ value }),
      () => resolve({ value: null })
    )
  })
}
