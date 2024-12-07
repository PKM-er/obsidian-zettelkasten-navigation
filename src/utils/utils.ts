import ZKNavigationPlugin, { ZoomPanScale } from "main";
import { loadMermaid, moment, Notice, TFile } from "obsidian";
import { ZKNode } from "src/view/indexView";

// formatting Luhmann style IDs
export async function ID_formatting(id: string, arr: string[], siblingsOrder:string): Promise<string[]> {
    if (/^[0-9]$/.test(id[0])) {
        let numStr = id.match(/\d+/g);
        if (numStr && numStr.length > 0) {
            arr.push(numStr[0].padStart(4, "0"));
            let len = numStr[0].length;
            if (len < id.length) {
                return await ID_formatting(id.slice(len), arr, siblingsOrder);
            } else {
                return arr;
            }
        } else {
            return arr;
        }
    } else if (/^[a-zA-Z]$/.test(id[0])) {
        let letterStr:string;
        if(siblingsOrder === "letter"){
            letterStr = id[0].padStart(5,"0");
        }else{
            letterStr = id[0];
        }        
        arr.push(letterStr)
        if (id.length === 1) {
            return arr;
        } else {
            return await ID_formatting(id.slice(1), arr, siblingsOrder);
        }
    } else {
        if (id.length === 1) {
            return arr;
        } else {
            return await ID_formatting(id.slice(1), arr, siblingsOrder);
        }
    }
}

// translating different ID fields(filename/attribute/prefix of filename) into standard ZKNode array
export async function mainNoteInit(plugin:ZKNavigationPlugin){

    let mainNoteFiles:TFile[] = this.app.vault.getMarkdownFiles();
    
    plugin.MainNotes = [];

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
            ctime: 0,
            randomId: random(16),
            nodeSons:1,
            startY:0,
            height:0,
            isRoot: false,
            fixWidth: 0,
            branchName: "",
            gitNodePos: 0,
        }

        let nodeCache = this.app.metadataCache.getFileCache(note);

        switch (plugin.settings.IDFieldOption) {
            case "1":
                node.ID = note.basename;

                node.IDArr = await ID_formatting(node.ID, node.IDArr, plugin.settings.siblingsOrder);

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
                        if(Array.isArray(id)){
                            node.ID = id[0].toString();
                            node.IDArr = await ID_formatting(node.ID, node.IDArr, plugin.settings.siblingsOrder);
                            node.IDStr = node.IDArr.toString();
                            node.title = note.basename;
                        }else if (typeof id == "string") {
                            node.ID = id;
                            node.IDArr = await ID_formatting(node.ID, node.IDArr, plugin.settings.siblingsOrder);
                            node.IDStr = node.IDArr.toString();
                            node.title = note.basename;
                        }else if(typeof id == 'number'){
                            node.ID = id.toString();
                            node.IDArr = await ID_formatting(node.ID, node.IDArr, plugin.settings.siblingsOrder);
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
                node.IDArr = await ID_formatting(node.ID, node.IDArr, plugin.settings.siblingsOrder);
                node.IDStr = IDArr.toString();
                if (node.ID.length < note.basename.length - 1) {
                    node.title = note.basename.substring(node.ID.length + 1);
                }
                break;
            default:
            // do nothing
        }
        
        if (plugin.settings.CustomCreatedTime.length > 0) {
            
           let ctime = nodeCache?.frontmatter?.[plugin.settings.CustomCreatedTime];

           if(ctime){
                let time = moment(ctime);
                if(time.isValid()){
                    node.ctime = time.valueOf();
                }
           }            
        }

        if(node.ctime === 0){         
            node.ctime = node.file.stat.ctime         
        }

        plugin.MainNotes.push(node);
    }

    if(plugin.settings.multiIDToggle == true && plugin.settings.multiIDField != ''){
        
        let duplicateNodes:ZKNode[] = [];

        for (let i = 0; i < plugin.MainNotes.length; i++) {
            let node = plugin.MainNotes[i];
            let fm = await this.app.metadataCache.getFileCache(node.file).frontmatter;
            if(fm){
                let IDs = fm[plugin.settings.multiIDField];
                if(Array.isArray(IDs)){
                    for(let j = 0; j < IDs.length; j++){
                        let nodeDup =  Object.assign({}, node);
                        nodeDup.ID = IDs[j].toString();
                        nodeDup.IDArr = await ID_formatting(nodeDup.ID, [], plugin.settings.siblingsOrder);
                        nodeDup.IDStr = nodeDup.IDArr.toString();
                        nodeDup.randomId = random(16);
                        duplicateNodes.push(nodeDup)
                    }
                }else if(typeof IDs == "string"){
                    let nodeDup =  Object.assign({}, node);
                    nodeDup.ID = IDs;
                    nodeDup.IDArr = await ID_formatting(nodeDup.ID, [], plugin.settings.siblingsOrder);
                    nodeDup.IDStr = nodeDup.IDArr.toString();
                    nodeDup.randomId = random(16);
                    duplicateNodes.push(nodeDup)
                }
            }
        }
        if(duplicateNodes.length > 0){
            plugin.MainNotes.push(...duplicateNodes);
            plugin.MainNotes = uniqueBy(plugin.MainNotes);
        }
    }

    plugin.MainNotes.sort((a, b) => a.IDStr.localeCompare(b.IDStr));

    for (let i = 0; i < plugin.MainNotes.length; i++) {
        let node = plugin.MainNotes[i];
        node.position = i;
        if(!plugin.MainNotes.find(n=>n.IDArr.toString() == node.IDArr.slice(0,-1).toString())){
            node.isRoot = true;
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
    }
}

