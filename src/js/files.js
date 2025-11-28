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

  androidDirUriObj: alp.$persist('').as('androidDirUriObj'),

  async pickDir() {
    // picked by user through the dialog.
    // these paths have read permissions.
    // you can traverse down to nested dirs but not up.

    if (isAndroid()) {
      const URIObj = await AndroidFS.showOpenDirPicker()
      if (!URIObj) {
        return null
      }
      const { uri } = URIObj
      log('pickDir android uri: ', uri)
      await AndroidFS.persistUriPermission(URIObj)
      if (uri) {
        $Files().userSelectedPaths[uri] = true
        $Files().androidDirUriObj = JSON.stringify(URIObj)
        $Files().changeDir(uri)
      }
    } else {
      const uri = await dialog.open({
        multiple: false,
        directory: true,
      })
      log(uri)
      if (uri) {
        $Files().userSelectedPaths[uri] = true
        $Files().changeDir(uri)
      }
    }
  },

  async readSelectedDir() {
    let files = []

    try {
      if (isAndroid()) {
        files = await AndroidFS.readDir(JSON.parse($Files().androidDirUriObj))
        log('readSelectedDir android files: ', files)
      } else {
        files = await fs.readDir(this.selectedDirPath)
      }
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
      // AndroidFS
      uri, // { uri: "content://..." , documentTopTreeUri: "content://.." }
    } = file
    log(name)
    if (name == PARENT_DIR_NAME) {
      return this.goBack()
    }
    const filePath = isAndroid() ? uri?.uri : $Files().selectedDirPath + "/" + name

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

