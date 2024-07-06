import ZKNavigationPlugin from "main";
import { ExtraButtonComponent, FileView, ItemView, Notice, TFile, WorkspaceLeaf, debounce, loadMermaid } from "obsidian";
import { ZKNode, ZK_NAVIGATION } from "./indexView";
import { t } from "src/lang/helper";
import { mainNoteInit } from "src/utils/utils";
import { expandGraphModal } from "src/modal/expandGraphModal";

export const ZK_GRAPH_TYPE: string = "zk-graph-type"
export const ZK_GRAPH_VIEW: string = t("zk-local-graph")

export class ZKGraphView extends ItemView {

    plugin: ZKNavigationPlugin;
    MainNotes: ZKNode[] = [];
    mainNoteFiles: TFile[] = [];
    currentFile: TFile | null;

    constructor(leaf: WorkspaceLeaf, plugin: ZKNavigationPlugin) {
        super(leaf);
        this.plugin = plugin;

    }

    getViewType(): string {
        return ZK_GRAPH_TYPE;
    }
    getDisplayText(): string {
        return ZK_GRAPH_VIEW;
    }

    getIcon(): string {
        return "network"
    }

    async onOpen() {
        this.refreshLocalGraph();        
    }

    onload() {

        const refresh = debounce(this.refreshLocalGraph, 300, true);

        this.registerEvent(this.app.vault.on("rename", () => {                        
            refresh();
        }));
        
        this.registerEvent(this.app.vault.on("create", () => {            
            refresh();
        }));

        this.registerEvent(this.app.vault.on("delete", () => {            
            refresh();
        }));

        this.registerEvent(this.app.metadataCache.on("changed", ()=>{
            refresh();
        }));

        this.registerEvent(this.app.metadataCache.on("deleted", ()=>{
            refresh();
        }));
        
        this.registerEvent(this.app.workspace.on("active-leaf-change", async(leaf)=>{  
            
            if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length > 0){  
                if(this.app.workspace.getActiveViewOfType(FileView)||this.app.workspace.getActiveViewOfType(ZKGraphView)){             
                    refresh();
                }
            }             
        }));

