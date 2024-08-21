import { getFetchClient } from "@strapi/helper-plugin"

import pluginId from "../pluginId"
import { FormattedStrapiEntry, MatchingContent, MatchingContentResponse, SelectedEntry } from "../interface"

export const fetchMatchingContent = async (
  keyword: string,
  contentTypes: string,
  locale: string
): Promise<MatchingContentResponse> => {
  const { post } = getFetchClient()
  const response = await post(`/${pluginId}/get-content`, {
    contentTypes: contentTypes.split(","),
    keyword,
    locale
  })

  const data = response.data as MatchingContent[]

  if (!data) throw new Error("No data returned from API")

  const total = data.reduce((accumulator, option) => {
    if (!option.results) return accumulator

    return accumulator + option.results.length
  }, 0)

  return {
    data,
    total
  }
}

export const formatToStrapiField = (entries: SelectedEntry[]) => {
  if (entries.length === 0) return ""

  return JSON.stringify(entries.map((entry) => ({ uid: entry.uid, id: entry.item.id, MRCT: true })).filter(Boolean))
}

export const validateCurrentRelations = async (entries: FormattedStrapiEntry[]) => {
  const { post } = getFetchClient()

  const response = await post(`/${pluginId}/validate-relations`, {
    entries
  })

  return response.data as SelectedEntry[]
}

export const listContentTypes = async () => {
  try {
    const { get } = getFetchClient()
    const response = await get(`/${pluginId}/list-content-types`)

    return response.data
  } catch (error) {
    console.error(error)
    return []
  }
}
