import { Node, h } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'
import { createMatcher, extractParams } from './matcher.ts'
import { render } from './render.ts'
import { createExplorer } from './static.ts'

export * from './util.ts'
export { h, Fragment } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'

type Context = Record<string, unknown>
export type PageOptions = {
  title: string
  lang: string
  head: Array<Node<unknown>>
}
export type Props<T extends Context = Context> = {
  request: Request
  params: Record<string, string>
  query: URLSearchParams
  ctx: T
  headers: Headers
  children: Array<Node<unknown>>
  url: URL
  page: PageOptions
}
type RouteResponse = Response | Node<unknown> | Promise<Response> | Promise<Node<unknown>> | void | Promise<void>
type Route<T extends Context> = ((input: Props<T>) => RouteResponse) | Component<T>
type Component<T extends Context> = (props: Props<T>) => Node<unknown> | Promise<Node<unknown>>
export type Routes<T extends Context = Context> = Record<string | symbol, Route<T>>
export type Config = {
  static?: string
  unoCSS?: boolean
}

export const NOT_FOUND = Symbol('Page not found')
export const MIDDLEWARE = Symbol('Middleware')

const defaultRoutes: Routes<Context> = {
  [NOT_FOUND]: (props) => new Response(`Not found\n${props.request.url}`, {
    status: 404,
  }),
  [MIDDLEWARE]: () => {},
}

export function withLayout<T extends Context>(Layout: Component<T>, Target: Component<T>) {
  return function WrappedComponent(props: Props<T>) {
    return {
      type: Layout,
      props: {
        ...props,
        children: [{
          type: Target,
          props
        }]
      }
    } as Node<unknown>
  }
}

export async function createHandler<T extends Context>(routes: Routes<T>, config: Config = {}) {
  const match = createMatcher(routes)
  const getStaticFile = await createExplorer(config.static)

  return async function handler(request: Request) {
    const url = new URL(request.url)
    
    const file = await getStaticFile(url.pathname)
    if (file) {
      return file
    }

    const props = {
      request,
      url,
      page: {
        title: '',
        lang: 'en',
        head: [
          h('meta', { charset: 'utf-8' }),
          h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
        ],
      },
      children: [],
      params: {},
      query: new URLSearchParams(url.search),
      ctx: {} as T,
      headers: new Headers(),
    } as Props<T>

    const middlewareResult = (MIDDLEWARE in routes)
      ? await routes[MIDDLEWARE](props)
      : await defaultRoutes[MIDDLEWARE](props)

    if (middlewareResult) {
      return await render(middlewareResult, props, config)
    }
    
    const route = match(request.method, url.pathname)

    if (!route) {
      const result = (NOT_FOUND in routes)
        ? await routes[NOT_FOUND](props)
        : await defaultRoutes[NOT_FOUND](props)

      return await render(result, props, config)
    }

    if (!route.static) {
      props.params = extractParams(url.pathname, route.path)
    }

    const result = await route.end(props)
    return await render(result, props, config)
  }
}