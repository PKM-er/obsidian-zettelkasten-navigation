import ZKNavigationPlugin from "main";
import { App, Modal, Notice, TFile, loadMermaid } from "obsidian";
import { ZKNode, ZK_NAVIGATION } from "src/view/indexView";

export class expandGraphModal extends Modal {

  plugin: ZKNavigationPlugin;
  mainNotes: ZKNode[];
  mermaidStr:string;
  files:TFile[]

  constructor(app: App, plugin:ZKNavigationPlugin, mainNotes:ZKNode[], files:TFile[], mermaidStr:string) {
    super(app);
    this.plugin = plugin;
    this.mainNotes = mainNotes;
    this.mermaidStr = mermaidStr;
    this.files = files;
  }

  async onOpen() {
    let { contentEl } = this;
    this.modalEl.addClass("zk-expand-modal");
    const mermaid = await loadMermaid();
    
    const svgGraph = contentEl.createEl("div", {cls: "zk-expand-graph"});
    svgGraph.id = "zk-expand-graph";

    let { svg } = await mermaid.render(`zk-expand-graph-svg`, `${this.mermaidStr}`);
    svgGraph.insertAdjacentHTML('beforeend', svg);
    svgGraph.children[0].addClass("zk-full-width");
    svgGraph.children[0].setAttribute('height', `${this.modalEl.offsetHeight - 50}px`); 

    this.contentEl.appendChild(svgGraph);

    const svgPanZoom = require("svg-pan-zoom");
    let panZoomTiger = svgPanZoom(`#zk-expand-graph-svg`, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: false,                    
        center: true,
        minZoom: 0.001,
        maxZoom: 1000,
        dblClickZoomEnabled: false,
        zoomScaleSensitivity: 0.25,
    })

    let setSvg = document.getElementById(`${svgGraph.id}-svg`);

    if(setSvg !== null){
        let a = setSvg.children[0].getAttr("style");
        if(typeof a == 'string'){
            let b = a.match(/\d([^\,]+)\d/g)
            if(b !== null && Number(b[0]) > 1){
                panZoomTiger.zoom(1/Number(b[0]))
            }                        
        }
    }
    
    let nodeGArr = svgGraph.querySelectorAll("[id^='flowchart-']");
    let nodeArr = svgGraph.getElementsByClassName("nodeLabel");

    for (let i = 0; i < nodeArr.length; i++) {
        let link = document.createElement('a');
        link.addClass("internal-link");
        let nodePosStr = nodeGArr[i].id.split('-')[1];
        let path:string = '';
        if(this.files.length == 0){
            path = this.mainNotes.filter(n=>n.position == Number(nodePosStr))[0].file.path;
        }else{
            path = this.files[Number(nodePosStr)].path;
        }
        
        link.textContent = nodeArr[i].getText();
        nodeArr[i].textContent = "";
        nodeArr[i].appendChild(link);
        nodeGArr[i].addEventListener("click", (event: MouseEvent) => {
            if(event.ctrlKey){
                this.app.workspace.openLinkText("", path, 'tab');                
            }else if(event.shiftKey){
                //this.plugin.FileforLocaLgraph = path;
                this.plugin.retrivalforLocaLgraph = {
                    type: '1',
                    ID: '',
                    filePath: path,  
                }; 
                this.plugin.openGraphView();
            }else if(event.altKey){
                let mainNotes = this.plugin.MainNotes.filter(n=>n.file.path == path);
                
                if(mainNotes.length > 0){
                    this.plugin.clearShowingSettings();
                    //this.plugin.settings.SelectMainNote = mainNote.file.path;
                    this.plugin.settings.lastRetrival = {
                        type: 'main',
                        ID: mainNotes[0].ID,
                        displayText: mainNotes[0].displayText,
                        filePath: mainNotes[0].file.path,
                        openTime: '',                        
                    }
                    this.plugin.RefreshIndexViewFlag = true;
                    this.app.workspace.trigger("zk-navigation:refresh-index-graph");
                }

            }else{
                this.app.workspace.openLinkText("",path)
            }
        })

        nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
            this.app.workspace.trigger(`hover-link`, {
                event,
                source: ZK_NAVIGATION,
                hoverParent: this,
                linktext: "",
                targetEl: link,
                sourcePath: path,
            })
        });
    }

  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
  
}