import ZKNavigationPlugin from "main";
import { debounce, ExtraButtonComponent, IconName, ItemView, Menu, Notice, SliderComponent, WorkspaceLeaf } from "obsidian"
import { t } from "src/lang/helper"
import { ZK_NAVIGATION, ZKNode } from "./indexView";

export const ZK_OUTLINE_TYPE: string = "zk-outline-type"
export const ZK_OUTLINE_VIEW: string = t("list tree")

export class ZKOutlineView extends ItemView {

    plugin:ZKNavigationPlugin;
    maxLength:number = 0;
    minLength:number = 0;
    defautLength:number

    constructor(leaf: WorkspaceLeaf, plugin: ZKNavigationPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return ZK_OUTLINE_TYPE;
    }
    getDisplayText(): string {
        return ZK_OUTLINE_VIEW;
    }

    getIcon(): IconName {
        return "list-tree"
    }

    onload() {

        const refresh = debounce(this.refreshOutlineView, 300, true);

        this.registerEvent(this.app.workspace.on("zk-navigation:refresh-outline-view",  refresh));

    }

    async onOpen() {
        this.refreshOutlineView()

    }

    refreshOutlineView = async ()=>{
        
        let { containerEl } = this;
        containerEl.empty();
        const headerDiv = containerEl.createDiv("nav-header").createDiv("nav-buttons-container");
        this.plugin.tableArr.sort((a, b) => a.IDStr.localeCompare(b.IDStr));
        this.maxLength =  Math.max(...this.plugin.tableArr.map(n=>n.IDArr.length));
        this.minLength =  Math.min(...this.plugin.tableArr.map(n=>n.IDArr.length));
        this.defautLength = this.plugin.settings.outlineLayer;

        const slider = new SliderComponent(headerDiv);

        let maxLayer = this.maxLength - this.minLength + 1;
        if(this.defautLength > maxLayer){
            this.defautLength = maxLayer;
        }

        slider.setLimits(1,maxLayer,1)
        .setDynamicTooltip()
        .setValue(this.defautLength)
        .onChange((value)=>{
            this.plugin.settings.outlineLayer = value;
            this.plugin.saveData(this.plugin.settings)
            this.app.workspace.trigger("zk-navigation:refresh-outline-view");
        })
        
        const outlineViewDiv = this.containerEl.createDiv("view-content node-insert-event");
        outlineViewDiv.id = "view-content"
        await this.createListTree(this.plugin.tableArr[0],outlineViewDiv)

        
    }
    
    async createListTree(item:ZKNode, itemEl:HTMLElement){
        
        let children = this.plugin.tableArr.filter(n=>n.IDArr.length === item.IDArr.length + 1 && n.IDStr.startsWith(item.IDStr))

        let treeItem = itemEl.createDiv("tree-item");
        let treeItemSelf = treeItem.createDiv("tree-item-self is-clickable");

        treeItemSelf.addEventListener(`mouseover`, (event: MouseEvent) => {
            this.app.workspace.trigger(`hover-link`, {
                event,
                source: ZK_NAVIGATION,
                hoverParent: this,
                linktext: "",
                targetEl: treeItemSelf,
                sourcePath: item.file.path,
            })
        });

        treeItemSelf.addEventListener("click", async (event: MouseEvent) => {            
            if(event.ctrlKey){
                navigator.clipboard.writeText(item.ID);
                new Notice(item.ID + " copied");
            }else if(event.shiftKey){
                this.plugin.settings.lastRetrival =  {
                    type: 'main',
                    ID: item.ID,
                    displayText: item.displayText,
                    filePath: item.file.path,
                    openTime: '',
                }
                await this.plugin.clearShowingSettings();
                this.plugin.RefreshIndexViewFlag = true;
                this.plugin.openIndexView();
            }else if(event.altKey){
                
                this.plugin.retrivalforLocaLgraph = {
                    type: '1',
                    ID: item.ID,
                    filePath: item.file.path,

                }; 
                this.plugin.openGraphView();
            }else{
                this.app.workspace.openLinkText("", item.file.path);
            }
        })


        const treeItemChildren = treeItem.createDiv("tree-item-children");
        let treeIteminner = treeItemSelf.createDiv("tree-item-inner");
        treeIteminner.setText(`${item.displayText}`);

        if(children.length > 0){
            let treeItemIcon = treeItemSelf.createDiv("tree-item-icon collapse-icon");
            let icon = new ExtraButtonComponent(treeItemIcon);
            icon.setIcon("right-triangle");
            treeItemIcon.addEventListener("click", (event: MouseEvent) => {

                if(treeItemIcon.hasClass("is-collapsed")){
                    treeItemIcon.removeClass("is-collapsed");
                    treeItemChildren.removeClass("zk-hidden");
                }else{
                    treeItemIcon.addClass("is-collapsed");
                    treeItemChildren.addClass("zk-hidden");
                }
                
                event.stopPropagation();
            })

            if(item.IDArr.length - this.minLength + 1 >= this.defautLength ){
                treeItemIcon.addClass("is-collapsed")
                treeItemChildren.addClass("zk-hidden");
            }

            for(let i=0;i<children.length;i++){
                
                await this.createListTree(children[i], treeItemChildren)
            }
        }

    }
}