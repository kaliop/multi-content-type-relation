import React, { useEffect, useMemo, useState } from "react"
import { useIntl } from "react-intl"
import { useLocation } from "react-router-dom"

import { Loader, Field, TextInput } from "@strapi/design-system"

import { FormattedStrapiEntry, PluginOption, SelectedEntry } from "../../interface"
import { useSearchedEntries } from "../../hooks/useSearchedEntries"
import { InputContentSuggestions } from "./InputContentSuggestions"
import { formatToStrapiField, validateCurrentRelations } from "../../helpers/content"

type Props = {
  name: string
  error: string
  description: string
  value: string
  onChange(payload: Record<string, unknown>): void
  intlLabel: Record<string, string>
  attribute: PluginOption
  required: boolean
}

export function MainInput({ name, error, description, onChange, value, intlLabel, attribute, required }: Props) {
  const { formatMessage } = useIntl()
  const location = useLocation()
  const maximumItems = attribute.options.max
  const minimumItems = attribute.options.min || 0
  const currentLocale = new URLSearchParams(location.search).get("plugins[i18n][locale]") as string

  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<SelectedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const value = selected.length > maximumItems || selected.length < minimumItems ? [] : selected

    onChange({ target: { name, value: formatToStrapiField(value) } })
  }, [selected])

  const hint = useMemo(() => {
    const minLabel = minimumItems > 0 ? `min. ${minimumItems} ${minimumItems > 1 ? "entries" : "entry"}` : ""
    const maxLabel = maximumItems > 0 ? `max. ${maximumItems} ${maximumItems > 1 ? "entries" : "entry"}` : ""

    return `
      ${minLabel ? `${minLabel}` : ""}
      ${minLabel && maxLabel ? ", " : ""}
      ${maxLabel}
      ${minLabel || maxLabel ? " - " : ""}
      ${selected.length} selected
    `
  }, [selected, maximumItems, minimumItems])

  const inputError = useMemo(() => {
    if (!error) return ""

    if (selected.length < minimumItems) return `${error} - A minimum of ${minimumItems} item(s) is required`

    if (selected.length > maximumItems) return `${error} - A maximum of ${maximumItems} item(s) is required`

    return error
  }, [error, maximumItems, minimumItems, selected])

  const { loading: searchLoading, results } = useSearchedEntries(keyword, attribute.options.contentTypes, currentLocale)

  // Validate relations and remove the one that got deleted
  useEffect(() => {
    async function validateContent() {
      if (!value) {
        setLoading(false)
        return
      }

      const entries = JSON.parse(value) as FormattedStrapiEntry[]

      const result = await validateCurrentRelations(entries)

      setSelected(result)
      setLoading(false)
    }

    validateContent()
  }, [])

  const onAddEntry = (entry: SelectedEntry) => {
    const alreadyDefined = selected.some(
      (selectedEntry) => selectedEntry.uid === entry.uid && selectedEntry.item.id === entry.item.id
    )

    if (alreadyDefined) return

    setSelected([...selected, entry])
  }

  const onDeleteEntry = (entry: SelectedEntry) => {
    const newSelected = selected.filter(
      (selectedEntry) => !(selectedEntry.uid === entry.uid && selectedEntry.item.id === entry.item.id)
    )

    setSelected(newSelected)
  }

  const onEntriesSorted = (entries) => {
    setSelected(entries)
  }

  if (loading) return <Loader />

  return (
    <Field name={name} id={name} error={error} hint={description} required={required}>
      <TextInput
        label={formatMessage(intlLabel)}
        placeholder="Type a term to search"
        required={required}
        hint={hint}
        error={inputError}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      {searchLoading ? (
        <Loader />
      ) : (
        <InputContentSuggestions
          uniqueId={Date.now()}
          suggestions={results}
          selected={selected}
          onAddEntry={onAddEntry}
          onDeleteEntry={onDeleteEntry}
          onEntriesSorted={onEntriesSorted}
          maximum={maximumItems}
          sortable
        />
      )}
    </Field>
  )
}
