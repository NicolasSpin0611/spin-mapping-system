import { useCallback, useEffect, useState } from 'react'

export type Route = { name: 'compare'; componentId: string | null } | { name: 'admin' }

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [section, param] = path.split('/')
  if (section === 'admin') return { name: 'admin' }
  if (section === 'component' && param) return { name: 'compare', componentId: decodeURIComponent(param) }
  return { name: 'compare', componentId: null }
}

export function hrefFor(route: Route): string {
  if (route.name === 'admin') return '#/admin'
  return route.componentId ? `#/component/${encodeURIComponent(route.componentId)}` : '#/'
}

/** Hash routing keeps the app deployable on GitHub Pages without a server rewrite. */
export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.location.hash = hrefFor(next)
  }, [])

  return { route, navigate }
}
