import { walk } from 'https://deno.land/std@0.192.0/fs/mod.ts'
import { join } from "https://deno.land/std@0.192.0/path/mod.ts"
import slash from 'https://deno.land/x/slash@v0.3.0/mod.ts'
import { readableStreamFromReader } from 'https://deno.land/std@0.192.0/streams/mod.ts'
import { mime } from 'https://deno.land/x/mimetypes@v1.0.0/mod.ts'

function getContentType(file: string) {
  const idx = file.lastIndexOf('.')

  if (idx === -1) {
    return 'text/plain'
  }

  const extension = file.substring(idx, file.length)
  return mime.getType(extension) ?? 'text/plain'
}

async function getFiles(src: string) {
  const files: string[] = []
  const path = slash(join(Deno.cwd(), src))

  for await (const entry of walk(path)) {
    if (entry.isFile) {
      const file = slash(entry.path)

      if (file.includes('.git')) {
        continue
      }

      files.push(file)
    }
  }

  return files
}

export async function createExplorer(staticFolder?: string) {
  const files = staticFolder ? await getFiles(staticFolder) : []

  return async function getStaticFile(path: string) {
    const fileToLookFor = slash(join(Deno.cwd(), staticFolder ?? '', path))

    if (!files.includes(fileToLookFor)) {
      return null
    }
    
    const file = await Deno.open(staticFolder + path, { read: true }).catch(() => null)
    if (!file) {
      return null
    }
    
    const stat = await file.stat()
    if (stat.isDirectory) {
      return null
    }
    
    const readableStream = readableStreamFromReader(file)
    return new Response(readableStream, {
      headers: {
        'Content-Type': getContentType(fileToLookFor),
      }
    })
  }
}