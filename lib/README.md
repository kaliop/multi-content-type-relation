<div align="center">
<h1>Strapi Multi Content Type Relation</h1>
	
<p style="margin-top: 0;">Create deep relations in the contribution between content types.</p>

</div>

- **Multilingual** Support i18n out of the box
- Support **Publication State**
- **Required, minimum, maximum** validators for the custom field
- Seamless UI integration with **Strapi Design System**

## Installation

Install the plugin in your Strapi project

```bash
npm install multi-content-type-relation
```

After installation, enable the plugin in your config file

```js
// config/plugins.js

module.exports = () => ({
  "multi-content-type-relation": {
    enabled: true,
    config: {
      recursive: {
        enabled: true,
        maxDepth: 2,
      },
      debug: false,
    },
  },
  // .. other plugins
});
```

The plugin should now appear in the **Settings** section of your Strapi app

## Usage

This plugin allows you to create a custom field inside any content type you want. This custom field will allow you, after some configuration in the **content type builder** to select multiple content types in the contribution

Configuring a MRCT field by selecting content types you want to link
![](https://i.imgur.com/J1cCGKM.png)

Advanced settings Tab
![](https://i.imgur.com/ik75kGH.png)

Usage from contribution side

https://i.imgur.com/UDz7pUh.mp4

## Configuration

Plugin configuration settings

###### Key: `recursive`

> `required:` no | `type:` { enabled: Boolean, maxDepth: number} | default { enabled: false, maxDepth: 1}

By default, the plugin will only hydrate the direct relations of the content you fetch

If, for some reasons, you want to hydrate the relations of the relations of the content you fetch, you can through this setting.

> Note: this setting will DRAMATICALLY increase the load on Strapi. The complexity is O(n^maxDepth) and the plugin will fetch n^maxDepth items through Strapi API. **I strongly recommand to never go above maxDepth set to 2.**

###### Key: `debug`

> `required:` no | `type:` Boolean | default false

This setting show debug log of the plugin for better understanding

###### Key: `disableRevertRelations`

> `required:` no | `type:` Boolean | default false

This setting disable relaction MCTR if needed for performances/stability concerns

###### Key: `useDeepSystem`

> `required:` no | `type:` Boolean | default false

The default populate parameter will be *, if you pass the parameter to true, the populate parameter from https://github.com/NEDDL/strapi-v5-plugin-populate-deep/tree/main will be used.

## Query parameters

Query parameters you can add to any public API `GET` request (`findOne` / `findMany`) to change how MCTR fields are hydrated for that request only.

###### Key: `mctrSkipDeep`

> `type:` `'true'` | default: not set

```
GET /api/[contentType]/:documentId?pLevel&mctrSkipDeep=true
```

When set to `true`, linked contents are fetched **without any populate**: only their own fields are returned (no components, dynamic zones, media or relations). Nested MCTR fields are returned as their raw JSON string.

It also bypasses [strapi-v5-plugin-populate-deep](https://github.com/NEDDL/strapi-v5-plugin-populate-deep/tree/main) for linked contents: that plugin applies the request's `pLevel` to every `findOne` / `findMany` run during the request, including the ones made by MCTR. With `mctrSkipDeep=true`, `pLevel` still populates the main content, but not the linked ones.

Use it when the consumer only needs the linked contents' first-level fields (title, slug, …), e.g. navigation or menus. It greatly reduces the number of SQL queries and the response size.

> Note: only the exact value `true` is taken into account. `mctrSkipDeep`, `mctrSkipDeep=1` or `mctrSkipDeep=false` keep the default behavior (`useDeepSystem` / `*`).

###### Key: `mctrPopulate`

> `type:` `string` (comma-separated) or `string[]` | default: not set | **only used with `mctrSkipDeep=true`**

```
GET /api/[contentType]/:documentId?pLevel&mctrSkipDeep=true&mctrPopulate=seo.h1,cover
GET /api/[contentType]/:documentId?pLevel&mctrSkipDeep=true&mctrPopulate[0]=seo.h1&mctrPopulate[1]=cover
```

Populates only the given dot-notation paths on linked contents, on top of their own first-level fields.

- `seo.h1`: populates the `seo` component with only its `h1` field
- `seo`: populates the `seo` component with all its own fields
- `seo.image.url`: goes through components, relations and media (`populate` + `fields` at each level)
- dynamic zones are populated on their first level only (`blocks.foo` behaves like `blocks`)

Paths are resolved against each linked content's schema: a path that doesn't exist on a content type is ignored for it, so the same parameter can be used whatever the linked content types are.

Without `mctrSkipDeep=true`, this parameter is ignored.

## Submit an issue

You can use github issues to raise an issue about this plugin

## Contributing

Feel free to fork and make a pull request of this plugin !

- [NPM package](https://www.npmjs.com/package/multi-content-type-relation)
- [GitHub repository](https://github.com/kaliop/multi-content-type-relation)
