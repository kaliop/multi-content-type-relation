import React, { useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tr,
  Td,
  Th,
  Tbody,
  Typography
} from '@strapi/design-system';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { MatchingContent, SelectedEntry } from '../../interface';
import { TableItem } from './TableItem';
import useTranslate from '../../hooks/useTranslate';

type Props = {
  uniqueId: number;
  suggestions?: MatchingContent[];
  selected?: SelectedEntry[];
  onAddEntry?(entry: SelectedEntry): void;
  onDeleteEntry?(entry: SelectedEntry): void;
  onEntriesSorted?(entries: SelectedEntry[]): void;
  maximum?: number;
};

export function InputContentSuggestions({
  uniqueId,
  suggestions,
  selected,
  onAddEntry,
  onDeleteEntry,
  onEntriesSorted,
  maximum,
}: Props) {
  const { translate } = useTranslate();
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
      .slice(0, 10);
  }, [suggestions]);

  const buildSelectedId = (entry: SelectedEntry) => {
    return `${uniqueId}-${entry.uid}-${entry.item.documentId}`;
  };

  const availableSuggestions = useMemo(() => {
    const selectedIdentifiers = (selected || []).map(buildSelectedId);

    return suggestionAsSelectedEntry.filter(
      (suggestion) => !selectedIdentifiers.includes(buildSelectedId(suggestion))
    );
  }, [suggestions, selected]);

  const onAdd = (entry: SelectedEntry) => {
    if (typeof onAddEntry === 'function') {
      onAddEntry(entry);
    }
  };

  const onDelete = (entry: SelectedEntry) => {
    if (typeof onDeleteEntry === 'function') {
      onDeleteEntry(entry);
    }
  };

  // Sortable behavior
  const onSort = (entries: SelectedEntry[]) => {
    if (typeof onEntriesSorted === 'function') {
      onEntriesSorted(entries);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const sortableItems = useMemo<string[]>(() => {
    const items =  selected?.map((entry) => buildSelectedId(entry)) ?? [];

    return items;
  }, [selected]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!active || !over) return;

    if (active.id !== over.id) {
      const oldIndex = selected!.findIndex(
        (entry) => buildSelectedId(entry) === active.id
      );
      const newIndex = selected!.findIndex(
        (entry) => buildSelectedId(entry) === over.id
      );

      onSort(arrayMove(selected!, oldIndex, newIndex));
    }
  };

  if (!availableSuggestions?.length && !selected?.length) return null;

  return (
    <Box padding={[2, 0, 2, 0]} background="neutral100">
      <Table style={{ whiteSpace: 'unset', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
        <Thead>
          <Tr>
            <Th></Th>
            <Th>
              <Typography variant="sigma">
                {translate('contentSuggestions.title')}
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                {translate('contentSuggestions.contentType')}
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                {translate('contentSuggestions.state')}
              </Typography>
            </Th>
          </Tr>
        </Thead>

        <Tbody>
          {selected?.length ? (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortableItems}
                  strategy={verticalListSortingStrategy}
                >
                  {selected.map((entry) => (
                    <TableItem
                      key={buildSelectedId(entry)}
                      id={buildSelectedId(entry)}
                      entry={entry}
                      type="selected"
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          ) : null}

          {availableSuggestions.length && selected?.length ? (
            <Tr>
              <Td colSpan={5}>
                <hr style={{ width: '100%' }} />
              </Td>
            </Tr>
          ) : null}

          {availableSuggestions.map((entry) => (
            <TableItem
              key={buildSelectedId(entry)}
              id={buildSelectedId(entry)}
              entry={entry}
              type="suggestion"
              onAdd={onAdd}
              disabled={
                typeof maximum === 'number'
                  ? (selected?.length ?? 0) >= maximum
                  : false
              }
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
