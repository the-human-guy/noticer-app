import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { defineEventHandler, readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const form = await readMultipartFormData(event)
  let filePath: string | undefined
  let file: { filename: string; data: Buffer } | undefined
  for (const field of form!) {
    if (field.name === 'filePath') filePath = field.data.toString('utf8')
    if (field.name === 'file')
      file = { filename: field.filename!, data: field.data }
  }
  if (!filePath || !file) {
    $logerr('Missing filePath or file')
    throw createError({ statusCode: 400, message: 'Missing filePath or file' })
  }
  const noteDir = path.dirname(filePath)
  const mediaDir = path.join(config.notesDir, noteDir, 'media')
  await mkdir(mediaDir, { recursive: true })
  const uniqueFilename = `${Date.now()}-${file.filename}`
  const imagePath = path.join(mediaDir, uniqueFilename)
  await writeFile(imagePath, file.data)
  const relativeImagePath = path.join(noteDir, 'media', uniqueFilename)
  return { link: `/${relativeImagePath}` }
})
