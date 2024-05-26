import { Notice, Plugin } from "obsidian";
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
    BranchTab: number;
    HeightOfBranchGraph:number;
    FileExtension:string; // "all" or ".md only"
}

//Default value for setting field
const DEFAULT_SETTINGS: ZKNavigationSettings = {
    FolderOfMainNotes: '',
    FolderOfIndexes: '',
    SelectIndex: '',
    StartingPoint: 'father',
    DisplayLevel: 'end',
    NodeText: "id",
    FamilyGraphToggle: true,
    InlinksGraphToggle: true,
    OutlinksGraphToggle: true,
    TagOfMainNotes: '',
    IDFieldOption: '1',
    TitleField: '',
    IDField: '',
    Separator: ' ',
    IndexButtonText: '📖index',
    SuggestMode: 'fuzzySuggest',
    FoldToggle: false,
    FoldNodeArr: [],
    RedDashLine:false,
    zoomPanScaleArr:[],
    BranchTab: 0,
    HeightOfBranchGraph: 530,
    FileExtension: "all"
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

        this.addSettingTab(new ZKNavigationSettngTab(this.app, this));

        this.registerView(ZK_INDEX_TYPE, (leaf) => new ZKIndexView(leaf, this));

        this.registerView(ZK_GRAPH_TYPE, (leaf) => new ZKGraphView(leaf, this));
      
        this.addRibbonIcon("ghost", t("open zk-index-graph"), () => {
            if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length === 0){                
                this.openIndexView();
            }
            
        })

        this.addRibbonIcon("network", t("open zk-local-graph"), () => {
            if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length === 0){
                this.openGraphView();
            }
        });

        this.addCommand({
            id: "zk-index-graph",
            name: t("open zk-index-graph"),
            callback:()=>{
                if(this.app.workspace.getLeavesOfType(ZK_INDEX_TYPE).length === 0){                
                    this.openIndexView();
                }
            }
        });

        this.addCommand({
            id: "zk-local-graph",
            name: t("open zk-local-graph"),
            callback:()=>{
                if(this.app.workspace.getLeavesOfType(ZK_GRAPH_TYPE).length === 0){                
                    this.openGraphView();
                }
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

        let leaf = this.app.workspace.getLeaf(false);
        if (leaf != null) {
            await leaf.setViewState({
                type: ZK_INDEX_TYPE
            })
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async openGraphView() {
        
        let leaf = this.app.workspace.getRightLeaf(false);
        if (leaf != null) {
            await leaf.setViewState({
                type: ZK_GRAPH_TYPE
            })
            this.app.workspace.revealLeaf(leaf);
        }
    }

    onunload() {
        
    }
}