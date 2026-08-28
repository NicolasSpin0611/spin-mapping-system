import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CONFIDENCE_LABEL, CONFIDENCE_NEEDS_REVIEW, NA } from '@/data/types'
import type { Confidence } from '@/data/types'
import { cn } from '@/lib/utils'

const CONFIDENCE_ORDER: Confidence[] = [
  'conflict',
  'legacy-only',
  'spinbox-only',
  'renamed',
  'similar',
  'exact',
  'unknown',
]

const FILTER_TONE: Record<Confidence, string> = {
  exact: 'data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-900 dark:data-[active=true]:bg-emerald-950 dark:data-[active=true]:text-emerald-300',
  similar:
    'data-[active=true]:bg-amber-100 data-[active=true]:text-amber-900 dark:data-[active=true]:bg-amber-950 dark:data-[active=true]:text-amber-300',
  renamed:
    'data-[active=true]:bg-sky-100 data-[active=true]:text-sky-900 dark:data-[active=true]:bg-sky-950 dark:data-[active=true]:text-sky-300',
  'spinbox-only':
    'data-[active=true]:bg-violet-100 data-[active=true]:text-violet-900 dark:data-[active=true]:bg-violet-950 dark:data-[active=true]:text-violet-300',
  'legacy-only':
    'data-[active=true]:bg-orange-100 data-[active=true]:text-orange-900 dark:data-[active=true]:bg-orange-950 dark:data-[active=true]:text-orange-300',
  conflict:
    'data-[active=true]:bg-rose-100 data-[active=true]:text-rose-900 dark:data-[active=true]:bg-rose-950 dark:data-[active=true]:text-rose-300',
  unknown:
    'data-[active=true]:bg-neutral-200 data-[active=true]:text-neutral-900 dark:data-[active=true]:bg-neutral-700 dark:data-[active=true]:text-neutral-100',
}

export interface ChecklistRow {
  id: string
  confidence?: Confidence
  reviewReason?: string
}

/** Search + confidence filtering shared by the prop and variant tables. */
export function useChecklistFilter<T extends ChecklistRow>(rows: T[], haystack: (row: T) => string) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Confidence[]>([])
  const [reviewOnly, setReviewOnly] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const counts = useMemo(() => {
    const map = new Map<Confidence, number>()
    for (const row of rows) {
      const confidence = row.confidence ?? 'unknown'
      map.set(confidence, (map.get(confidence) ?? 0) + 1)
    }
    return CONFIDENCE_ORDER.filter((confidence) => map.has(confidence)).map((confidence) => ({
      confidence,
      count: map.get(confidence) as number,
    }))
  }, [rows])

  const reviewTotal = useMemo(
    () => rows.filter((row) => CONFIDENCE_NEEDS_REVIEW[row.confidence ?? 'unknown']).length,
    [rows],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      const confidence = row.confidence ?? 'unknown'
      if (active.length > 0 && !active.includes(confidence)) return false
      if (reviewOnly && !CONFIDENCE_NEEDS_REVIEW[confidence]) return false
      if (!needle) return true
      return haystack(row).toLowerCase().includes(needle)
    })
  }, [active, haystack, query, reviewOnly, rows])

  const toggle = (confidence: Confidence) =>
    setActive((current) =>
      current.includes(confidence)
        ? current.filter((item) => item !== confidence)
        : [...current, confidence],
    )

  const toggleRow = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allExpanded = filtered.length > 0 && filtered.every((row) => expanded.has(row.id))
  const toggleAll = () =>
    setExpanded(allExpanded ? new Set() : new Set(filtered.map((row) => row.id)))

  const reset = () => {
    setQuery('')
    setActive([])
    setReviewOnly(false)
  }

  return {
    query,
    setQuery,
    active,
    toggle,
    reviewOnly,
    setReviewOnly,
    reviewTotal,
    counts,
    filtered,
    expanded,
    toggleRow,
    allExpanded,
    toggleAll,
    reset,
    isFiltered: query.trim() !== '' || active.length > 0 || reviewOnly,
  }
}

interface ToolbarProps {
  filter: ReturnType<typeof useChecklistFilter<ChecklistRow>>
  placeholder: string
  total: number
}

