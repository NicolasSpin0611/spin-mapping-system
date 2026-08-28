import { useState } from 'react'
import { ChevronDown, ChevronRight, CircleCheck, Info, ShieldAlert, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CONFIDENCE_LABEL, CONFIDENCE_NEEDS_REVIEW, NA } from '@/data/types'
import type { ComponentMapping, Confidence } from '@/data/types'
import { cn } from '@/lib/utils'

function tally(rows: { confidence?: Confidence }[]) {
  const map = new Map<Confidence, number>()
  for (const row of rows) {
    const confidence = row.confidence ?? 'unknown'
    map.set(confidence, (map.get(confidence) ?? 0) + 1)
  }
  return map
}

/**
 * Says out loud what the two JSON files could and could not prove about this
 * component, so an incomplete mapping is never mistaken for a finished one.
 */
export function AuditPanel({ component }: { component: ComponentMapping }) {
  const [open, setOpen] = useState(false)
  const audit = component.audit
  if (!audit) return null

  const risks = audit.issues.filter((issue) => issue.level === 'risk')
  const warnings = audit.issues.filter((issue) => issue.level === 'warn')

  const rows = [...component.propMappings, ...component.variants]
  const counts = tally(rows)
  const pendingReview = rows.filter((row) => CONFIDENCE_NEEDS_REVIEW[row.confidence ?? 'unknown']).length

  const tone = risks.length
    ? 'border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20'
    : warnings.length
      ? 'border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20'
      : 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20'

  const HeadIcon = risks.length ? ShieldAlert : warnings.length ? TriangleAlert : CircleCheck

  return (
    <section className={cn('rounded-xl border shadow-sm', tone)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
      >
        {open ? <ChevronDown className="size-4 shrink-0" aria-hidden /> : <ChevronRight className="size-4 shrink-0" aria-hidden />}
        <HeadIcon className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {risks.length
              ? `${risks.length} hallazgo${risks.length === 1 ? '' : 's'} que bloquea${risks.length === 1 ? '' : 'n'} el mapeo`
              : warnings.length
                ? `${warnings.length} advertencia${warnings.length === 1 ? '' : 's'} sobre este par`
                : 'Par respaldado por los dos JSON'}
          </span>
          <span className="text-muted-foreground block text-xs">
            {pendingReview} de {rows.length} filas necesitan una decisión humana · paridad {audit.parity}%
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <span className="w-24">
            <Progress value={audit.parity} />
          </span>
          <span className="text-xs underline">{open ? 'Ocultar' : 'Ver detalle'}</span>
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Componente en Spinbox" value={audit.spinboxComponent} mono />
            <Fact label="Componente en Legacy" value={audit.legacyComponent} mono />
            <Fact label="Ruta del código Legacy" value={audit.legacySource} mono />
            <Fact
              label="Ejes de variante"
              value={
                audit.spinboxAxes.length || audit.legacyAxes.length
                  ? `SB [${audit.spinboxAxes.join(', ') || '—'}] · LG [${audit.legacyAxes.join(', ') || '—'}]`
                  : null
              }
            />
          </div>

          {audit.issues.length > 0 ? (
            <ul className="space-y-2">
              {audit.issues.map((issue) => (
                <li
                  key={issue.title}
                  className={cn(
                    'flex gap-2 rounded-lg border px-3 py-2 text-xs',
                    issue.level === 'risk'
                      ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                      : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
                  )}
                >
                  {issue.level === 'risk' ? (
                    <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  )}
                  <span>
                    <strong className="font-semibold">{issue.title}.</strong> {issue.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground flex gap-2 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Ningún hallazgo: los nombres y los valores enumerados coinciden en los dos JSON.
            </p>
          )}

          <div>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Desglose de evidencia
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[...counts.entries()].map(([confidence, count]) => (
                <Badge
                  key={confidence}
                  variant="outline"
                  className={cn(CONFIDENCE_NEEDS_REVIEW[confidence] && 'border-dashed')}
                >
                  {CONFIDENCE_LABEL[confidence]}
                  <span className="tabular-nums opacity-70">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function Fact({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{label}</p>
      <p className={cn('truncate text-xs', mono && 'font-mono', !value && 'text-muted-foreground')} title={value ?? NA}>
        {value ?? NA}
      </p>
    </div>
  )
}
