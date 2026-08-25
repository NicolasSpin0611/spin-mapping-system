import { GitCompareArrows, Settings2 } from 'lucide-react'
import { AdminPage } from '@/pages/admin-page'
import { ComparePage } from '@/pages/compare-page'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { useRoute } from '@/lib/router'
import { MappingProvider } from '@/store/mapping-store'
import { cn } from '@/lib/utils'

function Shell() {
  const { route, navigate } = useRoute()

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <GitCompareArrows className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm leading-tight font-semibold">Spinbox ↔ Spin Legacy</p>
              <p className="text-muted-foreground text-xs leading-tight">
                Component parity workspace for the design-system migration
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <Button
              variant={route.name === 'compare' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => navigate({ name: 'compare', componentId: null })}
            >
              <GitCompareArrows aria-hidden />
              Comparison
            </Button>
            <Button
              variant={route.name === 'admin' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => navigate({ name: 'admin' })}
            >
              <Settings2 aria-hidden />
              Admin
            </Button>
          </nav>
        </div>
      </header>

      <main className={cn('mx-auto max-w-[1600px] px-4 py-6')}>
        {route.name === 'admin' ? (
          <AdminPage onOpenComponent={(id) => navigate({ name: 'compare', componentId: id || null })} />
        ) : (
          <ComparePage
            componentId={route.componentId}
            onSelect={(id) => navigate({ name: 'compare', componentId: id })}
          />
        )}
      </main>

      <footer className="text-muted-foreground mx-auto max-w-[1600px] px-4 pb-8 text-xs">
        Sources: Spinbox documentation site and the Spin Legacy Figma library, as listed in the “Spin box - Mapping”
        document. Figma frames need view access on the file to render.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <MappingProvider>
      <Shell />
      <Toaster position="bottom-right" />
    </MappingProvider>
  )
}
