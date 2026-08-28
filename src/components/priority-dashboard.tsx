import { useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  LayoutDashboard,
  ListChecks,
  MousePointerClick,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { ConfidenceBadge, MatchBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NA } from '@/data/types'
import type { ComponentMapping } from '@/data/types'
import { buildPriorityOverview } from '@/lib/priority'
import type { ComponentPriority, GapGroup, PriorityBand } from '@/lib/priority'
import { cn } from '@/lib/utils'

type ListFilter = 'critical' | 'start' | 'all'
type GapKind = 'variants' | 'handlers'

export function PriorityDashboard({
  components,
  onSelect,
}: {
  components: ComponentMapping[]
  onSelect: (id: string) => void
}) {
  const overview = useMemo(() => buildPriorityOverview(components), [components])
  const [listFilter, setListFilter] = useState<ListFilter>('critical')
  const [gapKind, setGapKind] = useState<GapKind>('variants')
  const [expandedGap, setExpandedGap] = useState<string | null>(null)

  const listed =
    listFilter === 'critical' ? overview.critical : listFilter === 'start' ? overview.startHere : overview.rows
  const gaps = gapKind === 'variants' ? overview.variantGaps : overview.handlerGaps

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <LayoutDashboard className="size-5" aria-hidden />
            Prioridad de paridad
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Empieza por los pares que los JSON ya respaldan. Deja para revisión los que no tienen equivalente, ni
            similar, en variantes o handlers.
          </p>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {overview.totals.components} componentes
        </Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Listos para empezar"
          value={overview.totals.startHere}
          hint="Ambos JSON, sin conflictos, paridad ≥ 25%"
          tone="good"
        />
        <StatCard
          label="Críticos"
          value={overview.totals.critical}
          hint="Sin par, conflicto de ejes, o paridad < 15%"
          tone="bad"
        />
        <StatCard
          label="Variantes sin par"
          value={overview.totals.unmatchedVariants}
          hint="Valores enumerados que no existen ni son similares"
          tone="warn"
        />
        <StatCard
          label="Handlers sin par"
          value={overview.totals.unmatchedHandlers}
          hint="Callbacks on* sin equivalente en el otro sistema"
          tone="warn"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PriorityColumn
          title="Empieza por aquí"
          icon={<Sparkles className="size-4" aria-hidden />}
          empty="Ningún par llega a paridad suficiente todavía."
          rows={overview.startHere}
          onSelect={onSelect}
          tone="good"
        />
        <PriorityColumn
          title="Más críticos"
          icon={<ShieldAlert className="size-4" aria-hidden />}
          empty="No hay componentes marcados como críticos."
          rows={overview.critical.slice(0, 8)}
          onSelect={onSelect}
          tone="bad"
        />
      </div>

      <section className="bg-card rounded-xl border shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ArrowDownWideNarrow className="size-4" aria-hidden />
              Ranking de componentes
            </h2>
            <p className="text-muted-foreground text-xs">
              Urgencia = baja paridad + conflictos + handlers y variantes sin equivalente.
            </p>
          </div>
          <Tabs value={listFilter} onValueChange={(value) => setListFilter(value as ListFilter)}>
            <TabsList>
              <TabsTrigger value="critical">Críticos ({overview.critical.length})</TabsTrigger>
              <TabsTrigger value="start">Empezar ({overview.startHere.length})</TabsTrigger>
              <TabsTrigger value="all">Todos ({overview.rows.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
        <ol className="divide-y">
          {listed.map((row, index) => (
            <li key={row.component.id}>
              <button
                type="button"
                onClick={() => onSelect(row.component.id)}
                className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
              >
                <span className="text-muted-foreground w-6 shrink-0 text-right text-xs tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{row.component.title}</span>
                    <BandBadge band={row.band} />
                    <MatchBadge status={row.component.match} />
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                    {row.reasons[0] ?? 'Sin hallazgos bloqueantes'}
                    {row.reasons[1] ? ` · ${row.reasons[1]}` : ''}
                  </span>
                </span>
                <span className="hidden w-36 shrink-0 sm:block">
                  <span className="text-muted-foreground mb-1 flex justify-between text-[11px] tabular-nums">
                    <span>Paridad</span>
                    <span>{row.parity}%</span>
                  </span>
                  <ParityBar value={row.parity} />
                </span>
                <span className="text-muted-foreground hidden w-28 shrink-0 text-right text-xs tabular-nums md:block">
                  {row.gapVariants} var · {row.gapHandlers} on*
                </span>
                <ArrowUpRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-card rounded-xl border shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              {gapKind === 'variants' ? (
                <ListChecks className="size-4" aria-hidden />
              ) : (
                <MousePointerClick className="size-4" aria-hidden />
              )}
              {gapKind === 'variants' ? 'Variantes que no cuadran' : 'Handlers sin equivalente'}
            </h2>
            <p className="text-muted-foreground text-xs">
              {gapKind === 'variants'
                ? 'Ejes enumerados donde el otro lado no tiene el valor, ni uno similar. Conflicto = mismo prop, significados distintos.'
                : 'Callbacks `on*` que solo existen en un sistema. No hay alias ni nombre parecido en el JSON del otro lado.'}
            </p>
          </div>
          <Tabs value={gapKind} onValueChange={(value) => setGapKind(value as GapKind)}>
            <TabsList>
              <TabsTrigger value="variants">
                Variantes ({overview.variantGaps.length})
              </TabsTrigger>
              <TabsTrigger value="handlers">
                Handlers ({overview.handlerGaps.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {gaps.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            No hay huecos de este tipo en los JSON.
          </p>
        ) : (
          <div className="divide-y">
            {gaps.slice(0, 18).map((group) => {
              const key = `${gapKind}:${group.name}`
              const open = expandedGap === key
              return (
                <GapRow
                  key={key}
                  group={group}
                  open={open}
                  onToggle={() => setExpandedGap(open ? null : key)}
                  onSelect={onSelect}
                  kind={gapKind}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint: string
  tone: 'good' | 'bad' | 'warn'
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border p-3 shadow-sm',
        tone === 'bad' && value > 0 && 'border-rose-300 dark:border-rose-900',
        tone === 'good' && value > 0 && 'border-emerald-300 dark:border-emerald-900',
        tone === 'warn' && value > 0 && 'border-amber-300 dark:border-amber-900',
      )}
    >
      <p className="flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
        {value}
        {tone === 'bad' && value > 0 ? (
          <TriangleAlert className="size-4 text-rose-600 dark:text-rose-400" aria-hidden />
        ) : null}
      </p>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

function PriorityColumn({
  title,
  icon,
  empty,
  rows,
  onSelect,
  tone,
}: {
  title: string
  icon: React.ReactNode
  empty: string
  rows: ComponentPriority[]
  onSelect: (id: string) => void
  tone: 'good' | 'bad'
}) {
  return (
    <section
      className={cn(
        'bg-card rounded-xl border shadow-sm',
        tone === 'good' && 'border-emerald-200 dark:border-emerald-900',
        tone === 'bad' && 'border-rose-200 dark:border-rose-900',
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        <span className="text-muted-foreground text-xs tabular-nums">{rows.length}</span>
      </header>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">{empty}</p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.component.id}>
              <button
                type="button"
                onClick={() => onSelect(row.component.id)}
                className="hover:bg-muted/50 flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{row.component.title}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                      {row.parity}%
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {row.component.audit?.spinboxComponent ?? NA} → {row.component.audit?.legacyComponent ?? NA}
                  </span>
                  {row.reasons[0] ? (
                    <span className="text-muted-foreground mt-1 block text-xs">{row.reasons[0]}</span>
                  ) : null}
                </span>
                <ArrowUpRight className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function GapRow({
  group,
  open,
  onToggle,
  onSelect,
  kind,
}: {
  group: GapGroup
  open: boolean
  onToggle: () => void
  onSelect: (id: string) => void
  kind: GapKind
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="hover:bg-muted/40 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
      >
        <code className="bg-muted/60 max-w-[40%] truncate rounded px-1.5 py-0.5 font-mono text-xs" title={group.name}>
          {group.name}
        </code>
        <span className="flex flex-wrap items-center gap-1">
          {group.conflicts > 0 ? (
            <Badge variant="secondary" className="bg-rose-100 tabular-nums text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              {group.conflicts} conflicto{group.conflicts === 1 ? '' : 's'}
            </Badge>
          ) : null}
          {group.spinboxOnly > 0 ? (
            <Badge variant="secondary" className="bg-violet-100 tabular-nums text-violet-800 dark:bg-violet-950 dark:text-violet-300">
              {group.spinboxOnly} solo SB
            </Badge>
          ) : null}
          {group.legacyOnly > 0 ? (
            <Badge variant="secondary" className="bg-orange-100 tabular-nums text-orange-900 dark:bg-orange-950 dark:text-orange-300">
              {group.legacyOnly} solo LG
            </Badge>
          ) : null}
        </span>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {group.components.length} componente{group.components.length === 1 ? '' : 's'}
        </span>
      </button>
      {open ? (
        <ul className="bg-muted/30 space-y-1 border-t px-4 py-2">
          {group.hits.slice(0, 12).map((hit, index) => (
            <li key={`${hit.componentId}-${hit.name}-${index}`}>
              <button
                type="button"
                onClick={() => onSelect(hit.componentId)}
                className="hover:bg-background flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs"
              >
                <ConfidenceBadge confidence={hit.confidence} />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{hit.componentTitle}</span>
                  <span className="text-muted-foreground mt-0.5 block">{hit.detail}</span>
                </span>
                <span className="text-muted-foreground shrink-0">{kind === 'handlers' ? 'handler' : 'variante'}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function BandBadge({ band }: { band: PriorityBand }) {
  if (band === 'start') {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        Empezar
      </Badge>
    )
  }
  if (band === 'critical') {
    return (
      <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
        Crítico
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
      Vigilar
    </Badge>
  )
}

function ParityBar({ value }: { value: number }) {
  return (
    <div
      className={cn(
        '[&_[data-slot=progress-indicator]]:transition-none',
        value >= 50
          ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
          : value >= 20
            ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
            : '[&_[data-slot=progress-indicator]]:bg-rose-500',
      )}
    >
      <Progress value={value} />
    </div>
  )
}
