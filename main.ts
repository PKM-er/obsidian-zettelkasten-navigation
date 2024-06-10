import { Plugin } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNavigationSettngTab } from "src/settings/settings";
import { ZK_TABLE_TYPE, ZKTableView } from "src/view/tableView";
import { ZKGraphView, ZK_GRAPH_TYPE } from "src/view/graphView";
import { ZKIndexView, ZKNode, ZK_INDEX_TYPE, ZK_NAVIGATION } from "src/view/indexView";

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
}

export default class ZKNavigationPlugin extends Plugin {

    settings: ZKNavigationSettings;
    tableArr:ZKNode[]

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )        
    }

    async onload() {

        await this.loadSettings();

        this.addSettingTab(new ZKNavigationSettngTab(this.app, this));

        this.registerView(ZK_INDEX_TYPE, (leaf) => new ZKIndexView(leaf, this));

        this.registerView(ZK_GRAPH_TYPE, (leaf) => new ZKGraphView(leaf, this));
      
        this.registerView(ZK_TABLE_TYPE, (leaf) => new ZKTableView(leaf, this, this.tableArr));

        this.addRibbonIcon("ghost", t("open zk-index-graph"), async () => {
            if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length > 0){     

                await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);   
            }
            this.openIndexView();
            
        })

        this.addRibbonIcon("network", t("open zk-local-graph"), async () => {
            if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length > 0){
                await this.app.workspace.detachLeavesOfType(ZK_GRAPH_TYPE);
            }
            this.openGraphView();
        });

        this.addCommand({
            id: "zk-index-graph",
            name: t("open zk-index-graph"),
            callback:async ()=>{
                if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length > 0){     
                
                await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);   
                }
                this.openIndexView();
            }
        });

        this.addCommand({
            id: "zk-local-graph",
            name: t("open zk-local-graph"),
            callback: async ()=>{
                if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length > 0){
                    await this.app.workspace.detachLeavesOfType(ZK_GRAPH_TYPE);
                }
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
        
        let leaf = this.app.workspace.getRightLeaf(false);
        if (leaf != null) {
            await leaf.setViewState({
                type: ZK_GRAPH_TYPE,
                active: true,
            })
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async openTableView() {

        if(this.app.workspace.getLeavesOfType(ZK_TABLE_TYPE).length > 0){   

            await this.app.workspace.detachLeavesOfType(ZK_TABLE_TYPE);
            
        }

        let leaf = this.app.workspace.getLeaf('tab');
        if (leaf != null) {
            await leaf.setViewState({
                type: ZK_TABLE_TYPE,
                active: true,
            })
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async refreshViews(){
        if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length > 0){              
            await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);              
            await this.openIndexView();
        }       

    }

    onunload() {
    }
}