import React, { useMemo } from "react"
import { Status, Typography } from "@strapi/design-system"

type Props = {
  isPublished: boolean
  hasDraftAndPublish?: boolean
}

export const PublicationState = ({ isPublished, hasDraftAndPublish }: Props) => {
  const configuration = useMemo(() => {
    const conf = { variant: "alternative", text: "N/A" }

    if (hasDraftAndPublish) {
      conf.variant = isPublished ? "success" : "secondary"
      conf.text = isPublished ? "Published" : "Draft"
    }

    return conf
  }, [isPublished, hasDraftAndPublish])

  return (
    <Status showBullet={false} variant={configuration.variant} size="S" width="min-content">
      <Typography fontWeight="bold" textColor={`${configuration.variant}700`}>
        {configuration.text}
      </Typography>
    </Status>
  )
}
