const ANDROID_DIR_ROOT = '/storage/emulated/0/Documents/noticer'
const PARENT_DIR_NAME = '../'

const $Files = () => alp.store('Files')

alp.store('Files', {
  items: [],

  _filterText: '',
  get filterText() {
    return this._filterText
  },
  set filterText(newVal) {
    this._filterText = newVal
    this.readSelectedDir()
  },

  init() {
    log(this.selectedDirPath)
    if (!this.selectedDirPath && isAndroid()) {
      this.selectedDirPath = ANDROID_DIR_ROOT
      fs.mkdir(this.selectedDirPath)
    }
    if (this.selectedDirPath) {
      this.readSelectedDir()
    }
  },

  userSelectedPaths: alp.$persist({
    [ANDROID_DIR_ROOT]: true,
  }).as('userSelectedPaths'),

  selectedDirPath: alp.$persist('').as('selectedDirPath'),

  async pickDir() {
    // picked by user through the dialog.
    // these paths have read permissions.
    // you can traverse down to nested dirs but not up.

    const file = await dialog.open({
      multiple: false,
      directory: true,
    })
    log(file)
    if (file) {
      $Files().userSelectedPaths[file] = true
      $Files().changeDir(file)
    }
  },

  async readSelectedDir() {
    let files = []

    try {
      files = await fs.readDir(this.selectedDirPath)
      // files = files.filter(file => file.name.includes('.txt') || file.name.includes('.html'))
      // files = files.filter(file => file.isDirectory)
      const filterTextLowerCase = this.filterText?.toLowerCase?.()
      files = files.filter(file => file.name.toLowerCase().includes(filterTextLowerCase))
      log(files)
    } catch (error) {
      log.error('readSelectedDir failed: ', error)
      files = []
    } finally {
      $Files().items = [
        { name: PARENT_DIR_NAME },
        ...files
      ]
    }
  },

  async changeDir(newPath) {
    if (!newPath) {
      return false
    }
    $Files().selectedDirPath = newPath
    $Files().readSelectedDir()
  },

  async pickFile(file) {
    const {
      name,
      isDirectory,
      isFile,
      isSymlink,
    } = file
    log(name)
    if (name == PARENT_DIR_NAME) {
      return this.goBack()
    }
    const filePath = $Files().selectedDirPath + "/" + name

    if (isDirectory) {
      $Files().changeDir(filePath)
    } else {
      $File().changeFile(filePath)
    }
  },
  goBack() {
    const newPath = $Files().selectedDirPath.split('/').slice(0, -1).join('/')
    if (isPathAllowed($Files().userSelectedPaths, newPath)) {
      $Files().changeDir(newPath)
    }
  },

  async newFile() {
    const { value: newFileName } = await window.ionPrompt({ header: 'Create file' });

    if (newFileName) {
      const newFilePath = $Files().selectedDirPath + "/" + newFileName
      log(newFileName)
      const file = await fs.create(newFilePath)
      await file.write(new TextEncoder().encode(''))
      await file.close()
      $Files().readSelectedDir()
      $File().changeFile(newFilePath)
    }
  },

  async newDir() {
    const { value: newDirName } = await window.ionPrompt({ header: 'Create folder' });
    if (newDirName) {
      const newDirPath = $Files().selectedDirPath + "/" + newDirName
      log(newDirPath)
      if (newDirName) {
        await fs.mkdir(newDirPath)
        $Files().readSelectedDir()
      }
    }
  },

  async deleteFileOrDir(fileOrDir) {
    if ((await ionAlert({
      message: `Are you sure you want to delete ${fileOrDir.name}?`,
    }))?.roles?.confirm) {
      await fs.remove($Files().selectedDirPath + '/' + fileOrDir.name, {
        recursive: true,
      })
      $Files().readSelectedDir()
    }
  },
})

