const editor_id = "wysiwyg"

alp.store('settings', {
  updateVh: alp.$persist(true).as('settings.updateVh'),
  updateViewportOffset: alp.$persist(true).as('settings.updateViewportOffset'),
  scrollIntoView: alp.$persist(true).as('settings.scrollIntoView'),
  triggerVvResize: alp.$persist(true).as('settings.triggerVvResize'),
  triggerVvScroll: alp.$persist(true).as('settings.triggerVvScroll'),
  triggerWinResize: alp.$persist(true).as('settings.triggerWinResize'),
  triggerDocFocusin: alp.$persist(true).as('settings.triggerDocFocusin'),
  showLogs: alp.$persist(false).as('settings.showLogs'),
})

const $Editor = () => alp.store('Editor')
alp.store('Editor', {
  getEditor() {
    return this.editor
  },
  initEditor() {
    log('init editor')

    Jodit.defaultOptions.controls.spoiler = {
      iconURL: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20focusable%3D%22false%22%20fill%3D%22black%22%3E%0A%20%20%3Crect%20x%3D%2212%22%20y%3D%227%22%20width%3D%2210%22%20height%3D%222%22%20rx%3D%221%22%3E%3C%2Frect%3E%0A%20%20%3Crect%20x%3D%2212%22%20y%3D%2211%22%20width%3D%2210%22%20height%3D%222%22%20rx%3D%221%22%3E%3C%2Frect%3E%0A%20%20%3Crect%20x%3D%2212%22%20y%3D%2215%22%20width%3D%226%22%20height%3D%222%22%20rx%3D%221%22%3E%3C%2Frect%3E%0A%20%20%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M2.3%207.3a1%201%200%200%201%201.4%200L6%209.6l2.3-2.3a1%201%200%200%201%201.4%201.4L6%2012.4%202.3%208.7a1%201%200%200%201%200-1.4Z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E%0A',
      exec: editor => {
        editor.s.insertHTML(`
          <details class="ntcr-jodit-spoiler__details">
            <summary contenteditable="false" class="ntcr-jodit-spoiler__summary">Click me!</summary>
            <div class="ntcr-jodit-spoiler__content">
              Spoiler
            </div>
          </details>
        `)
      }
    };

    this.editor?.destruct()
    this.editor = Jodit.make('#jodit-editor', {
      mobileTapTimeout: 500,
      "uploader": {
        "insertImageAsBase64URI": true
      },
      "toolbarButtonSize": "small",
      "enter": "DIV",
      // "enter": "BR",
      // "showCharsCounter": false,
      // "showWordsCounter": false,
      "showXPathInStatusbar": false,
      // "minHeight": 400,
      // "inline": true,
      "toolbarAdaptive": false,
      "toolbarInlineForSelection": true,
      "showPlaceholder": false,
      extraButtons: ['spoiler'],
      disablePlugins: ['autofocus'],
      autofocus: false,
      // "buttons": "bold,|,italic,underline,strikethrough,eraser,ul,ol,font,fontsize,paragraph,lineHeight,superscript,subscript,classSpan,file,image,video,spellcheck,spoiler"
    })
    window.editor = this.editor
  },
  getValue() {
    return this.getEditor().getEditorValue()
  }
})


function updateViewport() {
  if (!window.visualViewport) return
  const root = document.documentElement.style
  const s = alp.store('settings')

  if (s.updateVh) {
    root.setProperty('--vh', `${window.visualViewport.height}px`)
  }

  if (s.updateViewportOffset) {
    root.setProperty('--viewport-offset', `${window.visualViewport.offsetTop}px`)
  }

  if (s.scrollIntoView) {
    try {
      const selectedNode = editor?.editorWindow?.getSelection()?.anchorNode
      if (!selectedNode) return
      const el = selectedNode.nodeType === 1 ? selectedNode : selectedNode.parentNode
      el?.scrollIntoViewIfNeeded?.({ behaviour: 'smooth', block: 'end' })
    } catch (_) {}
  }
}

function dropEventListeners() {
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('scroll', updateViewport)
  window.removeEventListener('resize', updateViewport)
  document.removeEventListener('focusin', updateViewport)
}

function registerListeners() {
  dropEventListeners()
  const s = alp.store('settings')
  if (s.triggerVvResize)   window.visualViewport?.addEventListener('resize', updateViewport)
  if (s.triggerVvScroll)   window.visualViewport?.addEventListener('scroll', updateViewport)
  if (s.triggerWinResize)  window.addEventListener('resize', updateViewport)
  if (s.triggerDocFocusin) document.addEventListener('focusin', updateViewport)
  updateViewport()
}

window.reregisterViewportListeners = registerListeners

registerListeners()