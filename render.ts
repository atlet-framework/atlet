import { Node, h, renderToString } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'
import * as Uno from './uno.ts'
import { Config, Props } from './mod.ts'

function fuseHeaders(target: Headers, source: Headers) {
  for (const entry of source.entries()) {
    target.set(entry[0], entry[1])
  }
}

export async function render(result: Response | Node<unknown> | void, originalProps: Props, config: Config) {
  if (!result) {
    return new Response(null)
  }
  
  if (result instanceof Response) {
    return result
  }

  const html = await renderToString(result)

  let unocss = ''
  if (config.unoCSS) {
    unocss = await Uno.generate(html)
    originalProps.page.head.push(
      h('style', {
        dangerouslySetInnerHTML: {
          __html: unocss,
        },
      })
    )
  }

  const all = await Promise.all(originalProps.page.head.map(renderToString))
    .then((arr) => arr.join('\n'))
    .catch(() => '')

  const web = `
    <!DOCTYPE html>
    <html lang="${originalProps.page.lang}">
      <head>
        <title>${originalProps.page.title}</title>
        ${all}
      </head>
      ${html}
    </html>
  `
  const response = new Response(web, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })

  fuseHeaders(response.headers, originalProps.headers)
  return response
}