export const random = (e: number) => {
	let t = [];
	for (let n = 0; n < e; n++) {
		t.push((16 * Math.random() | 0).toString(16));
	}
	return t.join("");
};


function uniqueBy(arr: ZKNode[]) {
    const map = new Map();
    const result = [];
    for (const item of arr) {
      const compoundKey = item.ID + '_' + item.file.path;
      if (!map.has(compoundKey)) {
        map.set(compoundKey, true);
        result.push(item);
      }
    }
    return result;
}

export function displayWidth(str:string){
    let length = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        length += charCode >= 0 && charCode <= 128 ? 1 : 2;
    }
    return length;
}

export async function addSvgPanZoom(
    zkGraph:HTMLDivElement, 
    indexMermaidDiv: HTMLElement, 
    i:number, 
    plugin:ZKNavigationPlugin, 
    mermaidStr:string, height:number){
    
    const mermaid = await loadMermaid();
    let { svg } = await mermaid.render(`${zkGraph.id}-svg`, mermaidStr);
            
    zkGraph.insertAdjacentHTML('beforeend', svg);
    
    zkGraph.children[0].addClass("zk-full-width");

    zkGraph.children[0].setAttr('height', `${height}px`); 
    
    indexMermaidDiv.appendChild(zkGraph);

    const svgPanZoom = require("svg-pan-zoom");
            
    let panZoomTiger = await svgPanZoom(`#${zkGraph.id}-svg`, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,                    
        center: true,
        minZoom: 0.001,
        maxZoom: 1000,
        dblClickZoomEnabled: false,
        zoomScaleSensitivity: 0.2,
        
        onZoom: async () => {                        
            plugin.settings.zoomPanScaleArr[i].zoomScale = panZoomTiger.getZoom();

        },
        onPan: async ()=> {
            plugin.settings.zoomPanScaleArr[i].pan = panZoomTiger.getPan();
            
        }
    })

    if(typeof plugin.settings.zoomPanScaleArr[i] === 'undefined'){
        
        const setSvg = document.getElementById(`${zkGraph.id}-svg`);
        
        if(setSvg !== null){
            let a = setSvg.children[0].getAttr("style");
            if(a){
                let b = a.match(/\d([^\,]+)\d/g)
                if(b !== null && Number(b[0]) > 1){
                    panZoomTiger.zoom(1/Number(b[0]))
                }                        
            }
            let zoomPanScale: ZoomPanScale = {
                graphID: zkGraph.id,
                zoomScale: panZoomTiger.getZoom(),
                pan: panZoomTiger.getPan(),
            };

            plugin.settings.zoomPanScaleArr.push(zoomPanScale);
        }

    }else{
        panZoomTiger.zoom(plugin.settings.zoomPanScaleArr[i].zoomScale);  
        panZoomTiger.pan(plugin.settings.zoomPanScaleArr[i].pan); 
                
    }  
}