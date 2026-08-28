import { TriangleAlert } from 'lucide-react'
import type { ComponentMapping } from '@/data/types'
import { Progress } from '@/components/ui/progress'
import { CONFIDENCE_NEEDS_REVIEW, riskCount } from '@/data/types'
import { coverageOf } from '@/store/mapping-store'
import { cn } from '@/lib/utils'

export function CoverageSummary({ components }: { components: ComponentMapping[] }) {
  const coverage = coverageOf(components)

  const flagged = components.filter((component) => riskCount(component) > 0).length
  const rows = components.flatMap((component) => [...component.propMappings, ...component.variants])
  const needsDecision = rows.filter((row) => CONFIDENCE_NEEDS_REVIEW[row.confidence ?? 'unknown']).length
  const backedByJson = components.filter(
    (component) => component.audit?.spinboxComponent && component.audit?.legacyComponent,
  ).length

  const stats = [
    { label: 'Components mapped', value: coverage.components, hint: 'filas del documento de mapeo' },
    { label: 'Pares en ambos JSON', value: backedByJson, hint: 'Spinbox + parity declaran el componente' },
    {
      label: 'Componentes por revisar',
      value: flagged,
      hint: 'con hallazgos que bloquean el mapeo',
      alert: flagged > 0,
    },
    {
      label: 'Filas sin decidir',
      value: needsDecision,
      hint: `de ${rows.length} props + variantes`,
      alert: needsDecision > 0,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'bg-card rounded-xl border p-3 shadow-sm',
              stat.alert && 'border-rose-300 dark:border-rose-900',
            )}
          >
            <p className="flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
              {stat.value}
              {stat.alert ? (
                <TriangleAlert className="size-4 text-rose-600 dark:text-rose-400" aria-hidden />
              ) : null}
            </p>
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="text-muted-foreground text-xs">{stat.hint}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Mapping progress (props + variants)</p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {coverage.propMappingsDone + coverage.variantsDone} done · {coverage.propMappings} props ·{' '}
            {coverage.variants} variants
          </p>
        </div>
        <Progress value={coverage.percentDone} className="mt-2" />
      </div>
    </div>
  )
}
