import { unlink } from 'fs/promises'
import path from 'path'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const imagePath = event.context.params?.path as string
  const fullPath = path.join(config.notesDir, imagePath)
  try {
    await unlink(fullPath)
    return { status: 'success' }
  } catch (e) {
    $logerr('Image not found: ', e)
    throw createError({ statusCode: 404, message: 'Image not found' })
  }
})