        this.registerEvent(this.app.workspace.on("zk-navigation:refresh-local-graph",  refresh));

    }

    refreshLocalGraph = async () => {
        let { containerEl } = this;
        containerEl.empty();
        const graphMermaidDiv = containerEl.createDiv().createDiv("zk-graph-mermaid-container");
        
        if(this.plugin.FileforLocaLgraph !== ""){
            this.currentFile = this.app.vault.getFileByPath(this.plugin.FileforLocaLgraph);
        }else{
            this.currentFile = this.app.workspace.getActiveFile();
        } 
        this.plugin.FileforLocaLgraph = "";

        graphMermaidDiv.empty();

        if (this.currentFile !== null) {

            const mermaid = await loadMermaid();
            const svgPanZoom = require("svg-pan-zoom");
            if (this.plugin.settings.FamilyGraphToggle == true) {
                
                let familyNodeArr: ZKNode[] = await this.getFamilyNodes(this.currentFile);
                let familyMermaidStr: string = await this.genericFamilyMermaidStr(this.currentFile, familyNodeArr, this.plugin.settings.DirectionOfFamilyGraph);

                const familyGraphContainer = graphMermaidDiv.createDiv("zk-family-graph-container");
                const familyGraphTextDiv = familyGraphContainer.createDiv("zk-graph-text");

                familyGraphTextDiv.empty();
                familyGraphTextDiv.createEl('span', { text: t("close relative") })

                let graphIconDiv = familyGraphContainer.createDiv("zk-graph-icon");
                graphIconDiv.empty();
                let expandBtn = new ExtraButtonComponent(graphIconDiv);
                expandBtn.setIcon("expand").setTooltip(t("expand graph"));
                expandBtn.onClick(()=>{              
                    new expandGraphModal(this.app,this.plugin, familyNodeArr, [], familyMermaidStr).open();
                })

                const familyTreeDiv = familyGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });

                familyTreeDiv.id = "zk-family-tree";                    
                let { svg } = await mermaid.render(`${familyTreeDiv.id}-svg`, `${familyMermaidStr}`);
                familyTreeDiv.insertAdjacentHTML('beforeend', svg);
                familyTreeDiv.children[0].setAttribute('width', "100%");
                familyTreeDiv.children[0].setAttribute('height', `${this.plugin.settings.HeightOfFamilyGraph}px`);    
                graphMermaidDiv.appendChild(familyTreeDiv);
                                                   
                let panZoomTiger = svgPanZoom(`#${familyTreeDiv.id}-svg`, {
                    zoomEnabled: true,
                    controlIconsEnabled: false,
                    fit: false,                    
                    center: true,
                    minZoom: 0.001,
                    maxZoom: 1000,
                    dblClickZoomEnabled: false,
                    zoomScaleSensitivity: 0.3,
                })

                let setSvg = document.getElementById(`${familyTreeDiv.id}-svg`);

                if(setSvg !== null){
                    let a = setSvg.children[0].getAttr("style");
                    if(typeof a == 'string'){
                        let b = a.match(/\d([^\,]+)\d/g)
                        if(b !== null && Number(b[0]) > 1){
                            panZoomTiger.zoom(1/Number(b[0]))
                        }                        
                    }
                }

                let nodeGArr = familyTreeDiv.querySelectorAll("[id^='flowchart-']");
                let nodeArr = familyTreeDiv.getElementsByClassName("nodeLabel");

                for (let i = 0; i < nodeArr.length; i++) {
                    let link = document.createElement('a');
                    link.addClass("internal-link");
                    let nodePosStr = nodeGArr[i].id.split('-')[1];
                    let node = familyNodeArr.filter(n=>n.position == Number(nodePosStr))[0];
                    link.textContent = nodeArr[i].getText();
                    nodeArr[i].textContent = "";
                    nodeArr[i].appendChild(link);
                    nodeArr[i].addEventListener("click", (event: MouseEvent) => {
                        if(event.ctrlKey){
                            this.app.workspace.openLinkText("", node.file.path, 'tab');
                        }else{
                            this.app.workspace.openLinkText("",node.file.path)
                        }
                    })

                    nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                        this.app.workspace.trigger(`hover-link`, {
                            event,
                            source: ZK_NAVIGATION,
                            hoverParent: this,
                            linktext: "",
                            targetEl: link,
                            sourcePath: node.file.path,
                        })
                    });
                }
                
            }

            if (this.plugin.settings.InlinksGraphToggle == true) {

                let inlinkArr: TFile[] = await this.getInlinks(this.currentFile);
                let inlinkMermaidStr: string = await this.genericLinksMermaidStr(this.currentFile, inlinkArr, 'in',this.plugin.settings.DirectionOfInlinksGraph);

                const inlinksGraphContainer = graphMermaidDiv.createDiv("zk-inlinks-graph-container");
                const inlinksGraphTextDiv = inlinksGraphContainer.createDiv("zk-graph-text");

                inlinksGraphTextDiv.empty();
                inlinksGraphTextDiv.createEl('span', { text: t("inlinks") });

                let graphIconDiv = inlinksGraphContainer.createDiv("zk-graph-icon");
                graphIconDiv.empty();
                let expandBtn = new ExtraButtonComponent(graphIconDiv);
                expandBtn.setIcon("expand").setTooltip(t("expand graph"));
                expandBtn.onClick(()=>{              
                    new expandGraphModal(this.app,this.plugin,[], inlinkArr, inlinkMermaidStr).open();
                })

                const inlinksDiv = inlinksGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });
                inlinksDiv.id = "zk-inlinks";
                let { svg } = await mermaid.render(`${inlinksDiv.id}-svg`, inlinkMermaidStr);
                inlinksDiv.insertAdjacentHTML('beforeend', svg);
                inlinksDiv.children[0].setAttribute('width', "100%");
                inlinksDiv.children[0].setAttribute('height', `${this.plugin.settings.HeightOfInlinksGraph}px`); 
                graphMermaidDiv.appendChild(inlinksDiv);
                
                let panZoomTiger = svgPanZoom(`#${inlinksDiv.id}-svg`, {
                    zoomEnabled: true,
                    controlIconsEnabled: false,
                    fit: false,                    
                    center: true,
                    minZoom: 0.001,
                    maxZoom: 1000,
                    dblClickZoomEnabled: false,
                    zoomScaleSensitivity: 0.3,
                })

                let setSvg = document.getElementById(`${inlinksDiv.id}-svg`);

                if(setSvg !== null){
                    let a = setSvg.children[0].getAttr("style");
                    if(typeof a == 'string'){
                        let b = a.match(/\d([^\,]+)\d/g)
                        if(b !== null && Number(b[0]) > 1){
                            panZoomTiger.zoom(1/Number(b[0]))
                        }                        
                    }
                }
                

                let nodeGArr = inlinksDiv.querySelectorAll("[id^='flowchart-']");
                let nodeArr = inlinksDiv.getElementsByClassName("nodeLabel");

                inlinkArr.push(this.currentFile);
                for (let i = 0; i < nodeArr.length; i++) {
                    let link = document.createElement('a');
                    link.addClass("internal-link");
                    let nodePosStr = nodeGArr[i].id.split('-')[1];
                    let node = inlinkArr[Number(nodePosStr)];
                    link.textContent = nodeArr[i].getText();
                    nodeArr[i].textContent = "";
                    nodeArr[i].appendChild(link);
                    nodeArr[i].addEventListener("click", (event: MouseEvent) => {
                        if(event.ctrlKey){
                            this.app.workspace.openLinkText("", node.path, 'tab');
                        }else{
                            this.app.workspace.openLinkText("", node.path);
                        }
                    })

                    nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                        this.app.workspace.trigger(`hover-link`, {
                            event,
                            source: ZK_NAVIGATION,
                            hoverParent: this,
                            linktext: "",
                            targetEl: link,
                            sourcePath: node.path,
                        })
                    });
                }
                
            }

            if (this.plugin.settings.OutlinksGraphToggle == true) {

                let outlinkArr: TFile[] = [];

                if (this.currentFile.extension === 'md') {
                    outlinkArr = await this.getOutlinks(this.currentFile);
                }

                let outlinkMermaidStr: string = await this.genericLinksMermaidStr(this.currentFile, outlinkArr, 'out', this.plugin.settings.DirectionOfOutlinksGraph);

                const outlinksGraphContainer = graphMermaidDiv.createDiv("zk-outlinks-graph-container");
                const outlinksGraphTextDiv = outlinksGraphContainer.createDiv("zk-graph-text");

                outlinksGraphTextDiv.empty();
                outlinksGraphTextDiv.createEl('span', { text: t("outlinks") })


                let graphIconDiv = outlinksGraphContainer.createDiv("zk-graph-icon");
                graphIconDiv.empty();
                let expandBtn = new ExtraButtonComponent(graphIconDiv);
                expandBtn.setIcon("expand").setTooltip(t("expand graph"));
                expandBtn.onClick(()=>{              
                    new expandGraphModal(this.app,this.plugin,[], outlinkArr, outlinkMermaidStr).open();
                })

                const outlinksDiv = outlinksGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });
                outlinksDiv.id = "zk-outlinks";
                let { svg } = await mermaid.render(`${outlinksDiv.id}-svg`, outlinkMermaidStr);
                outlinksDiv.insertAdjacentHTML('beforeend', svg);
                outlinksDiv.children[0].setAttribute('width', "100%");
                outlinksDiv.children[0].setAttribute('height', `${this.plugin.settings.HeightOfOutlinksGraph}px`); 
                graphMermaidDiv.appendChild(outlinksDiv);
                
                let panZoomTiger = svgPanZoom(`#${outlinksDiv.id}-svg`, {
                    zoomEnabled: true,
                    controlIconsEnabled: false,
                    fit: false,                    
                    center: true,
                    minZoom: 0.001,
                    maxZoom: 1000,
                    dblClickZoomEnabled: false,
                    zoomScaleSensitivity: 0.3,
                })

                let setSvg = document.getElementById(`${outlinksDiv.id}-svg`);

                if(setSvg !== null){
                    let a = setSvg.children[0].getAttr("style");
                    if(typeof a == 'string'){
                        let b = a.match(/\d([^\,]+)\d/g)
                        if(b !== null && Number(b[0]) > 1){
                            panZoomTiger.zoom(1/Number(b[0]))
                        }                        
                    }
                }
               
                let nodeGArr = outlinksDiv.querySelectorAll("[id^='flowchart-']");
                let nodeArr = outlinksDiv.getElementsByClassName("nodeLabel");
                outlinkArr.push(this.currentFile);
                for (let i = 0; i < nodeArr.length; i++) {
                    let link = document.createElement('a');
                    link.addClass("internal-link");
                    let nodePosStr = nodeGArr[i].id.split('-')[1];
                    let node = outlinkArr[Number(nodePosStr)];
                    link.textContent = nodeArr[i].getText();
                    nodeArr[i].textContent = "";
                    nodeArr[i].appendChild(link);
                    nodeArr[i].addEventListener("click", (event: MouseEvent) => {
                        if(event.ctrlKey){
                            this.app.workspace.openLinkText("", node.path, 'tab');
                        }else{
                            this.app.workspace.openLinkText("", node.path);
                        }
                    })

                    nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                        this.app.workspace.trigger(`hover-link`, {
                            event,
                            source: ZK_NAVIGATION,
                            hoverParent: this,
                            linktext: "",
                            targetEl: link,
                            sourcePath: node.path,
                        })
                    });
                }
                
            }

        }
    }

    async getFamilyNodes(currentFile: TFile) {

        let familyNodeArr: ZKNode[] = [];
        this.MainNotes = await mainNoteInit(this.plugin);

        let currentNode = this.MainNotes.filter(n => n.file == currentFile)[0];

        if (typeof currentNode !== 'undefined') {

            if (currentNode.IDArr.length > 1) {
                let fatherArr = currentNode.IDArr.slice(0, currentNode.IDArr.length - 1);

                let fatherNode = this.MainNotes
                    .filter(n => n.IDStr == fatherArr.toString());

                if (fatherNode.length > 0) {

                    familyNodeArr = this.MainNotes.filter(n => n.IDStr.startsWith(fatherNode[0].IDStr))
                        .filter(n => n.IDArr.length <= currentNode.IDArr.length ||
                            (n.IDStr.startsWith(currentNode.IDStr) && n.IDArr.length == currentNode.IDArr.length + 1)
                        );

                } else {
                    familyNodeArr = this.MainNotes.filter(n => n.IDStr.startsWith(currentNode.IDStr)
                        && n.IDArr.length <= currentNode.IDArr.length + 1);
                }

            } else {
                familyNodeArr = this.MainNotes.filter(n => n.IDStr.startsWith(currentNode.IDStr)
                    && n.IDArr.length <= currentNode.IDArr.length + 1);
            }
        }

        return familyNodeArr;
    }

    async getInlinks(currentFile: TFile) {

        let inlinkArr: TFile[] = [];
        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        for (let src of Object.keys(resolvedLinks)) {
            let link = resolvedLinks[src];
            for (let dest of Object.keys(link)) {
                if (dest === currentFile.path) {
                    let inlinkFile = this.app.vault.getFileByPath(src);
                    if (inlinkFile !== null) {
                        inlinkArr.push(inlinkFile);
                    }

                }
            }
        }

        return inlinkArr;

    }

    async getOutlinks(currentFile: TFile) {


        let outlinkArr: TFile[] = [];
        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        let outlinks: string[] = Object.keys(resolvedLinks[currentFile.path]);

        if(this.plugin.settings.FileExtension == "md"){
            outlinks = outlinks.filter(link=>link.endsWith(".md"))
        }

        for (let outlink of outlinks) {
            let outlinkFile = this.app.vault.getFileByPath(outlink);
            if (outlinkFile !== null) {
                outlinkArr.push(outlinkFile);
            }
        }

        return outlinkArr;

    }

    async genericLinksMermaidStr(currentFile: TFile, linkArr: TFile[], direction1: string = 'in', direction2: string) {

        let mermaidStr: string = `%%{ init: { 'flowchart': { 'curve': 'basis' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart ${direction2};\n`


        let currentNode: ZKNode[] = [];

        if (this.MainNotes.length > 0) {
            currentNode = this.MainNotes.filter(n => n.file === currentFile);
        }

        if (currentNode.length > 0) {
            mermaidStr = mermaidStr + `${linkArr.length}("${currentNode[0].displayText}");
            style ${linkArr.length} fill:#ffa,stroke:#333,stroke-width:1px \n`;;
        } else {
            mermaidStr = mermaidStr + `${linkArr.length}("${currentFile.basename}");
            style ${linkArr.length} fill:#ffa,stroke:#333,stroke-width:1px \n`;;
        }

        for (let i = 0; i < linkArr.length; i++) {
            let node = this.MainNotes.find(n => n.file == linkArr[i]);
            if (typeof node !== 'undefined') {
                mermaidStr = mermaidStr + `${i}("${node.displayText}");\n`;
            } else {
                mermaidStr = mermaidStr + `${i}("${linkArr[i].basename}");\n`;
            }
            mermaidStr = mermaidStr + `style ${i} fill:#fff; \n`;
            if (direction1 == 'in') {
                mermaidStr = mermaidStr + `${i} --> ${linkArr.length};\n`;
            } else {
                mermaidStr = mermaidStr + `${linkArr.length} --> ${i};\n`;
            }
        }
        
        return mermaidStr;

        

    }

    async genericFamilyMermaidStr(currentFile: TFile, Nodes: ZKNode[], direction:string) {
        let mermaidStr: string = `%%{ init: { 'flowchart': { 'curve': 'basis' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart ${direction};`;

        for (let node of Nodes) {
            mermaidStr = mermaidStr + `${node.position}("${node.displayText}");\n`;

            if (node.file == currentFile) {
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

                mermaidStr = mermaidStr + `${node.position} --> ${son.position};\n`;

            }
        }

        if(this.plugin.settings.RedDashLine === true){

            for (let node of Nodes){
                if (/^[a-zA-Z]$/.test(node.file.basename.slice(-1))) {
                    //红色虚线边
                    mermaidStr = mermaidStr + `style ${node.position} stroke:#f66,stroke-width:2px,stroke-dasharray: 1 \n`;
                }
            }
        }

        return mermaidStr;
    }

    async onClose() {
        
    }
}
