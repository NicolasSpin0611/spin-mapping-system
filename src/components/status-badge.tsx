import {
  ArrowLeftToLine,
  ArrowRightToLine,
  CircleDashed,
  CircleHelp,
  CircleSlash,
  Equal,
  GitCompareArrows,
  Replace,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  CONFIDENCE_LABEL,
  MATCH_STATUS_LABEL,
  VARIANT_STATUS_LABEL,
} from '@/data/types'
import type { Confidence, MatchStatus, VariantStatus } from '@/data/types'
import { cn } from '@/lib/utils'

const MATCH_STYLE: Record<MatchStatus, { className: string; Icon: typeof Equal }> = {
  exact: { className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', Icon: Equal },
  approximate: {
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
    Icon: GitCompareArrows,
  },
  'missing-spinbox': {
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    Icon: CircleSlash,
  },
  'missing-legacy': {
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    Icon: CircleSlash,
  },
  'needs-review': {
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    Icon: TriangleAlert,
  },
}

export function MatchBadge({ status, className }: { status: MatchStatus; className?: string }) {
  const { className: tone, Icon } = MATCH_STYLE[status]
  return (
    <Badge variant="secondary" className={cn(tone, className)}>
      <Icon aria-hidden />
      {MATCH_STATUS_LABEL[status]}
    </Badge>
  )
}

const VARIANT_STYLE: Record<VariantStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  'in-progress': 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  blocked: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  'not-needed': 'bg-neutral-100 text-neutral-500 line-through dark:bg-neutral-800 dark:text-neutral-400',
}

export function VariantStatusBadge({ status }: { status: VariantStatus }) {
  return (
    <Badge variant="secondary" className={VARIANT_STYLE[status]}>
      {VARIANT_STATUS_LABEL[status]}
    </Badge>
  )
}

export function SuggestedBadge() {
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1 border-dashed">
      <CircleDashed aria-hidden />
      suggested
    </Badge>
  )
}

/**
 * How well the pair is backed by the two JSON files. Deliberately colour-coded so a
 * whole table can be scanned at a glance: green is safe, amber is a naming
 * difference, red is a genuine contradiction.
 */
const CONFIDENCE_STYLE: Record<Confidence, { className: string; Icon: typeof Equal; hint: string }> = {
  exact: {
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    Icon: Equal,
    hint: 'Mismo identificador en los dos JSON.',
  },
  similar: {
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
    Icon: GitCompareArrows,
    hint: 'Nombres distintos que parecen significar lo mismo. Necesita confirmación de diseño.',
  },
  renamed: {
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    Icon: Replace,
    hint: 'Emparejado por tabla de alias, no por nombre idéntico.',
  },
  'spinbox-only': {
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    Icon: ArrowRightToLine,
    hint: 'Solo existe en Spinbox: el lado de Legacy queda en N/A.',
  },
  'legacy-only': {
    className: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300',
    Icon: ArrowLeftToLine,
    hint: 'Solo existe en Legacy: el lado de Spinbox queda en N/A.',
  },
  conflict: {
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    Icon: ShieldAlert,
    hint: 'Los dos lados usan el mismo prop para cosas distintas.',
  },
  unknown: {
    className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    Icon: CircleHelp,
    hint: 'Ningún JSON lo describe.',
  },
}

export function ConfidenceBadge({
  confidence,
  className,
  showLabel = true,
}: {
  confidence: Confidence
  className?: string
  showLabel?: boolean
}) {
  const { className: tone, Icon, hint } = CONFIDENCE_STYLE[confidence]
  return (
    <Badge
      variant="secondary"
      title={`${CONFIDENCE_LABEL[confidence]} — ${hint}`}
      className={cn(tone, className)}
    >
      <Icon aria-hidden />
      {showLabel ? CONFIDENCE_LABEL[confidence] : <span className="sr-only">{CONFIDENCE_LABEL[confidence]}</span>}
    </Badge>
  )
}

export const CONFIDENCE_HINT: Record<Confidence, string> = Object.fromEntries(
  Object.entries(CONFIDENCE_STYLE).map(([key, value]) => [key, value.hint]),
) as Record<Confidence, string>

/** Count of blocking findings on a component. Used in the sidebar and the header. */
export function RiskBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <Badge
      variant="secondary"
      title={`${count} hallazgo${count === 1 ? '' : 's'} que requiere${count === 1 ? '' : 'n'} revisión`}
      className={cn(
        'bg-rose-100 tabular-nums text-rose-800 dark:bg-rose-950 dark:text-rose-300',
        className,
      )}
    >
      <TriangleAlert aria-hidden />
      {count}
    </Badge>
  )
}

export function WarnBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <Badge
      variant="secondary"
      title={`${count} advertencia${count === 1 ? '' : 's'}`}
      className={cn('bg-amber-100 tabular-nums text-amber-900 dark:bg-amber-950 dark:text-amber-300', className)}
    >
      {count}
    </Badge>
  )
}
