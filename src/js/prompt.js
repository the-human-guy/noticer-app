// window.prompt Polyfill because it's not availble in Tauri WebView
window.prompt = async function(message, defaultValue = '') {
  return new Promise((resolve, reject) => {
    alp.store('prompt').showPromptDialog(message, defaultValue, resolve, reject)
  })
}

alp.store('prompt', {
  selectedDir: '',
  files: [],
  currentFile: null,
  content: '',
  showPrompt: false,
  promptMessage: '',
  promptValue: '',
  promptResolve: null,
  promptReject: null,
  
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
    this.promptResolve = null
    this.reject = null
  },
})