export default () => ({
  'multi-content-type-relation': {
    enabled: true,
    resolve: './src/plugins/multi-content-type-relation',
    config: {
      recursive: {
        enabled: true,
        maxDepth: 1
      },
      debug: true
    }
  }
});
