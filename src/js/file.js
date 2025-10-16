const $File = () => alp.store('File')
alp.store('File', {
  items: [],
  init() {
    log(this.openedFilePath)
    if (this.openedFilePath) {
      this.readSelectedFile()
    }
  },
  openedFilePath: alp.$persist('').as('openedFilePath'),
  fileContent: '',
  async readSelectedFile() {
    const fileContent = await fs.readTextFile($File().openedFilePath);
    log(fileContent)
    $File().fileContent = fileContent
    setTimeout(() => {
      $Editor().initEditor()
    }, 1000)
  },
  async changeFile(newPath) {
    $File().openedFilePath = newPath
    $File().readSelectedFile()
  },
})

