import ZKNavigationPlugin from "main";
import { ItemView, Notice, TFile, WorkspaceLeaf, debounce, loadMermaid } from "obsidian";
import { ZKNode, ZK_NAVIGATION } from "./indexView";

export const ZK_GRAPH_TYPE:string = "zk-graph-type"
export const ZK_GRAPH_VIEW:string = "zk-local-graph"

export class ZKGraphView extends ItemView{

    plugin: ZKNavigationPlugin;
    MainNotes:ZKNode[] = [];

    constructor(leaf:WorkspaceLeaf, plugin:ZKNavigationPlugin ){
        super(leaf);
        this.plugin = plugin;

    }

    getViewType(): string {
        return ZK_GRAPH_TYPE;
    }
    getDisplayText(): string {
        return ZK_GRAPH_VIEW;
    }

    getIcon(): string {
        return "network"
    }

    async onOpen() {

        let {containerEl} = this;
        containerEl.empty();
        
        const graphMermaidDiv = containerEl.createDiv("zk-graph-mermaid-container");

        const refresh_graph = async () =>{

            const currentFile = this.app.workspace.getActiveFile();
            
            graphMermaidDiv.empty();

            if(currentFile !== null){
                
                let mermaid = await loadMermaid();

                if(this.plugin.settings.FamilyGraphToggle == true){

                    let familyNodeArr:ZKNode[] = await this.getFamilyNodes(currentFile);
                    let familyMermaidStr:string = await this.genericFamilyMermaidStr(currentFile,familyNodeArr);


                    const familyGraphContainer = graphMermaidDiv.createDiv("zk-family-graph-container");
                    const familyGraphTextDiv = familyGraphContainer.createDiv("zk-graph-link");

                    familyGraphTextDiv.empty();
                    familyGraphTextDiv.createEl('span',{text:`close relative`})

                    const familyTreeDiv = familyGraphContainer.createEl("div", {cls:"zk-graph-mermaid"});
                    
                    familyTreeDiv.id = "zk-family-tree";
                    
                    

                    let {svg} = await mermaid.render(`zk-family-tree`, `${familyMermaidStr}`);
                    familyTreeDiv.innerHTML = svg;
                    graphMermaidDiv.appendChild(familyTreeDiv);

                    let nodeGArr = familyTreeDiv.querySelectorAll("[id^='flowchart-']");
                    let nodeArr = familyTreeDiv.getElementsByClassName("nodeLabel");
                                        
                    for(let i=0;i<nodeArr.length;i++){
                        let link = document.createElement('a');
                        link.addClass("internal-link");
                        let nodePosStr = nodeGArr[i].id.split('-')[1];
                        let node = familyNodeArr.filter(n=>n.position == Number(nodePosStr))[0];
                        link.textContent = nodeArr[i].innerHTML;                       
                        nodeArr[i].textContent = "";
                        nodeArr[i].appendChild(link);
                        nodeArr[i].addEventListener("click", () => {
                            this.app.workspace.openLinkText(node.file.basename, node.file.path, 'tab');                
                        })
        
                        nodeArr[i].addEventListener(`mouseover`,(event:MouseEvent) => {
                            this.app.workspace.trigger(`hover-link`, {
                                event,
                                source: ZK_NAVIGATION,
                                hoverParent: this,
                                linktext: node.file.basename,
                                targetEl: link,
                                sourcePath: node.file.path,
                            })
                        }); 
                    }
                }
                
                if(this.plugin.settings.InlinksGraphToggle == true){

                    let inlinkArr:TFile[] = await this.getInlinks(currentFile);
                    let inlinkMermaidStr:string = await this.genericLinksMermaidStr(currentFile, inlinkArr, 'in');                    
                    
                    const inlinksGraphContainer = graphMermaidDiv.createDiv("zk-inlinks-graph-container");
                    const inlinksGraphTextDiv = inlinksGraphContainer.createDiv("zk-graph-text");

                    inlinksGraphTextDiv.empty();
                    inlinksGraphTextDiv.createEl('span',{text:`inlinks`});

                    const inlinksDiv = inlinksGraphContainer.createEl("div", {cls:"zk-graph-mermaid"});                    
                    inlinksDiv.id = "zk-inlinks";
                    let {svg} = await mermaid.render(`zk-inlinks`, inlinkMermaidStr);
                    inlinksDiv.innerHTML = svg;
                    graphMermaidDiv.appendChild(inlinksDiv);

                    let nodeGArr = inlinksDiv.querySelectorAll("[id^='flowchart-']");
                    let nodeArr = inlinksDiv.getElementsByClassName("nodeLabel");
                                        
                    inlinkArr.push(currentFile);
                    for(let i=0;i<nodeArr.length;i++){
                        let link = document.createElement('a');
                        link.addClass("internal-link");
                        let nodePosStr = nodeGArr[i].id.split('-')[1];
                        let node = inlinkArr[Number(nodePosStr)];
                        link.textContent = nodeArr[i].innerHTML;                       
                        nodeArr[i].textContent = "";
                        nodeArr[i].appendChild(link);
                        nodeArr[i].addEventListener("click", () => {
                            this.app.workspace.openLinkText(node.basename, node.path, 'tab');                
                        })
        
                        nodeArr[i].addEventListener(`mouseover`,(event:MouseEvent) => {
                            this.app.workspace.trigger(`hover-link`, {
                                event,
                                source: ZK_NAVIGATION,
                                hoverParent: this,
                                linktext: node.basename,
                                targetEl: link,
                                sourcePath: node.path,
                            })
                        }); 
                    }
                }
                
                if(this.plugin.settings.OutlinksGraphToggle){
                    
                    let outlinkArr:TFile[] = [];

                    if(currentFile.extension === 'md'){                        
                        outlinkArr = await this.getOutlinks(currentFile);
                    }
                    let outlinkMermaidStr:string = await this.genericLinksMermaidStr(currentFile, outlinkArr, 'out');                    
                    
                    const outlinksGraphContainer = graphMermaidDiv.createDiv("zk-outlinks-graph-container");
                    const outlinksGraphTextDiv = outlinksGraphContainer.createDiv("zk-graph-text");

                    outlinksGraphTextDiv.empty();
                    outlinksGraphTextDiv.createEl('span',{text:`outlinks`})                    
                    
                    const outlinksDiv = outlinksGraphContainer.createEl("div", {cls:"zk-graph-mermaid"});
                    outlinksDiv.id = "zk-outlinks";
                    let {svg} = await mermaid.render(`zk-outlinks`, outlinkMermaidStr);
                    outlinksDiv.innerHTML = svg;
                    graphMermaidDiv.appendChild(outlinksDiv);

                    let nodeGArr = outlinksDiv.querySelectorAll("[id^='flowchart-']");
                    let nodeArr = outlinksDiv.getElementsByClassName("nodeLabel");
                    outlinkArr.push(currentFile);
                    for(let i=0;i<nodeArr.length;i++){
                        let link = document.createElement('a');
                        link.addClass("internal-link");
                        let nodePosStr = nodeGArr[i].id.split('-')[1];
                        let node = outlinkArr[Number(nodePosStr)];
                        link.textContent = nodeArr[i].innerHTML;                       
                        nodeArr[i].textContent = "";
                        nodeArr[i].appendChild(link);
                        nodeArr[i].addEventListener("click", () => {
                            this.app.workspace.openLinkText(node.basename, node.path, 'tab');                
                        })
        
                        nodeArr[i].addEventListener(`mouseover`,(event:MouseEvent) => {
                            this.app.workspace.trigger(`hover-link`, {
                                event,
                                source: ZK_NAVIGATION,
                                hoverParent: this,
                                linktext: node.basename,
                                targetEl: link,
                                sourcePath: node.path,
                            })
                        }); 
                    }
                }

            }
        }

        const refresh = debounce(refresh_graph, 300, true);

        refresh();

        this.registerEvent(this.app.workspace.on("file-open", ()=>{
            refresh();
        }));
    }

