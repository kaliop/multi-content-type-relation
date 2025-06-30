import middlewares from './middlewares';

import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'multi-content-type-relation',
    plugin: 'multi-content-type-relation',
    type: 'richtext',
  });

  strapi.server.use(middlewares.middleware);
};

export default register;
