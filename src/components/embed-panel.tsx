import { useEffect, useState } from 'react'
import { ExternalLink, FileText, Frame, RotateCw, ShieldAlert, Unplug } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DesignSystem, Source } from '@/data/types'
import { embedUrlFor, figmaNodeId, hostnameOf } from '@/lib/embed'
import { cn } from '@/lib/utils'

const SYSTEM_LABEL: Record<DesignSystem, string> = {
  spinbox: 'Spinbox',
  legacy: 'Spin Legacy',
}

const SYSTEM_TONE: Record<DesignSystem, string> = {
  spinbox: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  legacy: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
}

interface EmbedPanelProps {
  system: DesignSystem
  source: Source
  componentTitle: string
  className?: string
}

export function EmbedPanel({ system, source, componentTitle, className }: EmbedPanelProps) {
  const embedUrl = embedUrlFor(source)
  const [nonce, setNonce] = useState(0)

  return (
    <section
      className={cn('bg-card flex min-w-0 flex-col overflow-hidden rounded-xl border shadow-sm', className)}
      aria-label={`${SYSTEM_LABEL[system]} preview of ${componentTitle}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="secondary" className={SYSTEM_TONE[system]}>
            {SYSTEM_LABEL[system]}
          </Badge>
          <p className="truncate text-sm font-medium" title={source.label || 'Unnamed'}>
            {source.label || 'Unnamed'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {source.kind === 'figma' && source.url ? (
            <span className="text-muted-foreground hidden font-mono text-xs sm:inline">
              node {figmaNodeId(source.url) ?? '—'}
            </span>
          ) : null}
          {embedUrl ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setNonce((value) => value + 1)}
              title="Reload frame"
            >
              <RotateCw aria-hidden />
              <span className="sr-only">Reload frame</span>
            </Button>
          ) : null}
          {source.url ? (
            <Button variant="ghost" size="icon-sm" asChild title="Open in a new tab">
              <a href={source.url} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                <span className="sr-only">Open in a new tab</span>
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      {embedUrl ? (
        <LiveFrame
          key={`${embedUrl}#${nonce}`}
          url={embedUrl}
          title={`${SYSTEM_LABEL[system]} — ${componentTitle}`}
        />
      ) : (
        <div className="bg-muted/40 relative flex-1">
          <MissingSource system={system} source={source} />
        </div>
      )}
    </section>
  )
}

/** Remounted on reload so the load state starts clean without an effect writing state. */
function LiveFrame({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false)
  const [slowToLoad, setSlowToLoad] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlowToLoad(true), 6000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      <div className="bg-muted/40 relative flex-1">
        <iframe
          title={title}
          style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
          width={800}
          height={450}
          src={url}
          allowFullScreen
          onLoad={() => setLoaded(true)}
          className="block h-full min-h-[420px] w-full bg-white"
        />
      </div>
      <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-3 py-1.5 text-xs">
        <span className="truncate font-mono">{hostnameOf(url)}</span>
        {slowToLoad && !loaded ? (
          <span className="text-amber-700 dark:text-amber-400">Still loading — the host may block embedding.</span>
        ) : (
          <span>Frame renders live content from the source of truth.</span>
        )}
      </footer>
    </>
  )
}

function MissingSource({ system, source }: { system: DesignSystem; source: Source }) {
  if (source.kind === 'google-doc' && source.url) {
    return (
      <EmptyPanel
        Icon={FileText}
        title="This reference lives in a Google Doc"
        description={
          source.note ??
          'Google Docs refuses to render inside an iframe, so the spec has to be opened in its own tab.'
        }
        action={
          <Button variant="outline" size="sm" asChild>
            <a href={source.url} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              Open the document
            </a>
          </Button>
        }
      />
    )
  }

  if (system === 'spinbox') {
    return (
      <EmptyPanel
        Icon={Unplug}
        title="Nothing to compare on the Spinbox side"
        description={source.note ?? 'This component has no Spinbox equivalent yet.'}
        hint="Add a URL from the admin panel once the component ships, or record the decision in the notes."
      />
    )
  }

  return (
    <EmptyPanel
      Icon={ShieldAlert}
      title="No Spin Legacy reference linked"
      description={source.note ?? 'No Figma node was recorded for this component.'}
      hint="Paste the Figma link in the admin panel — it is converted to an embed URL automatically."
    />
  )
}

interface EmptyPanelProps {
  Icon: typeof Frame
  title: string
  description: string
  hint?: string
  action?: React.ReactNode
}

export function EmptyPanel({ Icon, title, description, hint, action }: EmptyPanelProps) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span className="bg-background text-muted-foreground flex size-11 items-center justify-center rounded-full border">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
      </div>
      {hint ? <p className="text-muted-foreground/80 mx-auto max-w-sm text-xs">{hint}</p> : null}
      {action}
    </div>
  )
}
