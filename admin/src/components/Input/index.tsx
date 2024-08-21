import React, { useMemo } from "react"

import { MainInput } from "./MainInput"

export default function Index(props) {
  const attribute = useMemo(() => {
    if (!props.attribute) return props.attribute

    if (!props.attribute.options) return props.attribute

    if (!props.attribute.options.contentTypes) return props.attribute

    const contentTypes = Object.keys(props.attribute.options.contentTypes).filter(
      (key) => props.attribute.options.contentTypes[key]
    )

    return {
      ...props.attribute,
      options: {
        ...props.attribute.options,
        contentTypes: contentTypes.join(",")
      }
    }
  }, [props.attribute])

  return <MainInput {...props} attribute={attribute} />
}
