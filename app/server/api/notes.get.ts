import { readdir, stat } from 'fs/promises'
import path from 'path'
import { defineEventHandler } from 'h3'

async function listHtmlFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir)
  let htmlFiles: string[] = []
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      htmlFiles = htmlFiles.concat(await listHtmlFiles(fullPath))
    } else if (file.endsWith('.html')) {
      htmlFiles.push(path.relative(useRuntimeConfig().notesDir, fullPath))
    }
  }
  return htmlFiles
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  try {
    return await listHtmlFiles(config.notesDir)
  } catch (e) {
    $logerr('Error listing notes: ', e)
    throw createError({ statusCode: 500, message: 'Error listing notes' })
  }
})
