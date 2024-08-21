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

## Submit an issue

You can use github issues to raise an issue about this plugin

## Contributing

Feel free to fork and make a pull request of this plugin !

- [NPM package](https://www.npmjs.com/package/multi-content-type-relation)
- [GitHub repository](https://github.com/kaliop/multi-content-type-relation)
