---
title: Storing Settings
editUrl: false
description: When, where and how to store your plugin configuration
---

On this page, you can find information about creating configuration options that will or will not get shared to other vaults and devices.

### Overview

The table below gives a summary of what you should do if you want to e.g. have a setting that does *not* get shared to other vaults.

|                | SINGLE VAULT                                | MULTIPLE VAULTS                                                            |
| -------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| **LOCAL-ONLY** | Store in `localStorage` with `appId` prefix | Store in `localStorage`                                                    |
| **SHARED**     | Store in plugin settings                    | Store in plugin settings, update device `localStorage` on `settingsChange` |

### Unique to a single device, unique per vault

Use this approach when you want to store a setting that will not be available to other vaults or devices.

```ts
// Store your setting
app.saveLocalStorage("yourplugin:setting", VALUE)
```

```ts
// Read your setting
app.loadLocalStorage("yourplugin:setting")
```

Keep in mind that this makes use of private API, add your own typings for these methods or use [Obsidian Typings](https://github.com/fevol/obsidian-typings) to use this in a type-safe way.

Behind the scenes, the setting combines the provided key with the appId (`app.appId`+ `key`), and then stores it in `localStorage`.

### Unique to a single device, shared between vaults

Use this approach when you want to have a setting that will also be available to other vaults on this device.

```ts
// Store your setting
localStorage.setItem("yourplugin:setting", VALUE)
```

```ts
// Read your setting
localStorage.getItem("yourplugin:setting")
```

### Shared between devices, unique per vault

Use this approach when you have a setting that should be used on all devices where the vault is used.

Follow the [Official Settings guide](https://docs.obsidian.md/Plugins/User+interface/Settings).

```ts
export default class ExamplePlugin extends Plugin {
  // ...

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

### Shared between devices, shared between vaults

Use this approach when your setting should be the same on every instance of Obsidian that the user uses.

Store the setting in regular `localStorage` (see above), and whenever a setting changes, update the `localStorage` value:

```ts
export default class ExamplePlugin extends Plugin {
  // ...

  async loadSettings() {
    this.settings = Object.assign(
	    { value: localStorage.getItem("yourplugin:setting") }, 
	    DEFAULT_SETTINGS, 
	    await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    localStorage.setItem("yourplugin:setting", this.settings.VALUE)
  }
}
```