    async getFamilyNodes(currentFile:TFile){
        let familyNodeArr:ZKNode[] = [];        
        if(currentFile.path ===`${this.plugin.settings.FolderOfMainNotes}/${currentFile.name}`){
            this.MainNotes = [];
            const mainNoteFiles = this.app.vault.getMarkdownFiles() 
            .filter(f=>f.path.replace(f.name, "").startsWith(this.plugin.settings.FolderOfMainNotes));
            for(let note of mainNoteFiles){
                let IDArr = await this.ID_formatting(note.basename, []);
                let IDStr = IDArr.toString();
                
                let node:ZKNode = {
                    IDArr: IDArr,
                    IDStr: IDStr,
                    position: 0,
                    file:note,
                    title: '',
                    displayText:'',
                }

                let nodeFrontmatter = this.app.metadataCache.getFileCache(note)?.frontmatter;
            
                if(typeof nodeFrontmatter !== 'undefined' && this.plugin.settings.TitleField !== ""){
                
                    let title = nodeFrontmatter[this.plugin.settings.TitleField];
                    if(typeof title !== 'undefined'){
                        node.title = title;
                    }
                }

                switch(this.plugin.settings.NodeText){
                    case "id":
                        node.displayText = node.file.basename;
                        break;
                    case "title":
                        if(node.title == ""){
                            node.displayText = node.file.basename;
                        }else{
                            node.displayText = node.title;
                        }                    
                        break;
                    case "both":
                        node.displayText = `${node.file.basename} ${node.title}` ;
                        break;
                    default:
                        //do nothing
                }

                this.MainNotes.push(node);
            }
            
            this.MainNotes.sort((a,b) => a.IDStr.localeCompare(b.IDStr));

            for(let i=0;i<this.MainNotes.length;i++){

                this.MainNotes[i].position = i;
                
            }

            let currentNode:ZKNode = this.MainNotes.filter(n=>n.file == currentFile)[0];

            if(currentNode.IDArr.length > 1){
                let fatherArr = currentNode.IDArr.slice(0,currentNode.IDArr.length-1);

                let fatherNode = this.MainNotes
                    .find(n=>n.IDStr == fatherArr.toString());
                    
                if(fatherNode !== undefined){
                    
                    familyNodeArr = this.MainNotes.filter(n=>n.IDStr.startsWith(fatherNode.IDStr))
                                    .filter(n=>n.IDArr.length <=  currentNode.IDArr.length ||
                                        (n.IDStr.startsWith(currentNode.IDStr) && n.IDArr.length == currentNode.IDArr.length + 1)
                                    );
                    
                }else{
                    familyNodeArr = this.MainNotes.filter(n=>n.IDStr.startsWith(currentNode.IDStr)
                                            && n.IDArr.length <= currentNode.IDArr.length + 1);
                }

            }else{
                familyNodeArr = this.MainNotes.filter(n=>n.IDStr.startsWith(currentNode.IDStr)
                                            && n.IDArr.length <= currentNode.IDArr.length + 1);
            }
        }

        return familyNodeArr;
    }

