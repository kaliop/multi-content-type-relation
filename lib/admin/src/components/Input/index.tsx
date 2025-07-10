import React, { useMemo } from 'react';

import MainInput from './MainInput';
import { DesignSystemProvider, darkTheme } from '@strapi/design-system';
import { useIntl } from 'react-intl';

// TODO: add typs for props
const Index = (props: any) => {
  const { locale } = useIntl();
  const attribute = useMemo(() => {
    if (!props.attribute) return props.attribute;
    if (!props.attribute.options) return props.attribute;
    if (!props.attribute.options.contentTypes) return props.attribute;

    const contentTypes = Object.keys(
      props.attribute.options.contentTypes
    ).filter((key) => props.attribute.options.contentTypes[key]);

    return {
      ...props.attribute,
      options: {
        ...props.attribute.options,
        contentTypes: contentTypes.join(',')
      }
    };
  }, [props.attribute]);

  return (
    <DesignSystemProvider locale={locale} theme={darkTheme}>
      <MainInput {...props} attribute={attribute} />
    </DesignSystemProvider>
  );
};

export default Index;
