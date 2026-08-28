import { NA, riskCount } from '@/data/types'
import type { ComponentMapping, Confidence, PropMapping, VariantMapping } from '@/data/types'

const GAP: Confidence[] = ['spinbox-only', 'legacy-only', 'conflict', 'unknown']

export type PriorityBand = 'start' | 'watch' | 'critical'

export interface ComponentPriority {
  component: ComponentMapping
  band: PriorityBand
  /** Higher = more urgent to review. */
  urgency: number
  parity: number
  bothJson: boolean
  conflicts: number
  gapVariants: number
  gapHandlers: number
  reasons: string[]
}

export interface GapHit {
  name: string
  confidence: Confidence
  side: 'spinbox' | 'legacy' | 'both'
  componentId: string
  componentTitle: string
  detail: string
}

export interface GapGroup {
  name: string
  total: number
  spinboxOnly: number
  legacyOnly: number
  conflicts: number
  components: { id: string; title: string }[]
  hits: GapHit[]
}

export interface PriorityOverview {
  rows: ComponentPriority[]
  startHere: ComponentPriority[]
  critical: ComponentPriority[]
  watch: ComponentPriority[]
  variantGaps: GapGroup[]
  handlerGaps: GapGroup[]
  totals: {
    components: number
    startHere: number
    critical: number
    bothJson: number
    unmatchedVariants: number
    unmatchedHandlers: number
    conflicts: number
  }
}

function isGap(confidence: Confidence | undefined): boolean {
  return GAP.includes(confidence ?? 'unknown')
}

export function isHandlerName(name: string): boolean {
  return /^on[A-Z]/.test(name)
}

function propIdentity(mapping: PropMapping): string {
  if (mapping.spinboxProp && mapping.spinboxProp !== NA) return mapping.spinboxProp
  if (mapping.legacyProp && mapping.legacyProp !== NA) return mapping.legacyProp
  return NA
}

function variantIdentity(variant: VariantMapping): string {
  return variant.axis || (variant.spinboxName !== NA ? variant.spinboxName : variant.legacyName) || NA
}

function sideOf(spinboxValue: string, legacyValue: string): GapHit['side'] {
  const hasSb = Boolean(spinboxValue) && spinboxValue !== NA
  const hasLg = Boolean(legacyValue) && legacyValue !== NA
  if (hasSb && hasLg) return 'both'
  return hasSb ? 'spinbox' : 'legacy'
}

export function scoreComponent(component: ComponentMapping): ComponentPriority {
  const parity = component.audit?.parity ?? 0
  const bothJson = Boolean(component.audit?.spinboxComponent && component.audit?.legacyComponent)
  const risks = riskCount(component)
  const conflicts =
    component.variants.filter((row) => row.confidence === 'conflict').length +
    component.propMappings.filter((row) => row.confidence === 'conflict').length
  const gapVariants = component.variants.filter((row) => isGap(row.confidence)).length
  const gapHandlers = component.propMappings.filter(
    (row) => isHandlerName(propIdentity(row)) && isGap(row.confidence),
  ).length

  const reasons: string[] = []
  if (!component.audit?.spinboxComponent) reasons.push('Sin componente en el JSON de Spinbox')
  if (!component.audit?.legacyComponent) reasons.push('Sin componente en el JSON de Legacy')
  if (conflicts > 0) reasons.push(`${conflicts} eje${conflicts === 1 ? '' : 's'} con valores incompatibles`)
  if (gapHandlers > 0) reasons.push(`${gapHandlers} handler${gapHandlers === 1 ? '' : 's'} sin equivalente`)
  if (gapVariants > 0) reasons.push(`${gapVariants} variante${gapVariants === 1 ? '' : 's'} sin par similar`)
  if (parity < 20 && bothJson) reasons.push(`Paridad JSON ${parity}%`)
  for (const issue of component.audit?.issues ?? []) {
    if (issue.level === 'risk' && !reasons.includes(issue.title)) reasons.push(issue.title)
  }

  const missingJsonPenalty = bothJson ? 0 : 40
  const urgency =
    100 -
    parity +
    risks * 25 +
    conflicts * 20 +
    gapHandlers * 4 +
    gapVariants * 2 +
    missingJsonPenalty

  const missingMatch =
    component.match === 'needs-review' ||
    component.match === 'missing-spinbox' ||
    component.match === 'missing-legacy'

  let band: PriorityBand = 'watch'
  if (bothJson && conflicts === 0 && risks === 0 && parity >= 25) {
    band = 'start'
  } else if (!bothJson || conflicts > 0 || risks > 0 || parity < 15 || missingMatch) {
    band = 'critical'
  }

  return {
    component,
    band,
    urgency,
    parity,
    bothJson,
    conflicts,
    gapVariants,
    gapHandlers,
    reasons: reasons.slice(0, 3),
  }
}

