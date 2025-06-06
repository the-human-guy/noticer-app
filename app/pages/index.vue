<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Notes</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createNewNote">New Note</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item
          v-for="note in notes"
          :key="note"
          :href="`/note/${note}`"
        >
          <ion-label>{{ note }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useFileOperations } from '~/composables/useFileOperations'
import { useRouter } from 'vue-router'

const { listNotes, createNote } = useFileOperations()
const notes = ref<string[]>([])
const router = useRouter()

onMounted(async () => {
  notes.value = await listNotes()
})

async function createNewNote() {
  const fileName = prompt('Enter file name (e.g., new-note.html):')
  if (!fileName) return
  const notePath = fileName.endsWith('.html') ? fileName : `${fileName}.html`
  await createNote(notePath, '<body><pre>New Note</pre></body>')
  router.push(`/note/${notePath}`)
}
</script>
