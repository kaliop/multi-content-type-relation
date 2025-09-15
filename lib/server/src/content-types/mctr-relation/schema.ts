export default {
  collectionName: 'mctr-relation',
  info: {
    singularName: 'mctr-relation',
    pluralName: 'mctr-relations',
    displayName: 'MCTR Relation',
    name: 'mctr-relation'
  },
  pluginOptions: {
    'content-manager': {
      visible: false
    },
    'content-type-builder': {
      visible: false
    }
  },
  attributes: {
    sourceUID: {
      type: 'string',
      required: true
    },
    sourceDocId: {
      type: 'string',
      required: true
    },
    target: {
      type: 'json'
    }
  }
};
