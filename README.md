# Mindmap NextGen

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/verocloud/obsidian-mindmap-nextgen/release.yml?logo=github&style=for-the-badge)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/verocloud/obsidian-mindmap-nextgen?style=for-the-badge&sort=semver)

Obsidian plugin to view your notes as mindmaps using [Markmap](https://markmap.js.org/).

A similar plugin is available for [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode).

## Table of contents
+ [Usage](#usage)
+ ["More options" menu](#more-options-menu)
  + [Pin/Unpin](#pinunpin)
  + [Copy screenshot](#copy-screenshot)
  + [Collapse all](#collapse-all)
  + [Toggle toolbar](#toggle-toolbar)
+ [Settings](#settings)
  + [Frontmatter](#frontmatter)
  + [Coloring approaches](#coloring-approaches)
  + [Highlight inline markmaps](#highlight-inline-markmaps)
  + [Use title as root node](#use-title-as-root-node)
+ [Other features](#other-features)
  + [Checkboxes](#checkboxes)
  + [LaTeX](#latex)
+ [Installing](#installing)
+ [Contributing](#contributing)


## Usage

Open the command palette (cmd/ctrl-p) and begin typing the name of one of the 2 commands.

<img width="720" alt="Command palette commands" src="https://user-images.githubusercontent.com/10291002/216599311-75ec8e62-3e99-4e09-abc3-86ff125ab308.png">

What's the difference between a pinned and an unpinned mindmap? A pinned mindmap is linked to a single Markdown document. An unpinned mindmap will update based on whichever document is the last one you clicked on.

You can also insert mindmaps inside your document using a Markdown code block tagged with "markmap". For example:

~~~
```markmap
# Mindmap
## Mindmap
```
~~~


## "More options" menu

This is the menu in the top right of each tab.

<img width="104" alt="image" src="https://user-images.githubusercontent.com/10291002/217636599-1b33270b-4887-4153-aa07-468255ccf5f2.png">


### Pin/Unpin

Switch the tab to unpinned, or pin it to the active document.

### Copy screenshot

Copy a PNG of the mindmap to the clipboard.
Background and text color are configurable in settings or the document's frontmatter.

### Collapse all

Closes all mindmap nodes, leaving just the root visible

### Toggle toolbar

Show or hide the toolbar in the bottom right of the mindmap


## Other Features

### Checkboxes

Checkboxes will be displayed in the mindmap like so:

```
# Housework
## Main
- [x] Dishes
- [ ] Cleaning the bathroom
- [x] Change the light bulbs
- [ ] something else
## [x] Also works on titles
```
![Mindmap checkbox example](images/mind-map-checkboxes.png)

### LaTeX
LaTex expressions will be rendered in your mindmaps. Surround an inline expression with a dollar sign on either side.

`$\frac{\partial f}{\partial t}$`

Or use two dollar signs for a multiline expression.
```
$$
\frac{\partial f}{\partial t}
$$
```


## Frontmatter

Some settings can be set in each document's frontmatter. Frontmatter settings take precedence over global settings, when set.

The plugin will use any of [markmap's settings](https://markmap.js.org/docs/json-options) except for `extraJs` and `extraCss`).

**Example:**
```markdown
---
markmap:
  screenshotTextColor: #28F48D
  highlight: true
  titleAsRootNode: true
---
```


## Settings

### Coloring approaches
There are three approaches to coloring the branches of the mindmap for you to choose from, either in plugin settings or each document's frontmatter.

#### Branch coloring
This mode will choose random different colors per branch. The "Color freeze level" setting decides at what depth the branches will stop picking new colors.

#### Depth coloring
In this mode, branches are coloured depending on their depth level. In your plugin settings, you can choose the first three levels' colors, plus a default color for levels deeper than three.

#### Single color
In this mode, all branches are colored with a single color, which you can choose in your plugin settings.

#### Branch thickness
Regardless which coloring approach you choose, you can set branch thickness for the first three depth levels, and a default thickness for levels beyond that.


### Highlight inline markmaps

Frontmatter setting: `highlight`

Add a background to inline markmaps to make them stand out from the rest of the page.


### Use title as root node

Frontmatter setting: `titleAsRootNode`

Generate mindmaps with the title at the bottom level, so you can avoid repeating the title.


### Screenshot settings

Frontmatter settings: `screenshotTextColor`, `screenshotBgColor`

Decide what colors the screenshot function will use.

Take screenshots via the ["More options" menu](#more-options-menu).


## Installing

Search for "Mindmap NextGen" in the Community Plugins section in your Obsidian settings.

### Compatibility

The obsidian version I have tested is **v1.0.3**, which is recommended to use at least version **v1.0.0**.

### Manual installation

1. Download the [latest release](https://github.com/MasterTuto/obsidian-mindmap-vb/releases/latest)
2. Extract the obsidian-mindmap-nextgen folder from the zip to your vault's plugins folder: `<vault>/.obsidian/plugins/`  
   Note: On some machines the `.obsidian` folder may be hidden. On MacOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.
3. Reload Obsidian
4. If prompted about Safe Mode, you can disable safe mode and enable the plugin.

### Nightly Installation

Before anything you will need the following tools installed on your machine:
* [NodeJS](https://nodejs.org/en/)
* NPM (comes with NodeJS)
* Git (optional)

1. Open obsidian
2. Go to `Settings` > `Community plugins`.
3. On `Installed plugins` you can find a folder icon in the end, click on it:

![Obsidian Open Plugin Folder Icon](https://user-images.githubusercontent.com/21978588/206907799-7a79e2fa-3535-4c51-9604-dc45cb5bd21e.png)

4. Keep this folder open.
5. You can directly click [HERE](https://github.com/AdrianSimionov/obsidian-mindmap-nextgen/archive/refs/heads/main.zip) to download the zip file. Or you can go to [this repo](https://github.com/AdrianSimionov/obsidian-mindmap-nextgen/) and click on the green icon "CODE" and then "Download ZIP".
6. Go to your Downloads folder, or wherever you have downloaded it.
7. Extract the zip file.
8. Copy the extracted folder to the folder you have open on step 3.
9. Go to that extracted folder and open it on terminal (On Windows you can `Shift + Right Click` and then "Open Command Prompt Here" or "Open Powershell Here", and on Linux just `Right Click` and click on "Open terminal here").
10. Run `npm install`.
11. Run `npm run dev`.
12. Go to `Settings` > `Community plugins` on Obsidian.
13. Reload the plugins folder, and then enable "Mindmap NextGen"

## Contributing

Pull requests and issues are both welcome and appreciated. 😀

If you would like to contribute to the development of this plugin, please follow the guidelines provided in [CONTRIBUTING.md](CONTRIBUTING.md).
