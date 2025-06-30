export type StrapiContentTypeDefinition = {
  collectionName: string
  info: {
    name: string
    description: string
    singularName: string
    pluralName: string
    displayName: string
  }
  attributes: Record<string, unknown>
}

export type SelectedEntry = {
  displayName: string
  searchableField: string
  uid: string
  item: {
    id: string
    [key: string]: any
  }
}

export type FormattedStrapiEntry = {
  uid: string
  id: string
}

export type Configuration = {
  recursive: {
    enabled: boolean
    maxDepth: number
  }
  debug: boolean
}

export type AnyEntity = {
  id: number | string
  attributes: {
    [key: string]: any
  }
}

export type StrapiResponse = {
  data: AnyEntity | AnyEntity[]
}

export type Context = {
  configuration: Configuration
  publicationState: "live" | "preview"
}
