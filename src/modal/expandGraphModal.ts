import ZKNavigationPlugin from "main";
import { App, Modal, Notice, TFile, loadMermaid } from "obsidian";
import { ZKNode, ZK_NAVIGATION } from "src/view/indexView";

export class expandGraphModal extends Modal {

  plugin: ZKNavigationPlugin;
  mainNotes: ZKNode[];
  mermaidStr:string;
  files:TFile[]
  graphType:string;

  constructor(app: App, plugin:ZKNavigationPlugin, mainNotes:ZKNode[], files:TFile[], mermaidStr:string, graphType:string='flowchart') {
    super(app);
    this.plugin = plugin;
    this.mainNotes = mainNotes;
    this.mermaidStr = mermaidStr;
    this.files = files;
    this.graphType=graphType;
  }

  async onOpen() {
    let { contentEl } = this;
    this.containerEl.addClass("zk-modal-container");
    this.modalEl.addClass("zk-expand-modal");
    const mermaid = await loadMermaid();
    
    const svgGraph = contentEl.createEl("div", {cls: "zk-expand-graph"});
    svgGraph.id = "zk-expand-graph";

    let { svg } = await mermaid.render(`zk-expand-graph-svg`, `${this.mermaidStr}`);
    svgGraph.insertAdjacentHTML('beforeend', svg);
    svgGraph.children[0].removeAttribute('style');
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

    if(this.graphType==='flowchart'){

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
                this.app.workspace.openLinkText("", path, 'tab');                
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
    }else{

        const gElements = svgGraph.querySelectorAll('g.commit-bullets');        
        
        const circles = gElements[1].querySelectorAll("circle.commit"); 
        const circleNodes = Array.from(circles);
        gElements[1].textContent = "";

        for(let j=0;j<circleNodes.length;j++){
            let link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
            link.appendChild(circleNodes[j]);
            gElements[1].appendChild(link);            
            
            let nodeArr = this.mainNotes.filter(n=>n.gitNodePos === j);
            
            if(nodeArr.length > 0){
                let node = nodeArr[0];
                circleNodes[j].addEventListener("click", async (event: MouseEvent) => {  
                    this.app.workspace.openLinkText("", node.file.path, 'tab');                   
                })
                
                circleNodes[j].addEventListener(`mouseover`, (event: MouseEvent) => {
                    this.app.workspace.trigger(`hover-link`, {
                        event,
                        source: ZK_NAVIGATION,
                        hoverParent: this,
                        linktext: node.file.basename,
                        targetEl: circleNodes[j],
                        sourcePath: node.file.path,
                    })
                });                            
            }  
        }
    }

  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
  
}