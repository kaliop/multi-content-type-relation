import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  getFirstStringFieldInContentType(contentType) {
    const result = Object.keys(contentType.attributes).find(
      (attribute) => contentType.attributes[attribute].type === "string"
    )

    return result
  }
})
