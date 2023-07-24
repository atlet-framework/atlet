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
