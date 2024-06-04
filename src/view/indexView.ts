import ZKNavigationPlugin, { FoldNode, ZoomPanScale } from "main";
import { ButtonComponent, DropdownComponent, ItemView, Notice, TFile, WorkspaceLeaf, loadMermaid } from "obsidian";
import { t } from "src/lang/helper";
import { indexFuzzyModal, indexModal } from "src/modal/indexModal";

export const ZK_INDEX_TYPE: string = "zk-index-type";
export const ZK_INDEX_VIEW: string = t("zk-index-graph");
export const ZK_NAVIGATION: string = "zk-navigation";

export interface ZKNode {
    ID: string;
    IDArr: string[];
    IDStr: string;
    position: number;
    file: TFile;
    title: string;
    displayText: string;
    ctime: string;
}

export class ZKIndexView extends ItemView {

    plugin: ZKNavigationPlugin;
    MainNotes: ZKNode[];
    mainNoteFiles: TFile[];

    constructor(leaf: WorkspaceLeaf, plugin: ZKNavigationPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return ZK_INDEX_TYPE;
    }
    getDisplayText(): string {
        return ZK_INDEX_VIEW;
    }

    getIcon(): string {
        return "ghost";
    }

    async mainNoteFilesInit() {

        this.MainNotes = [];
        this.mainNoteFiles = [];

        this.mainNoteFiles = this.app.vault.getMarkdownFiles();

        if (this.plugin.settings.FolderOfMainNotes !== '') {
            this.mainNoteFiles = this.mainNoteFiles.filter(
                file => {
                    return file.path.replace(file.name, "").startsWith(this.plugin.settings.FolderOfMainNotes + '/');
                })
        }

        if (this.plugin.settings.TagOfMainNotes !== '') {

            this.mainNoteFiles = this.mainNoteFiles.filter(
                file => {
                    return this.app.metadataCache.getFileCache(file)?.frontmatter?.tags?.includes(
                        this.plugin.settings.TagOfMainNotes.substring(1)
                    );
                }
            )
        }

        for (let note of this.mainNoteFiles) {
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

            switch (this.plugin.settings.IDFieldOption) {
                case "1":
                    node.ID = note.basename;

                    node.IDArr = await this.ID_formatting(node.ID, node.IDArr);

                    node.IDStr = IDArr.toString();

                    if (nodeCache !== null) {
                        if (typeof nodeCache.frontmatter !== 'undefined' && this.plugin.settings.TitleField !== "") {
                            
                            let title = nodeCache.frontmatter[this.plugin.settings.TitleField]?.toString();
                            if (typeof title == "string" && title.length > 0) {
                                node.title = title;
                            }
                        }
                    }

                    break;
                case "2":
                    if (nodeCache !== null) {
                        if (typeof nodeCache.frontmatter !== 'undefined' && this.plugin.settings.IDField !== "") {
                            let id = nodeCache.frontmatter[this.plugin.settings.IDField];
                            if (typeof id == "string" && id.length > 0) {
                                node.ID = id;
                                node.IDArr = await this.ID_formatting(node.ID, node.IDArr);
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
                    node.ID = note.basename.split(this.plugin.settings.Separator)[0];
                    node.IDArr = await this.ID_formatting(node.ID, node.IDArr);
                    node.IDStr = IDArr.toString();
                    if (node.ID.length < note.basename.length - 1) {
                        node.title = note.basename.substring(node.ID.length + 1);
                    }
                    break;
                default:
                // do nothing
            }

            switch (this.plugin.settings.NodeText) {
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

            this.MainNotes.push(node);
        }

        this.MainNotes.sort((a, b) => a.IDStr.localeCompare(b.IDStr));

        for (let i = 0; i < this.MainNotes.length; i++) {

            this.MainNotes[i].position = i;

        }

    }

    async ID_formatting(id: string, arr: string[]): Promise<string[]> {
        if (/^[0-9]$/.test(id[0])) {
            let numStr = id.match(/\d+/g);
            if (numStr && numStr.length > 0) {
                arr.push(numStr[0].padStart(4, "0"));
                let len = numStr[0].length;
                if (len < id.length) {
                    return await this.ID_formatting(id.slice(len), arr);
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
                return await this.ID_formatting(id.slice(1), arr);
            }
        } else {
            if (id.length === 1) {
                return arr;
            } else {
                return await this.ID_formatting(id.slice(1), arr);
            }
        }
    }

    async IndexViewInterfaceInit() {
        
        let { containerEl } = this;
        containerEl.empty();

        // Create Divs on indexView
        const toolbarDiv = containerEl.createDiv("zk-index-toolbar");

        const indexMermaidDiv = containerEl.createDiv().createDiv("zk-index-mermaid-container");
        indexMermaidDiv.id = "zk-index-mermaid-container";


        indexMermaidDiv.empty();

        await this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
        
        const indexButtonDiv = toolbarDiv.createDiv("zk-index-toolbar-block");
        const indexButton = new ButtonComponent(indexButtonDiv).setClass("zk-index-toolbar-button");
        indexButton.setButtonText(this.plugin.settings.IndexButtonText);
        indexButton.setCta();
        indexButton.onClick(() => {
            this.plugin.settings.zoomPanScaleArr = [];
            this.plugin.settings.BranchTab = 0;
            if (this.plugin.settings.SuggestMode === "keywordOrder") {
                new indexModal(this.app, this.plugin, this.MainNotes, (index) => {
                    this.plugin.settings.SelectIndex = index;
                    this.plugin.settings.FoldNodeArr = [];                    
                    this.plugin.saveData(this.plugin.settings);
                    this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
                }).open();
            } else {
                new indexFuzzyModal(this.app, this.plugin, this.MainNotes, (index) => {
                    this.plugin.settings.SelectIndex = index;
                    this.plugin.settings.FoldNodeArr = [];
                    this.plugin.saveData(this.plugin.settings);
                    this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
                }).open();
            }
        });

        const startingDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        startingDiv.createEl("b", { text: t("Display from : ") });

        const startPoint = new DropdownComponent(startingDiv);
        startPoint
            .addOption("father", t("father"))
            .addOption("branch", t("branch"))
            .addOption("root", t("root"))
            .setValue(this.plugin.settings.StartingPoint)
            .onChange((StartPoint) => {
                this.plugin.settings.StartingPoint = StartPoint;
                this.plugin.settings.FoldNodeArr = [];
                this.plugin.settings.zoomPanScaleArr = [];
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
            });

        const displayLevelDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        displayLevelDiv.createEl("b", { text: t("To : ") });
        const displayLevel = new DropdownComponent(displayLevelDiv);
        displayLevel
            .addOption("next", t("next"))
            .addOption("end", t("end"))
            .setValue(this.plugin.settings.DisplayLevel)
            .onChange((DisplayLevel) => {
                this.plugin.settings.DisplayLevel = DisplayLevel;
                this.plugin.settings.FoldNodeArr = [];
                this.plugin.settings.zoomPanScaleArr = [];
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
            });

        const nodeTextDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        nodeTextDiv.createEl("b", { text: t("Text : ") });
        const nodeText = new DropdownComponent(nodeTextDiv);
        nodeText
            .addOption("id", "ID")
            .addOption("title", t("title"))
            .addOption("both", t("both"))
            .setValue(this.plugin.settings.NodeText)
            .onChange((NodeText) => {
                this.plugin.settings.NodeText = NodeText;
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
            });

    }

    async onOpen() {

        if(this.app.workspace.layoutReady){

            this.refreshIndexLayout();
        }else{
            this.app.workspace.onLayoutReady(()=>{

                this.refreshIndexLayout();
                
            });
        }

    }
    
    async refreshIndexLayout(){

        if (this.plugin.settings.FolderOfMainNotes == '' && this.plugin.settings.TagOfMainNotes == '') {

            new Notice("❌Setting error: no folder or tag specified for main notes!")

        } else if (this.plugin.settings.FolderOfIndexes == '') {

            new Notice("❌Setting error: no folder specified for index!")

        } else {            
            
            await this.IndexViewInterfaceInit();

            this.registerEvent(this.app.workspace.on("active-leaf-change", async(leaf)=>{                
                if(leaf && leaf.getDisplayText() == ZK_INDEX_VIEW){
                   await this.IndexViewInterfaceInit();
                }              
            }))

            this.registerEvent(this.app.vault.on("rename", async ()=>{
                await this.IndexViewInterfaceInit();
            }));

            this.registerEvent(this.app.vault.on("create", async ()=>{
                await this.IndexViewInterfaceInit();
            }));

            this.registerEvent(this.app.vault.on("delete", async ()=>{
                await this.IndexViewInterfaceInit();
            }));      
            
            this.registerEvent(this.app.metadataCache.on("changed", async()=>{
                await this.IndexViewInterfaceInit();
            }));

            this.registerEvent(this.app.metadataCache.on("deleted", async()=>{
                await this.IndexViewInterfaceInit();
            }));
        }
    }

    async refreshIndexMermaid(index: string, indexMermaidDiv: HTMLElement) {
        
        await this.mainNoteFilesInit();

        let branchEntranceNodeArr = await this.getBranchEntranceNode(index);
    
        indexMermaidDiv.empty();     

        const indexLinkDiv = indexMermaidDiv.createDiv("zk-index-link");
        indexLinkDiv.empty();
        indexLinkDiv.createEl('abbr', { text: t("Current index: ") });
        const indexFile = this.app.vault.getFileByPath(index);
        if (indexFile) {

            let link = indexLinkDiv.createEl('a', { text: `${indexFile.basename}` });

            link.addEventListener("click", (event: MouseEvent) => {
                if (event.ctrlKey) {
                    this.app.workspace.openLinkText("", indexFile.path, 'tab');
                } else {
                    this.app.workspace.openLinkText("", indexFile.path);
                }
            });
            
            link.addEventListener(`mouseover`, (event: MouseEvent) => {
                this.app.workspace.trigger(`hover-link`, {
                    event,
                    source: ZK_NAVIGATION,
                    hoverParent: link,
                    linktext: indexFile.basename,
                    targetEl: link,
                    sourcePath: indexFile.path,
                })
            });

            const mermaid = await loadMermaid();

            for (let i = 0; i < branchEntranceNodeArr.length; i++) {

                let branchAllNodes = await this.getBranchNodes(branchEntranceNodeArr[i]);
                let branchMermaidStr = await this.genericIndexMermaidStr(branchAllNodes, branchEntranceNodeArr[i],this.plugin.settings.DirectionOfBranchGraph);
                let zkGraph = indexMermaidDiv.createEl("div", { cls: "zk-index-mermaid" });
                zkGraph.id = `zk-index-mermaid-${i}`;
                let { svg } = await mermaid.render(`${zkGraph.id}-svg`, branchMermaidStr);
                zkGraph.insertAdjacentHTML('beforeend', svg);
                zkGraph.children[0].setAttribute('width', "98%");    
                zkGraph.children[0].setAttribute('height', `${this.plugin.settings.HeightOfBranchGraph}px`);    
                indexMermaidDiv.appendChild(zkGraph); 

                const svgPanZoom = require("svg-pan-zoom");
                let panZoomTiger = svgPanZoom(`#${zkGraph.id}-svg`, {
                    zoomEnabled: true,
                    controlIconsEnabled: false,
                    fit: true,                    
                    center: true,
                    minZoom: 0.001,
                    maxZoom: 1000,
                    dblClickZoomEnabled: false,
                    zoomScaleSensitivity: 0.2,
                    
                    onZoom: async () => {                        
                        this.plugin.settings.zoomPanScaleArr[i].zoomScale = panZoomTiger.getZoom();

                    },
                    onPan: async ()=> {
                        this.plugin.settings.zoomPanScaleArr[i].pan = panZoomTiger.getPan();
                        
                    }
                })

                if(typeof this.plugin.settings.zoomPanScaleArr[i] === 'undefined'){
                    
                    const setSvg = document.getElementById(`${zkGraph.id}-svg`);
                
                    if(setSvg !== null){
                        let a = setSvg.children[0].getAttr("style");
                        if(typeof a == 'string'){
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

                        this.plugin.settings.zoomPanScaleArr.push(zoomPanScale);
                    }

                }else{
                    
                    panZoomTiger.zoom(this.plugin.settings.zoomPanScaleArr[i].zoomScale);  
                    panZoomTiger.pan(this.plugin.settings.zoomPanScaleArr[i].pan);                             
                }
                       
                
                const indexMermaid = document.getElementById(zkGraph.id)

                if (indexMermaid !== null) {


                    for (let foldNode of this.plugin.settings.FoldNodeArr.filter(n => n.graphID == zkGraph.id)) {

                        let hideNodes = this.MainNotes.filter(n =>
                            n.IDStr.startsWith(foldNode.nodeIDstr) && (n.IDStr !== foldNode.nodeIDstr)
                        );

                        for (let hideNode of hideNodes) {
                            let hideNodeGArr = indexMermaid.querySelectorAll(`[id^='flowchart-${hideNode.position}']`);

                            hideNodeGArr.forEach((item) => {
                                item.setAttribute("style", "display:none");
                            })

                            let hideLines = indexMermaid.querySelectorAll(`[id^='L-${hideNode.position}']`);

                            hideLines.forEach((item) => {
                                item.setAttribute("style", "display:none");
                            })
                        }

                        let hideLines = indexMermaid.querySelectorAll(`[id^='L-${foldNode.position}']`);
                        hideLines.forEach((item) => {
                            item.setAttribute("style", "display:none");
                        })

                    }

                    let nodeGArr = indexMermaid.querySelectorAll("[id^='flowchart-']");
                    let flowchartG = indexMermaid.querySelector("g.nodes");

                    if (flowchartG !== null) {

                        let nodeArr = flowchartG.getElementsByClassName("nodeLabel");

                        for (let i = 0; i < nodeArr.length; i++) {
                            let link = document.createElement('a');
                            link.addClass("internal-link");
                            let nodePosStr = nodeGArr[i].id.split('-')[1];
                            let node = this.MainNotes.filter(n => n.position == Number(nodePosStr))[0];
                            link.textContent = nodeArr[i].getText();
                            nodeArr[i].textContent = "";
                            nodeArr[i].appendChild(link);
                            nodeArr[i].addEventListener("click", (event: MouseEvent) => {
                                if (event.ctrlKey) {
                                    this.app.workspace.openLinkText("", node.file.path, 'tab');
                                } else {
                                    this.app.workspace.openLinkText("", node.file.path)
                                }
                                event.stopPropagation();
                            })

                            nodeGArr[i].addEventListener("click", (event: MouseEvent) => {
                                if (event.ctrlKey) {
                                    navigator.clipboard.writeText(node.ID)
                                    new Notice(node.ID + " copied")
                                }
                            })

                            nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                                this.app.workspace.trigger(`hover-link`, {
                                    event,
                                    source: ZK_NAVIGATION,
                                    hoverParent: this,
                                    linktext: node.file.basename,
                                    targetEl: link,
                                    sourcePath: node.file.path,
                                })
                            });

                            if (this.plugin.settings.FoldToggle == true) {

                                let foldIcon = document.createElement("span")
                                nodeArr[i].parentNode?.insertAfter(foldIcon, nodeArr[i]);
                                if (typeof this.plugin.settings.FoldNodeArr.find(n =>
                                    (n.nodeIDstr == node.IDStr) && (n.graphID == zkGraph.id)) === "undefined"
                                ) {
                                    foldIcon.textContent = "🟡";
                                } else {
                                    foldIcon.textContent = "🟢";
                                }

                                foldIcon.addEventListener("click", async () => {                                   

                                    let foldNode: FoldNode = {
                                        graphID: zkGraph.id,
                                        nodeIDstr: node.IDStr,
                                        position: node.position,
                                    };

                                    if ((this.plugin.settings.FoldNodeArr.length === 0)) {
                                        if (this.MainNotes.filter(n => n.IDStr.startsWith(node.IDStr)).length > 1) {
                                            this.plugin.settings.FoldNodeArr.push(foldNode);
                                        }
                                    } else {
                                        if (typeof this.plugin.settings.FoldNodeArr.find(n =>
                                            (n.nodeIDstr == node.IDStr) && (n.graphID = zkGraph.id)) === "undefined"
                                        ) {
                                            if (this.MainNotes.filter(n => n.IDStr.startsWith(node.IDStr)).length > 1) {
                                                this.plugin.settings.FoldNodeArr.push(foldNode);
                                            }
                                        } else {
                                            this.plugin.settings.FoldNodeArr = this.plugin.settings.FoldNodeArr.filter(n =>
                                                !(n.graphID == foldNode.graphID && n.nodeIDstr == foldNode.nodeIDstr)
                                            );
                                        }
                                    }
                                    await this.plugin.saveData(this.plugin.settings);
                                    await this.refreshIndexMermaid(index, indexMermaidDiv)

                                })
                            }
                        }
                    }
                }
            }
            
            if(branchEntranceNodeArr.length > 1){

                const branchTabs = document.getElementsByClassName("zk-index-mermaid")
                indexLinkDiv.createEl('small', { text: ` >> `});

                for(let i = 0; i < branchTabs.length; i++){

                    let branchTab = indexLinkDiv.createEl('span').createEl('a', { text: `🌿${i+1} `,cls:"zK-branch-tab"});

                    branchTab.addEventListener("click", async () => {                        
                        await this.openBranchTab(i);
                    });
                    
                }
                
                await this.openBranchTab(this.plugin.settings.BranchTab);
            }

            
        }

    }

    async openBranchTab(tabNo:number){

        this.plugin.settings.BranchTab = tabNo;        
        this.plugin.saveData(this.plugin.settings);

        const branchGraph = document.getElementsByClassName("zk-index-mermaid")
        const branchTabs = document.querySelectorAll('[class^="zK-branch-tab"]')

        for(let i=0; i<branchGraph.length;i++){
            branchGraph[i].setAttribute("style", "display:none");
            branchTabs[i].className = "zK-branch-tabs";
        }

        branchGraph[tabNo].setAttribute("style", "display:block");
        branchTabs[tabNo].className = "zK-branch-tab-select";
        
    }

    async getBranchEntranceNode(index: string) {

        let branchNodeArr: ZKNode[] = [];
        
        const indexFile = this.app.vault.getFileByPath(index);
               

        if (indexFile !== null) {
            
            const resolvedLinks = this.app.metadataCache.resolvedLinks;
            let frontLinks: string[] = Object.keys(resolvedLinks[indexFile.path])
                .filter(l => l.endsWith("md"));

            if (frontLinks.length > 0) {
                for (let link of frontLinks) {
                    let branchFile = this.app.vault.getFileByPath(link);

                    if (branchFile) {
                        let nodes = this.MainNotes.filter(l => l.file.path == branchFile?.path);
                        if (nodes.length > 0) {
                            branchNodeArr.push(nodes[0]);
                        }
                    }
                }
            }

            if (this.plugin.settings.SelectIndex !== '' && branchNodeArr.length == 0) {
                new Notice(`Index: "${indexFile.basename}" has no valid main note outlinks`);
            }
        }
        
        

        return branchNodeArr;
    }

    async getBranchNodes(entranceNode: ZKNode) {

        let branchNodes: ZKNode[] = [];
        let startNode = entranceNode;

        // Starting node
        switch (this.plugin.settings.StartingPoint) {
            case "root":
                let frontNodes = this.MainNotes.filter(n => entranceNode.IDStr.startsWith(n.IDStr));

                if (frontNodes.length > 0) {
                    startNode = frontNodes[0];

                } else {
                    new Notice("Can't find the root of the branch!");
                }

                branchNodes = this.MainNotes.filter(n => n.IDStr.startsWith(startNode.IDStr));

                break;

            case "father":
                if (entranceNode.IDArr.length > 1) {
                    let fatherArr = entranceNode.IDArr.slice(0, entranceNode.IDArr.length - 1);

                    let fatherNode = this.MainNotes
                        .find(n => n.IDStr == fatherArr.toString());

                    if (typeof fatherNode !== 'undefined') {
                        startNode = fatherNode;

                    } else {
                        startNode = entranceNode;
                    }

                } else {
                    startNode = entranceNode;
                }

                // only keep the father, siblings and sons of entranceNode
                branchNodes = this.MainNotes
                    .filter(n => n.IDStr.startsWith(startNode.IDStr))
                    .filter(n => n.IDStr.startsWith(entranceNode.IDStr) || (n.IDArr.length <= entranceNode.IDArr.length));

                break;
            default:
                branchNodes = this.MainNotes.filter(n => n.IDStr.startsWith(entranceNode.IDStr));

        }

        // branch level
        if (this.plugin.settings.DisplayLevel == "next") {

            branchNodes = branchNodes.filter(n => !n.IDStr.startsWith(entranceNode.IDStr) ||
                n.IDArr.length <= entranceNode.IDArr.length + 1);
        }

        return branchNodes;

    }

    async genericIndexMermaidStr(Nodes: ZKNode[], entranceNode: ZKNode, direction: string) {

        let mermaidStr: string = `%%{ init: { 'flowchart': { 'curve': 'basis' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart ${direction};\n`;

        for (let node of Nodes) {
            
            mermaidStr = mermaidStr + `${node.position}("${node.displayText}");\n`;

            if (node.IDStr.startsWith(entranceNode.IDStr)) {
                //黄底                
                mermaidStr = mermaidStr + `style ${node.position} fill:#ffa,stroke:#333,stroke-width:1px \n`;

            } else {
                //白底
                mermaidStr = mermaidStr + `style ${node.position} fill:#fff; \n`;
            }

        }
        
        for (let node of Nodes) {

            let sonNodes = Nodes.filter(n => (n.IDArr.length - 1 == node.IDArr.length)
                && n.IDStr.startsWith(node.IDStr) && n.ID.startsWith(node.ID));

            for (let son of sonNodes) {

                mermaidStr = mermaidStr + `${node.position} ---> ${son.position};\n`;

            }
        }

        if (this.plugin.settings.RedDashLine === true) {

            for (let node of Nodes) {
                if (/^[a-zA-Z]$/.test(node.ID.slice(-1))) {
                    //红色虚线边
                    mermaidStr = mermaidStr + `style ${node.position} stroke:#f66,stroke-width:2px,stroke-dasharray: 1 \n`;
                }
            }
        }
        
        return mermaidStr;
    }
    async onClose() {
        this.plugin.saveData(this.plugin.settings);
    }

}
