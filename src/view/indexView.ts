import ZKNavigationPlugin, { FoldNode, Retrival, ZoomPanScale } from "main";
import { ButtonComponent, DropdownComponent, ExtraButtonComponent, ItemView, Menu, Notice, TFile, WorkspaceLeaf, debounce, loadMermaid, moment, setTooltip } from "obsidian";
import { t } from "src/lang/helper";
import { indexFuzzyModal, indexModal } from "src/modal/indexModal";
import { mainNoteFuzzyModal, mainNoteModal } from "src/modal/mainNoteModal";
import { tableModal } from "src/modal/tableModal";
import { displayWidth, mainNoteInit, random } from "src/utils/utils";

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
    ctime: number;
    randomId: string;
    nodeSons: number; //used for caculating card position when export to canvas
    startY: number; //used for caculating card position when export to canvas
    height: number; //used for caculating card position when export to canvas
    isRoot: boolean;
    fixWidth: number; // used for setting the same width for siblings
}

interface BrancAllhNodes{
    branchTab: number;
    branchNodes: ZKNode[];
}

interface PlayStates{
    current: number;
    total: number;
    nodeGArr: Element[];
    lines: Element[];
}

export class ZKIndexView extends ItemView {

    plugin: ZKNavigationPlugin;
    branchAllNodes: BrancAllhNodes[];

    playStatus: PlayStates = {
        current:0,
        total:0,
        nodeGArr:[],
        lines:[],
    }

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
    
