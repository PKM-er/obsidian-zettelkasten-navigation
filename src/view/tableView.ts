import ZKNavigationPlugin from "main";
import { debounce, ItemView, MarkdownRenderer, moment, TFile, WorkspaceLeaf } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNode, ZK_NAVIGATION } from "./indexView";


export const ZK_TABLE_TYPE: string = "zk-table-type"
export const ZK_TABLE_VIEW: string = t("table view")

export class ZKTableView extends ItemView{

    plugin: ZKNavigationPlugin;
    headerStr:string = `|${t("note's ID")}|${t("note's title")}|${t("inlinks")}|${t("outlinks")}|${t("Time of creation")}|\n| --- | --- | --- | --- | --- |\n`;
    tableStr:string = "";
    tableArr:ZKNode[];

    constructor(leaf:WorkspaceLeaf, plugin:ZKNavigationPlugin, tableArr:ZKNode[]){
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return ZK_TABLE_TYPE;
    }
    getDisplayText(): string {
        return ZK_TABLE_VIEW;
    }
    getIcon(): string {
        return "table";
    }
    
    async onOpen() {
        this.refreshTableView();
    }

    onload() {

        const refresh = debounce(this.refreshTableView, 300, true);

        this.registerEvent(this.app.workspace.on("zk-navigation:refresh-table-view", refresh));
    }

    refreshTableView = async ()=>{
        let { contentEl } = this;
        contentEl.empty();
        const contentDiv =  contentEl.createDiv("zk-table-view");   
        contentDiv.id = "zk-table-view";
        this.appendTableLine();  
        MarkdownRenderer.render(this.app, this.tableStr, contentDiv, '', this.plugin);
        this.addLinkAndPreview();

    }

    appendTableLine(){
        this.tableStr = this.headerStr        
        this.tableArr =  this.plugin.tableArr.sort((a, b) => a.IDStr.localeCompare(b.IDStr));
        for(let node of this.tableArr){
            let inlinksStr:string = "";
            for(let inlink of this.getInlinks(node.file)){
                inlinksStr = inlinksStr + `<li>[[${inlink.basename}]]</li>`;
            }
            if(inlinksStr !== ""){
                inlinksStr = `<ul>${inlinksStr}</ul>`;
            }

            let outlinkStr:string = "";
            
            let outlinks = this.app.metadataCache.getFileCache(node.file)?.links

            if(outlinks){
                for(let outlink of outlinks){
                    outlinkStr = outlinkStr + `<li> ${outlink.original.replace(`|`,`\\|`)}</li>`;
                }
            }
            if(outlinkStr !== ""){
                outlinkStr = `<ul>${outlinkStr}</ul>`;
            }

            this.tableStr = this.tableStr + `|[[${node.ID}]]|${node.title.replace(`|`,`\\|`)}|${inlinksStr}|${outlinkStr}|${moment(node.ctime).format(this.plugin.settings.datetimeFormat)}|\n`;
        }
    }

    getInlinks(currentFile: TFile) {

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

    getOutlinks(currentFile: TFile) {


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
    
    addLinkAndPreview(){

        let tableDiv = document.getElementById("zk-table-view");

        if(tableDiv !== null){
            let links = tableDiv.getElementsByTagName("a");
            for(let i=0;i<links.length;i++){
                let linkStr = links[i].getAttribute("href");
                if(typeof linkStr == 'string'){
                    links[i].addEventListener('click', ()=>{
                        this.app.workspace.openLinkText(linkStr?linkStr:"","",'tab');
                    })
                    links[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                        this.app.workspace.trigger(`hover-link`,{
                            event,
                            source: ZK_NAVIGATION,
                            hoverParent: links[i],
                            linktext: linkStr,
                            targetEl: links[i],
                            sourcePath: "",
                        })
                    })                    
                }
            }
        }        
    }

    async onClose() {        
        this.plugin.clearShowingSettings(this.plugin.settings.BranchTab);
    }
}