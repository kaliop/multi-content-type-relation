import React, { useMemo } from "react"
import { Box, Table, Thead, Tr, Th, Tbody, Typography, Divider } from "@strapi/design-system"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { MatchingContent, SelectedEntry } from "../../interface"
import { TableItem } from "./TableItem"

type Props = {
  uniqueId: number
  suggestions?: MatchingContent[]
  selected?: SelectedEntry[]
  onAddEntry?(entry: SelectedEntry): void
  onDeleteEntry?(entry: SelectedEntry): void
  onEntriesSorted?(entries: SelectedEntry[]): void
  sortable?: boolean
  maximum?: number
}

export function InputContentSuggestions({
  uniqueId,
  suggestions,
  selected,
  onAddEntry,
  onDeleteEntry,
  onEntriesSorted,
  maximum,
  sortable
}: Props) {
  const suggestionAsSelectedEntry = useMemo(() => {
    return (suggestions || [])
      .flatMap((suggestion) =>
        suggestion.results.map<SelectedEntry>((entrySuggestion) => ({
          displayName: suggestion.displayName,
          item: entrySuggestion,
          searchableField: suggestion.searchableField,
          uid: suggestion.uid
        }))
      )
      .slice(0, 10)
  }, [suggestions])

  const buildSelectedId = (entry: SelectedEntry) => {
    return `${uniqueId}-${entry.uid}-${entry.item.id}`
  }

  const availableSuggestions = useMemo(() => {
    const selectedIdentifiers = (selected || []).map(buildSelectedId)

    return suggestionAsSelectedEntry.filter((suggestion) => !selectedIdentifiers.includes(buildSelectedId(suggestion)))
  }, [suggestions, selected])

  const onAdd = (entry: SelectedEntry) => {
    if (typeof onAddEntry === "function") {
      onAddEntry(entry)
    }
  }

  const onDelete = (entry: SelectedEntry) => {
    if (typeof onDeleteEntry === "function") {
      onDeleteEntry(entry)
    }
  }

  // Sortable behavior
  const onSort = (entries: SelectedEntry[]) => {
    if (typeof onEntriesSorted === "function") {
      onEntriesSorted(entries)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!active || !over) return

    if (active.id !== over.id) {
      const oldIndex = selected!.findIndex((entry) => buildSelectedId(entry) === active.id)
      const newIndex = selected!.findIndex((entry) => buildSelectedId(entry) === over.id)

      onSort(arrayMove(selected!, oldIndex, newIndex))
    }
  }

  if (!availableSuggestions?.length && !selected?.length) return null

  return (
    <Box padding={[2, 0, 2, 0]} background="neutral100">
      <Table style={{ whiteSpace: "unset" }}>
        <Thead>
          <Tr>
            <Th></Th>
            <Th>
              <Typography variant="sigma">Title</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">ID</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Content type</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">State</Typography>
            </Th>
          </Tr>
        </Thead>

        <Tbody>
          {selected?.length ? (
            sortable ? (
              <>
                {/* @ts-expect-error Server Component */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={selected.map((entry) => buildSelectedId(entry))}
                    strategy={verticalListSortingStrategy}
                  >
                    {selected.map((entry) => (
                      <TableItem
                        uniqueId={uniqueId}
                        key={buildSelectedId(entry)}
                        entry={entry}
                        type="selected"
                        onDelete={onDelete}
                        sortable={sortable}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </>
            ) : (
              (selected || []).map((entry) => (
                <TableItem uniqueId={uniqueId} entry={entry} type="selected" onDelete={onDelete} />
              ))
            )
          ) : null}

          {availableSuggestions.length && selected?.length ? <Tr style={{ height: "32px" }} /> : null}

          {availableSuggestions.map((entry) => (
            <TableItem
              uniqueId={uniqueId}
              key={buildSelectedId(entry)}
              entry={entry}
              type="suggestion"
              onAdd={onAdd}
              disabled={typeof maximum === "number" ? (selected?.length ?? 0) >= maximum : false}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