export function ChecklistToolbar({ filter, placeholder, total }: ToolbarProps) {
  return (
    <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
      <div className="relative min-w-52 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          value={filter.query}
          onChange={(event) => filter.setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <button
        type="button"
        onClick={() => filter.setReviewOnly(!filter.reviewOnly)}
        data-active={filter.reviewOnly}
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-4xl border px-2.5 text-xs font-medium transition-colors',
          'hover:bg-muted data-[active=true]:border-rose-300 data-[active=true]:bg-rose-100 data-[active=true]:text-rose-900',
          'dark:data-[active=true]:border-rose-800 dark:data-[active=true]:bg-rose-950 dark:data-[active=true]:text-rose-300',
        )}
      >
        Solo revisión
        <span className="tabular-nums opacity-70">{filter.reviewTotal}</span>
      </button>

      <div className="flex flex-wrap items-center gap-1">
        {filter.counts.map(({ confidence, count }) => (
          <button
            key={confidence}
            type="button"
            onClick={() => filter.toggle(confidence)}
            data-active={filter.active.includes(confidence)}
            title={`Filtrar por ${CONFIDENCE_LABEL[confidence]}`}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-4xl border px-2.5 text-xs font-medium transition-colors hover:bg-muted',
              FILTER_TONE[confidence],
            )}
          >
            {CONFIDENCE_LABEL[confidence]}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
        {filter.filtered.length}/{total}
      </span>

      {filter.isFiltered ? (
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={filter.reset}>
          Limpiar
        </Button>
      ) : null}

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={filter.toggleAll}
        disabled={filter.filtered.length === 0}
      >
        {filter.allExpanded ? <ChevronsDownUp aria-hidden /> : <ChevronsUpDown aria-hidden />}
        {filter.allExpanded ? 'Colapsar' : 'Expandir'}
      </Button>
    </div>
  )
}

/** Semantic tokens that read as the same colour on both sides. */
const TOKEN_COLORS: { match: RegExp; className: string; label: string }[] = [
  { match: /^(success)/, className: 'bg-emerald-500', label: 'success' },
  { match: /^(urgent|error|critical|destructive|delete)/, className: 'bg-rose-500', label: 'error / urgent' },
  { match: /^(paused|warning|pending)/, className: 'bg-amber-500', label: 'warning / paused' },
  { match: /^(informational|info)/, className: 'bg-sky-500', label: 'informational / info' },
  { match: /^(points|premia)/, className: 'bg-fuchsia-500', label: 'points / premia' },
  { match: /^(brand|primary|solid|filled)/, className: 'bg-indigo-500', label: 'brand / primary' },
  { match: /^(highlight|activated|active|ui-active)/, className: 'bg-teal-500', label: 'highlight / active' },
  { match: /^(neutral|plain|default|stroke)/, className: 'bg-neutral-400', label: 'neutral / default' },
  { match: /^(inverted|inverse)/, className: 'bg-neutral-800', label: 'inverted' },
]

/**
 * Small colour dot for semantic values. Two rows showing the same dot are very
 * likely the same colour in both systems even when the token names differ.
 */
export function TokenSwatch({ value }: { value: string }) {
  if (!value || value === NA) return null
  // Values arrive as `variant=urgent_content`; only the value part carries the colour.
  const raw = value.includes('=') ? value.slice(value.indexOf('=') + 1) : value
  const normalised = raw.toLowerCase().replace(/[_\s]+/g, '-')
  const token = TOKEN_COLORS.find((candidate) => candidate.match.test(normalised))
  if (!token) return null
  return (
    <span
      title={`Color semántico: ${token.label}`}
      className={cn('size-2.5 shrink-0 rounded-full ring-1 ring-black/10', token.className)}
    />
  )
}

export function NaChip() {
  return (
    <Badge
      variant="outline"
      title="Ningún JSON describe este lado del par"
      className="text-muted-foreground border-dashed font-mono"
    >
      {NA}
    </Badge>
  )
}

/** Renders a value as code, or an explicit N/A chip when there is nothing to show. */
export function ValueCell({ value, className }: { value: string; className?: string }) {
  if (!value || value === NA) return <NaChip />
  return (
    <code
      className={cn(
        'bg-muted/60 block max-w-full truncate rounded px-1.5 py-0.5 font-mono text-xs',
        className,
      )}
      title={value}
    >
      {value}
    </code>
  )
}

export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{label}</p>
      <div className="mt-0.5 text-xs break-words">{children}</div>
    </div>
  )
}
