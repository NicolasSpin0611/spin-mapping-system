import { useMemo, useState } from 'react'
import { PanelsTopLeft } from 'lucide-react'
import { ComparisonView } from '@/components/comparison-view'
import { ComponentList } from '@/components/component-list'
import { PriorityDashboard } from '@/components/priority-dashboard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useMapping } from '@/store/mapping-store'

interface ComparePageProps {
  componentId: string | null
  onSelect: (id: string | null) => void
}

export function ComparePage({ componentId, onSelect }: ComparePageProps) {
  const { dataset } = useMapping()
  const [pickerOpen, setPickerOpen] = useState(false)
  const components = dataset.components

  const selected = useMemo(
    () => components.find((component) => component.id === componentId) ?? null,
    [components, componentId],
  )
  const index = selected ? components.indexOf(selected) : -1

  const select = (id: string) => {
    onSelect(id)
    setPickerOpen(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)]">
          <ComponentList
            components={components}
            selectedId={componentId}
            onSelect={select}
            className="h-[calc(100vh-6rem)]"
          />
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="lg:hidden">
          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <PanelsTopLeft aria-hidden />
                {selected ? selected.title : `Browse the ${components.length} components`}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Components</DialogTitle>
              </DialogHeader>
              <ComponentList
                components={components}
                selectedId={componentId}
                onSelect={select}
                className="max-h-[65vh]"
              />
            </DialogContent>
          </Dialog>
        </div>

        {selected ? (
          <ComparisonView
            component={selected}
            position={{ index, total: components.length }}
            onPrevious={index > 0 ? () => onSelect(components[index - 1].id) : undefined}
            onNext={index < components.length - 1 ? () => onSelect(components[index + 1].id) : undefined}
          />
        ) : (
          <PriorityDashboard components={components} onSelect={select} />
        )}
      </div>
    </div>
  )
}
