import { Notice, Plugin, TFile } from "obsidian";
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
    HeightOfBranchGraph:number;
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
    RefreshViews: boolean;
    settingIcon:boolean;
    MainNoteSuggestMode: string;
    ExportList: boolean;
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
    HeightOfBranchGraph: 530,
    FileExtension: "md",
    SectionTab: 0,
    HeightOfFamilyGraph: 200,
    HeightOfInlinksGraph: 200,
    HeightOfOutlinksGraph: 200,
    DirectionOfBranchGraph: "LR",
    DirectionOfFamilyGraph: "LR",
    DirectionOfInlinksGraph: "TB",
    DirectionOfOutlinksGraph: "TB",
    BranchToolbra: false,
    RandomIndex: true,
    RandomMainNote: true,
    TableView: true,
    IndexButton: true,
    MainNoteButton: true,
    MainNoteButtonText: t("Main notes"),
    SelectMainNote: '',
    RefreshViews: false,
    settingIcon:true,
    MainNoteSuggestMode: 'fuzzySuggest',
    ExportList:false,
}

export default class ZKNavigationPlugin extends Plugin {

    settings: ZKNavigationSettings;

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

                let indexFlag:boolean = false;

                if(this.settings.FolderOfIndexes !== ""){
                    if(para.file.startsWith(this.settings.FolderOfIndexes)){
                        indexFlag = true;
                        this.settings.SelectIndex = para.file;
                        this.settings.SelectMainNote = "";
                        this.settings.zoomPanScaleArr = [];
                        this.settings.BranchTab = 0;
                        this.settings.FoldNodeArr = [];                    
                        this.saveData(this.settings);
                        await this.openIndexView();
                    }
                }

                if(!indexFlag){
                    this.settings.SelectMainNote = para.file;
                    this.settings.SelectIndex = "";
                    this.settings.zoomPanScaleArr = [];
                    this.settings.BranchTab = 0;
                    this.settings.FoldNodeArr = [];                    
                    this.saveData(this.settings);
                    await this.openIndexView();
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

        this.registerHoverLinkSource(
        ZK_NAVIGATION,
        {
            defaultMod:true,
            display:ZK_NAVIGATION,
        });      

    }

    async openIndexView() {

        if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length > 0){     
                
            await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);   
        }

        let leaf = this.app.workspace.getLeaf('tab');
        if (leaf != null) {
            await leaf.setViewState({
                type: ZK_INDEX_TYPE,
                active: true,
            })
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async openGraphView() {

        if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length > 0){
            await this.app.workspace.detachLeavesOfType(ZK_GRAPH_TYPE);
        }
        
        let leaf = this.app.workspace.getRightLeaf(false);
        if (leaf != null) {
            await leaf.setViewState({
                type: ZK_GRAPH_TYPE,
                active: true,
            })
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async refreshViews(){
        if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length > 0){              
            await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);              
            await this.openIndexView();            
            this.settings.RefreshViews = false;
        }       

    }

    onunload() {
        this.saveData(this.settings);
    }
}