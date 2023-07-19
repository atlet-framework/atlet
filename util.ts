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
