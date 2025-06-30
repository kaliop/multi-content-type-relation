export default {
  default: ({ env }) => {
    return {
      recursive: {
        enabled: false,
        maxDepth: 1
      },
      debug: false
    }
  },
  validator(config) {
    if (typeof config.recursive !== "object") {
      throw new Error("recursive must be an object")
    }

    if (typeof config.recursive.enabled !== "boolean") {
      throw new Error("recursive.enabled must be a boolean")
    }

    if (typeof config.recursive.maxDepth !== "number") {
      throw new Error("recursive.maxDepth must be a number")
    }

    if (typeof config.debug !== "boolean") {
      throw new Error("Debug must be a boolean")
    }
  }
}
