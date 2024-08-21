import { Strapi } from "@strapi/strapi"
import type { Common } from "@strapi/strapi"
import { FormattedStrapiEntry } from "../interface"

export default ({ strapi }: { strapi: Strapi }) => ({
  getMatchingContent(ctx) {
    const contentTypes = strapi.contentTypes
    const body = ctx.request.body

    const requestedContentTypes = body.contentTypes as string[]
    const keyword = body.keyword as string
    const locale = body.locale as string

    const mapping = requestedContentTypes.reduce((accumulator, contentType) => {
      Object.keys(contentTypes).forEach((model) => {
        const strapiContentType = contentTypes[model]
        if (strapiContentType.info.singularName === contentType || strapiContentType.info.pluralName === contentType) {
          accumulator[contentType] = {
            uid: model,
            displayName: contentTypes[model].info.displayName,
            searchableField: strapi
              .plugin("multi-content-type-relation")
              .service("service")
              .getFirstStringFieldInContentType(contentTypes[model])
          }
        }
      })

      return accumulator
    }, {} as Record<string, { uid: string; displayName: string; searchableField: string }>)

    const promises = Object.keys(mapping).map((contentType) => {
      const uid = mapping[contentType].uid

      return strapi
        .entityService!.findMany(uid as Common.UID.ContentType, {
          filters: {
            [mapping[contentType].searchableField]: {
              $containsi: keyword
            }
          },
          locale
        })
        .then((results) => {
          let contents = Array.isArray(results) ? results : typeof results === "object" && results ? [results] : []

          const contentTypeDefinition = strapi.contentType(uid as Common.UID.ContentType)
          if (contentTypeDefinition?.options?.draftAndPublish) {
            contents = contents.filter((content) => content.publishedAt !== null)
          }

          return {
            uid,
            displayName: mapping[contentType].displayName,
            searchableField: mapping[contentType].searchableField,
            results: contents
          }
        })
    })

    return Promise.all(promises)
  },
  validateRelations: async function (ctx) {
    const contentTypes = strapi.contentTypes
    const body = ctx.request.body

    const entries = body.entries as FormattedStrapiEntry[]

    const promises = entries.map((entry) => {
      return strapi
        .entityService!.findOne(entry.uid as Common.UID.ContentType, entry.id, { populate: "deep" })
        .then((result) => {
          return {
            uid: entry.uid,
            result
          }
        })
    })

    const responses = await Promise.all(promises)

    return responses
      .map((response) => {
        return {
          displayName: contentTypes[response.uid].info.displayName,
          uid: response.uid,
          searchableField: strapi
            .plugin("multi-content-type-relation")
            .service("service")
            .getFirstStringFieldInContentType(contentTypes[response.uid]),
          item: response.result
        }
      })
      .filter((entry) => entry.item)
  },
  listContentTypes: async function (ctx) {
    const contentTypes: Record<string, unknown>[] = []

    for (const contentType of Object.values(strapi.contentTypes) as { kind: string; plugin: boolean }[]) {
      if ((contentType.kind === "collectionType" || contentType.kind === "singleType") && !contentType.plugin) {
        contentTypes.push(contentType as Record<string, unknown>)
      }
    }

    return contentTypes
  }
})
