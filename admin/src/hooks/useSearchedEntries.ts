import { useEffect, useMemo, useState } from "react"

import { MatchingContent } from "../interface"
import { fetchMatchingContent } from "../helpers/content"

export function useSearchedEntries(keyword: string, contentTypes: string, locale: string) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<MatchingContent[]>([])
  const [total, setTotal] = useState(0)

  async function fetchEntries() {
    setResults([])
    setTotal(0)

    if (loading || !keyword) return

    try {
      const { data, total } = await fetchMatchingContent(keyword, contentTypes, locale)

      setResults(data)
      setTotal(total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => fetchEntries(), 500)

    return () => clearTimeout(timeout)
  }, [keyword])

  return useMemo(
    () => ({
      loading,
      results,
      total
    }),
    [results, total]
  )
}
