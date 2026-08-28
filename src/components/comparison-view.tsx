import { ChevronLeft, ChevronRight, Code2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { AuditPanel } from '@/components/audit-panel'
import { EmbedPanel } from '@/components/embed-panel'
import { MatchBadge, RiskBadge, WarnBadge } from '@/components/status-badge'
import { PropChecklist } from '@/components/prop-checklist'
import { VariantChecklist } from '@/components/variant-checklist'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ComponentMapping, Source } from '@/data/types'
import { embedUrlFor } from '@/lib/embed'
import { useState } from 'react'

type ViewMode = 'both' | 'spinbox' | 'legacy'

function iframeSnippet(source: Source, title: string): string | null {
  const url = embedUrlFor(source)
  if (!url) return null
  return `<!-- ${title} — ${source.label} -->\n<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="${url}" allowfullscreen></iframe>`
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to the clipboard`)
  } catch {
    toast.error('The browser blocked clipboard access')
  }
}

interface ComparisonViewProps {
  component: ComponentMapping
  onPrevious?: () => void
  onNext?: () => void
  position?: { index: number; total: number }
}

export function ComparisonView({ component, onPrevious, onNext, position }: ComparisonViewProps) {
  const [mode, setMode] = useState<ViewMode>('both')
  const spinboxSnippet = iframeSnippet(component.spinbox, component.title)
  const legacySnippet = iframeSnippet(component.legacy, component.title)
  const risks = component.audit?.issues.filter((issue) => issue.level === 'risk').length ?? 0
  const warnings = component.audit?.issues.filter((issue) => issue.level === 'warn').length ?? 0

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{component.title}</h1>
            <MatchBadge status={component.match} />
            <Badge variant="outline">{component.category}</Badge>
            <RiskBadge count={risks} />
            <WarnBadge count={warnings} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Spinbox <span className="text-foreground font-medium">{component.spinbox.label || '—'}</span> vs. Spin
            Legacy <span className="text-foreground font-medium">{component.legacy.label || '—'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(value) => setMode(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="both">Side by side</TabsTrigger>
              <TabsTrigger value="spinbox">Spinbox</TabsTrigger>
              <TabsTrigger value="legacy">Legacy</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!spinboxSnippet && !legacySnippet}>
                <Code2 aria-hidden />
                Embed code
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!spinboxSnippet}
                onSelect={() => spinboxSnippet && copy(spinboxSnippet, 'Spinbox iframe')}
              >
                Copy Spinbox iframe
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!legacySnippet}
                onSelect={() => legacySnippet && copy(legacySnippet, 'Figma iframe')}
              >
                Copy Figma iframe
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!spinboxSnippet || !legacySnippet}
                onSelect={() =>
                  spinboxSnippet &&
                  legacySnippet &&
                  copy(`${spinboxSnippet}\n${legacySnippet}`, 'Both iframes')
                }
              >
                Copy both
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={onPrevious} disabled={!onPrevious} title="Previous">
              <ChevronLeft aria-hidden />
              <span className="sr-only">Previous component</span>
            </Button>
            {position ? (
              <span className="text-muted-foreground w-14 text-center text-xs tabular-nums">
                {position.index + 1} / {position.total}
              </span>
            ) : null}
            <Button variant="outline" size="icon-sm" onClick={onNext} disabled={!onNext} title="Next">
              <ChevronRight aria-hidden />
              <span className="sr-only">Next component</span>
            </Button>
          </div>
        </div>
      </header>

      <AuditPanel component={component} />

      {component.notes ? (
        <div className="bg-muted/50 text-muted-foreground flex gap-2 rounded-lg border px-3 py-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{component.notes}</p>
        </div>
      ) : null}

      <div className={mode === 'both' ? 'grid gap-4 xl:grid-cols-2' : 'grid gap-4'}>
        {mode !== 'legacy' ? (
          <EmbedPanel system="spinbox" source={component.spinbox} componentTitle={component.title} />
        ) : null}
        {mode !== 'spinbox' ? (
          <EmbedPanel system="legacy" source={component.legacy} componentTitle={component.title} />
        ) : null}
      </div>

      {component.spinbox.extra?.length ? (
        <div className="bg-card rounded-xl border px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Other Spinbox references
          </p>
          <ul className="mt-1 flex flex-wrap gap-3">
            {component.spinbox.extra.map((reference) => (
              <li key={reference.url}>
                <a className="text-primary text-sm hover:underline" href={reference.url} target="_blank" rel="noreferrer">
                  {reference.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <PropChecklist component={component} />

      <VariantChecklist component={component} />
    </div>
  )
}
