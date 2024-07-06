import { FileView, Notice, Plugin, TFile } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNavigationSettngTab } from "src/settings/settings";
import { ZKGraphView, ZK_GRAPH_TYPE } from "src/view/graphView";
import { ZKIndexView, ZK_INDEX_TYPE, ZK_NAVIGATION } from "src/view/indexView";

export interface FoldNode{
    graphID: string;
    nodeIDstr: string;
    position: number;
}

interface Point {
    x: number;
    y: number;
}

export interface ZoomPanScale{
    graphID: string;
    zoomScale: number;
    pan:Point;
}

export interface History {
    displayText: string;
    filePath: string;
    openTime: string;
}

//settings fields
interface ZKNavigationSettings {
    FolderOfMainNotes: string;
    FolderOfIndexes: string;
    SelectIndex: string;
    StartingPoint: string;
    DisplayLevel: string;
    NodeText: string;
    FamilyGraphToggle: boolean;
    InlinksGraphToggle: boolean;
    OutlinksGraphToggle: boolean;
    TagOfMainNotes: string;
    IDFieldOption: string; // 3 options for ID field
    TitleField: string; // ID field option 1, specify a frontmatter field as note title
    IDField: string;    // ID field option 2, specify a frontmatter field as note ID
    Separator: string;  // ID field option 3, specify a separator to split filename
    IndexButtonText: string;
    SuggestMode: string;
    FoldToggle: boolean;
    FoldNodeArr: FoldNode[];
    RedDashLine: boolean;
    zoomPanScaleArr:ZoomPanScale[];
    CustomCreatedTime: string;
    BranchTab: number;
    FileExtension:string; // "all" or ".md only"
    SectionTab:number;    
    HeightOfFamilyGraph: number;
    HeightOfInlinksGraph: number;
    HeightOfOutlinksGraph: number;
    DirectionOfBranchGraph: string;
    DirectionOfFamilyGraph: string;
    DirectionOfInlinksGraph: string;
    DirectionOfOutlinksGraph: string;
    BranchToolbra: boolean;
    RandomIndex: boolean;
    RandomMainNote: boolean;
    TableView: boolean;
    IndexButton: boolean;
    MainNoteButton: boolean;
    MainNoteButtonText: string;
    SelectMainNote: string;
    RefreshIndexViewFlag: boolean;
    settingIcon:boolean;
    MainNoteSuggestMode: string;
    ListTree: boolean;
    HistoryList: History[];
    HistoryToggle: boolean;
    HistoryMaxCount: number;
    HistoryListShow: boolean;
    ListTreeShow: boolean;
}

//Default value for setting field
const DEFAULT_SETTINGS: ZKNavigationSettings = {
    FolderOfMainNotes: '',
    FolderOfIndexes: '',
    SelectIndex: '',
    StartingPoint: 'father',
    DisplayLevel: 'end',
    NodeText: "both",
    FamilyGraphToggle: true,
    InlinksGraphToggle: true,
    OutlinksGraphToggle: true,
    TagOfMainNotes: '',
    IDFieldOption: '1',
    TitleField: '',
    IDField: '',
    Separator: ' ',
    IndexButtonText: t('📖index'),
    SuggestMode: 'fuzzySuggest',
    FoldToggle: false,
    FoldNodeArr: [],
    RedDashLine:false,
    zoomPanScaleArr:[],
    CustomCreatedTime: '',
    BranchTab: 0,
    FileExtension: "md",
    SectionTab: 0,
    HeightOfFamilyGraph: 200,
    HeightOfInlinksGraph: 200,
    HeightOfOutlinksGraph: 200,
    DirectionOfBranchGraph: "LR",
    DirectionOfFamilyGraph: "LR",
    DirectionOfInlinksGraph: "TB",
    DirectionOfOutlinksGraph: "TB",
    BranchToolbra: true,
    RandomIndex: true,
    RandomMainNote: true,
    TableView: true,
    IndexButton: true,
    MainNoteButton: true,
    MainNoteButtonText: t("Main notes"),
    SelectMainNote: '',
    RefreshIndexViewFlag: false,
    settingIcon: true,
    MainNoteSuggestMode: 'fuzzySuggest',
    ListTree: true,
    HistoryList: [],
    HistoryToggle: true,
    HistoryMaxCount: 20,
    HistoryListShow: false,
    ListTreeShow: false,
}

export default class ZKNavigationPlugin extends Plugin {

