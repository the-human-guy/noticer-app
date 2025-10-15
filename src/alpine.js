const { invoke } = window.__TAURI__.core;
const { dialog, fs } = window.__TAURI__;

const alp = Alpine

const $Files = () => Alpine.store('Files')
alp.store('Files', {
  items: [],
  init() {
    console.log(this.selectedDirPath)
    if (this.selectedDirPath) {
      this.readSelectedDir()
    }
  },
  userSelectedPaths: Alpine.$persist({}).as('userSelectedPaths'),
  selectedDirPath: Alpine.$persist('').as('selectedDirPath'),
  async pickDir() {
    // picked by user through the dialog.
    // these paths have read permissions.
    // you can traverse down to nested dirs but not up.
    const file = await dialog.open({
      multiple: false,
      directory: true,
    });
    console.log(file);
    $Files().userSelectedPaths[file] = true
    $Files().changeDir(file)
  },
  async readSelectedDir() {
    let files = []
    
    try {
      files = await fs.readDir(this.selectedDirPath);
      console.log(files)
    } catch (error) {
      console.error('readSelectedDir failed: ', error)
      files = []
    } finally {
      $Files().items = files
    }
  },
  async changeDir(newPath) {
    $Files().selectedDirPath = newPath
    $Files().readSelectedDir()
  },
  pickFile(file) {
    const {
      name,
      isDirectory,
      isFile,
      isSymlink,
    } = file
    console.log(name)
    if (isDirectory) {
      $Files().changeDir($Files().selectedDirPath + "/" + name)
    }
  },
  goBack() {
    const newPath = $Files().selectedDirPath.split('/').slice(0, -1).join('/')
    console.log(newPath)
    if (isPathAllowed($Files().userSelectedPaths, newPath)) {
      console.log('isPathAllowed true')
      $Files().changeDir(newPath)
    }
  }
})