import { readFile } from 'fs/promises'
import path from 'path'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const notePath = event.context.params?.path as string
  const fullPath = path.join(config.notesDir, notePath)
  try {
    const content = await readFile(fullPath, 'utf8')
    return content
  } catch (e) {
    $logerr('Note not found: ', e)
    throw createError({ statusCode: 404, message: 'Note not found' })
  }
})
