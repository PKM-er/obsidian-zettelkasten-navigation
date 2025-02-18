import ZKNavigationPlugin from "main";
import { ExtraButtonComponent, FileView, ItemView, Notice, TFile, WorkspaceLeaf, debounce, loadMermaid } from "obsidian";
import { GitBranch, ZKNode, ZK_NAVIGATION } from "./indexView";
import { t } from "src/lang/helper";
import { displayWidth, mainNoteInit } from "src/utils/utils";
import { expandGraphModal } from "src/modal/expandGraphModal";

export const ZK_GRAPH_TYPE: string = "zk-graph-type"
export const ZK_GRAPH_VIEW: string = t("zk-local-graph")

export class ZKGraphView extends ItemView {

    plugin: ZKNavigationPlugin;
    currentFile: TFile | null;
    familyNodeArr: ZKNode[] = [];
    graphHeight:number = 0;
    countOfGraphs:number = 0;
    gitBranches: GitBranch[] = [];
    order: number;
    result: GitBranch[];

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

    onResize(){
        
        if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length > 0){
                            
            this.app.workspace.trigger("zk-navigation:refresh-local-graph");
   
        }
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
                if(this.app.workspace.getActiveViewOfType(FileView)){    
                    this.plugin.retrivalforLocaLgraph.type = '2';         
                    refresh();                    
                }
            }             
        }));

        this.registerEvent(this.app.workspace.on("zk-navigation:refresh-local-graph",  refresh));

    }

    refreshLocalGraph = async () => {
        let { containerEl } = this;
        containerEl.empty();

        this.countGraphs();
        this.graphHeight = Math.floor(containerEl.offsetHeight / this.countOfGraphs - 10);

        const graphMermaidDiv = containerEl.createDiv().createDiv("zk-graph-mermaid-container");
        await mainNoteInit(this.plugin);

        switch (this.plugin.retrivalforLocaLgraph.type) {
            case '1': //click graph
                this.currentFile = this.app.vault.getFileByPath(this.plugin.retrivalforLocaLgraph.filePath);
                break;
            default: // open file
                
                this.currentFile = this.app.workspace.getActiveFile();
                if(this.currentFile !== null){
                    let path = this.currentFile.path;
                    let nodes = this.familyNodeArr.filter(n=>n.file.path ==path);
                    if(nodes.length > 0){
                        this.plugin.retrivalforLocaLgraph.ID = nodes[0].ID;
                    }else{
                        nodes = this.plugin.MainNotes.filter(n=>n.file.path == path);

                        if(nodes.length >0 ){
                            this.plugin.retrivalforLocaLgraph.ID = nodes[0].ID;
                        }                      
                        
                    }
                    
                    this.plugin.retrivalforLocaLgraph.filePath = path;
                }
                break;
        }

        graphMermaidDiv.empty();

        if (this.currentFile !== null) {

            const mermaid = await loadMermaid();
            const svgPanZoom = require("svg-pan-zoom");
            if (this.plugin.settings.FamilyGraphToggle == true) {

                await this.getFamilyNodes(this.currentFile);
                if(this.familyNodeArr.length > 0){

                
                    if(this.plugin.settings.graphType === "structure"){
                                            
                        
                        let familyMermaidStr: string = await this.genericFamilyMermaidStr(this.currentFile, this.plugin.settings.DirectionOfFamilyGraph);
                        
                        const familyGraphContainer = graphMermaidDiv.createDiv("zk-family-graph-container");
                        const familyGraphTextDiv = familyGraphContainer.createDiv("zk-graph-text");

                        familyGraphTextDiv.empty();
                        familyGraphTextDiv.createEl('span', { text: t("close relative") })

                        let graphIconDiv = familyGraphContainer.createDiv("zk-graph-icon");
                        graphIconDiv.empty();
                        let expandBtn = new ExtraButtonComponent(graphIconDiv);
                        expandBtn.setIcon("expand").setTooltip(t("expand graph"));
                        expandBtn.onClick(()=>{              
                            new expandGraphModal(this.app,this.plugin, this.familyNodeArr, [], familyMermaidStr).open();
                        })

                        const familyTreeDiv = familyGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });

                        familyTreeDiv.id = "zk-family-tree";                    
                        let { svg } = await mermaid.render(`${familyTreeDiv.id}-svg`, `${familyMermaidStr}`);
                        familyTreeDiv.insertAdjacentHTML('beforeend', svg);
                        familyTreeDiv.children[0].addClass("zk-full-width");
                        familyTreeDiv.children[0].setAttribute('height', `${this.graphHeight}px`);    
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
                            let node = this.familyNodeArr.filter(n=>n.position == Number(nodePosStr))[0];
                            link.textContent = nodeArr[i].getText();
                            nodeArr[i].textContent = "";
                            nodeArr[i].appendChild(link);
                            nodeGArr[i].addEventListener("click", (event: MouseEvent) => {
                                if(event.ctrlKey){
                                    this.app.workspace.openLinkText("", node.file.path, 'tab');
                                }else if(event.shiftKey){
                                    this.plugin.retrivalforLocaLgraph = {
                                        type: '1',
                                        ID: node.ID,
                                        filePath: node.file.path,  
                                    }; 
                                    this.plugin.openGraphView();
                                }else if(event.altKey){                 
                                        this.plugin.clearShowingSettings();
                                        this.plugin.settings.lastRetrival = {
                                            type: 'main',
                                            ID: node.ID,
                                            displayText: node.displayText,
                                            filePath: node.file.path,
                                            openTime: '',                        
                                        }
                                        this.plugin.RefreshIndexViewFlag = true;
                                        this.plugin.openIndexView();
                                }else{
                                    this.app.workspace.openLinkText("",node.file.path)
                                }
                            })
                            nodeGArr[i].addEventListener("touchend", () => {
                                this.app.workspace.openLinkText("",node.file.path)
                            })
                            nodeGArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
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
                    }else{                                      
                        let familyMermaidStr: string = await this.genericGitgraphStr(this.currentFile);
                        const familyGraphContainer = graphMermaidDiv.createDiv("zk-family-graph-container");
                        const familyGraphTextDiv = familyGraphContainer.createDiv("zk-graph-text");

                        familyGraphTextDiv.empty();
                        familyGraphTextDiv.createEl('span', { text: t("close relative") })

                        let graphIconDiv = familyGraphContainer.createDiv("zk-graph-icon");
                        graphIconDiv.empty();
                        let expandBtn = new ExtraButtonComponent(graphIconDiv);
                        expandBtn.setIcon("expand").setTooltip(t("expand graph"));
                        expandBtn.onClick(()=>{              
                            new expandGraphModal(this.app,this.plugin, this.familyNodeArr, [], familyMermaidStr).open();
                        })

                        const familyTreeDiv = familyGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });

                        familyTreeDiv.id = "zk-family-tree";                    
                        let { svg } = await mermaid.render(`${familyTreeDiv.id}-svg`, `${familyMermaidStr}`);
                        familyTreeDiv.insertAdjacentHTML('beforeend', svg);
                        familyTreeDiv.children[0].removeAttribute('style');
                        familyTreeDiv.children[0].addClass("zk-full-width");
                        familyTreeDiv.children[0].setAttribute('height', `${this.graphHeight}px`);    
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
                        

                        const gElements = familyTreeDiv.querySelectorAll('g.commit-bullets');
                        
                        
                        let temNode = gElements[1];
                        const circles = gElements[1].querySelectorAll("circle.commit")
                        const circleNodes = Array.from(circles);
                        gElements[1].textContent = "";

                        for(let j=0;j<circleNodes.length;j++){
                            let link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
                            link.appendChild(circleNodes[j]);
                            gElements[1].appendChild(link);
                            
                            let nodes = this.familyNodeArr;
    
                            let nodeArr = nodes.filter(n=>n.gitNodePos === j);
                            if(nodeArr.length > 0){
                                let node = nodeArr[0];
                                circleNodes[j].addEventListener("click", async (event: MouseEvent) => {  
                                    if (event.ctrlKey) {
                                        this.app.workspace.openLinkText("", node.file.path, 'tab');
                                    }else if(event.shiftKey){
                                        this.plugin.retrivalforLocaLgraph = {
                                            type: '1',
                                            ID: node.ID,
                                            filePath: node.file.path,  
                                        }; 
                                        this.plugin.openGraphView();
                                    }else if(event.altKey){
                                        this.plugin.settings.lastRetrival = {
                                            type: 'main',
                                            ID: node.ID,
                                            displayText: node.displayText,
                                            filePath: node.file.path,
                                            openTime: '',                        
                                        }
                                        this.plugin.RefreshIndexViewFlag = true;
                                        this.plugin.openIndexView();
                                    }else{
                                        this.app.workspace.openLinkText("", node.file.path)
                                    }
                                    
                                })
                                circleNodes[j].addEventListener("touchend", () => {
                                    this.app.workspace.openLinkText("",node.file.path)
                                })
                                circleNodes[j].addEventListener(`mouseover`, (event: MouseEvent) => {
                                    this.app.workspace.trigger(`hover-link`, {
                                        event,
                                        source: ZK_NAVIGATION,
                                        hoverParent: circleNodes[j],
                                        linktext: node.file.basename,
                                        targetEl: circleNodes[j],
                                        sourcePath: node.file.path,
                                    })
                                });                            
                            }  
                        }
                    }
                }else{
                    this.countOfGraphs--;
                    this.graphHeight = Math.floor(containerEl.offsetHeight / this.countOfGraphs - 10);
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
                inlinksDiv.children[0].addClass("zk-full-width");
                inlinksDiv.children[0].setAttribute('height', `${this.graphHeight}px`); 
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
                    nodeGArr[i].addEventListener("click", (event: MouseEvent) => {
                        if(event.ctrlKey){
                            this.app.workspace.openLinkText("", node.path, 'tab');
                        }else if(event.shiftKey){
                            this.plugin.retrivalforLocaLgraph = {
                                type: '1',
                                ID: '',
                                filePath: node.path,
            
                            }; 
                            this.plugin.openGraphView();
                        }else if(event.altKey){
                            if(this.plugin.settings.FolderOfIndexes !== '' && node.path.startsWith(this.plugin.settings.FolderOfIndexes)){
                                this.plugin.clearShowingSettings(); 
                                this.plugin.settings.lastRetrival = {
                                    type: 'index',
                                    ID: '',
                                    displayText: '',
                                    filePath: node.path,
                                    openTime: '',                        
                                }
                                this.plugin.RefreshIndexViewFlag = true;
                                this.plugin.openIndexView();
                                
                            }else{
                                let mainNote = this.plugin.MainNotes.find(n=>n.file.path == node.path);
                            
                                if(mainNote){
                                    this.plugin.clearShowingSettings();                               
                                    this.plugin.settings.lastRetrival = {
                                        type: 'main',
                                        ID: mainNote.ID,
                                        displayText: mainNote.displayText,
                                        filePath: mainNote.file.path,
                                        openTime: '',                        
                                    }
                                    this.plugin.RefreshIndexViewFlag = true;
                                    this.plugin.openIndexView();
                                }
                            }

                        }else{
                            this.app.workspace.openLinkText("", node.path);
                        }
                    })
                    nodeGArr[i].addEventListener("touchend", () => {
                        this.app.workspace.openLinkText("",node.path)
                    })

                    nodeGArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
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
                outlinksDiv.children[0].addClass("zk-full-width");
                outlinksDiv.children[0].setAttribute('height', `${this.graphHeight}px`); 
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
                    nodeGArr[i].addEventListener("click", async (event: MouseEvent) => {
                        if(event.ctrlKey){
                            this.app.workspace.openLinkText("", node.path, 'tab');
                        }else if(event.shiftKey){
                            
                            this.plugin.retrivalforLocaLgraph = {
                                type: '1',
                                ID: '',
                                filePath: node.path,
            
                            }; 
                            this.plugin.openGraphView();
                        }else if(event.altKey){
                            if(this.plugin.settings.FolderOfIndexes !== '' && node.path.startsWith(this.plugin.settings.FolderOfIndexes)){
                                this.plugin.clearShowingSettings(); 
                                this.plugin.settings.lastRetrival = {
                                    type: 'index',
                                    ID: '',
                                    displayText: '',
                                    filePath: node.path,
                                    openTime: '',                        
                                }
                                this.plugin.RefreshIndexViewFlag = true;
                                this.plugin.openIndexView();
                                
                            }else{
                                let mainNote = this.plugin.MainNotes.find(n=>n.file.path == node.path);
                            
                                if(mainNote){
                                    this.plugin.clearShowingSettings();                               
                                    this.plugin.settings.lastRetrival = {
                                        type: 'main',
                                        ID: mainNote.ID,
                                        displayText: mainNote.displayText,
                                        filePath: mainNote.file.path,
                                        openTime: '',                        
                                    }
                                    this.plugin.RefreshIndexViewFlag = true;
                                    this.plugin.openIndexView();
                                }
                            }

                        }else{
                            this.app.workspace.openLinkText("", node.path);
                        }
                            
                    })
                    nodeGArr[i].addEventListener("touchend", () => {
                        this.app.workspace.openLinkText("",node.path)
                    })

                    nodeGArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
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

        this.familyNodeArr = [];

        let Nodes = this.plugin.MainNotes.filter(n => n.file == currentFile);

        if(Nodes.length > 0 ){
            if(this.plugin.retrivalforLocaLgraph.ID !== ''){
                Nodes = Nodes.filter(n=>n.ID == this.plugin.retrivalforLocaLgraph.ID);
            }else{
                this.plugin.retrivalforLocaLgraph.ID = Nodes[0].ID;
            }            
        }

        if (Nodes.length > 0) {

            let currentNode = Nodes[0];            

            if (currentNode.IDArr.length > 1) {
                let fatherArr = currentNode.IDArr.slice(0, currentNode.IDArr.length - 1);

                let fatherNode = this.plugin.MainNotes
                    .filter(n => n.IDStr == fatherArr.toString());

                if (fatherNode.length > 0) {

                    this.familyNodeArr = this.plugin.MainNotes.filter(n => n.IDStr.startsWith(fatherNode[0].IDStr))
                        .filter(n => n.IDArr.length <= currentNode.IDArr.length ||
                            (n.IDStr.startsWith(currentNode.IDStr) && n.IDArr.length == currentNode.IDArr.length + 1)
                        );

                } else {
                    this.familyNodeArr = this.plugin.MainNotes.filter(n => n.IDStr.startsWith(currentNode.IDStr)
                        && n.IDArr.length <= currentNode.IDArr.length + 1);
                }

            } else {
                this.familyNodeArr = this.plugin.MainNotes.filter(n => n.IDStr.startsWith(currentNode.IDStr)
                    && n.IDArr.length <= currentNode.IDArr.length + 1);
            }
        }

        //calculate width for siblings
        if(this.plugin.settings.siblingLenToggle === true){
            const maxLength =  Math.max(...this.familyNodeArr.map(n=>n.IDArr.length));
            const minLength =  Math.min(...this.familyNodeArr.map(n=>n.IDArr.length));
    
            for(let i=minLength;i<=maxLength;i++){
                let layerNodes = this.familyNodeArr.filter(n=>n.IDArr.length === i);
                if(layerNodes.length > 1){
                    let maxTextLen = Math.max(...layerNodes.map(n=>displayWidth(n.displayText)));
                    for(let node of layerNodes){
                        node.fixWidth = 6 * maxTextLen + 6;
                    }
                }else{
                    layerNodes[0].fixWidth = 0;
                }
                
            }
            
        }
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

        let mermaidStr: string = `%%{ init: { 'flowchart': { 'curve': 'basis', 'wrappingWidth': '3000' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart ${direction2};\n`

        let currentNode: ZKNode[] = [];

        if(this.familyNodeArr.length > 0 ){
            currentNode = this.familyNodeArr.filter(n=>n.file == currentFile)
            if(currentNode.length == 0){
                currentNode = this.plugin.MainNotes.filter(n => n.file === currentFile);
            }
        }

        if (currentNode.length > 0) {
            mermaidStr = mermaidStr + `${linkArr.length}("${currentNode[0].displayText}");
            style ${linkArr.length} fill:${this.plugin.settings.nodeColor},stroke:#333,stroke-width:1px \n`;
        } else {
            mermaidStr = mermaidStr + `${linkArr.length}("${currentFile.basename}");
            style ${linkArr.length} fill:${this.plugin.settings.nodeColor},stroke:#333,stroke-width:1px \n`;
        }

        for (let i = 0; i < linkArr.length; i++) {
            let node = this.plugin.MainNotes.find(n => n.file == linkArr[i]);
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

    async genericFamilyMermaidStr(currentFile: TFile, direction:string) {
        let mermaidStr: string = `%%{ init: { 'flowchart': { 'curve': 'basis', 'wrappingWidth': '3000' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart ${direction};`;

        for (let node of this.familyNodeArr) {

            if(this.plugin.settings.siblingLenToggle === true && node.fixWidth !== 0){
                mermaidStr = mermaidStr + `${node.position}("<p style='width:${node.fixWidth}px;margin:0px;'>${node.displayText}</p>");\n`;
            }else{
                mermaidStr = mermaidStr + `${node.position}("${node.displayText}");\n`;
            }

            if (node.file == currentFile) {
                mermaidStr = mermaidStr + `style ${node.position} fill:${this.plugin.settings.nodeColor},stroke:#333,stroke-width:1px \n`;
            } else {
                //白底
                mermaidStr = mermaidStr + `style ${node.position} fill:#fff; \n`;
            }

            
        }

        for (let node of this.familyNodeArr) {

            let sonNodes = this.familyNodeArr.filter(n => (n.IDArr.length - 1 == node.IDArr.length)
                && n.IDStr.startsWith(node.IDStr) && n.ID.startsWith(node.ID));

            for (let son of sonNodes) {

                mermaidStr = mermaidStr + `${node.position} --> ${son.position};\n`;

            }
        }

        if(this.plugin.settings.RedDashLine === true){

            for (let node of this.familyNodeArr){
                if (/^[a-zA-Z]$/.test(node.file.basename.slice(-1))) {
                    //红色虚线边
                    mermaidStr = mermaidStr + `style ${node.position} stroke:#f66,stroke-width:2px,stroke-dasharray: 1 \n`;
                }
            }
        }

        return mermaidStr;
    }

    async genericGitgraphStr(currentFile: TFile){

        this.generateGitBranch();
        this.order = 0;
        this.result = [];
        let temBranches = this.gitBranches.filter(b=>b.branchName === "main");
        this.gitBranches = this.gitBranches.filter(b=>b.branchName !== "main");
        
        if(temBranches.length > 0){
            this.orderGitBranch(temBranches[0]);
            
        }            

        temBranches = this.result.filter(b=>b.branchName === "main")
        this.gitBranches = this.result.filter(b=>b.branchName !== "main")
        let gitNodePos:number = 0;
        let gitStr:string = '';
        while(temBranches.length > 0){
            
            let nextBranch = temBranches.reduce((min,obj) =>{
                
                return min && min.nodes[min.currentPos].ctime < obj.nodes[obj.currentPos].ctime? min:obj;
            }, temBranches[0])
            
            let branchIndex = temBranches.indexOf(nextBranch);
            
            let nextNode = temBranches[branchIndex].nodes[temBranches[branchIndex].currentPos];
            temBranches[branchIndex].currentPos = temBranches[branchIndex].currentPos + 1;
                        
            nextNode.gitNodePos = gitNodePos
            gitNodePos = gitNodePos + 1;

            if(nextBranch.active === false){
                gitStr = gitStr + `checkout ${nextBranch.branchPoint.branchName}\n`
                nextBranch.active = true;
            }
            gitStr = gitStr + `checkout ${nextBranch.branchName}
            commit id: "${nextNode?.displayText}"`
            
            if(nextNode?.ID === this.plugin.retrivalforLocaLgraph.ID){	
                gitStr = gitStr + `tag: "index🌿"`// `type: HIGHLIGHT`
            }
            
            gitStr = gitStr + `\n`
        
            //if(temBranches[branchIndex].nodes.length === 0){
            if(temBranches[branchIndex].nodes.length === temBranches[branchIndex].currentPos){
                temBranches.splice(branchIndex,1);
            }
            let newBranches = this.gitBranches.filter(n=>n.branchPoint.ID == nextNode?.ID);
            // 必须先声明分支
            for(let branch of newBranches){
                temBranches.push(branch);
                gitStr = gitStr + `branch ${branch.branchName} order: ${branch.order}\n`
            }
        }
        let mermaidStr: string = `%%{init: { 'logLevel': 'debug', 'theme': 'base', 'gitGraph': {'showBranches': false, 'parallelCommits': true, 'rotateCommitLabel': true}} }%%
                                gitGraph
                                ${gitStr}
                                `; 
        return mermaidStr;
    }
    
    generateGitBranch() {

        let Nodes = this.familyNodeArr;
        const maxLength = Math.max(...Nodes.map(n=>n.IDArr.length));
        const minLength = Math.min(...Nodes.map(n=>n.IDArr.length));

        this.gitBranches = [];
        let nodes = Nodes.filter(l=>l.IDArr.length === minLength)

        this.gitBranches.push({
            branchName: "main",
            branchPoint: Nodes[0],
            nodes: nodes,
            currentPos: 0,
            order: 0,
            positionX: 0,
            active: true,
        })

        let nodeIndex = Nodes.indexOf(nodes[0]);
        Nodes[nodeIndex].branchName = "main";

        for(let i=minLength;i<maxLength;i++){
            let layerNodes = Nodes.filter(n=>n.IDArr.length === i);
	        for(let fatherNode of layerNodes){
                let numberSons = Nodes.filter(n=>n.IDArr.length === i+1 && /[0-9]/.test(n.ID.slice(-1)) && n.IDArr.slice(0,-1).toString() === fatherNode.IDStr);
                if(numberSons.length>0){
                    let branchName = `B${this.gitBranches.length}`;
                    let gitBranch: GitBranch = {
                        branchName: branchName,
                        branchPoint: fatherNode,
                        nodes: numberSons,
                        currentPos: 0,
                        positionX: 0,
                        order: 0,
                        active: false,
                    };
                    this.gitBranches.push(gitBranch);
                    for(let node of numberSons){
                        let index = Nodes.indexOf(node);
                        Nodes[index].branchName =  branchName;							
                    }	

                }
                let letterSons = Nodes.filter(n=>n.IDArr.length === i+1 && /[a-zA-Z]/.test(n.ID.slice(-1)) && n.IDArr.slice(0,-1).toString() === fatherNode.IDStr);
                if(letterSons.length>0){
                    let branchName = `B${this.gitBranches.length}`;
                    let gitBranch: GitBranch = {
                        branchName: branchName,
                        branchPoint: fatherNode,
                        nodes: letterSons,
                        currentPos: 0,
                        order: 0,
                        positionX: 0,
                        active: false,
                    };
                    this.gitBranches.push(gitBranch);
                    for(let node of letterSons){                        
                        let index = Nodes.indexOf(node);
                        Nodes[index].branchName =  branchName;							
                    }	
                }
            }
        }
    }

    orderGitBranch(current:GitBranch){
        
        current.order = this.order;
        this.result.push(current);
     
        this.order = this.order + 1;				
        for(let i=current.nodes.length-1;i>=0;i--){
        let branches = this.gitBranches.filter(b=>b.branchPoint.ID === current.nodes[i].ID);
            if(branches.length > 0){               
                branches.sort((a, b) => a.nodes[0].ctime - b.nodes[0].ctime);
                for(let next of branches){
                    this.orderGitBranch(next);
                }
            }
        }
    }
    countGraphs(){

        let count = 0;
        if(this.plugin.settings.FamilyGraphToggle === true){
            count++;
        }
        if(this.plugin.settings.InlinksGraphToggle === true){
            count++;
        }
        if(this.plugin.settings.OutlinksGraphToggle === true){
            count++;
        }
        
        this.countOfGraphs = count;
    }

    async onClose() {
        
    }
}
