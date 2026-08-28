import { useRef, useState } from 'react'
import {
  ClipboardCopy,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { CoverageSummary } from '@/components/coverage-summary'
import { MatchBadge } from '@/components/status-badge'
import { VariantChecklist } from '@/components/variant-checklist'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES, MATCH_STATUS_LABEL } from '@/data/types'
import type { ComponentMapping, MappingDataset, MatchStatus, Source, SourceKind } from '@/data/types'
import { toFigmaEmbedUrl } from '@/lib/embed'
import { useMapping } from '@/store/mapping-store'

const MATCH_STATUSES = Object.keys(MATCH_STATUS_LABEL) as MatchStatus[]

function inferKind(url: string): SourceKind {
  if (!url.trim()) return 'none'
  if (url.includes('figma.com')) return 'figma'
  if (url.includes('docs.google.com')) return 'google-doc'
  return 'spinbox-docs'
}

export function AdminPage({ onOpenComponent }: { onOpenComponent: (id: string) => void }) {
  const { dataset, hasLocalEdits, seedRevision, addComponent, removeComponent, importDataset, resetToSeed } =
    useMapping()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const editing = dataset.components.find((component) => component.id === editingId) ?? null
  const json = JSON.stringify(dataset, null, 2)

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `spin-mapping-${dataset.updatedAt}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Dataset exported')
  }

  const applyImport = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as MappingDataset
      if (!Array.isArray(parsed.components)) throw new Error('missing components array')
      // Imports must not fall behind the seed, or they get discarded on the next reload.
      importDataset({
        revision: Math.max(parsed.revision ?? 0, seedRevision),
        updatedAt: parsed.updatedAt ?? '',
        components: parsed.components,
      })
      setImportOpen(false)
      setImportText('')
      toast.success(`Imported ${parsed.components.length} components`)
    } catch (error) {
      toast.error(`That file is not a valid mapping dataset: ${(error as Error).message}`)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Admin panel</h1>
          <p className="text-muted-foreground text-sm">
            Edit the mapping, fix a wrong link, or add a component the document missed. Changes stay in this browser
            until you export them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={hasLocalEdits ? 'secondary' : 'outline'}>
            {hasLocalEdits ? 'Local edits stored in this browser' : 'Showing committed seed data'}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => onOpenComponent(dataset.components[0]?.id ?? '')}>
            <ExternalLink aria-hidden />
            Back to comparison
          </Button>
        </div>
      </header>

      <CoverageSummary components={dataset.components} />

      <div className="bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3 shadow-sm">
        <Button size="sm" onClick={() => setEditingId(addComponent())}>
          <Plus aria-hidden />
          Add component
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button size="sm" variant="outline" onClick={download}>
          <Download aria-hidden />
          Export JSON
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(json)
              toast.success('Dataset copied to the clipboard')
            } catch {
              toast.error('The browser blocked clipboard access')
            }
          }}
        >
          <ClipboardCopy aria-hidden />
          Copy JSON
        </Button>
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload aria-hidden />
          Import JSON
        </Button>
        <Button size="sm" variant="ghost" onClick={resetToSeed} disabled={!hasLocalEdits}>
          <RotateCcw aria-hidden />
          Reset to seed data
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) applyImport(await file.text())
            event.target.value = ''
          }}
        />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="text-muted-foreground hidden gap-3 border-b px-4 py-2 text-xs font-medium md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_90px_120px]">
          <span>Component</span>
          <span>Category</span>
          <span>Parity</span>
          <span>Variants</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y">
          {dataset.components.map((component) => (
            <li
              key={component.id}
              className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_90px_120px] md:items-center md:gap-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{component.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {component.spinbox.label || '—'} ↔ {component.legacy.label || '—'}
                </p>
              </div>
              <p className="text-muted-foreground truncate text-xs md:text-sm">{component.category}</p>
              <MatchBadge status={component.match} className="w-fit" />
              <p className="text-muted-foreground text-xs tabular-nums">
                {component.variants.filter((variant) => variant.status === 'done').length}/
                {component.variants.length}
              </p>
              <div className="flex gap-1 md:justify-end">
                <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(component.id)} title="Edit">
                  <Pencil aria-hidden />
                  <span className="sr-only">Edit {component.title}</span>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onOpenComponent(component.id)}
                  title="Open comparison"
                >
                  <ExternalLink aria-hidden />
                  <span className="sr-only">Open {component.title}</span>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    removeComponent(component.id)
                    toast.success(`${component.title} removed`)
                  }}
                  title="Delete"
                >
                  <Trash2 aria-hidden />
                  <span className="sr-only">Delete {component.title}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import a mapping dataset</DialogTitle>
            <DialogDescription>
              Paste an exported JSON file, or pick one from disk. This replaces the whole local dataset.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder='{ "revision": 1, "components": [ … ] }'
            className="min-h-40 font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              <Upload aria-hidden />
              Choose file
            </Button>
            <Button onClick={() => applyImport(importText)} disabled={!importText.trim()}>
              Replace dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {editing ? <ComponentEditor component={editing} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ComponentEditor({ component }: { component: ComponentMapping }) {
  const { updateComponent } = useMapping()

  const patchSource = (key: 'spinbox' | 'legacy', patch: Partial<Source>) => {
    const next: Source = { ...component[key], ...patch }
    if (patch.url !== undefined) next.kind = inferKind(patch.url ?? '')
    if (!next.url) next.url = null
    updateComponent(component.id, { [key]: next } as Partial<ComponentMapping>)
  }

  const legacyEmbed = component.legacy.url ? toFigmaEmbedUrl(component.legacy.url) : null

  return (
    <>
      <DialogHeader>
        <DialogTitle>{component.title || 'Untitled component'}</DialogTitle>
        <DialogDescription>
          Links are stored as authored; Figma URLs are converted to <code>embed.figma.com</code> when rendered.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Comparison title">
            <Input
              value={component.title}
              onChange={(event) => updateComponent(component.id, { title: event.target.value })}
            />
          </Field>
          <Field label="Category">
            <Select
              value={component.category}
              onValueChange={(value) => updateComponent(component.id, { category: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Parity">
          <Select
            value={component.match}
            onValueChange={(value) => updateComponent(component.id, { match: value as MatchStatus })}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {MATCH_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Spinbox</p>
            <Field label="Component name">
              <Input
                value={component.spinbox.label}
                onChange={(event) => patchSource('spinbox', { label: event.target.value })}
              />
            </Field>
            <Field label="Documentation URL">
              <Input
                value={component.spinbox.url ?? ''}
                placeholder="https://spinbox.tools.genesysprime.mx/…"
                onChange={(event) => patchSource('spinbox', { url: event.target.value })}
              />
            </Field>
            <Field label="Note shown in the empty state">
              <Input
                value={component.spinbox.note ?? ''}
                onChange={(event) => patchSource('spinbox', { note: event.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Spin Legacy</p>
            <Field label="Component name">
              <Input
                value={component.legacy.label}
                onChange={(event) => patchSource('legacy', { label: event.target.value })}
              />
            </Field>
            <Field label="Figma URL">
              <Input
                value={component.legacy.url ?? ''}
                placeholder="https://www.figma.com/design/…?node-id=1-2"
                onChange={(event) => patchSource('legacy', { url: event.target.value })}
              />
            </Field>
            <Field label="Note shown in the empty state">
              <Input
                value={component.legacy.note ?? ''}
                onChange={(event) => patchSource('legacy', { note: event.target.value })}
              />
            </Field>
            {legacyEmbed ? (
              <p className="text-muted-foreground truncate font-mono text-xs" title={legacyEmbed}>
                → {legacyEmbed}
              </p>
            ) : null}
          </div>
        </div>

        <Field label="Migration notes">
          <Textarea
            value={component.notes}
            onChange={(event) => updateComponent(component.id, { notes: event.target.value })}
            placeholder="Naming conflicts, ownership, decisions still open…"
          />
        </Field>

        <VariantChecklist component={component} />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button>Done</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  )
}
