export type PluginOption = {
  options: {
    min: number
    max: number
    contentTypes: string
  }
}

export type MatchingContent = {
  uid: string
  displayName: string
  searchableField: string
  results: {
    id: string
    [key: string]: any
  }[]
}

export type MatchingContentResponse = {
  data: MatchingContent[]
  total: number
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
