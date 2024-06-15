import ZKNavigationPlugin from "main";
import { TFile } from "obsidian";
import { ZKNode } from "src/view/indexView";

// formatting Luhmann style IDs
export async function ID_formatting(id: string, arr: string[]): Promise<string[]> {
    if (/^[0-9]$/.test(id[0])) {
        let numStr = id.match(/\d+/g);
        if (numStr && numStr.length > 0) {
            arr.push(numStr[0].padStart(4, "0"));
            let len = numStr[0].length;
            if (len < id.length) {
                return await ID_formatting(id.slice(len), arr);
            } else {
                return arr;
            }
        } else {
            return arr;
        }
    } else if (/^[a-zA-Z]$/.test(id[0])) {
        arr.push(id[0])
        if (id.length === 1) {
            return arr;
        } else {
            return await ID_formatting(id.slice(1), arr);
        }
    } else {
        if (id.length === 1) {
            return arr;
        } else {
            return await ID_formatting(id.slice(1), arr);
        }
    }
}

// translating different ID fields(filename/attribute/prefix of filename) into standard ZKNode array

export async function mainNoteInit(MainNotes:ZKNode[], plugin:ZKNavigationPlugin): Promise<ZKNode[]> {

    let mainNoteFiles:TFile[] = this.app.vault.getMarkdownFiles();

    if (plugin.settings.FolderOfMainNotes !== '') {
        mainNoteFiles = mainNoteFiles.filter(
            file => {
                return file.path.replace(file.name, "").startsWith(plugin.settings.FolderOfMainNotes + '/');
            })
    }

    if (plugin.settings.TagOfMainNotes !== '') {

        mainNoteFiles = mainNoteFiles.filter(
            file => {
                return this.app.metadataCache.getFileCache(file)?.frontmatter?.tags?.includes(
                    plugin.settings.TagOfMainNotes.substring(1)
                );
            }
        )
    }

    for (let note of mainNoteFiles) {
        let IDArr: string[] = [];

        let node: ZKNode = {
            ID: '',
            IDArr: IDArr,
            IDStr: '',
            position: 0,
            file: note,
            title: '',
            displayText: '',
            ctime: "",
        }

        let nodeCache = this.app.metadataCache.getFileCache(note);

        switch (plugin.settings.IDFieldOption) {
            case "1":
                node.ID = note.basename;

                node.IDArr = await ID_formatting(node.ID, node.IDArr);

                node.IDStr = IDArr.toString();

                if (nodeCache !== null) {
                    if (typeof nodeCache.frontmatter !== 'undefined' && plugin.settings.TitleField !== "") {
                        
                        let title = nodeCache.frontmatter[plugin.settings.TitleField]?.toString();
                        if (typeof title == "string" && title.length > 0) {
                            node.title = title;
                        }
                    }
                }

                break;
            case "2":
                if (nodeCache !== null) {
                    if (typeof nodeCache.frontmatter !== 'undefined' && plugin.settings.IDField !== "") {
                        let id = nodeCache.frontmatter[plugin.settings.IDField];
                        if (typeof id == "string" && id.length > 0) {
                            node.ID = id;
                            node.IDArr = await ID_formatting(node.ID, node.IDArr);
                            node.IDStr = node.IDArr.toString();
                            node.title = note.basename;
                        }
                    }
                }
                if (node.ID == '') {
                    continue;
                }
                break;
            case "3":
                node.ID = note.basename.split(plugin.settings.Separator)[0];
                node.IDArr = await ID_formatting(node.ID, node.IDArr);
                node.IDStr = IDArr.toString();
                if (node.ID.length < note.basename.length - 1) {
                    node.title = note.basename.substring(node.ID.length + 1);
                }
                break;
            default:
            // do nothing
        }

        switch (plugin.settings.NodeText) {
            case "id":
                node.displayText = node.ID;
                break;
            case "title":
                if (node.title == "") {
                    node.displayText = node.ID;
                } else {
                    node.displayText = node.title;
                }
                break;
            case "both":
                node.displayText = `${node.ID}: ${node.title}`;
                break;
            default:
            //do nothing
        }

        
        if (plugin.settings.CustomCreatedTime.length > 0) {
            
           let ctime = nodeCache?.frontmatter?.[plugin.settings.CustomCreatedTime];

           if(ctime){
                node.ctime = ctime.toString();
           }            
        }

        if(node.ctime === ""){         
            node.ctime = window.moment(node.file.stat.ctime).format('YYYY-MM-DD HH:mm:ss')                
        }

        MainNotes.push(node);
    }

    MainNotes.sort((a, b) => a.IDStr.localeCompare(b.IDStr));

    for (let i = 0; i < MainNotes.length; i++) {

        MainNotes[i].position = i;

    }

    return MainNotes;

}