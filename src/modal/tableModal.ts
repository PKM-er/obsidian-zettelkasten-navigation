import ZKNavigationPlugin from "main";
import { App, MarkdownRenderer, Modal, TFile } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNode, ZK_NAVIGATION } from "src/view/indexView";

export class tableModal extends Modal {

  plugin: ZKNavigationPlugin;
  data:string = `|${t("note's ID")}|${t("note's title")}|${t("inlinks")}|${t("outlinks")}|${t("Time of creation")}|\n| --- | --- | --- | --- | --- |\n`;
  tableArr:ZKNode[];

  constructor(app: App, plugin:ZKNavigationPlugin, tableArr:ZKNode[]) {
    super(app);
    this.plugin = plugin;
    this.tableArr = tableArr;
  }

  onOpen() {
    let { contentEl } = this;
    this.modalEl.addClass("zk-table-container");
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
            let href = links[i].getAttribute("href");
            if(href){
                let linkStr:string = href;

                let node = this.tableArr.find(n=>n.ID == linkStr)

                if(node){
                    linkStr =  node.file.basename;
                }

                links[i].addEventListener('click', (event:MouseEvent)=>{
                    if(event.ctrlKey){
                        this.app.workspace.openLinkText(linkStr,"",'tab');              
                    }else{
                        this.app.workspace.openLinkText(linkStr,"");
                    }
                    
                })
                links[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                    this.app.workspace.trigger(`hover-link`,{
                        event,
                        source: ZK_NAVIGATION,
                        hoverParent: tableDiv,
                        linktext: linkStr,
                        targetEl: links[i],
                        sourcePath: "",
                    })
                })                    
            }
        }
    }        
}

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
  
}