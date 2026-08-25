import { ListChecks, Plus, Trash2 } from 'lucide-react'
import { EmptyPanel } from '@/components/embed-panel'
import { SuggestedBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VARIANT_STATUS_LABEL } from '@/data/types'
import type { ComponentMapping, VariantStatus } from '@/data/types'
import { useMapping } from '@/store/mapping-store'

const STATUSES = Object.keys(VARIANT_STATUS_LABEL) as VariantStatus[]

export function VariantChecklist({ component }: { component: ComponentMapping }) {
  const { addVariant, updateVariant, removeVariant } = useMapping()
  const counted = component.variants.filter((variant) => variant.status !== 'not-needed')
  const done = counted.filter((variant) => variant.status === 'done').length
  const percent = counted.length === 0 ? 0 : Math.round((done / counted.length) * 100)

  return (
    <section className="bg-card rounded-xl border shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4" aria-hidden />
            Variants to map
          </h2>
          <p className="text-muted-foreground text-xs">
            Write the Spinbox variant next to the Spin Legacy one it replaces. Names rarely match, so keep both.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Progress value={percent} />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {done}/{counted.length} done
          </span>
          <Button size="sm" variant="outline" onClick={() => addVariant(component.id)}>
            <Plus aria-hidden />
            Add variant
          </Button>
        </div>
      </header>

      {component.variants.length === 0 ? (
        <EmptyPanel
          Icon={ListChecks}
          title="No variants written down yet"
          description={`Nothing has been mapped for ${component.title}. Open both panels above and list every variant that has to be rebuilt.`}
          action={
            <Button size="sm" onClick={() => addVariant(component.id)}>
              <Plus aria-hidden />
              Add the first variant
            </Button>
          }
        />
      ) : (
        <div className="divide-y">
          <div className="text-muted-foreground hidden items-center gap-3 px-4 py-2 text-xs font-medium md:grid md:grid-cols-[1fr_1fr_150px_1fr_36px]">
            <span>Spinbox variant</span>
            <span>Spin Legacy variant</span>
            <span>Status</span>
            <span>Notes</span>
            <span className="sr-only">Actions</span>
          </div>
          {component.variants.map((variant) => (
            <div
              key={variant.id}
              className="hover:bg-muted/40 grid gap-2 px-4 py-3 transition-colors md:grid-cols-[1fr_1fr_150px_1fr_36px] md:items-center md:gap-3"
            >
              <label className="grid gap-1">
                <span className="text-muted-foreground text-xs md:hidden">Spinbox variant</span>
                <div className="flex items-center gap-2">
                  <Input
                    value={variant.spinboxName}
                    placeholder="e.g. Primary"
                    onChange={(event) =>
                      updateVariant(component.id, variant.id, { spinboxName: event.target.value })
                    }
                  />
                  {variant.suggested ? <SuggestedBadge /> : null}
                </div>
              </label>
              <label className="grid gap-1">
                <span className="text-muted-foreground text-xs md:hidden">Spin Legacy variant</span>
                <Input
                  value={variant.legacyName}
                  placeholder="e.g. Botón primario"
                  onChange={(event) => updateVariant(component.id, variant.id, { legacyName: event.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-muted-foreground text-xs md:hidden">Status</span>
                <Select
                  value={variant.status}
                  onValueChange={(value) =>
                    updateVariant(component.id, variant.id, { status: value as VariantStatus })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {VARIANT_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1">
                <span className="text-muted-foreground text-xs md:hidden">Notes</span>
                <Input
                  value={variant.notes}
                  placeholder="Token gaps, missing states, owner…"
                  onChange={(event) => updateVariant(component.id, variant.id, { notes: event.target.value })}
                />
              </label>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeVariant(component.id, variant.id)}
                  title="Remove variant"
                >
                  <Trash2 aria-hidden />
                  <span className="sr-only">Remove variant</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
