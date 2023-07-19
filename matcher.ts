import { removeTraillingSlashes } from './util.ts'

type StaticRoute<T> = {
  static: true,
  route: string,
  end: T,
}
type DynamicRoute<T> = {
  static: false,
  route: string,
  routeParts: string[],
  end: T,
}

function separateRoutes<T>(routes: Record<string | symbol, T>) {
  const staticRoutes: StaticRoute<T>[] = []
  const dynamicRoutes: DynamicRoute<T>[] = []
  
  const entries = Object.entries(routes)

  for (const [route, endpoint] of entries) {
    if (typeof route === 'symbol') {
      continue
    }

    const sanitizedRoute = removeTraillingSlashes(route)
    
    if (!sanitizedRoute.includes(':')) {
      const idx = staticRoutes.findIndex((r) => {
        return r.route === route
      })

      if (idx === -1) {
        staticRoutes.push({
          static: true,
          route: sanitizedRoute,
          end: endpoint,
        })
      }

      continue
    }

    const idx = dynamicRoutes.findIndex((r) => {
      return r.route === sanitizedRoute
    })

    if (idx === -1) {
      dynamicRoutes.push({
        static: false,
        route: sanitizedRoute,
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

  return function match(routeToMatch: string): StaticRoute<T> | DynamicRoute<T> | null {
    const sanitizedRoute = removeTraillingSlashes(routeToMatch)

    const staticRoute = staticRoutes.find((r) => {
      return r.route === sanitizedRoute
    })

    if (staticRoute) {
      return staticRoute
    }

    const sanitizedRouteParts = sanitizedRoute.split('/')
    const dynamicRoute = dynamicRoutes.find((r) => {
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
