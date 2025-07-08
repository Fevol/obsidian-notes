---
title: Showcase Plugin and Theme Downloads
editUrl: false
description: Use shields.io to get a badge showing your plugin or theme's downloads
---

If you ever wanted to show how many downloads your plugin or theme has inside your `README.md`, there is a simple way to do so:
![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/fevol/obsidian-criticmarkup/latest/main.js)

This badge makes use of the fantastic shields.io service, which generates these small images (badges) for you that can be pasted straight into your readme, without requiring an API-key or extensive set-up.

Generally, there are a couple ways to get your downloads:

* Show the plugin downloads from the `obsidian-releases` `community-plugin-stats.json`, which is also used inside the plugin browser
* Show the theme downloads using Obsidian's stats API
* Show the latest release's asset downloads (e.g. `main.js` or `theme.css`) from GitHub
* Show the total downloads of the package

## Download Data

### Plugin downloads from `obsidian-releases`

The URL below gives the 'official' download count for any plugin listed in the community plugins browser. This counts *all* downloads over time, rather than the downloads for just a single version.

```[YOUR-PLUGIN-ID]
https://img.shields.io/badge/dynamic/json?query=%24%5B%22YOUR-PLUGIN-ID%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json
```

![](https://img.shields.io/badge/dynamic/json?query=%24%5B%22dataview%22%5D.downloads\&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

Let's break it down in smaller chunks, to make it more understandable.

```sh
# Fetch a badge using the dynamic JSON query endpoint
https://img.shields.io/badge/dynamic/json?
# Inside the JSON provided below, get the `downloads` field for the `YOUR-PLUGIN-ID`
query=%24%5B%22YOUR-PLUGIN-ID%22%5D.downloads&
# Use the JSON found at https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json
url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json
```

Note that this option is only available if you are fetching data for a plugin *and* it is available in the plugin browser.

### Theme downloads from Obsidian's API

The URL below gives the 'official' download count for any theme listed in the community themes browser. This counts *all* downloads over time, rather than the downloads for just a single version.

```[YOUR-THEME-ID]
https://img.shields.io/badge/dynamic/json?query=%24%5B%22YOUR-THEME-ID%22%5D.download&url=https%3A%2F%2Freleases.obsidian.md%2Fstats%2Ftheme
```

![](https://img.shields.io/badge/dynamic/json?query=%24%5B%22Minimal%22%5D.download\&url=https%3A%2F%2Freleases.obsidian.md%2Fstats%2Ftheme)

:::note
Make sure your theme's ID is properly encoded, e.g. a space should be encoded as `%20`
:::

```sh
# Fetch a badge using the dynamic JSON query endpoint
https://img.shields.io/badge/dynamic/json?
# Inside the JSON provided below, get the `download` field for the `YOUR-THEME-ID`
query=%24%5B%22YOUR-THEME-ID%22%5D.download&
# Use the JSON found at https://releases.obsidian.md/stats/theme, note that this is undocumented API and might change
url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json
```

Again, please note that this option only works if you are fetching data for a theme, *and* this theme is available in the theme browser.

### Plugin/Theme downloads from GitHub

If you want to fetch the downloads for your all releases, a specific release or just the latest one, shields.io has great configurators available for generating a custom link:

* All versions: [https://shields.io/badges/git-hub-downloads-specific-asset-all-releases](https://shields.io/badges/git-hub-downloads-specific-asset-all-releases)
  ![](https://img.shields.io/github/downloads/blacksmithgu/obsidian-dataview/main.js)
* Latest: [https://shields.io/badges/git-hub-downloads-specific-asset-latest-release](https://shields.io/badges/git-hub-downloads-specific-asset-latest-release)
  (Choose `downloads-pre` if you do not want to include beta releases)
  ![](https://img.shields.io/github/downloads/blacksmithgu/obsidian-dataview/latest/main.js)
* Specific version: [https://shields.io/badges/git-hub-downloads-specific-asset-specific-tag](https://shields.io/badges/git-hub-downloads-specific-asset-specific-tag)
  ![](https://img.shields.io/github/downloads/blacksmithgu/obsidian-dataview/0.5.59/main.js)

The following fields are always necessary:

* `user`: This is your GitHub user ID
* `repo`: This is the ID of the repo you want to fetch the downloads for
* `assetName`: This is either `main.js` (for plugins), or `theme.css` (for themes)

Again, a brief breakdown:

```sh
# Fetch a badge using the GitHub downloads endpoint
https://img.shields.io/github/downloads/
USER-ID/
REPO-ID/
# Either `latest/`, a specific version `0.5.1/`, or omitted for all versions
(latest/)
# theme.css or main.js
ASSET-NAME
```

## Customizing

You may have noticed that the badge looks kind of bland. Luckily, shields.io also has quite a few options available for customizing the badge. For all options, check out: [https://shields.io/badges/static-badge](https://shields.io/badges/static-badge).

Here, you can find a common style for making the badge a bit prettier:
![GitHub Downloads (specific asset, latest release)](https://img.shields.io/badge/dynamic/json?query=%24%5B%22translate%22%5D.downloads\&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json\&label=Downloads:\&logo=obsidian\&color=8c79de\&logoColor=8c79de)

```sh
YOUR-BADGE-URL
# Add the 'Downloads:' label to the left side of the badge 
&label=Downloads:
# Add the Obsidian logo
&logo=obsidian
# Make both the logo and download count purple
&color=8c79de
&logoColor=8c79de
```
