const $File = () => alp.store('File')
alp.store('File', {
  init() {
    log(this.openedFilePath)
    if (this.openedFilePath) {
      this.readSelectedFile()
    }
  },
  openedFilePath: alp.$persist('').as('openedFilePath'),
  _fileContent: '',
  get fileContent() {
    return this._fileContent
  },
  set fileContent(newVal) {
    this._fileContent = newVal || ' '
  },
  async readSelectedFile() {
    const fileContent = await fs.readTextFile($File().openedFilePath);
    log(fileContent)
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
  }
})

