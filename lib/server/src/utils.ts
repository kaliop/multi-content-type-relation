import { Configuration } from "./interface"

export const getPluginConfiguration = (): Configuration => {
  const pluginConfiguration = strapi.config.get("plugin.multi-content-type-relation") as Configuration

  return pluginConfiguration
}
export const log = (message: string) => {
  const { debug } = getPluginConfiguration()

  if (debug) {
    console.log(`[MCTR DEBUG] ${message}`)
  }
}
