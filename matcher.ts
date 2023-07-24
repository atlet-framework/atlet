import { removeTraillingSlashes } from './util.ts'

type StaticRoute<T> = {
  method: string | null,
  static: boolean,
  path: string,
  end: T,
}
type DynamicRoute<T> = StaticRoute<T> & {
  routeParts: string[],
  end: T,
}

function separateRoutes<T>(routes: Record<string | symbol, T>) {
  const staticRoutes: StaticRoute<T>[] = []
  const dynamicRoutes: DynamicRoute<T>[] = []
  
  const entries = Object.entries(routes)

  for (let [path, endpoint] of entries) {
    if (typeof path === 'symbol') {
      continue
    }

    let method = null

    if (path.includes(' ')) {
      [method, path] = path.split(' ')
    }
    
    const sanitizedRoute = removeTraillingSlashes(path)
    
    if (!sanitizedRoute.includes(':')) {
      const idx = staticRoutes.findIndex((r) => {
        return r.path === path
      })

      if (idx === -1) {
        staticRoutes.push({
          method,
          static: true,
          path: sanitizedRoute,
          end: endpoint,
        })
      }

      continue
    }

    const idx = dynamicRoutes.findIndex((r) => {
      return r.path === sanitizedRoute
    })

    if (idx === -1) {
      dynamicRoutes.push({
        method,
        static: false,
        path: sanitizedRoute,
        end: endpoint,
        routeParts: sanitizedRoute.split('/'),
      })
    }
  }

  return {
    dynamicRoutes,
    staticRoutes,
  }
}

export function createMatcher<T>(routes: Record<string | symbol, T>) {
  const { staticRoutes, dynamicRoutes } = separateRoutes(routes)

  return function match(method: string, path: string): StaticRoute<T> | DynamicRoute<T> | null {
    const sanitizedRoute = removeTraillingSlashes(path)

    const staticRoute = staticRoutes.find((r) => {
      return r.path === sanitizedRoute && (r.method === method || r.method === null)
    })

    if (staticRoute) {
      return staticRoute
    }

    const sanitizedRouteParts = sanitizedRoute.split('/')
    const dynamicRoute = dynamicRoutes.find((r) => {
      if (r.method !== method && r.method !== null) {
        return false
      }

      if (r.routeParts.length !== sanitizedRouteParts.length) {
        return false
      }

      for (let idx = 0; idx < r.routeParts.length; idx++) {
        const sourceRoutePart = sanitizedRouteParts[idx]
        const targetRoutePart = r.routeParts[idx]

        if (sourceRoutePart === targetRoutePart) {
          continue
        }

        if (targetRoutePart.startsWith(':')) {
          continue
        }

        return false
      }

      return true
    })

    if (dynamicRoute) {
      return dynamicRoute
    }

    return null
  }
}

export function extractParams(sourceRoute: string, targetRoute: string) {
  const params: Record<string, string> = {}
  const sourceRouteParts = removeTraillingSlashes(sourceRoute).split('/')
  const targetRouteParts = removeTraillingSlashes(targetRoute).split('/')

  if (sourceRouteParts.length !== targetRouteParts.length) {
    throw new Error('Source route is different than target route')
  }

  for (let idx = 0; idx < sourceRouteParts.length; idx++) {
    const sourceRoutePart = sourceRouteParts[idx]
    const targetRoutePart = targetRouteParts[idx]

    if (targetRoutePart.includes(':')) {
      params[targetRoutePart.substring(1)] = sourceRoutePart
    }
  }

  return params
}
