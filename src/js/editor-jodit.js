const editor_id = "wysiwyg"

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


dropEventListeners()
// In your main JS (e.g., React/Vue/Svelte component or plain script)
function updateViewport() {
  if (window.visualViewport) {
    const vh = window.visualViewport.height;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    console.log('Visual viewport height:', vh); // Debug in DevTools

    document.documentElement.style.setProperty('--top', `${window.visualViewport.offsetTop}px`);

    // Optional: Auto-scroll focused element
    const selectedNode = editor.editorWindow.getSelection().anchorNode
    if (selectedNode.scrollIntoViewIfNeeded) {
      selectedNode.scrollIntoViewIfNeeded({ behaviour: "smooth", block: "end" })
    } else {
      selectedNode.parentNode.scrollIntoViewIfNeeded({ behaviour: "smooth", block: "end" })
    }
  }
}

// Listen to changes
window.visualViewport?.addEventListener('resize', updateViewport);
window.visualViewport?.addEventListener('scroll', updateViewport); // Sometimes needed for offset changes
window.addEventListener('resize', updateViewport); // Fallback

// Initial call + on focus
updateViewport();
document.addEventListener('focusin', updateViewport);


function dropEventListeners() {
  window.visualViewport?.removeEventListener('resize', updateViewport);
  window.visualViewport?.removeEventListener('scroll', updateViewport);
  window.removeEventListener('resize', updateViewport);
  document.removeEventListener('focusin', updateViewport);
}