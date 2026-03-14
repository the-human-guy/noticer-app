// Nav stack entry shape:
//   { path: string, androidUri: string|null, relPath: string }
//   path       — display string (fs path on desktop, content URI on Android)
//   androidUri — URI passed to AndroidFS.readDir() for this level
//   relPath    — path relative to root dir, used when creating files/dirs on Android
//                so we always stay within the persistent root permission
//                (e.g. '' at root, 'notes', 'notes/2024')

const ANDROID_DIR_ROOT = '/storage/emulated/0/Documents/noticer'

const $Files = () => alp.store('Files')

const _isDir = (f) => f.isDirectory || f.type === 'Dir'

alp.store('Files', {
  items: [],

  _filterText: '',
  get filterText() { return this._filterText },
  set filterText(v) { this._filterText = v; this.readSelectedDir() },

  rootDirPath: alp.$persist('').as('rootDirPath'),

  // Android: full URI object { uri, documentTopTreeUri } stored as JSON string
  _rootUriObjStr: alp.$persist('').as('rootAndroidUriObj'),
  _getRootUriObj() {
    const v = this._rootUriObjStr
    if (!v) return null
    try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return null }
  },
  _setRootUriObj(obj) {
    this._rootUriObjStr = JSON.stringify(obj)
  },

  _navStack: alp.$persist([]).as('navStack'),

  get currentDir() {
    const s = this._navStack
    return s.length ? s[s.length - 1] : null
  },
  get canGoBack() { return this._navStack.length > 1 },
  get currentPath() { return this.currentDir?.path || '' },

  init() {
    if (!this.rootDirPath && isAndroid()) {
      this.rootDirPath = ANDROID_DIR_ROOT
      fs.mkdir(this.rootDirPath)
    }
    if (this.rootDirPath && !this._navStack.length) {
      this._navStack = [{ path: this.rootDirPath, androidUri: this.rootDirPath, relPath: '' }]
    }
    if (this.currentDir) this.readSelectedDir()
  },

  async pickDir() {
    if (isAndroid()) {
      const uriObj = await AndroidFS.showOpenDirPicker()
      if (!uriObj) return
      await AndroidFS.persistUriPermission(uriObj)
      $Files()._setRootUriObj(uriObj)
      $Files().rootDirPath = uriObj.uri
      $Files()._navStack = [{ path: uriObj.uri, androidUri: uriObj.uri, relPath: '' }]
    } else {
      // Rust opens the native picker and grants fs scope internally.
      // The frontend only receives the path string for display — it cannot
      // influence which path is granted.
      const path = await invoke('pick_and_grant_dir')
      if (!path) return
      $Files().rootDirPath = path
      $Files()._navStack = [{ path, androidUri: null, relPath: '' }]
    }
    $Files().readSelectedDir()
  },

  async readSelectedDir() {
    const dir = $Files().currentDir
    if (!dir) return
    let files = []
    try {
      if (isAndroid()) {
        files = await AndroidFS.readDir(dir.androidUri)
        log('readSelectedDir android files:', files)
      } else {
        files = await fs.readDir(dir.path)
      }
      const q = (this.filterText || '').toLowerCase()
      if (q) files = files.filter(f => f.name.toLowerCase().includes(q))
      log(files)
    } catch (e) {
      log.error('readSelectedDir failed:', e)
      files = []
    }
    $Files().items = files
  },

  async _pushDir(dirEntry) {
    const cur = $Files().currentDir
    let entry
    if (isAndroid()) {
      const androidUri = dirEntry.uri?.uri || dirEntry.uri
      const relPath = cur.relPath ? cur.relPath + '/' + dirEntry.name : dirEntry.name
      entry = { path: androidUri, androidUri, relPath }
    } else {
      entry = { path: cur.path + '/' + dirEntry.name, androidUri: null, relPath: '' }
    }
    $Files()._navStack = [...$Files()._navStack, entry]
    $Files().readSelectedDir()
  },

  goBack() {
    if (!$Files().canGoBack) return
    $Files()._navStack = $Files()._navStack.slice(0, -1)
    $Files().readSelectedDir()
  },

  async pickFile(file) {
    if (_isDir(file)) {
      $Files()._pushDir(file)
    } else {
      const filePath = isAndroid()
        ? (file.uri?.uri || file.uri)
        : $Files().currentDir.path + '/' + file.name
      $File().changeFile(filePath)
    }
  },

  async newFile() {
    const { value: newFileName } = await window.ionPrompt({ header: 'Create file' })
    if (!newFileName) return
    const cur = $Files().currentDir
    try {
      if (isAndroid()) {
        const relPath = cur.relPath ? cur.relPath + '/' + newFileName : newFileName
        const fileURI = await AndroidFS.createNewFile($Files()._getRootUriObj(), relPath)
        $Files().readSelectedDir()
        $File().changeFile(fileURI.uri)
      } else {
        const newFilePath = cur.path + '/' + newFileName
        const file = await fs.create(newFilePath)
        await file.write(new TextEncoder().encode(''))
        await file.close()
        $Files().readSelectedDir()
        $File().changeFile(newFilePath)
      }
    } catch (e) {
      log.error('newFile failed:', e)
    }
  },

  async newDir() {
    const { value: newDirName } = await window.ionPrompt({ header: 'Create folder' })
    if (!newDirName) return
    const cur = $Files().currentDir
    try {
      if (isAndroid()) {
        const relPath = cur.relPath ? cur.relPath + '/' + newDirName : newDirName
        await AndroidFS.createDirAll($Files()._getRootUriObj(), relPath)
      } else {
        await fs.mkdir(cur.path + '/' + newDirName)
      }
    } catch (e) {
      log.error('newDir failed:', e)
    }
    $Files().readSelectedDir()
  },

  async deleteFileOrDir(file) {
    if (!(await ionAlert({ message: `Delete "${file.name}"?` }))?.roles?.confirm) return
    const cur = $Files().currentDir
    try {
      if (isAndroid()) {
        const uri = file.uri?.uri || file.uri
        _isDir(file) ? await AndroidFS.removeDirAll(uri) : await AndroidFS.removeFile(uri)
      } else {
        await fs.remove(cur.path + '/' + file.name, { recursive: true })
      }
    } catch (e) {
      log.error('Delete failed:', e)
    }
    $Files().readSelectedDir()
  },

  async renameFileOrDir(file) {
    const { value: newName } = await window.ionPrompt({
      header: `Rename ${_isDir(file) ? 'folder' : 'file'}`,
      value: file.name,
    })
    if (!newName || newName === file.name) return
    const cur = $Files().currentDir
    try {
      if (isAndroid()) {
        const oldUri = file.uri?.uri || file.uri
        const oldFsPath = await AndroidFS.getFsPath(oldUri)
        const newFsPath = oldFsPath.substring(0, oldFsPath.lastIndexOf('/')) + '/' + newName
        await fs.rename(oldFsPath, newFsPath)
        if (!_isDir(file) && $File().openedFilePath === oldUri) {
          $File().openedFilePath = newFsPath
        }
      } else {
        const oldPath = cur.path + '/' + file.name
        const newPath = cur.path + '/' + newName
        await fs.rename(oldPath, newPath)
        if ($File().openedFilePath === oldPath) $File().openedFilePath = newPath
      }
    } catch (e) {
      log.error('Rename failed:', e)
    }
    $Files().readSelectedDir()
  },

  async duplicateFile(file) {
    if (_isDir(file)) return
    const dotIdx = file.name.lastIndexOf('.')
    const base = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name
    const ext  = dotIdx > 0 ? file.name.substring(dotIdx) : ''
    const copyName = `${base} (copy)${ext}`
    const cur = $Files().currentDir
    try {
      if (isAndroid()) {
        const relPath = cur.relPath ? cur.relPath + '/' + copyName : copyName
        const newUri = await AndroidFS.createNewFile($Files()._getRootUriObj(), relPath)
        await AndroidFS.copyFile(file.uri?.uri || file.uri, newUri.uri)
      } else {
        await fs.copyFile(cur.path + '/' + file.name, cur.path + '/' + copyName)
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
        _isDir(file) ? await AndroidFS.showViewDirDialog(uri) : await AndroidFS.showViewFileDialog(uri)
      } else {
        const path = $Files().currentDir.path + '/' + file.name
        _isDir(file) ? await opener.openPath(path) : await opener.revealItemInDir(path)
      }
    } catch (e) {
      log.error('Open in file manager failed:', e)
    }
  },

  async openCurrentDirExternally() {
    try {
      if (isAndroid()) {
        await AndroidFS.showViewDirDialog($Files().currentDir?.androidUri)
      } else {
        await opener.openPath($Files().currentDir?.path)
      }
    } catch (e) {
      log.error('Open dir externally failed:', e)
    }
  },
})
