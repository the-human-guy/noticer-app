import { writeFile } from 'fs/promises'
import path from 'path'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const notePath = event.context.params?.path as string
    const fullPath = path.join(config.notesDir, notePath)
    const content = await readBody<string>(event)
    await writeFile(fullPath, content, 'utf8')
    return { status: 'success' }
  } catch (e) {
    $logerr('Error creating note: ', e)
    throw createError({ statusCode: 500, message: 'Error creating note' })
  }
})
