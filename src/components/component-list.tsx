import { useMemo, useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MATCH_STATUS_LABEL } from '@/data/types'
import type { ComponentMapping, MatchStatus } from '@/data/types'
import { cn } from '@/lib/utils'

type Filter = 'all' | MatchStatus | 'unfinished'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All components' },
  { value: 'unfinished', label: 'With pending variants' },
  ...(Object.keys(MATCH_STATUS_LABEL) as MatchStatus[]).map((status) => ({
    value: status as Filter,
    label: MATCH_STATUS_LABEL[status],
  })),
]

function matchesFilter(component: ComponentMapping, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'unfinished') {
    return (
      component.variants.length === 0 ||
      component.variants.some((variant) => variant.status === 'pending' || variant.status === 'in-progress')
    )
  }
  return component.match === filter
}

interface ComponentListProps {
  components: ComponentMapping[]
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

export function ComponentList({ components, selectedId, onSelect, className }: ComponentListProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = components.filter((component) => {
      if (!matchesFilter(component, filter)) return false
      if (!needle) return true
      const haystack = [
        component.title,
        component.category,
        component.spinbox.label,
        component.legacy.label,
        ...component.variants.flatMap((variant) => [variant.spinboxName, variant.legacyName]),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })

    const byCategory = new Map<string, ComponentMapping[]>()
    for (const component of filtered) {
      const bucket = byCategory.get(component.category) ?? []
      bucket.push(component)
      byCategory.set(component.category, bucket)
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [components, filter, query])

  const total = groups.reduce((sum, [, items]) => sum + items.length, 0)

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <div className="space-y-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components or variants"
            className="pl-8"
            aria-label="Search components"
          />
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          {total} of {components.length} components
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {total === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <SearchX className="size-5" aria-hidden />
            <p className="text-sm font-medium text-foreground">No component matches</p>
            <p className="text-xs">Try another name, or clear the filter to see the full mapping.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(([category, items]) => (
              <div key={category}>
                <p className="text-muted-foreground px-1 pb-1 text-xs font-semibold tracking-wide uppercase">
                  {category}
                </p>
                <ul className="space-y-1">
                  {items.map((component) => {
                    const pending = component.variants.filter((variant) => variant.status === 'pending').length
                    const isSelected = component.id === selectedId
                    return (
                      <li key={component.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(component.id)}
                          aria-current={isSelected ? 'true' : undefined}
                          className={cn(
                            'hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                            isSelected && 'bg-primary/10 hover:bg-primary/10 ring-primary/30 ring-1',
                          )}
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{component.title}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {component.spinbox.url ? component.spinbox.label : 'Not in Spinbox'} ·{' '}
                              {component.legacy.label || 'No legacy link'}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1">
                            <StatusDot ok={Boolean(component.spinbox.url)} title="Spinbox reference" />
                            <StatusDot ok={component.legacy.kind === 'figma'} title="Figma reference" />
                            {pending > 0 ? (
                              <Badge variant="outline" className="tabular-nums">
                                {pending}
                              </Badge>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusDot({ ok, title }: { ok: boolean; title: string }) {
  return (
    <span
      title={`${title}: ${ok ? 'linked' : 'missing'}`}
      className={cn('size-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-muted-foreground/30')}
    />
  )
}
