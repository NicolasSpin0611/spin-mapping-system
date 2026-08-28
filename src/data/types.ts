export type DesignSystem = 'spinbox' | 'legacy'

export type SourceKind = 'spinbox-docs' | 'figma' | 'google-doc' | 'none'

export type MatchStatus =
  | 'exact'
  | 'approximate'
  | 'missing-spinbox'
  | 'missing-legacy'
  | 'needs-review'

export type VariantStatus = 'pending' | 'in-progress' | 'done' | 'blocked' | 'not-needed'

/**
 * How much the pair is backed by components-props-spinbox.json and
 * components-props-pagopop-parity.json. Anything other than `exact` needs a human decision.
 */
export type Confidence =
  /** Same identifier on both sides. */
  | 'exact'
  /** Different spelling, same meaning (filled ↔ solid, informational ↔ info). */
  | 'similar'
  /** Paired through the alias table, so the intent is inferred rather than proven. */
  | 'renamed'
  /** Exists in Spinbox only — the Legacy side is N/A. */
  | 'spinbox-only'
  /** Exists in Legacy only — the Spinbox side is N/A. */
  | 'legacy-only'
  /** Both sides expose the axis but the values describe different things. */
  | 'conflict'
  /** Neither JSON describes it, so nothing can be asserted. */
  | 'unknown'

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  exact: 'Exacto',
  similar: 'Similar',
  renamed: 'Renombrado',
  'spinbox-only': 'Solo Spinbox',
  'legacy-only': 'Solo Legacy',
  conflict: 'Conflicto',
  unknown: 'Sin datos',
}

/** `exact` needs no attention; everything else is surfaced with a badge. */
export const CONFIDENCE_NEEDS_REVIEW: Record<Confidence, boolean> = {
  exact: false,
  similar: true,
  renamed: true,
  'spinbox-only': true,
  'legacy-only': true,
  conflict: true,
  unknown: true,
}

export interface Source {
  /** Name the component has inside that design system. */
  label: string
  url: string | null
  kind: SourceKind
  /** Shown in the panel when there is nothing to embed, or as a caveat. */
  note?: string
  /** Secondary references, e.g. Activity loader + Skeleton both map to Loaders. */
  extra?: { label: string; url: string }[]
}

export interface VariantMapping {
  id: string
  spinboxName: string
  legacyName: string
  status: VariantStatus
  notes: string
  /** Pre-filled starting point from the mapping doc, not a confirmed pair yet. */
  suggested?: boolean
  /** Prop that carries the variant, e.g. `variant`, `size`, `color`. */
  axis?: string
  confidence?: Confidence
  /** Why a human still has to decide. Empty when the pair is safe. */
  reviewReason?: string
}

/** Nearly 1:1 prop mapping between Spinbox and Legacy APIs. */
export interface PropMapping {
  id: string
  spinboxProp: string
  legacyProp: string
  spinboxType?: string
  legacyType?: string
  status: VariantStatus
  notes: string
  suggested?: boolean
  confidence?: Confidence
  reviewReason?: string
  /** Doc comment from components-props-spinbox.json. */
  spinboxDescription?: string
  /** Doc comment from components-props-pagopop-parity.json. */
  legacyDescription?: string
}

export interface AuditIssue {
  level: 'warn' | 'risk'
  title: string
  detail: string
}

/** What the two JSON files can and cannot prove about a component pair. */
export interface ComponentAudit {
  /** Share of rows (0–100) that are an exact or clearly similar pair. */
  parity: number
  issues: AuditIssue[]
  /** Component name inside components-props-spinbox.json, or null when absent. */
  spinboxComponent: string | null
  /** Component name inside components-props-pagopop-parity.json, or null when absent. */
  legacyComponent: string | null
  /** `source` path reported by the JSON, useful to spot sub-components. */
  legacySource: string | null
  /** Variant axes (enum props) found on each side. */
  spinboxAxes: string[]
  legacyAxes: string[]
}

export type VariantDraft = Omit<VariantMapping, 'id'>
export type PropMappingDraft = Omit<PropMapping, 'id'>

export interface ComponentMapping {
  id: string
  title: string
  category: string
  match: MatchStatus
  spinbox: Source
  legacy: Source
  notes: string
  /** Color, size, and visual state values (e.g. variant=filled → Default). */
  variants: VariantMapping[]
  /** Prop name pairs extracted from components-props-*.json. */
  propMappings: PropMapping[]
  /** Evidence available in the two JSON files. Absent for hand-written rows. */
  audit?: ComponentAudit
}

export const NA = 'N/A'

export function needsReview(component: ComponentMapping): boolean {
  return (
    (component.audit?.issues.some((issue) => issue.level === 'risk') ?? false) ||
    component.match === 'needs-review'
  )
}

export function riskCount(component: ComponentMapping): number {
  return component.audit?.issues.filter((issue) => issue.level === 'risk').length ?? 0
}

export interface MappingDataset {
  /** Bumped whenever the committed seed data changes. */
  revision: number
  updatedAt: string
  components: ComponentMapping[]
}

export const CATEGORIES = [
  'Buttons',
  'Cards',
  'Controls',
  'Data display',
  'Inputs',
  'Loaders',
  'Modals',
  'Navigation',
  'System feedback',
  'Tagging & categorization',
  'Templates',
  'Typography',
] as const

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  exact: 'Direct match',
  approximate: 'Approximate',
  'missing-spinbox': 'Missing in Spinbox',
  'missing-legacy': 'Missing in Legacy',
  'needs-review': 'Needs review',
}

export const VARIANT_STATUS_LABEL: Record<VariantStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In progress',
  done: 'Done',
  blocked: 'Blocked',
  'not-needed': 'Not needed',
}
