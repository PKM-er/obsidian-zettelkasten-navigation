import { Plugin } from "obsidian";
import { ZKNavigationSettngTab } from "src/settings/settings";
import { ZKGraphView, ZK_GRAPH_TYPE } from "src/view/graphView";
import { ZKIndexView, ZK_INDEX_TYPE, ZK_NAVIGATION } from "src/view/indexView";

//settings fields
interface ZKNavigationSettings{
	FolderOfMainNotes: string;
	FolderOfIndexes: string;
    SelectIndex: string;
    StartingPoint: string;
    DisplayLevel: string;
    NodeText: string;
    TitleField: string;
    FamilyGraphToggle: boolean;
    InlinksGraphToggle: boolean;
    OutlinksGraphToggle: boolean;
}

//Default value for setting field
const DEFAULT_SETTINGS: ZKNavigationSettings = {
	FolderOfMainNotes: '',
	FolderOfIndexes: '',
    SelectIndex: '',
    StartingPoint: 'father',
    DisplayLevel: 'next',
    NodeText: "id",
    TitleField: '',
    FamilyGraphToggle: true,
    InlinksGraphToggle: true,
    OutlinksGraphToggle: true,
}

export default class ZKNavigationPlugin extends Plugin{

    settings: ZKNavigationSettings;

    async loadSettings(){
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )
    }
    
    async onload() {

        await this.loadSettings();
        
        this.addSettingTab(new ZKNavigationSettngTab(this.app, this));

        this.registerView(ZK_INDEX_TYPE, (leaf) => new ZKIndexView(leaf,this));
        
        this.registerView(ZK_GRAPH_TYPE, (leaf) => new ZKGraphView(leaf,this));

        this.addRibbonIcon("ghost", "open zk-index-graph", () => {
			this.openIndexView();
        });
        this.addRibbonIcon("network", "open zk-local-graph", () => {
			this.openGraphView();
        });

        (this.app.workspace as any).registerHoverLinkSource(
            ZK_NAVIGATION,
            {
                display: `ZK Navigation`,
                default: true,
            },
        );

        //refresh index mermaid
        this.app.workspace.onLayoutReady(async () => {

            if(this.app.workspace.getActiveViewOfType(ZKIndexView) !== null){
                await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);

                let leaf = this.app.workspace.getLeaf(true);
                if(leaf != null){
                    await leaf.setViewState({
                        type: ZK_INDEX_TYPE
                    })
                }  
            }
        })
        // refresh graph mermaid
        this.app.workspace.onLayoutReady(async () => {
            if(this.app.workspace.getActiveViewOfType(ZKGraphView) !== null){
                await this.app.workspace.detachLeavesOfType(ZK_GRAPH_TYPE);

                let leaf = this.app.workspace.getRightLeaf(false);
                if(leaf != null){
                    await leaf.setViewState({
                        type: ZK_GRAPH_TYPE
                    })
                }
            }
        })
	}
	
	async openGraphView(){

		await this.app.workspace.detachLeavesOfType(ZK_GRAPH_TYPE);

		let leaf = this.app.workspace.getRightLeaf(false);
        if(leaf != null){
            await leaf.setViewState({
                type: ZK_GRAPH_TYPE
            })
            this.app.workspace.revealLeaf(leaf);
        } 
	}

	async openIndexView(){

		await this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);

		let leaf = this.app.workspace.getLeaf(true);
        if(leaf != null){
            await leaf.setViewState({
                type: ZK_INDEX_TYPE
            })
            this.app.workspace.revealLeaf(leaf);
        } 
	}
    
	onunload() {

        //this.app.workspace.detachLeavesOfType(ZK_GRAPH_TYPE);
        //this.app.workspace.detachLeavesOfType(ZK_INDEX_TYPE);
        (this.app.workspace as any).unregisterHoverLinkSource(
            ZK_NAVIGATION
        );
	}    
}