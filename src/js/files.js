const ANDROID_DIR_ROOT = '/storage/emulated/0/Documents/noticer'
const PARENT_DIR_NAME = '../'

const $Files = () => alp.store('Files')

const _isDir = (f) => f.isDirectory || f.type === 'Dir'

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

  _androidDirUriObj: alp.$persist('').as('_androidDirUriObj'),
  getAndroidDirUriObj() {
    return typeof this._androidDirUriObj === 'string'
      ? JSON.parse(this._androidDirUriObj)
      : this._androidDirUriObj
  },
  setAndroidDirUriObj(newAndroidDirUriObj) {
    this._androidDirUriObj = typeof newAndroidDirUriObj === 'string'
      ? newAndroidDirUriObj
      : JSON.stringify(newAndroidDirUriObj)
  },

  async pickDir() {
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
        $Files().setAndroidDirUriObj(JSON.stringify(URIObj))
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
        files = await AndroidFS.readDir($Files().getAndroidDirUriObj())
        log('readSelectedDir android files: ', files)
      } else {
        files = await fs.readDir(this.selectedDirPath)
      }
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
    const { name, uri } = file
    log(name)
    if (name == PARENT_DIR_NAME) {
      return this.goBack()
    }
    const filePath = isAndroid() ? uri?.uri : $Files().selectedDirPath + "/" + name

    if (_isDir(file)) {
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
      const { selectedDirPath, } = $Files()
      const newFilePath = selectedDirPath + "/" + newFileName
      log(newFileName)
      if (isAndroid()) {
        const fileURI = await AndroidFS.createNewFile($Files().getAndroidDirUriObj(), newFileName)
        $Files().readSelectedDir()
        $File().changeFile(fileURI.uri)
      } else {
        const file = await fs.create(newFilePath)
        await file.write(new TextEncoder().encode(''))
        await file.close()
        $Files().readSelectedDir()
        $File().changeFile(newFilePath)
      }
    }
  },

  async newDir() {
    const { value: newDirName } = await window.ionPrompt({ header: 'Create folder' });
    if (newDirName) {
      log(newDirName)
      if (isAndroid()) {
        await AndroidFS.createDirAll($Files().getAndroidDirUriObj(), newDirName)
      } else {
        const newDirPath = $Files().selectedDirPath + "/" + newDirName
        await fs.mkdir(newDirPath)
      }
      $Files().readSelectedDir()
    }
  },

  async deleteFileOrDir(file) {
    if ((await ionAlert({
      message: `Are you sure you want to delete "${file.name}"?`,
    }))?.roles?.confirm) {
      try {
        if (isAndroid()) {
          const uri = file.uri?.uri || file.uri
          if (_isDir(file)) {
            await AndroidFS.removeDirAll(uri)
          } else {
            await AndroidFS.removeFile(uri)
          }
        } else {
          await fs.remove($Files().selectedDirPath + '/' + file.name, {
            recursive: true,
          })
        }
      } catch (e) {
        log.error('Delete failed:', e)
      }
      $Files().readSelectedDir()
    }
  },

  async renameFileOrDir(file) {
    const { value: newName } = await window.ionPrompt({
      header: `Rename ${_isDir(file) ? 'folder' : 'file'}`,
      value: file.name,
    })
    if (!newName || newName === file.name) return

    try {
      if (isAndroid()) {
        const oldUri = file.uri?.uri || file.uri
        const oldFsPath = await AndroidFS.getFsPath(oldUri)
        const parentDir = oldFsPath.substring(0, oldFsPath.lastIndexOf('/'))
        const newFsPath = parentDir + '/' + newName
        await fs.rename(oldFsPath, newFsPath)
        if (!_isDir(file) && $File().openedFilePath === oldUri) {
          $File().openedFilePath = newFsPath
        }
      } else {
        const oldPath = $Files().selectedDirPath + '/' + file.name
        const newPath = $Files().selectedDirPath + '/' + newName
        await fs.rename(oldPath, newPath)
        if ($File().openedFilePath === oldPath) {
          $File().openedFilePath = newPath
        }
      }
    } catch (e) {
      log.error('Rename failed:', e)
    }
    $Files().readSelectedDir()
  },

  async duplicateFile(file) {
    if (_isDir(file)) return

    const dotIdx = file.name.lastIndexOf('.')
    const baseName = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name
    const ext = dotIdx > 0 ? file.name.substring(dotIdx) : ''
    const copyName = `${baseName} (copy)${ext}`

    try {
      if (isAndroid()) {
        const newFileUri = await AndroidFS.createNewFile($Files().getAndroidDirUriObj(), copyName, null)
        await AndroidFS.copyFile(file.uri?.uri || file.uri, newFileUri.uri)
      } else {
        const srcPath = $Files().selectedDirPath + '/' + file.name
        const destPath = $Files().selectedDirPath + '/' + copyName
        await fs.copyFile(srcPath, destPath)
      }
    } catch (e) {
      log.error('Duplicate failed:', e)
    }
    $Files().readSelectedDir()
  },

  async openInFileManager(file) {
    try {
      if (isAndroid()) {
        const uri = file.uri?.uri || file.uri
        if (_isDir(file)) {
          await AndroidFS.showViewDirDialog(uri)
        } else {
          await AndroidFS.showViewFileDialog(uri)
        }
      } else {
        const path = $Files().selectedDirPath + '/' + file.name
        if (_isDir(file)) {
          await opener.openPath(path)
        } else {
          await opener.revealItemInDir(path)
        }
      }
    } catch (e) {
      log.error('Open in file manager failed:', e)
    }
  },

  async openCurrentDirExternally() {
    try {
      if (isAndroid()) {
        await AndroidFS.showViewDirDialog($Files().getAndroidDirUriObj()?.uri)
      } else {
        await opener.openPath($Files().selectedDirPath)
      }
    } catch (e) {
      log.error('Open dir externally failed:', e)
    }
  },
})
