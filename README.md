# [Obsidian Zettelkasten Navigation](https://github.com/terrychenzw/obsidian-zettelkasten-navigation)
This plugin provides 2 customViews for navigating a zettelkasten using Luhmann-style IDs and key word indexes.

![Demo](https://github.com/terrychenzw/obsidian-zettelkasten-navigation/blob/35981ab539718b3248afd5d7c9e844d987dfa209/attachments/Demo.gif)

## Main functionalities
1. zk-index-graph-view
2. zk-local-graph-view

## Why Mermaid?
Because Obsidian supports Mermaid.js natively.

This plugin uses [Obsidian API: loadMermaid()](https://docs.obsidian.md/Reference/TypeScript+API/loadMermaid) to generate flowcharts and uses [d3.js](https://github.com/d3/d3) for zooming mermaid flowcharts.

## Prerequisites
1. **Luhmann-style IDs**. below style IDs are supported by this plugin:
	- **100% Luhmann IDs**: such as 21/3a1p5c4aA11 , 12.5.1. (more detials please refer to [Niklas Luhmann-Archiv](https://niklas-luhmann-archiv.de/bestand/zettelkasten/inhaltsuebersicht#ZK_1_editor_I_1))
	- **Folgezettel**: such as 13.8c1c1b3. (more detials please refer to [How to Use Folgezettel in Your Zettelkasten](https://writing.bobdoto.computer/how-to-use-folgezettel-in-your-zettelkasten-everything-you-need-to-know-to-get-started/))
	- **Antinet**: such as 3306/2A/12. (more detials please refer to [Introducing the Antinet Zettelkasten](https://zettelkasten.de/posts/introduction-antinet-zettelkasten/))
	- (As '/' is not allowed in file name on computer, it must be changed to '-', '.' or ',' if the file name is the note ID of your main notes.)

2. **Luhmann-style key word indexes**.
	- Each key word index contains a few notes (branch entrance). (more detials plase refer to [Niklas Luhmann-Archiv](https://niklas-luhmann-archiv.de/bestand/zettelkasten/schlagwortregister))
	- In this plugin, a valid key word index is a single file contains a few linkages of main notes.

## ID field options
Below ID field options are supported by this plugin. You have to choose 1 option in the plugin settingTab.
1. option 1: filename as note ID
2. option 2: metadata as note ID
3. option 3: prefix of filename as note ID

## Plugin Settings
1. Specify a folder location or/and a tag for main note files (mandatory)
2. Specify a folder location for keyword index files(mandatory)
3. Choose 1 option for your note's ID field.
4. others settings(optional)

## Installation
`Settings > Community plugins > Community Plugins > Browse` and search for `Zettelkasten Navigation`.
