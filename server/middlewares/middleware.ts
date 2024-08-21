import type { Common } from "@strapi/strapi"
import { getPluginConfiguration, log } from "../utils"
import type { Context, StrapiResponse, AnyEntity } from "../interface"

export default async (ctx, next) => {
  await next()

  if (!ctx?.request?.url?.startsWith("/api")) return
  if (ctx.request.method !== "GET") return
  if (!ctx.body) return

  const configuration = getPluginConfiguration()

  const handler = ctx.state.route.handler
  const contentTypes = Object.keys(strapi.contentTypes)

  log(`URL: ${ctx.request.url} (${ctx.request.method})`)
  log(`Strapi Route: ${JSON.stringify(ctx.state.route, null, 2)}`)

  const validHandler = contentTypes
    .filter((contentType) => contentType.startsWith("api::"))
    .some(
      (contentType) =>
        handler.includes(`${contentType}.findOne`) ||
        handler.includes(`${contentType}.findMany`) ||
        handler.includes(`${contentType}.find`)
    )

  log(`Is valid handler: ${validHandler}`)

  // Allow only findOne/findMany for native contentypes that have api::
  if (!validHandler) return

  const context = {
    configuration,
    publicationState: ctx.request.query?.["publicationState"] ?? "live"
  }

  log(" ----- ")
  log(`Context Body: ${JSON.stringify(ctx.body, null, 2)}`)
  if (ctx.body.error || !ctx.body?.data.attributes) return

  const hydratedData = await augmentMRCT(ctx.body, 1, context)

  ctx.body.data = hydratedData
}

const augmentMRCT = async (
  strapiResponse: StrapiResponse,
  currentDepth: number,
  context: Context
): Promise<AnyEntity | AnyEntity[]> => {
  if (Array.isArray(strapiResponse.data)) {
    const promises = strapiResponse.data.map((item) => hydrateMRCT(item, currentDepth, context))

    return await Promise.all(promises)
  } else {
    return await hydrateMRCT(strapiResponse.data, currentDepth, context)
  }
}

const hydrateMRCT = async (content: AnyEntity, currentDepth: number, context: Context) => {
  const eligibleProperties: Set<string> = new Set()
  const contentsToFetch: Set<string> = new Set()

  const { configuration } = context

  const flattenedProperties = flattenObj(content.attributes, null)

  for (const [key, value] of Object.entries(flattenedProperties)) {
    if (typeof value !== "string" || !value.includes("MRCT")) continue

    try {
      const field = JSON.parse(value)

      if (!Array.isArray(field)) continue

      for (const item of field) {
        if (Object.keys(item).length !== 3 || (!item.uid && typeof item.uid !== "string") || !item.id) continue

        const compositeID = `${item.uid}####${item.id}`

        eligibleProperties.add(key)

        if (contentsToFetch.has(compositeID)) continue
        else contentsToFetch.add(compositeID)
      }
    } catch (e) {
      continue
    }
  }

  if (!contentsToFetch.size) return content

  log(`Depth: ${currentDepth}, Hydrating MCTR for ID ${content.id}`)

  const promises: Promise<any>[] = []
  for (const item of Array.from(contentsToFetch)) {
    const [uid, id] = item.split("####")
    const promise = strapi.entityService
      .findOne(uid as Common.UID.ContentType, id, { populate: "deep" })
      .then(async (response) => {
        if (!response) return { uid, response }

        if (configuration.recursive.enabled && currentDepth < configuration.recursive.maxDepth) {
          // Entity service serve the content flattened, so we need to rebuild the API format for the hydrate recursion
          const hydratedResponse = await hydrateMRCT(
            {
              id: response.id,
              attributes: response
            },
            currentDepth + 1,
            context
          )

          return {
            uid,
            response: {
              id: response.id,
              attributes: hydratedResponse.attributes
            }
          }
        } else {
          return {
            uid,
            response: {
              id: response.id,
              attributes: response
            }
          }
        }
      })

    promises.push(promise)
  }

  const linkedEntries: any[] = await Promise.all(promises)

  const filteredLinkedEntries: { uid: string; response: AnyEntity }[] = linkedEntries
    .filter((linkedEntry) => Boolean(linkedEntry.response))
    .filter((linkedEntry) => {
      const contentTypeConfiguration = strapi.contentTypes[linkedEntry.uid]

      if (!contentTypeConfiguration) return true
      if (!contentTypeConfiguration.options?.draftAndPublish) return true
      if (context.publicationState === "preview") return true

      return typeof linkedEntry.response?.attributes.publishedAt === "string"
    })

  for (const key of Array.from(eligibleProperties)) {
    const hydratedArray: AnyEntity[] = []

    const unhydratedField = JSON.parse(flattenedProperties[key]) as { uid: string; id: string }[]

    for (const item of unhydratedField) {
      const matchingContent = filteredLinkedEntries.find(
        (linkedEntry) => item.uid === linkedEntry.uid && item.id === linkedEntry.response.id
      )

      if (matchingContent) {
        hydratedArray.push(matchingContent.response)
      }
    }

    flattenedProperties[key] = hydratedArray
  }

  const newContent = unflatten(flattenedProperties)
  return {
    ...content,
    attributes: newContent
  }
}

const flattenObj = (obj: any, parent: any, res: Record<string, any> = {}) => {
  for (let key in obj) {
    let propName = parent ? parent + "." + key : key
    if (typeof obj[key] == "object") {
      flattenObj(obj[key], propName, res)
    } else {
      res[propName] = obj[key]
    }
  }
  return res
}

const unflatten = (data: any) => {
  var result = {}
  for (var i in data) {
    var keys = i.split(".")
    keys.reduce(function (r: any, e, j) {
      return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? data[i] : {}) : [])
    }, result)
  }
  return result
}
