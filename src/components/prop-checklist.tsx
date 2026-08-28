import { Braces, ChevronDown, ChevronRight, Plus, TriangleAlert, Trash2 } from 'lucide-react'
import {
  ChecklistToolbar,
  DetailField,
  TokenSwatch,
  ValueCell,
  useChecklistFilter,
} from '@/components/checklist-parts'
import { EmptyPanel } from '@/components/embed-panel'
import { ConfidenceBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CONFIDENCE_NEEDS_REVIEW, NA } from '@/data/types'
import type { ComponentMapping, PropMapping } from '@/data/types'
import { useMapping } from '@/store/mapping-store'
import { cn } from '@/lib/utils'

const GRID =
  'lg:grid-cols-[1.75rem_minmax(7.5rem,1.1fr)_minmax(7.5rem,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(7.5rem,auto)_1.75rem]'

export function PropChecklist({ component }: { component: ComponentMapping }) {
  const { addPropMapping, updatePropMapping, removePropMapping } = useMapping()

  const filter = useChecklistFilter(component.propMappings, (row) =>
    [row.spinboxProp, row.legacyProp, row.spinboxType, row.legacyType, row.notes, row.reviewReason]
      .filter(Boolean)
      .join(' '),
  )

  return (
    <section className="bg-card rounded-xl border shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Braces className="size-4" aria-hidden />
            Props to map
          </h2>
          <p className="text-muted-foreground text-xs">
            Pares de props extraídos de components-props-spinbox.json y components-props-pagopop-parity.json. Todo
            lo que los JSON no describen aparece como <span className="font-mono">{NA}</span>.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => addPropMapping(component.id)}>
          <Plus aria-hidden />
          Add prop
        </Button>
      </header>

      {component.propMappings.length === 0 ? (
        <EmptyPanel
          Icon={Braces}
          title="No props mapped yet"
          description={`Ningún JSON describe las props de ${component.title}. Ábrelo en los paneles de arriba y anota cada prop que haya que alinear.`}
          action={
            <Button size="sm" onClick={() => addPropMapping(component.id)}>
              <Plus aria-hidden />
              Add the first prop
            </Button>
          }
        />
      ) : (
        <>
          <ChecklistToolbar
            filter={filter}
            placeholder="Buscar prop, tipo o motivo de revisión…"
            total={component.propMappings.length}
          />

          {filter.filtered.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              Ninguna prop coincide con el filtro.
            </p>
          ) : (
            <div className="divide-y overflow-x-auto">
              <div
                className={cn(
                  'text-muted-foreground hidden min-w-[48rem] items-center gap-3 px-4 py-2 text-xs font-medium lg:grid',
                  GRID,
                )}
              >
                <span aria-hidden className="size-6" />
                <span>Spinbox prop</span>
                <span>Legacy prop</span>
                <span>Spinbox type</span>
                <span>Legacy type</span>
                <span>Evidencia</span>
                <span aria-hidden className="size-6" />
              </div>

              {filter.filtered.map((mapping) => (
                <PropRow
                  key={mapping.id}
                  componentId={component.id}
                  mapping={mapping}
                  expanded={filter.expanded.has(mapping.id)}
                  onToggle={() => filter.toggleRow(mapping.id)}
                  onUpdate={(patch) => updatePropMapping(component.id, mapping.id, patch)}
                  onRemove={() => removePropMapping(component.id, mapping.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

interface PropRowProps {
  componentId: string
  mapping: PropMapping
  expanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<PropMapping>) => void
  onRemove: () => void
}

function PropRow({ mapping, expanded, onToggle, onUpdate, onRemove }: PropRowProps) {
  const confidence = mapping.confidence ?? 'unknown'
  const flagged = CONFIDENCE_NEEDS_REVIEW[confidence]

  return (
    <div className={cn(flagged && confidence === 'conflict' && 'bg-rose-50/40 dark:bg-rose-950/10')}>
      <div
        className={cn(
          'hover:bg-muted/40 grid min-w-[48rem] gap-2 px-4 py-2.5 transition-colors lg:items-center lg:gap-3',
          GRID,
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          title={expanded ? 'Ocultar detalle' : 'Ver detalle'}
          className="text-muted-foreground hover:text-foreground hidden size-6 shrink-0 items-center justify-center rounded transition-colors lg:flex"
        >
          {expanded ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
          <span className="sr-only">Detalle de {mapping.spinboxProp || mapping.legacyProp}</span>
        </button>

        <label className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-xs lg:hidden">Spinbox prop</span>
          <Input
            value={mapping.spinboxProp}
            placeholder="e.g. variant"
            className="h-8 font-mono text-xs"
            onChange={(event) => onUpdate({ spinboxProp: event.target.value })}
          />
        </label>

        <label className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-xs lg:hidden">Legacy prop</span>
          <Input
            value={mapping.legacyProp}
            placeholder="e.g. type"
            className="h-8 min-w-0 font-mono text-xs"
            onChange={(event) => onUpdate({ legacyProp: event.target.value })}
          />
        </label>

        <div className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-xs lg:hidden">Spinbox type</span>
          <ValueCell value={mapping.spinboxType ?? NA} />
        </div>

        <div className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-xs lg:hidden">Legacy type</span>
          <ValueCell value={mapping.legacyType ?? NA} />
        </div>

        <div className="flex min-w-0 items-center overflow-hidden">
          <ConfidenceBadge confidence={confidence} />
        </div>

        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground text-xs underline lg:hidden"
          >
            {expanded ? 'Ocultar' : 'Detalle'}
          </button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} title="Remove prop">
            <Trash2 aria-hidden />
            <span className="sr-only">Remove prop</span>
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="bg-muted/40 space-y-3 border-t px-4 py-3 lg:pl-11">
          {mapping.reviewReason ? (
            <div
              className={cn(
                'flex gap-2 rounded-lg border px-3 py-2 text-xs',
                confidence === 'conflict'
                  ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
              )}
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <p>{mapping.reviewReason}</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Spinbox — descripción">
              {mapping.spinboxDescription ? (
                <p className="text-muted-foreground">{mapping.spinboxDescription}</p>
              ) : (
                <span className="text-muted-foreground font-mono">{NA}</span>
              )}
            </DetailField>
            <DetailField label="Legacy — descripción">
              {mapping.legacyDescription ? (
                <p className="text-muted-foreground">{mapping.legacyDescription}</p>
              ) : (
                <span className="text-muted-foreground font-mono">{NA}</span>
              )}
            </DetailField>
            <DetailField label="Spinbox — tipo completo">
              <span className="flex items-center gap-1.5">
                <TokenSwatch value={mapping.spinboxType ?? ''} />
                <code className="bg-background rounded px-1.5 py-0.5 font-mono">{mapping.spinboxType || NA}</code>
              </span>
            </DetailField>
            <DetailField label="Legacy — tipo completo">
              <span className="flex items-center gap-1.5">
                <TokenSwatch value={mapping.legacyType ?? ''} />
                <code className="bg-background rounded px-1.5 py-0.5 font-mono">{mapping.legacyType || NA}</code>
              </span>
            </DetailField>
          </div>

          <label className="grid gap-1">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Notas del equipo
            </span>
            <Input
              value={mapping.notes}
              placeholder="Decisión tomada, dueño, token equivalente…"
              className="h-8 text-xs"
              onChange={(event) => onUpdate({ notes: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
