import React, { useEffect, useMemo, useState } from 'react';
import { Tr, Td, Typography, IconButton, Flex } from '@strapi/design-system';
import { Trash, Plus, Drag, Eye } from '@strapi/icons';
import { PublicationState } from './PublicationState';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SelectedEntry } from '../../interface';
import { getContentTypeForUid, getContentTypes } from '../../helpers/storage';
import { useLocation } from 'react-router-dom';
import useTranslate from '../../hooks/useTranslate';

type Props = {
  entry: SelectedEntry;
  type: 'suggestion' | 'selected';
  uniqueId: number;
  onAdd?(entry: SelectedEntry): void;
  onDelete?(entry: SelectedEntry): void;
  disabled?: boolean;
  sortable?: boolean;
};

export const TableItem = ({
  entry,
  type,
  uniqueId,
  disabled,
  onAdd,
  onDelete
}: Props) => {
  const { translate } = useTranslate();
  const entryIdentifier = useMemo(
    () => `${uniqueId}-${entry.uid}-${entry.item.id}`,
    [entry]
  );
  const contentType = getContentTypeForUid(entry.uid);
  const location = useLocation();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: entryIdentifier });

  const trueRef = document.querySelector(
    `[data-tableitem="${entryIdentifier}"]`
  );
  useEffect(() => {
    if (!trueRef) return;

    setNodeRef(trueRef as HTMLElement);
  }, [trueRef]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const [currentLocale, setCurrentLocale] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const locale = searchParams.get('plugins[i18n][locale]');
    if (!locale) return;
    setCurrentLocale(locale);
  }, [location]);

  const goToEntry = () => {
    if (!currentLocale) return;

    const contentTypes = window.sessionStorage.getItem('mctr::content_types');

    if (contentTypes) {
      try {
        const parsedContentTypes = JSON.parse(contentTypes);
        if (Array.isArray(parsedContentTypes)) {
          const contentType = parsedContentTypes.find(
            (ct) => ct.uid === entry.uid
          );
          if (contentType) {
            const kind = contentType.kind;
            let url = `/admin/content-manager/${kind}/${entry.uid}`;
            if (kind === 'collectionType') {
              url += `/${entry.item.id}`;
            }
            url += `?plugins[i18n][locale]=${currentLocale}`;

            window.open(url, '_blank');
            return;
          }
        }
      } catch (e) {
        console.error('[MCTR] Failed to retrieve content types');
      }
    } else {
      alert(translate('tableItem.error'));
    }
  };

  return (
    <Tr
      style={style}
      {...attributes}
      {...listeners}
      data-tableitem={entryIdentifier}
    >
      <Td>
        {type === 'selected' ? (
          <IconButton noBorder>
            <Drag />
          </IconButton>
        ) : null}
      </Td>
      <Td>
        <Typography color="neutral800">
          {entry.item[entry.searchableField]}
        </Typography>
      </Td>
      <Td>
        <Typography color="neutral800">{entry.item.id}</Typography>
      </Td>
      <Td>
        <Typography color="neutral800">{entry.displayName}</Typography>
      </Td>
      <Td>
        <PublicationState
          isPublished={!!entry.item.publishedAt}
          hasDraftAndPublish={contentType?.options?.draftAndPublish}
        />
      </Td>
      <Td>
        <Flex>
          <IconButton
            label={translate('tableItem.goToEntry')}
            onClick={goToEntry}
            style={{ 'marg@in-right': '5px' }}
          >
            <Eye />
          </IconButton>
          {type === 'suggestion' ? (
            <IconButton
              label={translate('tableItem.add')}
              onClick={() => onAdd!(entry)}
              disabled={disabled}
              marginLeft={1}
            >
              <Plus />
            </IconButton>
          ) : type === 'selected' ? (
            <IconButton
              label={translate('tableItem.delete')}
              onClick={() => onDelete!(entry)}
              marginLeft={1}
            >
              <Trash />
            </IconButton>
          ) : null}
        </Flex>
      </Td>
    </Tr>
  );
};
