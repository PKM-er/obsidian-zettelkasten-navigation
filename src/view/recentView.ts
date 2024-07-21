import ZKNavigationPlugin from "main";
import { debounce,  ExtraButtonComponent,  IconName, ItemView, moment, WorkspaceLeaf } from "obsidian"
import { t } from "src/lang/helper"
import { ZK_NAVIGATION } from "./indexView";

export const ZK_RECENT_TYPE: string = "zk-recent-type"
export const ZK_RECENT_VIEW: string = t("History List")

export class ZKRecentView extends ItemView {
    plugin:ZKNavigationPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: ZKNavigationPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return ZK_RECENT_TYPE;
    }
    getDisplayText(): string {
        return ZK_RECENT_VIEW;
    }

    getIcon(): IconName {
        return "history"
    }

    onload() {
        
        const refresh = debounce(this.refreshRecentView, 300, true);

        this.registerEvent(this.app.workspace.on("zk-navigation:refresh-recent-view",  refresh));

    }
    
    async onOpen() {
        this.refreshRecentView()

    }

    refreshRecentView = async ()=>{

        let { containerEl } = this;
        containerEl.empty();
        const historyListDiv = this.containerEl.createDiv("view-content node-insert-event");
        
        for(let i=0;i<this.plugin.settings.HistoryList.length;i++){

            let item = this.plugin.settings.HistoryList[i]
            let line = historyListDiv.createEl('div', {text: `${i+1}. ${item.displayText}`, cls:"vertical-tab-nav-item recent-item"});
            
            line.addEventListener(`mousemove`, (event:MouseEvent)=>{
                this.app.workspace.trigger(`hover-link`, {
                    event,
                    source: ZK_NAVIGATION,
                    hoverParent: line,
                    linktext: "",
                    targetEl: line,
                    sourcePath: item.filePath,
                })
            })
            
            line.addEventListener('click', async ()=>{
                
                if(this.plugin.settings.FolderOfIndexes !== '' && 
                    item.filePath.startsWith(this.plugin.settings.FolderOfIndexes)){
                    this.plugin.settings.SelectIndex = item.filePath;
                    this.plugin.settings.SelectMainNote = "";

                }else{

                    this.plugin.settings.SelectMainNote = item.filePath;
                    this.plugin.settings.SelectIndex = "";
                }
                
                let history =  {
                    displayText: item.displayText,
                    filePath: item.filePath,
                    openTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                }

                this.plugin.settings.HistoryList.splice(i,1);
                this.plugin.settings.HistoryList.unshift(history);
                this.plugin.settings.zoomPanScaleArr = [];
                this.plugin.settings.BranchTab = 0;
                this.plugin.settings.FoldNodeArr = [];  
                this.app.workspace.trigger("zk-navigation:refresh-recent-view");
                this.plugin.RefreshIndexViewFlag = true;
                this.plugin.openIndexView();

            })

            const closeBtnDiv = line.createDiv("recent-close-button")
            const closeBtn = new ExtraButtonComponent(closeBtnDiv);
            
            closeBtn.setIcon("x");
            
            closeBtnDiv.addEventListener("click", (event) =>{

                this.plugin.settings.HistoryList.splice(i,1);
                this.app.workspace.trigger("zk-navigation:refresh-recent-view");
                
                event.stopPropagation();
            })

            line.addEventListener("mouseenter", function() {
                closeBtnDiv.setAttr("style","display:block");
             });
              
            line.addEventListener("mouseleave", function() {
                closeBtnDiv.setAttr("style","display:none");
             });
        }
        
    }
}