    settings: ZKNavigationSettings;
    FileforLocaLgraph: string = "";

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )        
    }

    async onload() {

        await this.loadSettings();
        
        this.registerObsidianProtocolHandler("zk-navigation",async (para)=>{

            if(para.file){             
                
                let file = this.app.vault.getFileByPath(para.file);

                if(!file){
                    new Notice(`zk-navigation: file "${para.file}" can't be found!`);
                    return;

                } 

                if(para.from && ["root","father","branch"].includes(para.from)){
                    this.settings.StartingPoint = para.from;
                }
                if(para.to && ["next","end"].includes(para.to)){
                    this.settings.DisplayLevel = para.to;
                }
                if(para.text && ["id","title","both"].includes(para.text)){
                    this.settings.NodeText = para.text;
                }

                let indexFlag:boolean = false;
                
                if(this.settings.FolderOfIndexes !== ""){
                    if(para.file.startsWith(this.settings.FolderOfIndexes)){
                        indexFlag = true;
                        this.settings.SelectIndex = para.file;
                        this.settings.SelectMainNote = "";
                        this.settings.zoomPanScaleArr = [];
                        this.settings.BranchTab = 0;
                        this.settings.FoldNodeArr = [];  
                        await this.openIndexView();
                        this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                    }
                }

                if(!indexFlag){
                    this.settings.SelectMainNote = para.file;
                    this.settings.SelectIndex = "";
                    this.settings.zoomPanScaleArr = [];
                    this.settings.BranchTab = 0;
                    this.settings.FoldNodeArr = [];  
                    await this.openIndexView();
                    this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                }

            } else {
                new Notice(`zk-navigation: invalid uri`);
            }
        })

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file, source) => {
                console.log(source);

                if (
                    !(
                        source === "more-options" ||
                        source === "tab-header" ||
                        source == "file-explorer-context-menu"
                    )
                ) {
                    return;
                }

                if (!(file instanceof TFile)) {
                    return;
                }

                menu.addItem((item) => {
                    item.setTitle(t("Copy zk-navigation URI"))
                        .setIcon("copy")
                        .setSection("info")
                        .onClick(() =>
                            
                            navigator.clipboard.writeText(`obsidian://zk-navigation?file=${encodeURI(file.path)}`)
                        );
                });
            })
        );

        this.addSettingTab(new ZKNavigationSettngTab(this.app, this));

        this.registerView(ZK_INDEX_TYPE, (leaf) => new ZKIndexView(leaf, this));

        this.registerView(ZK_GRAPH_TYPE, (leaf) => new ZKGraphView(leaf, this));
              
        this.addRibbonIcon("ghost", t("open zk-index-graph"), async () => {
            
            this.openIndexView();
            
        })

        this.addRibbonIcon("network", t("open zk-local-graph"), async () => {
            
            this.openGraphView();
        });

        this.addCommand({
            id: "zk-index-graph",
            name: t("open zk-index-graph"),
            callback:async ()=>{
                
                this.openIndexView();
            }
        });

        this.addCommand({
            id: "zk-local-graph",
            name: t("open zk-local-graph"),
            callback: async ()=>{
                
                this.openGraphView();
            }
        });

        this.addCommand({
            id: "zk-index-graph-by-file",
            name: t("reveal current file in zk-index-graph"),
            callback: async ()=>{
                let filePath = this.app.workspace.getActiveViewOfType(FileView)?.file?.path
                
                if(filePath && filePath.endsWith(".md")){

                    let indexFlag:boolean = false;

                    if(this.settings.FolderOfIndexes !== ""){
                        if(filePath.startsWith(this.settings.FolderOfIndexes)){
                            indexFlag = true;
                            this.settings.SelectIndex = filePath;
                            this.settings.SelectMainNote = "";
                            this.settings.zoomPanScaleArr = [];
                            this.settings.BranchTab = 0;
                            this.settings.FoldNodeArr = [];  
                            await this.openIndexView();
                        }
                    }
    
                    if(!indexFlag){
                        this.settings.SelectMainNote = filePath;
                        this.settings.SelectIndex = "";
                        this.settings.zoomPanScaleArr = [];
                        this.settings.BranchTab = 0;
                        this.settings.FoldNodeArr = []; 
                        await this.openIndexView();
                    }

                    return;
                }
            }
        })

        this.registerHoverLinkSource(
        ZK_NAVIGATION,
        {
            defaultMod:true,
            display:ZK_NAVIGATION,
        });      

    }

    async openIndexView() {

        if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length === 0){
         await this.app.workspace.getLeaf('tab')?.setViewState({
             type:ZK_INDEX_TYPE,
             active:true,
         });
        }
        this.app.workspace.revealLeaf(
         this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE)[0]
        );
    }

    async openGraphView() {

       if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length === 0){
        await this.app.workspace.getRightLeaf(false)?.setViewState({
            type:ZK_GRAPH_TYPE,
            active:true,
        });
       }
       this.app.workspace.revealLeaf(
        this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE)[0]
       );
       this.app.workspace.trigger("zk-navigation:refresh-local-graph");
    }

    onunload() {
        this.saveData(this.settings);
    }
}