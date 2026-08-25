import type { ComponentMapping } from '@/data/types'
import { Progress } from '@/components/ui/progress'
import { coverageOf } from '@/store/mapping-store'

export function CoverageSummary({ components }: { components: ComponentMapping[] }) {
  const coverage = coverageOf(components)

  const stats = [
    { label: 'Components mapped', value: coverage.components, hint: 'rows from the mapping document' },
    { label: 'In both systems', value: coverage.inBothSystems, hint: 'Spinbox docs + Figma node linked' },
    { label: 'Missing in Spinbox', value: coverage.missingSpinbox, hint: 'has to be built or replaced' },
    { label: 'Needs review', value: coverage.needsReview, hint: 'conflicting or unclear source' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border p-3 shadow-sm">
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="text-muted-foreground text-xs">{stat.hint}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Variant mapping progress</p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {coverage.variantsDone} done · {coverage.variantsPending} pending · {coverage.variants} total
          </p>
        </div>
        <Progress value={coverage.percentDone} className="mt-2" />
      </div>
    </div>
  )
}