    async ID_formatting(id:string, arr:string[]):Promise<string[]>{

        if(isNaN(Number(id[0]))){
            if(/^[a-zA-Z]$/.test(id[0])){
                arr.push(id[0])
                let len = id.length
                if(len === 1){
                    return arr;
                }else{
                    return this.ID_formatting(id.slice(1), arr);
                }
            }else{
                    return this.ID_formatting(id.slice(1), arr);
            }
        }else{
            let numStr = id.match(/\d+/g);
    
            if(numStr && numStr.length > 0){
                arr.push(numStr[0].padStart(4,"0"));
                let len = numStr[0].length;
                if(len < id.length){
                    return this.ID_formatting(id.slice(len), arr);
                }else{
                    return arr;
                }
            }else{
                return arr;
            }
            
        }
    }

    async getInlinks(currentFile:TFile){
        
        let inlinkArr:TFile[] = [];
        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        for(let src of Object.keys(resolvedLinks)){
            let link = resolvedLinks[src];
            for(let dest of Object.keys(link)){
                if(dest === currentFile.path){
                    let inlinkFile = this.app.vault.getFileByPath(src);
                    if(inlinkFile !== null){
                        inlinkArr.push(inlinkFile);
                    }
                    
                }
            }
        }

        return inlinkArr;

    }

