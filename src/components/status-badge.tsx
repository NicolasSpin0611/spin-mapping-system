import { AlertTriangle, CircleDashed, CircleSlash, Equal, GitCompareArrows } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MATCH_STATUS_LABEL, VARIANT_STATUS_LABEL } from '@/data/types'
import type { MatchStatus, VariantStatus } from '@/data/types'
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
    Icon: AlertTriangle,
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
