alp = Alpine

alp.store('Files', {
  items: [],
  init() {
    console.log(this.selectedDirPath)
    if (this.selectedDirPath) {
      this.readSelectedDir()
    }
  },
  // selectedDirPath: '',
  selectedDirPath: Alpine.$persist('').as('selectedDirPath'),
  async pickDir() {
    const file = await dialog.open({
      multiple: false,
      directory: true,
    });
    console.log(file);
    Alpine.store('Files').selectedDirPath = file
    Alpine.store('Files').readSelectedDir()
  },
  async readSelectedDir() {
    const files = await window.__TAURI__.fs.readDir(this.selectedDirPath);
    console.log(files)
    Alpine.store('Files').items = files
  }
})