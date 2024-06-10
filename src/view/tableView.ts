import ZKNavigationPlugin from "main";
import { ItemView, MarkdownRenderer, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNode, ZK_NAVIGATION } from "./indexView";
import { link } from "fs";


export const ZK_TABLE_TYPE: string = "zk-table-type"
export const ZK_TABLE_VIEW: string = "zk-table-view"

export class ZKTableView extends ItemView{

    plugin: ZKNavigationPlugin;
    data:string = `|${t("note's ID")}|${t("note's title")}|${t("inlinks")}|${t("outlinks")}|${t("Time of creation")}|\n| --- | --- | --- | --- | --- |\n`;
    tableArr:ZKNode[];

    constructor(leaf:WorkspaceLeaf, plugin:ZKNavigationPlugin, tableArr:ZKNode[]){
        super(leaf);
        this.plugin = plugin;
        this.tableArr = tableArr;
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
        let { contentEl } = this;
        const contentDiv =  contentEl.createDiv("zk-table-view");   
        contentDiv.id = "zk-table-view";
        this.appendTableLine();    
        MarkdownRenderer.render(this.app, this.data, contentDiv, '', this.plugin);
        this.addLinkAndPreview();
     }

    appendTableLine(){
        for(let node of this.tableArr){
            let inlinksStr:string = "";
            for(let inlink of this.getInlinks(node.file)){
                inlinksStr = inlinksStr + `<li>[[${inlink.basename}]]</li>`;
            }
            if(inlinksStr !== ""){
                inlinksStr = `<ul>${inlinksStr}</ul>`;
            }

            let outlinkStr:string = "";
            
            for(let outlink of this.getOutlinks(node.file)){
                outlinkStr = outlinkStr + `<li> [[${outlink.basename}]]</li>`;
            }

            if(outlinkStr !== ""){
                outlinkStr = `<ul>${outlinkStr}</ul>`;
            }

            this.data = this.data + `|[[${node.ID}]]|${node.title}|${inlinksStr}|${outlinkStr}|${node.ctime}|\n`
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
}