import ZKNavigationPlugin from "main";
import { App, ExtraButtonComponent, MarkdownRenderer, Modal, moment, Notice, TFile } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNode, ZK_NAVIGATION } from "src/view/indexView";

export class tableModal extends Modal {

  plugin: ZKNavigationPlugin;
  headerStr:string = `|${t("note's ID")}|${t("note's title")}|${t("inlinks")}|${t("outlinks")}|${t("Time of creation")}|\n| --- | --- | --- | --- | --- |\n`;
  tableStr:string = "";
  tableArr:ZKNode[];

  constructor(app: App, plugin:ZKNavigationPlugin, tableArr:ZKNode[]) {
    super(app);
    this.plugin = plugin;
    this.tableArr = tableArr;
  }

  onOpen() {
    let { contentEl } = this;
    this.modalEl.addClass("zk-table-container");

    this.createToolBar(contentEl)
    this.createTable(contentEl)

  }

  createToolBar(contentEl:HTMLElement){

    const toolbarDiv = contentEl.createDiv("zk-table-toolbar");
    toolbarDiv.empty();
    const copyTableIcon = new ExtraButtonComponent(toolbarDiv);
    copyTableIcon.setIcon("copy").setTooltip(t("Copy markdown table"));
    copyTableIcon.onClick(async ()=>{
        await this.copyTableStr();
    })


  }
  createTable(contentEl:HTMLElement){
    const contentDiv =  contentEl.createDiv("zk-table-view");   
    contentDiv.id = "zk-table-view";
    this.appendTableLine();    
    MarkdownRenderer.render(this.app, this.tableStr, contentDiv, '', this.plugin);
    this.addLinkAndPreview();

  }

  async copyTableStr(){

    this.appendTableLine();

    this.tableStr = this.tableStr.replace(/<ul><li>/g,"").replace(/<\/li><\/ul>/g,"").replace(/<\/li><li>/g,"<br>");
    
    await navigator.clipboard.writeText(this.tableStr);

    new Notice(t("Copy markdown table"));

  }

  appendTableLine(){
    this.tableStr = this.headerStr;
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

        this.tableStr = this.tableStr + `|[[${node.ID}]]|${node.title.replace(`|`,`\\|`)}|${inlinksStr}|${outlinkStr}|${moment(node.ctime).format(this.plugin.settings.datetimeFormat)}|\n`
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