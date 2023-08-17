import { Node, h } from 'https://deno.land/x/jsx@v0.1.5/mod.ts'

export type PageOptions = {
  title: string
  lang: string
  head: Array<Node<unknown>>
}

export type DefaultContext = Record<string, unknown>

export type Props<T extends DefaultContext = DefaultContext> = {
  request: Request
  params: Record<string, string>
  query: URLSearchParams
  ctx: T
  headers: Headers
  children: Array<Node<unknown>>
  url: URL
  page: PageOptions
}

type RouteResponse = 
  | Response 
  | Node<unknown> 
  | Promise<Response> 
  | Promise<Node<unknown>> 
  | void | Promise<void>

export type Route<T extends DefaultContext> = ((input: Props<T>) => RouteResponse) | Component<T>

export type Component<T extends DefaultContext> = (props: Props<T>) => Node<unknown> | Promise<Node<unknown>>

export type Routes<T extends DefaultContext = DefaultContext> = Record<string | symbol, Route<T>>

export type Config = {
  static?: string
  unoCSS?: boolean
}