    onResize(){

        if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length > 0 && this.containerEl.offsetHeight !== 0){
            
            if (this.plugin.indexViewOffsetHeight !== this.containerEl.offsetHeight ||
                this.plugin.indexViewOffsetWidth !== this.containerEl.offsetWidth){
                
                this.app.workspace.trigger("zk-navigation:refresh-index-graph");

            }       
        }
    }

    async IndexViewInterfaceInit() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.addClass("zk-view-content");

        const toolbarDiv = containerEl.createDiv("zk-index-toolbar");

        const indexMermaidDiv = containerEl.createDiv("zk-index-mermaid-container");
        indexMermaidDiv.id = "zk-index-mermaid-container";

        indexMermaidDiv.empty();

        if(this.plugin.settings.MainNoteButton == true){

            const mainNoteButtonDiv = toolbarDiv.createDiv("zk-index-toolbar-block");
            const mainNoteButton = new ButtonComponent(mainNoteButtonDiv).setClass("zk-index-toolbar-button");
            mainNoteButton.setButtonText(this.plugin.settings.MainNoteButtonText);
            mainNoteButton.setCta();
            mainNoteButton.onClick(() => {
                if (this.plugin.settings.MainNoteSuggestMode === "IDOrder") {
                    new mainNoteModal(this.app, this.plugin, this.plugin.MainNotes, (selectZKNode) =>{
                        this.plugin.settings.lastRetrival = {
                            type: 'main',
                            ID: selectZKNode.ID,
                            displayText: selectZKNode.displayText,
                            filePath: selectZKNode.file.path,
                            openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                        
                        }
                        this.plugin.clearShowingSettings();
                        this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                    }).open();
                }else {
                    new mainNoteFuzzyModal(this.app, this.plugin, this.plugin.MainNotes, (selectZKNode) =>{
                        this.plugin.settings.lastRetrival = {
                            type: 'main',
                            ID: selectZKNode.ID,
                            displayText: selectZKNode.displayText,
                            filePath: selectZKNode.file.path,
                            openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                        
                        }
                        this.plugin.clearShowingSettings();
                        this.app.workspace.trigger("zk-navigation:refresh-index-graph");
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
                    new indexModal(this.app, this.plugin, this.plugin.MainNotes, (index) => {
                        this.plugin.settings.lastRetrival = {
                            type: 'index',
                            ID: '',
                            displayText: index.keyword,
                            filePath: index.path,
                            openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                        
                        }
                        this.plugin.clearShowingSettings();
                        this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                    }).open();
                } else {
                    new indexFuzzyModal(this.app, this.plugin, this.plugin.MainNotes, (index) => {
                        this.plugin.settings.lastRetrival = {
                            type: 'index',
                            ID: '',
                            displayText: index.keyword,
                            filePath: index.path,
                            openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                        
                        }
                        this.plugin.clearShowingSettings();
                        this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                    }).open();
                }
            });
            
        }

        const startingDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        startingDiv.createEl("b", { text: t("Display from : ") });

        const startPoint = new DropdownComponent(startingDiv);
        startPoint
            .addOption("index", t("index"))
            .addOption("parent", t("parent"))
            .addOption("root", t("root"))
            .setValue(this.plugin.settings.StartingPoint)
            .onChange((StartPoint) => {
                this.plugin.settings.StartingPoint = StartPoint;
                this.plugin.clearShowingSettings(this.plugin.settings.BranchTab);
                this.app.workspace.trigger("zk-navigation:refresh-index-graph");
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
                this.plugin.clearShowingSettings(this.plugin.settings.BranchTab);
                this.app.workspace.trigger("zk-navigation:refresh-index-graph");
            });

        const nodeTextDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        nodeTextDiv.createEl("b", { text: t("Text : ") });
        const nodeText = new DropdownComponent(nodeTextDiv);
        nodeText
            .addOption("id", "id")
            .addOption("title", t("title"))
            .addOption("both", t("both"))
            .setValue(this.plugin.settings.NodeText)
            .onChange((NodeText) => {
                this.plugin.settings.NodeText = NodeText;
                this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                this.app.workspace.trigger("zk-navigation:refresh-local-graph");
            });

        await this.refreshBranchMermaid();  
    }

    async onload() {

        this.registerEvent(this.app.workspace.on("active-leaf-change", async(leaf)=>{ 
            
            if(leaf?.view.getViewType() == ZK_INDEX_TYPE){
                if(this.plugin.RefreshIndexViewFlag == true){  
                    await this.IndexViewInterfaceInit();
                }
            }             
        }));

        this.registerEvent(this.app.vault.on("rename", async ()=>{
            this.plugin.RefreshIndexViewFlag = true; 
            this.app.workspace.trigger("zk-navigation:refresh-index-graph");
        }));

        this.registerEvent(this.app.vault.on("modify", async ()=>{
            this.plugin.RefreshIndexViewFlag = true;  
            this.app.workspace.trigger("zk-navigation:refresh-index-graph");
        }));

        this.registerEvent(this.app.vault.on("create", async ()=>{
            this.plugin.RefreshIndexViewFlag = true; 
        }));

        this.registerEvent(this.app.vault.on("delete", async ()=>{
            this.plugin.RefreshIndexViewFlag = true;
            this.app.workspace.trigger("zk-navigation:refresh-index-graph");
        }));      
        
        this.registerEvent(this.app.metadataCache.on("changed", async()=>{            
            this.plugin.RefreshIndexViewFlag = true;
        }));

        this.registerEvent(this.app.metadataCache.on("deleted", async()=>{
            this.plugin.RefreshIndexViewFlag = true;
        }));

        const refresh = debounce(this.refreshIndexLayout, 300, true);
        this.registerEvent(this.app.workspace.on("zk-navigation:refresh-index-graph", refresh));
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

    refreshIndexLayout = async() => {
        
        if (this.plugin.settings.FolderOfMainNotes == '' && this.plugin.settings.TagOfMainNotes == '') {

            new Notice(t("❌Setting error: no folder or tag specified for main notes!"));
            return;

        } else {        
            await this.IndexViewInterfaceInit();

        }
    }

    async refreshBranchMermaid() {

        const indexMermaidDiv = document.getElementById("zk-index-mermaid-container");

        if(!indexMermaidDiv) return;

        await mainNoteInit(this.plugin);

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

            if(this.plugin.settings.exportCanvas == true){
                const canvasBtn = new ExtraButtonComponent(toolButtonsDiv);
                canvasBtn.setIcon("layout-dashboard").setTooltip(t("export to canvas"));
                canvasBtn.onClick(async ()=>{
                    await this.exportToCanvas();
                })

            }
            
            if(this.plugin.settings.RandomMainNote == true && this.plugin.settings.MainNoteButton){

                const randomBtn = new ExtraButtonComponent(toolButtonsDiv);
                randomBtn.setIcon("dice-3").setTooltip(t("random main note"));
                randomBtn.onClick(async ()=>{
                    
                    if(this.plugin.settings.FolderOfMainNotes == '' && this.plugin.settings.TagOfMainNotes == ''){
                        new Notice(t("❌Setting error: no folder or tag specified for main notes!"));
                        return;
                    }else{              
                        let randomMainNoteNode = this.plugin.MainNotes[Math.floor(Math.random()*this.plugin.MainNotes.length)];                          
                            
                        this.plugin.settings.lastRetrival = {
                            type: 'main',
                            ID: randomMainNoteNode.ID,
                            displayText: randomMainNoteNode.displayText,
                            filePath: randomMainNoteNode.file.path,
                            openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                        
                        }                 
                        await this.plugin.clearShowingSettings();
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
                        return;
                    }else{
                        const indexFiles = this.app.vault.getMarkdownFiles()
                        .filter(f => f.path.startsWith(this.plugin.settings.FolderOfIndexes + '/'));  
                        
                        let randomIndex = indexFiles[Math.floor(Math.random()*indexFiles.length)];

                        this.plugin.settings.lastRetrival = {
                            type: 'index',
                            ID: '',
                            displayText: randomIndex.name,
                            filePath: randomIndex.path,
                            openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                        
                        }          
                        await this.plugin.clearShowingSettings();
                        await this.IndexViewInterfaceInit();                                    
                    }
                })
            }

            if(this.plugin.settings.showAllToggle == true){
                const showAllBtn = new ExtraButtonComponent(toolButtonsDiv);
                showAllBtn.setIcon("trees").setTooltip(t("all trees"));
                showAllBtn.onClick(async ()=>{
                    this.plugin.settings.lastRetrival = {
                        type: 'all',
                        ID: '',
                        displayText: 'all trees',
                        filePath: '',
                        openTime: moment().format("YYYY-MM-DD HH:mm:ss"),                        
                    }
                    this.plugin.settings.showAll=true;  
                    this.plugin.settings.DisplayLevel = "end";    
                    await this.plugin.clearShowingSettings();
                    await this.IndexViewInterfaceInit();   
                })
            }

            if(this.plugin.settings.play == true){
                const playBtn = new ExtraButtonComponent(toolButtonsDiv);
                playBtn.setIcon("wand-2").setTooltip(t("growing animation"));
                playBtn.onClick(async ()=>{
                    this.plugin.settings.FoldNodeArr = []; 
                    await this.branchGrowing(); 
                })
            }

            if(this.plugin.settings.playControllerToggle === true){
                
                const playControllerDiv = indexMermaidDiv.createDiv("zk-play-controller");
                                
                const previousBtn = new ExtraButtonComponent(playControllerDiv);
                previousBtn
                .setIcon('arrow-left')
                .onClick(async ()=>{
                    this.playStatus.current = (this.playStatus.current - 1 + this.playStatus.total) % this.playStatus.total;
                    await this.branchAnimation();
                })

                const nextBtn = new ExtraButtonComponent(playControllerDiv);
                nextBtn
                .setIcon('arrow-right')
                .onClick(async ()=>{
                    this.playStatus.current = (this.playStatus.current + 1) % this.playStatus.total;
                    await this.branchAnimation();
                })

                const fullScreenBtn = new ExtraButtonComponent(playControllerDiv);
                fullScreenBtn
                .setIcon('fullscreen')
                .onClick(()=>{
                    
                    let toggleClassList:string[] = [
                        '.workspace-ribbon.side-dock-ribbon.mod-left',
                        '.workspace-split.mod-horizontal.mod-left-split',
                        '.workspace-tab-header-container',
                        '.titlebar-button-container.mod-right',
                        `.status-bar`,
                    ];
                    toggleClassList.forEach((cls) => {
                        const elements = document.querySelectorAll(cls);
                        if (cls && elements) {
                            elements.forEach((element, i) => {
                                const cname = 'zk-hidden';
                                if(element.classList.contains(cname)){
                                    element.removeClass(cname);
                                } else{
                                    element.addClass(cname);
                                }
                            });
                        }
                    });
                })
            }
            
            if(this.plugin.settings.TableView == true){
                const tableBtn = new ExtraButtonComponent(toolButtonsDiv);
                tableBtn.setIcon("table").setTooltip(t("table view"))
                tableBtn.onClick(async ()=>{
                    await this.genericBranchNodes();
                    new tableModal(this.app, this.plugin, this.plugin.tableArr).open();
                })
            }   

            if(this.plugin.settings.ListTree == true){           
                const listBtn = new ExtraButtonComponent(toolButtonsDiv);
                listBtn.setIcon("list-tree").setTooltip(t("list tree"))
                listBtn.onClick(async ()=>{
                    await this.genericBranchNodes();
                    await this.plugin.openOutlineView();
                })

            }  

            if(this.plugin.settings.HistoryToggle == true){             

                const historyBtn = new ExtraButtonComponent(toolButtonsDiv);
                historyBtn.setIcon("history").setTooltip(t("History List"));
                historyBtn.onClick(async ()=>{                    
                   this.plugin.openRecentView();
                })
            } 

        } 

        switch (this.plugin.settings.lastRetrival.type) {
            case 'main':
                let selectZKNodes = this.plugin.MainNotes.filter(n=>
                    n.file.path == this.plugin.settings.lastRetrival.filePath)
                
                if(selectZKNodes.length > 0){
                    if(this.plugin.settings.lastRetrival.ID !== ''){
                        let nodeIndex = selectZKNodes.findIndex(n=>n.ID == this.plugin.settings.lastRetrival.ID);
                        if(nodeIndex !== -1){
                            this.plugin.settings.BranchTab = nodeIndex;
                        }
                    }else{
                        this.plugin.settings.lastRetrival.ID = selectZKNodes[0].ID;
                        this.plugin.settings.lastRetrival.displayText = selectZKNodes[0].displayText;
                    }
                }
                
                if(selectZKNodes.length == 0){
                    new Notice(`Invalid main note: ${this.plugin.settings.lastRetrival.filePath}`)
                    return;
                } 

                branchEntranceNodeArr.push(...selectZKNodes);

                indexLinkDiv.createEl('abbr', { text: t("Current note: ") }); 

                indexFile = this.app.vault.getFileByPath(this.plugin.settings.lastRetrival.filePath);

                this.unshiftHistoryList(this.plugin.settings.lastRetrival);

                break;

            case 'index':
                if(!this.plugin.settings.lastRetrival.filePath.startsWith(this.plugin.settings.FolderOfIndexes))
            
                    return;
    
                branchEntranceNodeArr = await this.getBranchEntranceNode(this.plugin.settings.lastRetrival);
               
                indexLinkDiv.createEl('abbr', { text: t("Current index: ") });
    
                indexFile = this.app.vault.getFileByPath(this.plugin.settings.lastRetrival.filePath);
    
                this.plugin.settings.lastRetrival.displayText = indexFile.basename;

                this.unshiftHistoryList(this.plugin.settings.lastRetrival)
                
                break;

            case 'all':                
                indexLinkDiv.createEl('abbr', { text: t("all trees") }); 
                branchEntranceNodeArr = this.plugin.MainNotes.filter(n=>n.isRoot == true);
                this.plugin.settings.lastRetrival =  {
                    type: 'all',
                    ID: '',
                    displayText: t("all trees"),
                    filePath: '',
                    openTime: '',
                }          
                this.unshiftHistoryList(this.plugin.settings.lastRetrival);      
                break;
            default:

                let node = this.plugin.MainNotes[Math.floor(Math.random()*(this.plugin.MainNotes.length))];
                if(node) {
                    this.plugin.settings.lastRetrival =  {
                        type: 'main',
                        ID: node.ID,
                        displayText: node.displayText,
                        filePath: node.file.path,
                        openTime: '',
                    }
                }
                branchEntranceNodeArr.push(node);

                indexLinkDiv.createEl('abbr', { text: t("Current note: ") });    
                this.unshiftHistoryList(this.plugin.settings.lastRetrival)
                indexFile = this.app.vault.getFileByPath(this.plugin.settings.lastRetrival.filePath);
                break;
        }

        if (indexFile instanceof TFile) {
            
            let link = indexLinkDiv.createEl('a', { text: `【${this.plugin.settings.lastRetrival.displayText}】` });
            
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
        }
        
        if(branchEntranceNodeArr.length >0){

            const mermaid = await loadMermaid();
            this.branchAllNodes = [];
            for (let i = 0; i < branchEntranceNodeArr.length; i++) {

                const branchNodes = await this.getBranchNodes(branchEntranceNodeArr[i]);
                this.branchAllNodes.push({branchTab:i,branchNodes:branchNodes});
                let branchMermaidStr = await this.genericIndexMermaidStr(branchNodes, branchEntranceNodeArr[i],this.plugin.settings.DirectionOfBranchGraph);
                let zkGraph = indexMermaidDiv.createEl("div", { cls: "zk-index-mermaid" });
                zkGraph.id = `zk-index-mermaid-${i}`;        

                let { svg } = await mermaid.render(`${zkGraph.id}-svg`, branchMermaidStr);
                
                zkGraph.insertAdjacentHTML('beforeend', svg);
                  
                zkGraph.children[0].addClass("zk-full-width");

                zkGraph.children[0].setAttr('height', `${this.containerEl.offsetHeight - 100}px`); 
                
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

                        let hideNodes = this.plugin.MainNotes.filter(n =>
                            n.IDStr.startsWith(foldNode.nodeIDstr) && (n.IDStr !== foldNode.nodeIDstr)
                        );

                        for (let hideNode of hideNodes) {
                            let hideNodeGArr = indexMermaid.querySelectorAll(`[id^='flowchart-${hideNode.position}']`);

                            hideNodeGArr.forEach((item) => {
                                item.addClass("zk-hidden")
                            })

                            let hideLines = indexMermaid.querySelectorAll(`[id^='L-${hideNode.position}']`);

                            hideLines.forEach((item) => {
                                item.addClass("zk-hidden")
                            })
                        }

                        let hideLines = indexMermaid.querySelectorAll(`[id^='L-${foldNode.position}']`);
                        hideLines.forEach((item) => {
                            item.addClass("zk-hidden")
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
                            let node = this.plugin.MainNotes.filter(n => n.position == Number(nodePosStr))[0];
                            link.textContent = nodeArr[i].getText();
                            nodeArr[i].textContent = "";
                            nodeArr[i].appendChild(link);
                            
                            nodeArr[i].addEventListener('contextmenu', (event: MouseEvent) => {
                                
                                const menu = new Menu();

                                for(let command of this.plugin.settings.NodeCommands){
                                    menu.addItem((item) =>
                                        item
                                          .setTitle(command.name)
                                          .setIcon(command.icon)
                                          .onClick(async() => {
                                            let copyStr:string = '';
                                            switch(command.copyType){
                                                case 1:
                                                    copyStr = node.ID;
                                                    break;
                                                case 2:
                                                    copyStr = node.file.path;
                                                    break;
                                                case 3:
                                                    copyStr = moment(node.ctime).format(this.plugin.settings.datetimeFormat);
                                                    break;
                                                default:
                                                    break;
                                            }
                                            if(copyStr !== ''){
                                                await navigator.clipboard.writeText(copyStr);
                                            }       
                                            this.app.commands.executeCommandById(command.id); 
                                          })
                                    )
                                }                                
                                menu.showAtMouseEvent(event);
                            });

                            if(this.plugin.settings.displayTimeToggle === true){
                                let nodeParent = nodeArr[i].parentElement;
                                if(nodeParent !== null){
                                    setTooltip(nodeParent, `${t("created")}: ${moment(node.ctime).format(this.plugin.settings.datetimeFormat)}`)
                                }
                            }

                            nodeArr[i].addEventListener("click", async (event: MouseEvent) => {
                                if (event.ctrlKey) {
                                    this.app.workspace.openLinkText("", node.file.path, 'tab');
                                    event.stopPropagation();
                                }
                            })                

                            nodeGArr[i].addEventListener("click", async (event: MouseEvent) => {
                                if (event.ctrlKey) {
                                    navigator.clipboard.writeText(node.ID)
                                    new Notice(node.ID + " copied")
                                }else if(event.shiftKey){
                                    this.plugin.settings.lastRetrival =  {
                                        type: 'main',
                                        ID: node.ID,
                                        displayText: node.displayText,
                                        filePath: node.file.path,
                                        openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                                    }
                                    await this.plugin.clearShowingSettings();
                                    await this.IndexViewInterfaceInit();
                                }else if(event.altKey){
                                    this.plugin.retrivalforLocaLgraph = {
                                        type: '1',
                                        ID: node.ID,
                                        filePath: node.file.path,
                
                                    };       
                                    this.plugin.openGraphView();
                                }else{
                                    this.app.workspace.openLinkText("", node.file.path)
                                }
                            })

                            nodeGArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
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
                          
                                foldIcon.addEventListener("click", async (event) => {

                                    
                                    let foldNode: FoldNode = {
                                        graphID: zkGraph.id,
                                        nodeIDstr: node.IDStr,
                                        position: node.position,
                                    };                         

                                    if ((this.plugin.settings.FoldNodeArr.length === 0)) {
                                        if (this.plugin.MainNotes.filter(n => n.IDStr.startsWith(node.IDStr)).length > 1) {
                                            this.plugin.settings.FoldNodeArr.push(foldNode);
                                        }
                                    } else {
                                        if (typeof this.plugin.settings.FoldNodeArr.find(n =>
                                            (n.nodeIDstr == node.IDStr) && (n.graphID = zkGraph.id)) === "undefined"
                                        ) {
                                            if (this.plugin.MainNotes.filter(n => n.IDStr.startsWith(node.IDStr)).length > 1) {
                                                this.plugin.settings.FoldNodeArr.push(foldNode);
                                            }
                                        } else {
                                            this.plugin.settings.FoldNodeArr = this.plugin.settings.FoldNodeArr.filter(n =>
                                                !(n.graphID == foldNode.graphID && n.nodeIDstr == foldNode.nodeIDstr)
                                            );
                                        }
                                    }

                                    if(foldIcon.textContent === "🟢" && event.ctrlKey){
                                        this.plugin.settings.FoldNodeArr = this.plugin.settings.FoldNodeArr.filter(
                                            n=>!n.nodeIDstr.startsWith(foldNode.nodeIDstr)
                                        )                       
                                    }                 
                                    event.stopPropagation();

                                    await this.refreshBranchMermaid();

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

                    let branchTab = indexLinkDiv.createEl('span').createEl('a', { text: `🌿${i+1} `,cls:"zk-branch-tab"});
                    
                    let node = branchEntranceNodeArr[i];
                    setTooltip(branchTab,`${node.displayText} (${this.plugin.MainNotes.filter(n=>n.IDStr.startsWith(node.IDStr)).length})`)
                    
                    branchTab.addEventListener("click", async () => {                        
                        await this.openBranchTab(i);
                        this.resetController();
                    });                   
                    
                }
                
                await this.openBranchTab(this.plugin.settings.BranchTab);
            }

            
        }

        if(this.plugin.settings.ListTree === true){
            await this.genericBranchNodes();
            this.app.workspace.trigger("zk-navigation:refresh-outline-view");
        }
        
        if(this.plugin.settings.HistoryToggle === true){ 
            this.app.workspace.trigger("zk-navigation:refresh-recent-view");
        }

        if(this.plugin.settings.playControllerToggle === true){
            this.resetController();
        }

        this.plugin.indexViewOffsetWidth = this.containerEl.offsetWidth;
        this.plugin.indexViewOffsetHeight = this.containerEl.offsetHeight;
    }

    resetController(){
        
        this.genericBranchNodes();
        
        this.plugin.tableArr.sort((a, b) => a.ctime - b.ctime);
    
        const branchMermaid = document.getElementById(`zk-index-mermaid-${this.plugin.settings.BranchTab}-svg`)

        if(branchMermaid == null) return;            

        this.playStatus = {
            current:-1,
            total:this.plugin.tableArr.length,
            nodeGArr: Array.from(branchMermaid.querySelectorAll("[id^='flowchart-']")),
            lines: Array.from(branchMermaid.querySelectorAll(`[id^='L-']`)),
        }

        this.playStatus.nodeGArr.forEach((item)=>{
            item.removeClass("zk-hidden");
        })

        this.playStatus.lines.forEach((item)=>{
            item.removeClass("zk-hidden");
        })
        
    }

    async openBranchTab(tabNo:number){

        this.plugin.settings.BranchTab = tabNo;        

        const branchGraph = document.getElementsByClassName("zk-index-mermaid");
        const branchTabs = document.getElementsByClassName("zk-branch-tab");

        for(let i=0; i<branchGraph.length;i++){
            branchGraph[i].addClass("zk-hidden");
            branchTabs[i].removeClass("zk-branch-tab-select");

        }

        branchGraph[tabNo].removeClass("zk-hidden");
        branchTabs[tabNo].addClass("zk-branch-tab-select");

        if(this.plugin.settings.ListTree === true){
            await this.genericBranchNodes();
            this.app.workspace.trigger("zk-navigation:refresh-outline-view");
        }
        
    }

    async getBranchEntranceNode(lastRetrival: Retrival) { 

        let branchNodeArr: ZKNode[] = [];
        
        const indexFile = this.app.vault.getFileByPath(lastRetrival.filePath);     

        if (indexFile !== null) {
            
            const resolvedLinks = this.app.metadataCache.resolvedLinks;
            let frontLinks: string[] = Object.keys(resolvedLinks[indexFile.path])
                .filter(l => l.endsWith("md"));

            if (frontLinks.length > 0) {
                for (let link of frontLinks) {
                    let branchFile = this.app.vault.getFileByPath(link);

                    if (branchFile) {
                        let nodes = this.plugin.MainNotes.filter(l => l.file.path == branchFile?.path);
                        if (nodes.length > 0) {
                            branchNodeArr.push(...nodes);
                        }
                    }
                }
            }

            if (this.plugin.settings.lastRetrival.type !== 'index' && branchNodeArr.length == 0) {
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
                let frontNodes = this.plugin.MainNotes.filter(n => entranceNode.IDStr.startsWith(n.IDStr));

                if (frontNodes.length > 0) {
                    startNode = frontNodes[0];

                } else {
                    new Notice("Can't find the root of the branch!");
                }

                branchNodes = this.plugin.MainNotes.filter(n => n.IDStr.startsWith(startNode.IDStr));

                break;

            case "parent":
                if (entranceNode.IDArr.length > 1) {
                    let fatherArr = entranceNode.IDArr.slice(0, entranceNode.IDArr.length - 1);

                    let fatherNode = this.plugin.MainNotes
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
                branchNodes = this.plugin.MainNotes
                    .filter(n => n.IDStr.startsWith(startNode.IDStr))
                    .filter(n => n.IDStr.startsWith(entranceNode.IDStr) || (n.IDArr.length <= entranceNode.IDArr.length));

                break;
            default:
                branchNodes = this.plugin.MainNotes.filter(n => n.IDStr.startsWith(entranceNode.IDStr));

        }

        // branch level
        if (this.plugin.settings.DisplayLevel == "next") {

            branchNodes = branchNodes.filter(n => !n.IDStr.startsWith(entranceNode.IDStr) ||
                n.IDArr.length <= entranceNode.IDArr.length + 1);
        }

        //calculate width for siblings
        if(this.plugin.settings.siblingLenToggle === true){
            const maxLength =  Math.max(...branchNodes.map(n=>n.IDArr.length));
            const minLength =  Math.min(...branchNodes.map(n=>n.IDArr.length));
    
            for(let i=minLength;i<=maxLength;i++){
                let layerNodes = branchNodes.filter(n=>n.IDArr.length === i);
                let maxTextLen = Math.max(...layerNodes.map(n=>displayWidth(n.displayText)));
                for(let node of layerNodes){
                    node.fixWidth = 6 * maxTextLen;
                }
            }
            
        }

        return branchNodes;

    }

    async genericIndexMermaidStr(Nodes: ZKNode[], entranceNode: ZKNode, direction: string) {

        let mermaidStr: string = `%%{ init: { 'flowchart': { 'curve': 'basis' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart ${direction};\n`;
        
        for (let node of Nodes) {

            if(this.plugin.settings.siblingLenToggle === true && this.plugin.settings.NodeText !== "id"){
                mermaidStr = mermaidStr + `${node.position}("<p style='width:${node.fixWidth}px;margin:0px;'>${node.displayText}</p>");\n`;
            }else{
                mermaidStr = mermaidStr + `${node.position}("${node.displayText}");`;
            }
            
            if (node.IDStr.startsWith(entranceNode.IDStr)) {
                mermaidStr = mermaidStr + `style ${node.position} fill:${this.plugin.settings.nodeColor},stroke:#333,stroke-width:1px \n`;
            } else {
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

    unshiftHistoryList(lastRetrival:Retrival) {

        let a  = this.plugin.settings.HistoryList.find(n=>n.type == lastRetrival.type 
            && n.filePath == lastRetrival.filePath && n.ID == lastRetrival.ID);

        if(a){
            let index  = this.plugin.settings.HistoryList.indexOf(a);
            if(index > -1){
                this.plugin.settings.HistoryList.splice(index,1);
            }
        }
        
        lastRetrival.openTime = moment().format("YYYY-MM-DD HH:mm:ss");
        
        this.plugin.settings.HistoryList.unshift(lastRetrival);

        if(this.plugin.settings.HistoryList.length > this.plugin.settings.HistoryMaxCount){
            this.plugin.settings.HistoryList = this.plugin.settings.HistoryList.slice(0, this.plugin.settings.HistoryMaxCount);
        }        
    }

    async genericBranchNodes(){

        this.plugin.tableArr = [];

        const tableBranch = document.getElementById(`zk-index-mermaid-${this.plugin.settings.BranchTab}-svg`)

        if(tableBranch !== null){
            
            let nodeGArr = tableBranch.querySelectorAll("[id^='flowchart-']");
 
            for(let i=0;i<nodeGArr.length;i++){

                let nodePosStr = nodeGArr[i].id.split('-')[1];
                let node = this.plugin.MainNotes.filter(n => n.position == Number(nodePosStr))[0];            
                this.plugin.tableArr.push(node);
            }            
        }
        
    } 

    async exportToCanvas(){
        let nodes = this.branchAllNodes.find(b=>b.branchTab == this.plugin.settings.BranchTab)?.branchNodes;
        if(typeof nodes === 'undefined') return;        

        const cardWidth = this.plugin.settings.cardWidth;
        const cardHeight = this.plugin.settings.cardHeight;
        const intervalX = cardWidth/2;
        const intervalY =  cardHeight/8;

        const maxLength =  Math.max(...nodes.map(n=>n.IDArr.length));
        const minLength =  Math.min(...nodes.map(n=>n.IDArr.length));
        

        for(let i=maxLength-1;i>=minLength;i--){
            let layerNodes = nodes.filter(n=>n.IDArr.length === i);
            
            for(let node of layerNodes){
                let sons = nodes.filter(n=>n.IDStr.startsWith(node.IDStr) && n.IDArr.length == i+1)
                if(sons.length > 0){
                    let target = nodes.indexOf(node)
                    if(target >= 0){
                        nodes[target].nodeSons = sons.reduce((count, node) => count+node.nodeSons, 0);
                    }
                }else{
                    node.nodeSons = 1;
                }
            }
        }

        for(let i=minLength;i<=maxLength;i++){
            let layerNodes = nodes.filter(n=>n.IDArr.length === i);
            let deep:number = 0;
            for(let j=0; j<layerNodes.length; j++){
                
                let father = nodes.find(n=>layerNodes[j].IDStr.startsWith(n.IDStr) && (n.IDArr.length === i-1));
                if(typeof father !== 'undefined'){

                    layerNodes[j].startY = father.startY + deep;
                    
                    let height = intervalY*(layerNodes[j].nodeSons-1) + cardHeight*layerNodes[j].nodeSons;
         
                    layerNodes[j].height = father.startY + deep + height/2;

                    deep = deep + height + intervalY;

                    if(j<layerNodes.length - 1){
                        let nextFather = nodes.find(n=>layerNodes[j+1].IDStr.startsWith(n.IDStr) && (n.IDArr.length === i-1));
                        if(typeof nextFather !== 'undefined' && father !== nextFather){
                            deep = 0;
                        }
                    }

                }else{                    
                    layerNodes[j].height = (intervalY*(layerNodes[j].nodeSons-1) + cardHeight*layerNodes[j].nodeSons)/2; 
                }
            }
        }

        this.tightCards(nodes);

        let canvasNodeStr:string = "";
        let canvasEdgeStr:string = "";
        for(let i=0;i<nodes.length;i++){

            let positionX:number = (nodes[i].IDArr.length - nodes[0].IDArr.length)*(cardWidth + intervalX);
            let positionY:number = nodes[i].height;
            canvasNodeStr = canvasNodeStr + `
            {"id":"${nodes[i].randomId}","x":${positionX},"y":${positionY},"width":${cardWidth},"height":${cardHeight},"type":"file","file":"${nodes[i].file.path}"},`

            let IDStr = nodes[i].IDStr;
            let IDArr = nodes[i].IDArr;
            
            let sonNodes = nodes.filter(n=>n.IDStr.startsWith(IDStr) && n.IDArr.length == IDArr.length+1);
                        
            for(let son of sonNodes){
                canvasEdgeStr = canvasEdgeStr + `
                {"id":"${random(16)}","fromNode":"${nodes[i].randomId}","fromSide":"right","toNode":"${son.randomId}","toSide":"left"},`
            }

        }

        if(canvasNodeStr.length > 0 ){
            canvasNodeStr = canvasNodeStr.slice(0,-1);
        }
        if(canvasEdgeStr.length > 0 ){
            canvasEdgeStr = canvasEdgeStr.slice(0,-1);
        }
        let fileContent:string = `{
        "nodes":[${canvasNodeStr}
        ],
        "edges":[${canvasEdgeStr}
	    ]
        }`;
        
        let targetfile:any;
        let filePath:string = "";
        if(this.plugin.settings.canvasFilePath.endsWith(".canvas")){
            filePath = this.plugin.settings.canvasFilePath;
            targetfile = this.app.vault.getAbstractFileByPath(filePath);
            if(targetfile && targetfile instanceof TFile){
                await this.app.vault.modify(targetfile, fileContent); 
            }
        }

        if(!(targetfile instanceof TFile)){
            if(filePath == ""){
                filePath = `${moment().format("YYYY-MM-DD HH.mm.ss")}.canvas`;                
            }
            new Notice("create new canvas file: " + filePath);
            targetfile = await this.app.vault.create(filePath, fileContent);
        }

        if(targetfile instanceof TFile){
            let leaf = this.app.workspace.getLeavesOfType("canvas").filter(l => l.getDisplayText() == targetfile.basename);
            
            if(leaf.length > 0){
                this.app.workspace.revealLeaf(leaf[0]);
            }else{
                this.app.workspace.openLinkText("",targetfile.path);
            }
        }
    }

    tightCards(nodes:ZKNode[]){
        const cardHeight = this.plugin.settings.cardHeight;
        const intervalY =  cardHeight/8;

        const maxLength =  Math.max(...nodes.map(n=>n.IDArr.length));
        const minLength =  Math.min(...nodes.map(n=>n.IDArr.length));
        

        for(let i=maxLength-1;i>=minLength;i--){
            let layerNodes = nodes.filter(n=>n.IDArr.length === i);
            
            for(let node of layerNodes){                
                let sons = nodes.filter(n=>n.IDStr.startsWith(node.IDStr) && n.IDArr.length == i+1)
                if(sons.length > 1){
                    //上半子节点
                    let upSons = sons.filter(n=>n.height + cardHeight < node.height + (cardHeight + intervalY)/2);
                    for(let j=upSons.length-1;j>=0;j--){
                        let gapYArr:number[] = [];                         
                        let sequentNodes = nodes.filter(n=>n.IDStr.startsWith(upSons[j].IDStr));                        
                        let maxLen =  Math.max(...sequentNodes.map(n=>n.IDArr.length));
                        for(let k=upSons[j].IDArr.length;k<=maxLen;k++){
                            let temLayerNodes = sequentNodes.filter(n=>n.IDArr.length === k);
                            let maxHeightNode = temLayerNodes.find(n=>n.height == Math.max(...temLayerNodes.map(n=>n.height)));
                            if(typeof maxHeightNode !== 'undefined'){                                
                                let columnNodes = nodes.filter(n=>n.IDArr.length === k);
                                let nextNodeIndex = columnNodes.indexOf(maxHeightNode) + 1;
                                let nextNode = columnNodes[nextNodeIndex];
                                if(typeof nextNode !== 'undefined'){
                                    let gapY = nextNode.height - maxHeightNode.height - cardHeight;
                                    if(gapY >= intervalY){
                                        gapYArr.push(gapY);
                                    }                                     
                                }
                            }
                        }                        
                        if(gapYArr.length > 0){
                            if(j==upSons.length-1){
                                let firstGapY = node.height + (cardHeight+intervalY)/2 - upSons[upSons.length-1].height - cardHeight; 
                                if(firstGapY > intervalY){
                                    gapYArr.push(firstGapY);
                                }else{
                                    continue;
                                }
                                gapYArr.push(firstGapY);
                            }                           
                            let minGapY = Math.min(...gapYArr);
                            if(minGapY > intervalY){                             
                                for(let item of sequentNodes){
                                    nodes[nodes.indexOf(item)].height += (minGapY - intervalY); 
                                }
                            }
                        }
                    }

                    //下半子节点
                    let bottomSons = sons.filter(n=>n.height > node.height + (cardHeight + intervalY)/2);
                    for(let j=0;j<bottomSons.length;j++){
                        let gapYArr:number[] = [];                         
                        let sequentNodes = nodes.filter(n=>n.IDStr.startsWith(bottomSons[j].IDStr));                        
                        let maxLen =  Math.max(...sequentNodes.map(n=>n.IDArr.length));
                        for(let k=bottomSons[j].IDArr.length;k<=maxLen;k++){
                            let temLayerNodes = sequentNodes.filter(n=>n.IDArr.length === k);
                            
                            let minHeightNode = temLayerNodes.find(n=>n.height == Math.min(...temLayerNodes.map(n=>n.height)));
                            if(typeof minHeightNode !== 'undefined'){                                
                                let columnNodes = nodes.filter(n=>n.IDArr.length === k);
                                let previousNodeIndex = columnNodes.indexOf(minHeightNode) - 1;
                                let previousNode = columnNodes[previousNodeIndex]; 
                                if(typeof previousNode !== 'undefined'){                                    
                                    let gapY =  minHeightNode.height - previousNode.height - cardHeight;
                                    if(gapY >= intervalY){
                                        gapYArr.push(gapY);
                                    }                               
                                }
                            }
                        }                        
                        if(gapYArr.length > 0){
                            if(j==0){
                                let firstGapY = bottomSons[0].height - node.height - (cardHeight-intervalY)/2;                        
                                if(firstGapY > intervalY){
                                    gapYArr.push(firstGapY);
                                }else{
                                    continue;
                                }
                                gapYArr.push(firstGapY);
                            }               
                            let minGapY = Math.min(...gapYArr);
                            if(minGapY > intervalY){                             
                                for(let item of sequentNodes){
                                    nodes[nodes.indexOf(item)].height -= (minGapY - intervalY); 
                                }
                            }
                        }
                    }
                }
            }            
        }        
    }

    async branchGrowing(){

        this.playStatus.nodeGArr.forEach((item) => {
            item.addClass('zk-hidden');
        })
        this.playStatus.lines.forEach((item) => {
            item.addClass('zk-hidden');
        })

        let sec:number= 500;
        for(let node of this.plugin.tableArr){            
            
            setTimeout(() => {
                let nodeG = this.playStatus.nodeGArr.find(n=>n.id.startsWith(`flowchart-${node.position}`));
                if(nodeG){
                    nodeG.removeClass('zk-hidden');
                }
                let line = this.playStatus.lines.find(n=>n.id.split('-')[2] == node.position.toString());
                if(line){                
                    line.removeClass('zk-hidden');
                }
            }, sec);

            sec = sec + 500;
        }
        
    }

    async branchAnimation(){

        let split = this.playStatus.current+1;
        let showNodes = this.plugin.tableArr.slice(0, split);
        let hideNodes = this.plugin.tableArr.slice(split);

        for(let node of showNodes){
            let nodeG = this.playStatus.nodeGArr.find(n=>n.id.startsWith(`flowchart-${node.position}`));
            if(nodeG){
                nodeG.removeClass('zk-hidden');
            }
            let line = this.playStatus.lines.find(n=>n.id.split('-')[2] == node.position.toString());
            if(line){                
                line.removeClass('zk-hidden');
            }
        }
        
        for(let node of hideNodes){
            let nodeG = this.playStatus.nodeGArr.find(n=>n.id.startsWith(`flowchart-${node.position}`));
            if(nodeG){
                nodeG.addClass('zk-hidden');
            }
            let line = this.playStatus.lines.find(n=>n.id.split('-')[2] == node.position.toString());
            if(line){                
                line.addClass('zk-hidden');
            }
        }
    }
    
    async onClose() {
        this.plugin.saveData(this.plugin.settings);
    }

}