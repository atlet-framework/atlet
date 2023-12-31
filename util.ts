import { Node, h, renderToString } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'

export function removeTraillingSlashes(str: string) {
  const arr = Array.from(str)

  while (arr.at(0) === '/') {
    arr.shift()
  }

  while (arr.at(-1) === '/') {
    arr.pop()
  }

  return arr.join('')
}

export function html(node: Node<unknown>) {
  return renderToString(node).then((htmlContent) => {
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  })
}

export function json(obj: Record<string, unknown>) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function text(input: string | number | boolean) {
  return new Response(String(input), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export function redirect(destination: string, status = 302) {
  return new Response(null, {
    status,
    headers: {
      Location: destination,
    },
  })
}

export function fuseHeaders(target: Headers, source: Headers) {
  for (const entry of source.entries()) {
    target.set(entry[0], entry[1])
  }
}

export function createScript<T>(imports?: T) {
  return function script(fn: (imports: T) => unknown) {
    return h('script', {
      dangerouslySetInnerHTML: {
        __html: `(${fn.toString()})(${JSON.stringify(imports)});`,
      },
    })
  }
}