function groupHits(hits: GapHit[]): GapGroup[] {
  const byName = new Map<string, GapHit[]>()
  for (const hit of hits) {
    const bucket = byName.get(hit.name) ?? []
    bucket.push(hit)
    byName.set(hit.name, bucket)
  }

  return [...byName.entries()]
    .map(([name, group]) => {
      const components = new Map<string, string>()
      for (const hit of group) components.set(hit.componentId, hit.componentTitle)
      return {
        name,
        total: group.length,
        spinboxOnly: group.filter((hit) => hit.confidence === 'spinbox-only').length,
        legacyOnly: group.filter((hit) => hit.confidence === 'legacy-only').length,
        conflicts: group.filter((hit) => hit.confidence === 'conflict').length,
        components: [...components.entries()].map(([id, title]) => ({ id, title })),
        hits: group,
      }
    })
    .sort((a, b) => b.conflicts - a.conflicts || b.total - a.total || a.name.localeCompare(b.name))
}

export function buildPriorityOverview(components: ComponentMapping[]): PriorityOverview {
  const rows = components.map(scoreComponent).sort((a, b) => b.urgency - a.urgency)
  const startHere = rows
    .filter((row) => row.band === 'start')
    .sort((a, b) => b.parity - a.parity || a.urgency - b.urgency)
  const critical = rows.filter((row) => row.band === 'critical')
  const watch = rows.filter((row) => row.band === 'watch')

  const variantHits: GapHit[] = []
  const handlerHits: GapHit[] = []

  for (const component of components) {
    for (const variant of component.variants) {
      if (!isGap(variant.confidence) || variant.confidence === 'unknown') continue
      // Skip "similar" — those exist as near-matches. Only true absences and clashes.
      if (variant.confidence === 'spinbox-only' || variant.confidence === 'legacy-only' || variant.confidence === 'conflict') {
        variantHits.push({
          name: variantIdentity(variant),
          confidence: variant.confidence,
          side: sideOf(variant.spinboxName, variant.legacyName),
          componentId: component.id,
          componentTitle: component.title,
          detail:
            variant.reviewReason ||
            `${variant.spinboxName || NA} → ${variant.legacyName || NA}`,
        })
      }
    }

    for (const mapping of component.propMappings) {
      const name = propIdentity(mapping)
      if (!isHandlerName(name)) continue
      if (
        mapping.confidence !== 'spinbox-only' &&
        mapping.confidence !== 'legacy-only' &&
        mapping.confidence !== 'conflict'
      ) {
        continue
      }
      handlerHits.push({
        name,
        confidence: mapping.confidence,
        side: sideOf(mapping.spinboxProp, mapping.legacyProp),
        componentId: component.id,
        componentTitle: component.title,
        detail:
          mapping.reviewReason ||
          `${mapping.spinboxProp || NA} → ${mapping.legacyProp || NA}`,
      })
    }
  }

  const unmatchedVariants = components.reduce(
    (sum, component) => sum + component.variants.filter((row) => isGap(row.confidence) && row.confidence !== 'unknown').length,
    0,
  )
  const unmatchedHandlers = handlerHits.length
  const conflicts = rows.reduce((sum, row) => sum + row.conflicts, 0)

  return {
    rows,
    startHere,
    critical,
    watch,
    variantGaps: groupHits(variantHits),
    handlerGaps: groupHits(handlerHits),
    totals: {
      components: components.length,
      startHere: startHere.length,
      critical: critical.length,
      bothJson: rows.filter((row) => row.bothJson).length,
      unmatchedVariants,
      unmatchedHandlers,
      conflicts,
    },
  }
}
