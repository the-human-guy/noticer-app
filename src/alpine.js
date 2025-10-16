const { invoke } = window.__TAURI__.core;
const { dialog, fs } = window.__TAURI__;

const alp = Alpine

const $Files = () => alp.store('Files')
alp.store('Files', {
  items: [],
  init() {
    log(this.selectedDirPath)
    if (this.selectedDirPath) {
      this.readSelectedDir()
    }
  },
  userSelectedPaths: alp.$persist({}).as('userSelectedPaths'),
  selectedDirPath: alp.$persist('').as('selectedDirPath'),
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


alp.store('Editor', {
  items: [],
  init(id) {
    tinymce.init({
      selector: '#' + id,
      license_key: 'gpl',
      plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion',
      menubar: 'file edit view insert format tools table help',
      toolbar: "undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl",
      contextmenu: 'link image table',
      skin: 'oxide',
      quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    }).then(() => {
      // add 'input' listener 
      tinymce.get(id).on('input', () => {
        // set textarea value = editor value
        document.getElementById(id).value = tinymce.get(id).getContent();
        // dispatch a native event for Alpine to recognize
        document.getElementById(id).dispatchEvent(new Event('input', { bubbles: true }));
      })
    }); 
  },
})



// Full featured demo: Non-Premium Plugins only
/*
const useDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isSmallScreen = window.matchMedia('(max-width: 1023.5px)').matches;

tinymce.init({
  selector: 'textarea#open-source-plugins',
  plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion',
  editimage_cors_hosts: ['picsum.photos'],
  menubar: 'file edit view insert format tools table help',
  toolbar: "undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl",
  autosave_ask_before_unload: true,
  autosave_interval: '30s',
  autosave_prefix: '{path}{query}-{id}-',
  autosave_restore_when_empty: false,
  autosave_retention: '2m',
  image_advtab: true,
  link_list: [
    { title: 'My page 1', value: 'https://www.tiny.cloud' },
    { title: 'My page 2', value: 'http://www.moxiecode.com' }
  ],
  image_list: [
    { title: 'My page 1', value: 'https://www.tiny.cloud' },
    { title: 'My page 2', value: 'http://www.moxiecode.com' }
  ],
  image_class_list: [
    { title: 'None', value: '' },
    { title: 'Some class', value: 'class-name' }
  ],
  importcss_append: true,
  file_picker_callback: (callback, value, meta) => {
    if (meta.filetype === 'file') {
      callback('https://www.google.com/logos/google.jpg', { text: 'My text' });
    }

    if (meta.filetype === 'image') {
      callback('https://www.google.com/logos/google.jpg', { alt: 'My alt text' });
    }

    if (meta.filetype === 'media') {
      callback('movie.mp4', { source2: 'alt.ogg', poster: 'https://www.google.com/logos/google.jpg' });
    }
  },
  height: 600,
  image_caption: true,
  quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
  noneditable_class: 'mceNonEditable',
  toolbar_mode: 'sliding',
  contextmenu: 'link image table',
  skin: useDarkMode ? 'oxide-dark' : 'oxide',
  content_css: useDarkMode ? 'dark' : 'default',
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
});
*/