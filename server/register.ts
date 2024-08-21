import { Strapi } from "@strapi/strapi"

import middlewares from "./middlewares"

export default ({ strapi }: { strapi: Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: "multi-content-type-relation",
    plugin: "multi-content-type-relation",
    type: "richtext"
  })

  strapi.server.use(middlewares.middleware)
}
