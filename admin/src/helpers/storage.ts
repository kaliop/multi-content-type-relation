export type LightContentType = {
  apiName: string
  attributes: Record<string, Record<string, unknown>>[]
  collectionName: string
  globalId: string
  modelName: string
  modelType: string
  options?: { draftAndPublish?: boolean }
  uid: string
}

const STORAGE_KEY = "mctr::content_types"

export function getContentTypes() {
  const raw = sessionStorage.getItem(STORAGE_KEY)

  return raw ? (JSON.parse(raw) as LightContentType[]) : undefined
}

export function getContentTypeForUid(uid: string) {
  const contentTypes = getContentTypes()

  if (!Array.isArray(contentTypes)) return

  return contentTypes.find((contentType) => contentType.uid === uid)
}

export function setContentTypes(contentTypes: LightContentType[]) {
  const stringified = JSON.stringify(contentTypes)

  sessionStorage.setItem(STORAGE_KEY, stringified)
}
