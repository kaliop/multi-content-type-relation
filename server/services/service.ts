import { Strapi } from "@strapi/strapi"

export default ({ strapi }: { strapi: Strapi }) => ({
  getFirstStringFieldInContentType(contentType) {
    const result = Object.keys(contentType.attributes).find(
      (attribute) => contentType.attributes[attribute].type === "string"
    )

    return result
  }
})
