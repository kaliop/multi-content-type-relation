# Multi Content Type Relation

This repository contains the source code for the **Multi Content Type Relation** Strapi plugin.

## Project Structure

- **`lib/`** - The plugin source code. See [`lib/README.md`](./lib/README.md) for plugin usage, installation, and configuration instructions.
- **`example/`** - A Strapi application used for developing and testing the plugin locally.

## Development

The `example/` directory contains a Strapi application with basic fixtures and a content type "Article" that already has a custom field configured to link articles and authors. The Strapi instance is correctly configured to use the plugin in development mode.

### Quick Start

1. Install all dependencies:

```bash
npm run dev:install
```

2. Start development mode (this will watch the plugin and start the example Strapi app):

```bash
npm run dev
```

### Manual Development

Alternatively, you can run the commands separately:

1. Start the plugin in watch mode:

```bash
cd lib && npm run watch
```

2. In another terminal, start the Strapi example application:

```bash
cd example && npm run dev
```

The plugin will be automatically reloaded when you make changes to the code in the `lib/` directory.

## Plugin Documentation

For information about installing, configuring, and using the plugin in your Strapi project, please refer to the [plugin README](./lib/README.md).

## Contributing

Feel free to fork this repository and submit pull requests!

- [NPM package](https://www.npmjs.com/package/multi-content-type-relation)
- [GitHub repository](https://github.com/kaliop/multi-content-type-relation)
