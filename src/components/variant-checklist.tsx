import { ChevronDown, ChevronRight, ListChecks, Plus, TriangleAlert, Trash2 } from 'lucide-react'
import {
  ChecklistToolbar,
  DetailField,
  TokenSwatch,
  useChecklistFilter,
} from '@/components/checklist-parts'
import { EmptyPanel } from '@/components/embed-panel'
import { ConfidenceBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CONFIDENCE_NEEDS_REVIEW, NA } from '@/data/types'
import type { ComponentMapping, VariantMapping } from '@/data/types'
import { useMapping } from '@/store/mapping-store'
import { cn } from '@/lib/utils'

const GRID =
  'md:grid-cols-[1.75rem_minmax(5.5rem,7rem)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(7.5rem,auto)_1.75rem]'

export function VariantChecklist({ component }: { component: ComponentMapping }) {
  const { addVariant, updateVariant, removeVariant } = useMapping()

  const filter = useChecklistFilter(component.variants, (row) =>
    [row.spinboxName, row.legacyName, row.axis, row.notes, row.reviewReason].filter(Boolean).join(' '),
  )

  const axes = [...new Set(component.variants.map((variant) => variant.axis).filter(Boolean))] as string[]

  return (
    <section className="bg-card rounded-xl border shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4" aria-hidden />
            Variants &amp; colors to map
          </h2>
          <p className="text-muted-foreground text-xs">
            Solo valores declarados como tipos enumerados en los dos JSON. Los puntos de color marcan tokens
            semánticamente equivalentes.
          </p>
          {axes.length > 0 ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">Ejes</span>
              {axes.map((axis) => (
                <Badge key={axis} variant="outline" className="font-mono">
                  {axis}
                </Badge>
              ))}
            </p>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={() => addVariant(component.id)}>
          <Plus aria-hidden />
          Add variant
        </Button>
      </header>

      {component.variants.length === 0 ? (
        <EmptyPanel
          Icon={ListChecks}
          title="Ningún JSON declara variantes"
          description={`Ni components-props-spinbox.json ni components-props-pagopop-parity.json declaran colores, tamaños o estados enumerados para ${component.title}. Las variantes solo pueden confirmarse en Figma.`}
          action={
            <Button size="sm" onClick={() => addVariant(component.id)}>
              <Plus aria-hidden />
              Añadir la primera variante a mano
            </Button>
          }
        />
      ) : (
        <>
          <ChecklistToolbar
            filter={filter}
            placeholder="Buscar variante, eje o motivo de revisión…"
            total={component.variants.length}
          />

          {filter.filtered.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              Ninguna variante coincide con el filtro.
            </p>
          ) : (
            <div className="divide-y overflow-x-auto">
              <div
                className={cn(
                  'text-muted-foreground hidden min-w-[40rem] items-center gap-3 px-4 py-2 text-xs font-medium md:grid',
                  GRID,
                )}
              >
                <span aria-hidden className="size-6" />
                <span>Eje</span>
                <span>Spinbox</span>
                <span>Spin Legacy</span>
                <span>Evidencia</span>
                <span aria-hidden className="size-6" />
              </div>

              {filter.filtered.map((variant) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  expanded={filter.expanded.has(variant.id)}
                  onToggle={() => filter.toggleRow(variant.id)}
                  onUpdate={(patch) => updateVariant(component.id, variant.id, patch)}
                  onRemove={() => removeVariant(component.id, variant.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

interface VariantRowProps {
  variant: VariantMapping
  expanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<VariantMapping>) => void
  onRemove: () => void
}

function VariantRow({ variant, expanded, onToggle, onUpdate, onRemove }: VariantRowProps) {
  const confidence = variant.confidence ?? 'unknown'
  const flagged = CONFIDENCE_NEEDS_REVIEW[confidence]

  return (
    <div className={cn(flagged && confidence === 'conflict' && 'bg-rose-50/40 dark:bg-rose-950/10')}>
      <div
        className={cn(
          'hover:bg-muted/40 grid min-w-[40rem] gap-2 px-4 py-2.5 transition-colors md:items-center md:gap-3',
          GRID,
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          title={expanded ? 'Ocultar detalle' : 'Ver detalle'}
          className="text-muted-foreground hover:text-foreground hidden size-6 shrink-0 items-center justify-center rounded transition-colors md:flex"
        >
          {expanded ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
          <span className="sr-only">Detalle de {variant.spinboxName || variant.legacyName}</span>
        </button>

        <div className="min-w-0">
          {variant.axis ? (
            <Badge variant="outline" className="max-w-full font-mono" title={variant.axis}>
              <span className="truncate">{variant.axis}</span>
            </Badge>
          ) : (
            <span className="text-muted-foreground font-mono text-xs">{NA}</span>
          )}
        </div>

        <label className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-xs md:hidden">Spinbox</span>
          <div className="flex min-w-0 items-center gap-1.5">
            <TokenSwatch value={variant.spinboxName} />
            <Input
              value={variant.spinboxName}
              placeholder="e.g. variant=filled"
              className="h-8 min-w-0 font-mono text-xs"
              onChange={(event) => onUpdate({ spinboxName: event.target.value })}
            />
          </div>
        </label>

        <label className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-xs md:hidden">Spin Legacy</span>
          <div className="flex min-w-0 items-center gap-1.5">
            <TokenSwatch value={variant.legacyName} />
            <Input
              value={variant.legacyName}
              placeholder="e.g. type=solid"
              className="h-8 min-w-0 font-mono text-xs"
              onChange={(event) => onUpdate({ legacyName: event.target.value })}
            />
          </div>
        </label>

        <div className="flex min-w-0 items-center overflow-hidden">
          <ConfidenceBadge confidence={confidence} />
        </div>

        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground text-xs underline md:hidden"
          >
            {expanded ? 'Ocultar' : 'Detalle'}
          </button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} title="Remove variant">
            <Trash2 aria-hidden />
            <span className="sr-only">Remove variant</span>
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="bg-muted/40 space-y-3 border-t px-4 py-3 md:pl-11">
          {variant.reviewReason ? (
            <div
              className={cn(
                'flex gap-2 rounded-lg border px-3 py-2 text-xs',
                confidence === 'conflict'
                  ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
              )}
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <p>{variant.reviewReason}</p>
            </div>
          ) : null}

          <DetailField label="Descripción del prop en el JSON">
            {variant.notes ? (
              <p className="text-muted-foreground">{variant.notes}</p>
            ) : (
              <span className="text-muted-foreground font-mono">{NA}</span>
            )}
          </DetailField>

          <label className="grid gap-1">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Notas del equipo
            </span>
            <Input
              value={variant.notes}
              placeholder="Token equivalente, decisión de diseño, dueño…"
              className="h-8 text-xs"
              onChange={(event) => onUpdate({ notes: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
