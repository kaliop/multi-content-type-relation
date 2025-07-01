import React, { ComponentType } from 'react';

import pluginPkg from '../../package.json';

import PluginIcon from './components/PluginIcon';
import pluginId from './pluginId';
import getTrad from './utils/getTrad';
import { listContentTypes } from './helpers/content';
import { setContentTypes } from './helpers/storage';
import SidePanel from './components/SidePanel/SidePanel';

const name = pluginPkg.strapi.name;

export default {
  async register(app: any) {
    const contentTypes = await listContentTypes();
    setContentTypes(contentTypes);

    app.customFields.register({
      name,
      pluginId,
      type: 'richtext',
      intlLabel: {
        id: 'multi-content-type-relation.text-ai.label',
        defaultMessage: 'Multi Content Type Relation',
      },
      intlDescription: {
        id: 'multi-content-type-relation.text-ai.description',
        defaultMessage: 'Write content types separated by commas',
      },
      icon: PluginIcon, // don't forget to create/import your icon component
      components: {
        Input: () =>
          import(
            /* webpackChunkName: "input-component" */ './components/Input'
          ) as unknown as ComponentType,
      },
      inputSize: {
        default: 12,
        isResizable: false,
      },
      options: {
        base: [
          /*
            Declare settings to be added to the "Base settings" section
            of the field in the Content-Type Builder
          */
          {
            sectionTitle: {
              id: 'multi-content-type-relation.text-ai.length',
              defaultMessage: 'Content types',
            },
            items: contentTypes.map((contentType: any) => {
              const value = contentType.info.singularName;

              return {
                intlLabel: {
                  id: `multi-content-type-relation.options.${contentType.uid}`,
                  defaultMessage: contentType.info.displayName,
                },
                type: 'checkbox',
                name: `options.contentTypes.${value}`,
              };
            }),
          },
        ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: getTrad(
                    'content-type-relation-select.options.advanced.requiredField'
                  ),
                  defaultMessage: 'Required field',
                },
                description: {
                  id: getTrad(
                    'content-type-relation-select.options.advanced.requiredField.description'
                  ),
                  defaultMessage:
                    "You won't be able to create an entry if this field is empty",
                },
              },
              {
                name: 'options.min',
                type: 'number',
                intlLabel: {
                  id: getTrad(
                    'content-type-relation-select.options.advanced.minField'
                  ),
                  defaultMessage: 'Minimum values',
                },
                description: {
                  id: getTrad(
                    'content-type-relation-select.options.advanced.minField.description'
                  ),
                  defaultMessage: 'Minimum number of entries',
                },
              },
              {
                name: 'options.max',
                type: 'number',
                intlLabel: {
                  id: getTrad(
                    'content-type-relation-select.options.advanced.maxField'
                  ),
                  defaultMessage: 'Maximum values',
                },
                description: {
                  id: getTrad(
                    'content-type-relation-select.options.advanced.maxField.description'
                  ),
                  defaultMessage: 'Maximum number of entries',
                },
              },
            ],
          },
        ],
      },
    });
  },

  bootstrap(app: any) {
    app
      .getPlugin('content-manager')
      .injectComponent('editView', 'right-links', {
        name: 'side-panel',
        Component: SidePanel,
      });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map(async (locale) => {
        const { default: data } = await import(`./translations/${locale}.json`);

        return {
          data,
          locale,
        };
      })
    );

    return Promise.resolve(importedTrads);
  },
};
