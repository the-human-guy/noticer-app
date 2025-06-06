// composables/useFileOperations.ts
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import path from 'path'

const isMobile = Capacitor.getPlatform() !== 'web'
const baseDir = 'notes' // Base directory for mobile

// Define the interface for file operation methods
interface FileOperations {
  readNote: (notePath: string) => Promise<string>
  saveNote: (notePath: string, content: string) => Promise<void>
  createNote: (notePath: string, content: string) => Promise<void>
  uploadImage: (file: File, notePath: string) => Promise<string>
  deleteImage: (imagePath: string) => Promise<void>
  listNotes: (dir?: string) => Promise<string[]>
}

export function useFileOperations(): FileOperations {
  async function readNote(notePath: string): Promise<string> {
    if (isMobile) {
      try {
        const result = await Filesystem.readFile({
          path: `${baseDir}/${notePath}`,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        })
        return result.data as string
      } catch (e) {
        throw new Error(`Error reading note: ${(e as Error).message}`)
      }
    } else {
      return await $fetch<string>(`/api/notes/${notePath}`)
    }
  }

  async function saveNote(notePath: string, content: string): Promise<void> {
    if (isMobile) {
      try {
        await Filesystem.writeFile({
          path: `${baseDir}/${notePath}`,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        })
      } catch (e) {
        throw new Error(`Error saving note: ${(e as Error).message}`)
      }
    } else {
      await $fetch(`/api/notes/${notePath}`, {
        // @ts-ignore
        method: 'PUT',
        body: content,
      })
    }
  }

  async function createNote(notePath: string, content: string): Promise<void> {
    if (isMobile) {
      await Filesystem.writeFile({
        path: `${baseDir}/${notePath}`,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      })
    } else {
      await $fetch(`/api/notes/${notePath}`, {
        // @ts-ignore
        method: 'POST',
        body: content,
        headers: {
          'Content-Type': 'multipart/formdata',
        },
      })
    }
  }

  async function uploadImage(file: File, notePath: string): Promise<string> {
    if (isMobile) {
      const noteDir = path.dirname(notePath)
      const mediaDir = path.join(noteDir, 'media')
      await Filesystem.mkdir({
        path: `${baseDir}/${mediaDir}`,
        directory: Directory.Documents,
        recursive: true,
      })
      const uniqueFilename = `${Date.now()}-${file.name}`
      const imagePath = path.join(mediaDir, uniqueFilename)
      const base64Data = await fileToBase64(file)
      await Filesystem.writeFile({
        path: `${baseDir}/${imagePath}`,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
      return imagePath
    } else {
      const formData = new FormData()
      formData.append('filePath', notePath)
      formData.append('file', file)
      const response = await $fetch<{ link: string }>('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      return response.link
    }
  }

  async function deleteImage(imagePath: string): Promise<void> {
    if (isMobile) {
      await Filesystem.deleteFile({
        path: `${baseDir}/${imagePath}`,
        directory: Directory.Documents,
      })
    } else {
      await $fetch(`/api/images/${imagePath}`, {
        method: 'DELETE',
      })
    }
  }

  async function listNotes(dir: string = baseDir): Promise<string[]> {
    if (isMobile) {
      const result = await listHtmlFilesMobile(dir)
      return result
    } else {
      return await $fetch<string[]>('/api/notes')
    }
  }

  return { readNote, saveNote, createNote, uploadImage, deleteImage, listNotes }
}

// Helper functions with types
async function listHtmlFilesMobile(dir: string): Promise<string[]> {
  const result = await Filesystem.readdir({
    path: dir,
    directory: Directory.Documents,
  })
  let htmlFiles: string[] = []
  for (const file of result.files) {
    const fullPath = path.join(dir, file.name)
    if (file.type === 'directory') {
      htmlFiles = htmlFiles.concat(await listHtmlFilesMobile(fullPath))
    } else if (file.name.endsWith('.html')) {
      htmlFiles.push(fullPath.replace(baseDir + '/', ''))
    }
  }
  return htmlFiles
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
