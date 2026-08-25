export type DesignSystem = 'spinbox' | 'legacy'

export type SourceKind = 'spinbox-docs' | 'figma' | 'google-doc' | 'none'

export type MatchStatus =
  | 'exact'
  | 'approximate'
  | 'missing-spinbox'
  | 'missing-legacy'
  | 'needs-review'

export type VariantStatus = 'pending' | 'in-progress' | 'done' | 'blocked' | 'not-needed'

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
}

export interface ComponentMapping {
  id: string
  title: string
  category: string
  match: MatchStatus
  spinbox: Source
  legacy: Source
  notes: string
  variants: VariantMapping[]
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
