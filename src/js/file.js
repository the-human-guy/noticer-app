const $File = () => alp.store('File')
alp.store('File', {

  openedFilePath: alp.$persist('').as('openedFilePath'),

  init() {
    log(this.openedFilePath)
    if (this.openedFilePath) {
      this.readSelectedFile()
    }
  },

  _fileContent: '',
  get fileContent() {
    return this._fileContent
  },
  set fileContent(newVal) {
    this._fileContent = newVal || ' '
  },

  saveSuccess: false,
  saveSuccessIndicatorTimeout: null,
  indicateSuccessfulSave() {
    this.saveSuccess = true
    window.clearTimeout(this.saveSuccessIndicatorTimeout)
    this.saveSuccessIndicatorTimeout = setTimeout(() => this.saveSuccess = false, 3000)
  },

  async readSelectedFile() {
    const fileContent = await fs.readTextFile($File().openedFilePath);
    // log(fileContent)
    $File().fileContent = fileContent
    setTimeout(() => {
      $Editor().initEditor()
    }, 0)
  },

  async changeFile(newPath) {
    $File().openedFilePath = newPath
    $File().readSelectedFile()
  },

  async save() {
    await fs.writeTextFile($File().openedFilePath, $Editor().save())
    $File().indicateSuccessfulSave()
  },

})

