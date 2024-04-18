# [Obsidian Zettelkasten Navigation](https://github.com/terrychenzw/obsidian-zettelkasten-navigation)

This plugin provides 2 customViews for navigating a zettelkasten using Luhmann-style IDs and key word indexes.
![Demo](https://github.com/terrychenzw/obsidian-zettelkasten-navigation/blob/d70396c5180e00ec3985a5253f88c74dbe18456c/attachments/Demo.gif)
## Main function

1. zk-index-graph-view
2. zk-local-graph-view

## Prerequisites

1. **Luhmann-style IDs**. below style IDs are supported by this plugin:
	- **100% Luhmann IDs**: such as 21/3a1p5c4aA11 , 12.5.1. (more detials please refer to [Niklas Luhmann-Archiv](https://niklas-luhmann-archiv.de/bestand/zettelkasten/inhaltsuebersicht#ZK_1_editor_I_1))
	- **Folgezettel**: such as 13.8c1c1b3. (more detials please refer to [How to Use Folgezettel in Your Zettelkasten](https://writing.bobdoto.computer/how-to-use-folgezettel-in-your-zettelkasten-everything-you-need-to-know-to-get-started/))
	- **Antinet**: such as 3306/2A/12. (more detials please refer to [Introducing the Antinet Zettelkasten](https://zettelkasten.de/posts/introduction-antinet-zettelkasten/))
	- (As '/' is not allowed in file name on computer, it must be changed to '-', '.' or ',')

2. **Luhmann-style key word indexes**.
	- Each key word index contains a few notes (branch entrance). (more detials plase refer to [Niklas Luhmann-Archiv](https://niklas-luhmann-archiv.de/bestand/zettelkasten/schlagwortregister))
	- In this plugin, a valid key word index is a single file contains a few main note linkages.

## Plugin Settings

1. folder location for main note files (mandatory)
2. folder location for keyword index files(mandatory)
3. others settings(optional)

MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
