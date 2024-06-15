import ZKNavigationPlugin, { FoldNode, ZoomPanScale } from "main";
import { ButtonComponent, DropdownComponent, ExtraButtonComponent, ItemView, Notice, TFile, WorkspaceLeaf, loadMermaid, moment } from "obsidian";
import { t } from "src/lang/helper";
import { indexFuzzyModal, indexModal } from "src/modal/indexModal";
import { mainNoteFuzzyModal, mainNoteModal } from "src/modal/mainNoteModal";
import { tableModal } from "src/modal/tableModal";
import { mainNoteInit } from "src/utils/utils";

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
    

    async IndexViewInterfaceInit() {
        
        let { containerEl } = this;
        containerEl.empty();

        // Create Divs on indexView
        const toolbarDiv = containerEl.createDiv("zk-index-toolbar");

        const indexMermaidDiv = containerEl.createDiv().createDiv("zk-index-mermaid-container");
        indexMermaidDiv.id = "zk-index-mermaid-container";

        indexMermaidDiv.empty();


        if(this.plugin.settings.MainNoteButton == true){

            const mainNoteButtonDiv = toolbarDiv.createDiv("zk-index-toolbar-block");
            const mainNoteButton = new ButtonComponent(mainNoteButtonDiv).setClass("zk-index-toolbar-button");
            mainNoteButton.setButtonText(this.plugin.settings.MainNoteButtonText);
            mainNoteButton.setCta();
            mainNoteButton.onClick(() => {
                if (this.plugin.settings.MainNoteSuggestMode === "IDOrder") {
                    new mainNoteModal(this.app, this.plugin, this.MainNotes, (selectZKNode) =>{
                        this.plugin.settings.SelectMainNote = selectZKNode.file.path;
                        this.plugin.settings.SelectIndex = "";
                        this.clearShowingSettings();
                        this.refreshBranchMermaid(indexMermaidDiv);
                    }).open();
                }else {
                    new mainNoteFuzzyModal(this.app, this.plugin, this.MainNotes, (selectZKNode) =>{
                        this.plugin.settings.SelectMainNote = selectZKNode.file.path;
                        this.plugin.settings.SelectIndex = "";
                        this.clearShowingSettings();
                        this.refreshBranchMermaid(indexMermaidDiv);
                    }).open()
                }
            })
        }

        if(this.plugin.settings.IndexButton == true){
            
            const indexButtonDiv = toolbarDiv.createDiv("zk-index-toolbar-block");
            const indexButton = new ButtonComponent(indexButtonDiv).setClass("zk-index-toolbar-button");
            indexButton.setButtonText(this.plugin.settings.IndexButtonText);
            indexButton.setCta();
            indexButton.onClick(() => {
                if (this.plugin.settings.SuggestMode === "keywordOrder") {
                    new indexModal(this.app, this.plugin, this.MainNotes, (index) => {
                        this.plugin.settings.SelectIndex = index;
                        this.plugin.settings.SelectMainNote = "";
                        this.clearShowingSettings();
                        this.refreshBranchMermaid(indexMermaidDiv);
                    }).open();
                } else {
                    new indexFuzzyModal(this.app, this.plugin, this.MainNotes, (index) => {
                        this.plugin.settings.SelectIndex = index;
                        this.plugin.settings.SelectMainNote = "";
                        this.clearShowingSettings();
                        this.refreshBranchMermaid(indexMermaidDiv);
                    }).open();
                }
            });
        }

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
                this.clearShowingSettings(this.plugin.settings.BranchTab);
                this.refreshBranchMermaid(indexMermaidDiv);
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
                this.clearShowingSettings(this.plugin.settings.BranchTab);
                this.refreshBranchMermaid(indexMermaidDiv);
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
                this.refreshBranchMermaid(indexMermaidDiv);
            });

        await this.refreshBranchMermaid(indexMermaidDiv);
    }

    async onload() {

        this.registerEvent(this.app.workspace.on("active-leaf-change", async(leaf)=>{  
            
            if(leaf?.view.getViewType() == ZK_INDEX_TYPE){
                if(this.plugin.settings.RefreshViews == true){                         
                    await this.IndexViewInterfaceInit();
                    this.plugin.settings.RefreshViews = false;
                }else{
                    
                    let svgAbc = document.getElementsByClassName("svg-pan-zoom_viewport")[0];
                    
                    let a = svgAbc.getAttr("style"); 
                    if(a){
                        let b = a.match(/\d([^\,]+)\d/g)
                        if(b === null){
                            await this.IndexViewInterfaceInit();
                            this.plugin.settings.RefreshViews = false; 
                        }
                    }
                } 
            }             
        }));

        this.registerEvent(this.app.vault.on("rename", async ()=>{
            this.plugin.settings.RefreshViews = true;
        }));

        this.registerEvent(this.app.vault.on("create", async ()=>{
            this.plugin.settings.RefreshViews = true;
        }));

        this.registerEvent(this.app.vault.on("delete", async ()=>{
            this.plugin.settings.RefreshViews = true;
        }));      
        
        this.registerEvent(this.app.metadataCache.on("changed", async()=>{
            
            this.plugin.settings.RefreshViews = true;
        }));

        this.registerEvent(this.app.metadataCache.on("deleted", async()=>{
            this.plugin.settings.RefreshViews = true;
        }));

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

            new Notice(t("❌Setting error: no folder or tag specified for main notes!"));

        } else {            
            
            await this.IndexViewInterfaceInit();
            this.plugin.settings.RefreshViews = false;
            
        }
    }

    async refreshBranchMermaid(indexMermaidDiv: HTMLElement) {
        
        this.MainNotes = await mainNoteInit([], this.plugin);

        indexMermaidDiv.empty(); 

        let branchEntranceNodeArr:ZKNode[] = [];
        let indexFile:any;

        const indexLinkDiv = indexMermaidDiv.createDiv("zk-index-link");
        indexLinkDiv.empty();
        
        if(this.plugin.settings.BranchToolbra == true){
            const toolButtonsDiv = indexMermaidDiv.createDiv("zk-tool-buttons");
            toolButtonsDiv.empty();

            if(this.plugin.settings.settingIcon == true){
                const settingBtn = new ExtraButtonComponent(toolButtonsDiv);
                settingBtn.setIcon("settings").setTooltip(t("settings"));
                settingBtn.onClick(()=>{
                    //@ts-ignore
                    this.app.setting.open();
                    //@ts-ignore
                    this.app.setting.openTabById("zettelkasten-navigation"); 
                })
            }
            
            if(this.plugin.settings.RandomMainNote == true && this.plugin.settings.MainNoteButton){

                const randomBtn = new ExtraButtonComponent(toolButtonsDiv);
                randomBtn.setIcon("dice-3").setTooltip(t("random main note"));
                randomBtn.onClick(async ()=>{
                    
                    if(this.plugin.settings.FolderOfMainNotes == ''){
                        new Notice(t("❌Setting error: no folder or tag specified for main notes!"));
                    }else{                                        
                        this.plugin.settings.SelectMainNote = this.MainNotes[Math.floor(Math.random()*this.MainNotes.length)].file.path;
                        this.plugin.settings.SelectIndex = ""
                        await this.clearShowingSettings();
                        await this.IndexViewInterfaceInit();                                    
                    }
                })
            }

            if(this.plugin.settings.RandomIndex == true && this.plugin.settings.IndexButton){

                const randomBtn = new ExtraButtonComponent(toolButtonsDiv);
                randomBtn.setIcon("dices").setTooltip(t("random index"));
                randomBtn.onClick(async ()=>{
                    
                    if(this.plugin.settings.FolderOfIndexes == ''){
                        new Notice(t("❌Setting error: no folder specified for index!"));
                    }else{
                        const indexFiles = this.app.vault.getMarkdownFiles()
                        .filter(f => f.path.startsWith(this.plugin.settings.FolderOfIndexes + '/'));                                        
                        this.plugin.settings.SelectIndex = indexFiles[Math.floor(Math.random()*indexFiles.length)].path;
                        this.plugin.settings.SelectMainNote = "",
                        await this.clearShowingSettings();
                        await this.IndexViewInterfaceInit();                                    
                    }
                })
            }
            
            if(this.plugin.settings.TableView == true){
                const tableBtn = new ExtraButtonComponent(toolButtonsDiv);
                tableBtn.setIcon("table").setTooltip(t("table view"))
                tableBtn.onClick(async ()=>{
                    new tableModal(this.app, this.plugin, await this.genericTableArr()).open();
                })
            }       
            
            if(this.plugin.settings.ExportList == true){
                const listBtn = new ExtraButtonComponent(toolButtonsDiv);
                listBtn.setIcon("list").setTooltip(t("export markdown list"))
                listBtn.onClick(async ()=>{
                    let tableArr = await this.genericTableArr();
                    
                    if(tableArr.length > 0){

                        let listStr:string = '';
                        let layer = tableArr[0].IDArr.length
                        for(let line of tableArr ){
                            let tabStr = ''
                            for(let i= layer; i<line.IDArr.length; i++){
                                tabStr = tabStr + `\t`;
                            }   
                            listStr = listStr + `${tabStr}- [[${line.file.basename}|${line.displayText}]]\n`
                        }                       
                        
                        let newFile = await this.app.vault.create(`${moment().format("YYYY-MM-DD HH.mm.ss")}.md`, listStr);
                        this.app.workspace.getLeaf().openFile(newFile);
                    }else{
                        new Notice("No contents!")
                    }

                    
                })
            }  
        }  

        if(this.plugin.settings.SelectIndex != ""){

            if(!this.plugin.settings.SelectIndex.startsWith(this.plugin.settings.FolderOfIndexes))
            
                return;

            branchEntranceNodeArr = await this.getBranchEntranceNode(this.plugin.settings.SelectIndex);
           
            indexLinkDiv.createEl('abbr', { text: t("Current index: ") });

            indexFile = this.app.vault.getFileByPath(this.plugin.settings.SelectIndex);

        }else if(this.plugin.settings.SelectMainNote != ""){

            let selectZKNode = this.MainNotes.filter(n=>n.file.path == this.plugin.settings.SelectMainNote)[0]
            
            if(typeof selectZKNode === 'undefined'){
                new Notice(`Invalid main note: ${this.plugin.settings.SelectMainNote}`)
                return;
            } 

            branchEntranceNodeArr.push(selectZKNode);

            indexLinkDiv.createEl('abbr', { text: t("Current note: ") });            

            indexFile = this.app.vault.getFileByPath(this.plugin.settings.SelectMainNote);

        }              

      
        
        if (indexFile instanceof TFile) {

            let link = indexLinkDiv.createEl('a', { text: `【${indexFile.basename}】` });
            
            if(this.plugin.settings.SelectMainNote != ""){
                
                link.empty();

                let node = this.MainNotes.filter(n=>n.file.path == this.plugin.settings.SelectMainNote)[0]
                if(node){
                    link = indexLinkDiv.createEl('a', { text: `【${node.displayText}】`});
                }
            }

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

                const branchAllNodes = await this.getBranchNodes(branchEntranceNodeArr[i]);
                let branchMermaidStr = await this.genericIndexMermaidStr(branchAllNodes, branchEntranceNodeArr[i],this.plugin.settings.DirectionOfBranchGraph);
                let zkGraph = indexMermaidDiv.createEl("div", { cls: "zk-index-mermaid" });
                zkGraph.id = `zk-index-mermaid-${i}`;
                let { svg } = await mermaid.render(`${zkGraph.id}-svg`, branchMermaidStr);
                zkGraph.insertAdjacentHTML('beforeend', svg);
                zkGraph.children[0].setAttribute('width', "100%");    
                zkGraph.children[0].setAttribute('height', `${this.plugin.settings.HeightOfBranchGraph}px`);    
                
                await indexMermaidDiv.appendChild(zkGraph); 
                
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
                                    await this.refreshBranchMermaid(indexMermaidDiv)

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
                new Notice(`${t("Index: ")}【${indexFile.basename}】${t("has no valid main note outlinks")}`);
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

    async clearShowingSettings(BranchTab:number=0){
        this.plugin.settings.zoomPanScaleArr = [];
        this.plugin.settings.BranchTab = BranchTab;
        this.plugin.settings.FoldNodeArr = [];                    
        this.plugin.saveData(this.plugin.settings);
    }

    async genericTableArr(){

        let tableArr:ZKNode[] = [];

        const tableBranch = document.getElementById(`zk-index-mermaid-${this.plugin.settings.BranchTab}-svg`)

        if(tableBranch !== null){
            
            let nodeGArr = tableBranch.querySelectorAll("[id^='flowchart-']");
 
            for(let i=0;i<nodeGArr.length;i++){

                let nodePosStr = nodeGArr[i].id.split('-')[1];
                let node = this.MainNotes.filter(n => n.position == Number(nodePosStr))[0];            
                tableArr.push(node);
            }            
        }

        return tableArr;
        
    }    

    async onClose() {
        this.plugin.saveData(this.plugin.settings);
    }

}