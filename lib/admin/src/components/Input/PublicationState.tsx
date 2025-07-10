import React, { useMemo } from 'react';
import { Status, Typography } from '@strapi/design-system';
import useTranslate from '../../hooks/useTranslate';

type Props = {
  isPublished: boolean;
  hasDraftAndPublish?: boolean;
};

export const PublicationState = ({
  isPublished,
  hasDraftAndPublish
}: Props) => {
  const { translate } = useTranslate();
  const configuration = useMemo(() => {
    const conf = {
      variant: 'alternative',
      text: translate('publicationState.na')
    };

    if (hasDraftAndPublish) {
      conf.variant = isPublished ? 'success' : 'secondary';
      conf.text = isPublished
        ? translate('publicationState.published')
        : translate('publicationState.draft');
    }

    return conf;
  }, [isPublished, hasDraftAndPublish, translate]);

  return (
    <Status
      showBullet={false}
      variant={configuration.variant}
      size="S"
      width="min-content"
      style={{ paddingLeft: 12, paddingRight: 12 }}
    >
      <Typography fontWeight="bold" textColor={`${configuration.variant}700`}>
        {configuration.text}
      </Typography>
    </Status>
  );
};