    async getOutlinks(currentFile:TFile){

        
        let outlinkArr:TFile[] = [];
        const resolvedLinks = this.app.metadataCache.resolvedLinks;
        
        let outlinks: string[] = Object.keys(resolvedLinks[currentFile.path]);   

        for(let outlink of outlinks){
            let outlinkFile = this.app.vault.getFileByPath(outlink);
            if(outlinkFile !== null){
                outlinkArr.push(outlinkFile);
            }
        }

        return outlinkArr;

    }

    async genericLinksMermaidStr(currentFile:TFile, linkArr:TFile[], direction:string='in'){
        
        let mermaidStr:string = `%%{ init: { 'flowchart': { 'cruve': '' },
        'themeVariables':{ 'fontSize': '10px'}}}%% flowchart TB;\n`
        

        let currentNode = this.MainNotes.find(n=>n.file == currentFile);
        

        if(typeof currentNode !== 'undefined'){
            mermaidStr = mermaidStr + `${linkArr.length}("${currentNode.displayText}");
            style ${linkArr.length} fill:#ffa,stroke:#333,stroke-width:1px \n`;;
        }else{
            mermaidStr = mermaidStr + `${linkArr.length}("${currentFile.basename}");
            style ${linkArr.length} fill:#ffa,stroke:#333,stroke-width:1px \n`;;
        } 

        for(let i=0;i<linkArr.length;i++){
            let node = this.MainNotes.find(n=>n.file == linkArr[i]);
            if(typeof node !== 'undefined'){
                mermaidStr = mermaidStr + `${i}("${node.displayText}");\n`;
            }else{
                mermaidStr = mermaidStr + `${i}("${linkArr[i].basename}");\n`;
            }            
            mermaidStr = mermaidStr + `style ${i} fill:#fff; \n`;
            if(direction == 'in'){
                mermaidStr = mermaidStr + `${i} --> ${linkArr.length};\n`;
            }else{
                mermaidStr = mermaidStr + `${linkArr.length} --> ${i};\n`;
            }
        }

        return mermaidStr;

    }

    async genericFamilyMermaidStr(currentFile:TFile, Nodes:ZKNode[]){
        let mermaidStr:string = `%%{ init: { 'flowchart': { 'cruve': '' },
        'themeVariables':{ 'fontSize': '10px'}}}%% flowchart LR;`;

        for(let node of Nodes){            
            mermaidStr = mermaidStr + `${node.position}("${node.displayText}");\n`;                 
            
            if(node.file == currentFile){
                //黄底                
                mermaidStr = mermaidStr + `style ${node.position} fill:#ffa,stroke:#333,stroke-width:1px \n`;
            }else{
                //白底
                mermaidStr = mermaidStr + `style ${node.position} fill:#fff; \n`;
            }
    
            if(/^[a-zA-Z]$/.test(node.file.basename.slice(-1))){
                //红色虚线边
                mermaidStr = mermaidStr + `style ${node.position} stroke:#f66,stroke-width:2px,stroke-dasharray: 1 \n`;
            }            
        }

        for(let node of Nodes){
                
            let sonNodes = Nodes.filter(n=>(n.IDArr.length-1 == node.IDArr.length)
                && n.IDStr.startsWith(node.IDStr));            
            
            for(let son of sonNodes){
                
                mermaidStr = mermaidStr + `${node.position} --> ${son.position};\n`;
                
            }
        }
        
        return mermaidStr;
    }

    async onClose(){
           
    }
}
