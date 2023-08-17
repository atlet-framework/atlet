import { Node, h } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'
import { createMatcher, extractParams } from './matcher.ts'
import { render } from './render.ts'
import { createExplorer } from './static.ts'
import { Component, Config, DefaultContext, Props, Routes } from './types.ts'

export { Fragment, h } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'
export * from './util.ts'
export * from './types.ts'

export const NOT_FOUND = Symbol('Page not found')
export const MIDDLEWARE = Symbol('Middleware')

const defaultRoutes: Routes = {
  [NOT_FOUND]: (props) => new Response(`Not found\n${props.request.url}`, {
    status: 404,
  }),
  [MIDDLEWARE]: () => {},
}

export function withLayout<T extends DefaultContext>(Layout: Component<T>, Target: Component<T>) {
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

export async function createHandler<T extends DefaultContext>(routes: Routes<T>, config: Config = {}) {
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