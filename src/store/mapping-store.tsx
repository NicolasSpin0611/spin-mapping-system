import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SEED_DATASET } from '@/data/seed'
import type { ComponentMapping, MappingDataset, PropMapping, VariantMapping } from '@/data/types'

const STORAGE_KEY = 'spin-mapping:dataset:v1'

function isDataset(value: unknown): value is MappingDataset {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MappingDataset>
  return (
    Array.isArray(candidate.components) &&
    typeof candidate.revision === 'number' &&
    candidate.components.every(
      (component) =>
        Array.isArray((component as ComponentMapping).variants) &&
        Array.isArray((component as ComponentMapping).propMappings),
    )
  )
}

/**
 * Local edits are dropped when the committed seed moves ahead of them: a seed bump
 * means the mapping itself was corrected, and keeping the old copy would hide it.
 */
function readStored(): MappingDataset | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isDataset(parsed)) return null
    if (parsed.revision < SEED_DATASET.revision) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export interface MappingStore {
  dataset: MappingDataset
  /** True when the local copy differs from the committed seed data. */
  hasLocalEdits: boolean
  seedRevision: number
  updateComponent: (id: string, patch: Partial<ComponentMapping>) => void
  addComponent: () => string
  removeComponent: (id: string) => void
  addVariant: (componentId: string) => void
  updateVariant: (componentId: string, variantId: string, patch: Partial<VariantMapping>) => void
  removeVariant: (componentId: string, variantId: string) => void
  addPropMapping: (componentId: string) => void
  updatePropMapping: (componentId: string, propId: string, patch: Partial<PropMapping>) => void
  removePropMapping: (componentId: string, propId: string) => void
  importDataset: (dataset: MappingDataset) => void
  resetToSeed: () => void
}

const MappingContext = createContext<MappingStore | null>(null)

export function MappingProvider({ children }: { children: ReactNode }) {
  const [stored] = useState(readStored)
  const [dataset, setDataset] = useState<MappingDataset>(() => stored ?? clone(SEED_DATASET))
  const [hasLocalEdits, setHasLocalEdits] = useState(stored !== null)

  useEffect(() => {
    if (!hasLocalEdits) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
    } catch {
      // Private-mode or quota errors: the app still works, edits just do not persist.
    }
  }, [dataset, hasLocalEdits])

  const mutate = useCallback((updater: (draft: MappingDataset) => void) => {
    setHasLocalEdits(true)
    setDataset((current) => {
      const next = clone(current)
      updater(next)
      next.updatedAt = new Date().toISOString().slice(0, 10)
      return next
    })
  }, [])

  const mutateComponent = useCallback(
    (componentId: string, updater: (component: ComponentMapping) => void) => {
      mutate((draft) => {
        const component = draft.components.find((item) => item.id === componentId)
        if (component) updater(component)
      })
    },
    [mutate],
  )

  const value = useMemo<MappingStore>(
    () => ({
      dataset,
      hasLocalEdits,
      seedRevision: SEED_DATASET.revision,
      updateComponent: (id, patch) => mutateComponent(id, (component) => Object.assign(component, patch)),
      addComponent: () => {
        const id = `component-${Date.now().toString(36)}`
        mutate((draft) => {
          draft.components.unshift({
            id,
            title: 'New component',
            category: 'Data display',
            match: 'needs-review',
            spinbox: { label: '', url: null, kind: 'none', note: '' },
            legacy: { label: '', url: null, kind: 'none', note: '' },
            notes: '',
            variants: [],
            propMappings: [],
          })
        })
        return id
      },
      removeComponent: (id) =>
        mutate((draft) => {
          draft.components = draft.components.filter((component) => component.id !== id)
        }),
      addVariant: (componentId) =>
        mutateComponent(componentId, (component) => {
          component.variants.push({
            id: `${componentId}-v${Date.now().toString(36)}`,
            spinboxName: '',
            legacyName: '',
            status: 'pending',
            notes: '',
          })
        }),
      updateVariant: (componentId, variantId, patch) =>
        mutateComponent(componentId, (component) => {
          const variant = component.variants.find((item) => item.id === variantId)
          if (variant) Object.assign(variant, patch, patch.suggested === undefined ? { suggested: false } : {})
        }),
      removeVariant: (componentId, variantId) =>
        mutateComponent(componentId, (component) => {
          component.variants = component.variants.filter((variant) => variant.id !== variantId)
        }),
      addPropMapping: (componentId) =>
        mutateComponent(componentId, (component) => {
          component.propMappings.push({
            id: `${componentId}-p${Date.now().toString(36)}`,
            spinboxProp: '',
            legacyProp: '',
            status: 'pending',
            notes: '',
          })
        }),
      updatePropMapping: (componentId, propId, patch) =>
        mutateComponent(componentId, (component) => {
          const mapping = component.propMappings.find((item) => item.id === propId)
          if (mapping) Object.assign(mapping, patch, patch.suggested === undefined ? { suggested: false } : {})
        }),
      removePropMapping: (componentId, propId) =>
        mutateComponent(componentId, (component) => {
          component.propMappings = component.propMappings.filter((mapping) => mapping.id !== propId)
        }),
      importDataset: (incoming) => {
        setHasLocalEdits(true)
        setDataset(clone(incoming))
      },
      resetToSeed: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
        setHasLocalEdits(false)
        setDataset(clone(SEED_DATASET))
      },
    }),
    [dataset, hasLocalEdits, mutate, mutateComponent],
  )

  return <MappingContext.Provider value={value}>{children}</MappingContext.Provider>
}

export function useMapping(): MappingStore {
  const store = useContext(MappingContext)
  if (!store) throw new Error('useMapping must be used inside <MappingProvider>')
  return store
}

export interface Coverage {
  components: number
  inBothSystems: number
  missingSpinbox: number
  missingLegacy: number
  needsReview: number
  variants: number
  variantsDone: number
  variantsPending: number
  propMappings: number
  propMappingsDone: number
  percentDone: number
}

export function coverageOf(components: ComponentMapping[]): Coverage {
  const variants = components.flatMap((component) => component.variants)
  const propMappings = components.flatMap((component) => component.propMappings)
  const variantsDone = variants.filter((variant) => variant.status === 'done').length
  const propsDone = propMappings.filter((mapping) => mapping.status === 'done').length
  const variantsCounted = variants.filter((variant) => variant.status !== 'not-needed').length
  const propsCounted = propMappings.filter((mapping) => mapping.status !== 'not-needed').length
  const totalCounted = variantsCounted + propsCounted
  const totalDone = variantsDone + propsDone

  return {
    components: components.length,
    inBothSystems: components.filter(
      (component) => Boolean(component.spinbox.url) && component.legacy.kind === 'figma',
    ).length,
    missingSpinbox: components.filter((component) => component.match === 'missing-spinbox').length,
    missingLegacy: components.filter((component) => component.match === 'missing-legacy').length,
    needsReview: components.filter((component) => component.match === 'needs-review').length,
    variants: variants.length,
    variantsDone,
    variantsPending: variants.filter((variant) => variant.status === 'pending').length,
    propMappings: propMappings.length,
    propMappingsDone: propsDone,
    percentDone: totalCounted === 0 ? 0 : Math.round((totalDone / totalCounted) * 100),
  }
}
