export default [
  {
    method: "GET",
    path: "/list-content-types",
    handler: "controller.listContentTypes",
    config: {
      policies: [],
      auth: false
    }
  },
  {
    method: "POST",
    path: "/get-content",
    handler: "controller.getMatchingContent",
    config: {
      policies: []
    }
  },
  {
    method: "POST",
    path: "/validate-relations",
    handler: "controller.validateRelations",
    config: {
      policies: []
    }
  }
]
