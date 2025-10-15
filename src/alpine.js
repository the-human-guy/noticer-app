const { invoke } = window.__TAURI__.core;
const { dialog, fs } = window.__TAURI__;

const alp = Alpine

const $Files = () => Alpine.store('Files')
alp.store('Files', {
  items: [],
  init() {
    log(this.selectedDirPath)
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
    log(file);
    $Files().userSelectedPaths[file] = true
    $Files().changeDir(file)
  },
  async readSelectedDir() {
    let files = []
    
    try {
      files = await fs.readDir(this.selectedDirPath);
      log(files)
    } catch (error) {
      log.error('readSelectedDir failed: ', error)
      files = []
    } finally {
      $Files().items = files
    }
  },
  async changeDir(newPath) {
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
    const filePath = $Files().selectedDirPath + "/" + name

    if (isDirectory) {
      $Files().changeDir(filePath)
    } else {
      const fileContent = await fs.readTextFile(filePath);
      log(fileContent)
      $Files().fileContent = fileContent
    }
  },
  goBack() {
    const newPath = $Files().selectedDirPath.split('/').slice(0, -1).join('/')
    log(newPath)
    if (isPathAllowed($Files().userSelectedPaths, newPath)) {
      log('isPathAllowed true')
      $Files().changeDir(newPath)
    }
  },
  async newFile() {
    const path = await dialog.save({
      filters: [
        {
          name: 'My Filter',
          extensions: ['html'],
        },
      ],
    })
    log(path)
    const file = await fs.create(path);
    await file.write(new TextEncoder().encode('Hello world'));
    await file.close();
  }
})