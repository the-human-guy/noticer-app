<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ noteName }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            @click="downloadNote"
            v-if="!isMobile"
            aria-label="Download"
          >
            <ion-icon name="download-outline"></ion-icon>
          </ion-button>
          <ion-button @click="onSaveNote">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div
        id="editor-anchor"
        sv-html="noteContent"
      ></div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useFileOperations } from '~/composables/useFileOperations'
import { downloadOutline } from 'ionicons/icons'
import { addIcons } from 'ionicons' // Import addIcons

// Register the icon
addIcons({
  'download-outline': downloadOutline,
})

const froalaScript = useNuxtApp().$scripts.froala
const route = useRoute()
const notePath = ref<string>((route.params.path as string[]).join('/'))
// Compute noteName by extracting the file name without path or extension
const noteName = computed(() => {
  const fileName = notePath.value.split('/').pop() || 'Untitled'
  return fileName.replace(/\.[^/.]+$/, '') // Remove file extension
})
const noteContent = ref<string>('')
const isMobile = Capacitor.getPlatform() !== 'web'
const { readNote, saveNote, uploadImage, deleteImage } = useFileOperations()

onMounted(async () => {
  noteContent.value = await readNote(notePath.value)
  froalaScript.onLoaded(() => {
    initEditor()
  })
})

function initEditor() {
  const imgsToBeRemoved: string[] = []
  const editor = new FroalaEditor(
    '#editor-anchor',
    {
      htmlRemoveTags: [],
      pastePlain: true,
      multiline: true,
      htmlUntouched: true,
      entities: '&<>',
      codeBeautifierOptions: {
        end_with_newline: true,
        indent_inner_html: true,
        brace_style: 'expand',
        indent_char: ' ',
        indent_size: 4,
      },
      enter: FroalaEditor.ENTER_BR,
      saveInterval: 0,
      events: {
        'save.before': async () => {
          const content = editor.html.get()
          await saveNote(notePath.value, content)
        },
        'save.after': async () => {
          for (const imgUrl of imgsToBeRemoved) {
            const imagePath = new URL(
              imgUrl,
              window.location.origin,
            ).pathname.slice(1)
            await deleteImage(imagePath)
          }
          imgsToBeRemoved.length = 0
        },
        'image.removed': ($img: JQuery) => {
          const src = $img[0].src
          if (src) {
            imgsToBeRemoved.push(src)
          }
        },
        'image.beforeUpload': async (files: File[]) => {
          const file = files[0]
          const imagePath = await uploadImage(file, notePath.value)
          const imageUrl = getImageUrl(imagePath)
          editor.image.insert(imageUrl, null, null, editor.image.get())
          return false // Prevent default upload
        },
      },
    },
    function () {
      // Call the method inside the initialized event.
      editor.html.set(noteContent.value)
    },
  )
  window.editor = editor // For saveNote function
}

async function onSaveNote() {
  window.editor.save.save()
}

function downloadNote() {
  const content = window.editor.html.get()
  const blob = new Blob([`<body>\n${content}\n</body>`], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = noteName.value + '.html' // Use noteName for download file name
  a.click()
  URL.revokeObjectURL(url)
}

function getImageUrl(imagePath: string): string {
  return isMobile
    ? `capacitor://localhost/_capacitor_file_/notes/${imagePath}`
    : `/notes/${imagePath}`
}
</script>
