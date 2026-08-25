import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SEED_DATASET } from '@/data/seed'
import type { ComponentMapping, MappingDataset, VariantMapping } from '@/data/types'

const STORAGE_KEY = 'spin-mapping:dataset:v1'

function isDataset(value: unknown): value is MappingDataset {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MappingDataset>
  return Array.isArray(candidate.components) && typeof candidate.revision === 'number'
}

function readStored(): MappingDataset | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isDataset(parsed) ? parsed : null
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
  percentDone: number
}

export function coverageOf(components: ComponentMapping[]): Coverage {
  const variants = components.flatMap((component) => component.variants)
  const done = variants.filter((variant) => variant.status === 'done').length
  const counted = variants.filter((variant) => variant.status !== 'not-needed').length

  return {
    components: components.length,
    inBothSystems: components.filter(
      (component) => Boolean(component.spinbox.url) && component.legacy.kind === 'figma',
    ).length,
    missingSpinbox: components.filter((component) => component.match === 'missing-spinbox').length,
    missingLegacy: components.filter((component) => component.match === 'missing-legacy').length,
    needsReview: components.filter((component) => component.match === 'needs-review').length,
    variants: variants.length,
    variantsDone: done,
    variantsPending: variants.filter((variant) => variant.status === 'pending').length,
    percentDone: counted === 0 ? 0 : Math.round((done / counted) * 100),
  }
}
