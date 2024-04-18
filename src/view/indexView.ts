import ZKNavigationPlugin from "main";
import { ButtonComponent, DropdownComponent, ItemView, Notice, TFile, WorkspaceLeaf, loadMermaid } from "obsidian";
import { indexModal } from "src/modal/indexModal";

export const ZK_INDEX_TYPE:string = "zk-index-type";
export const ZK_INDEX_VIEW:string = "zk-index-graph";

export const ZK_NAVIGATION:string = "zk-navigation";

export interface ZKNode{
    IDArr:string[];
    IDStr:string;
    position:number;
    file:TFile;
    title:string;
    displayText:string;
}

export class ZKIndexView extends ItemView{

    plugin: ZKNavigationPlugin;
    MainNotes: ZKNode[];

    constructor(leaf:WorkspaceLeaf, plugin:ZKNavigationPlugin ){
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return ZK_INDEX_TYPE;
    }
    getDisplayText(): string {
        return ZK_INDEX_VIEW;
    }

    getIcon(): string {
        return "ghost";
    }

    async mainNoteFilesInit(){
        if(this.plugin.settings.FolderOfMainNotes !== ""){
            
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

                let nodeCache = this.app.metadataCache.getFileCache(note);

                if(nodeCache !== null){
                    if(typeof nodeCache.frontmatter !== 'undefined' && this.plugin.settings.TitleField !== ""){
                
                        let title = nodeCache.frontmatter[this.plugin.settings.TitleField];
                        if(typeof title !== 'undefined'){
                            node.title = title;
                        }
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
        }        
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

    async IndexViewInterfaceInit(containerEl:HTMLElement){
        
        containerEl.empty();

        // Create Divs on indexView
        const toolbarDiv = containerEl.createDiv("zk-index-toolbar");  

        const indexMermaidDiv = containerEl.createDiv("zk-index-mermaid-container");
        indexMermaidDiv.id = "zk-index-mermaid-container";
        
        indexMermaidDiv.empty();

        this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);

        const indexButtonDiv = toolbarDiv.createDiv("zk-index-toolbar-block");
        const indexButton = new ButtonComponent(indexButtonDiv).setClass("zk-index-toolbar-button");
        indexButton.setButtonText("📖Index Book");
        indexButton.setCta();
        indexButton.onClick(() => {
            new indexModal(this.app, this.plugin, (index) => {
                this.plugin.settings.SelectIndex = index;
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
            }).open();
        });

        const startingDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        startingDiv.createEl("b", {text:"Display from : "});

        const startPoint = new DropdownComponent(startingDiv);
        startPoint
            .addOption("father", "father")
            .addOption("branch","branch")
            .addOption("root", "root")
            .setValue(this.plugin.settings.StartingPoint)
            .onChange((StartPoint) => {
                this.plugin.settings.StartingPoint = StartPoint;
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
            });
        
        const displayLevelDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        displayLevelDiv.createEl("b", {text:"To : "});
        const displayLevel = new DropdownComponent(displayLevelDiv);
        displayLevel
            .addOption("next", "next")
            .addOption("end","end")
            .setValue(this.plugin.settings.DisplayLevel)
            .onChange((DisplayLevel) => {
                this.plugin.settings.DisplayLevel = DisplayLevel;
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
        });

        const nodeTextDiv = toolbarDiv.createDiv("zk-index-toolbar-block");

        nodeTextDiv.createEl("b", {text:"Text : "});
        const nodeText = new DropdownComponent(nodeTextDiv);
        nodeText
            .addOption("id", "id")
            .addOption("title","title")
            .addOption("both","both")
            .setValue(this.plugin.settings.NodeText)
            .onChange((NodeText) => {
                this.plugin.settings.NodeText = NodeText;
                this.plugin.saveData(this.plugin.settings);
                this.refreshIndexMermaid(this.plugin.settings.SelectIndex, indexMermaidDiv);
                this.plugin.openGraphView();
        });

        
    }

    async onOpen() {        
        let {containerEl} = this;
        containerEl.empty();
        
        await this.mainNoteFilesInit();
       
        await this.IndexViewInterfaceInit(containerEl);
        
    }

    async refreshIndexMermaid(index:string, indexMermaidDiv:HTMLElement){

        let branchEntranceNodeArr =  await this.getBranchEntranceNode(index);

        let allShowNodes:ZKNode[] = [];
        
        await this.mainNoteFilesInit();

        indexMermaidDiv.empty();

        const indexLinkDiv = indexMermaidDiv.createDiv("zk-index-link");
        indexLinkDiv.empty();
        indexLinkDiv.createEl('span',{text:`Current Index: `});
        const indexFile = this.app.vault.getFileByPath(`${this.plugin.settings.FolderOfIndexes}/${this.plugin.settings.SelectIndex}.md`);
        if(indexFile){
            
            let link = indexLinkDiv.createEl('a',{text:indexFile.basename});
            
            link.addEventListener("click",() =>{
                this.app.workspace.openLinkText(indexFile.basename,indexFile.path,'tab');
            });
            link.addEventListener(`mouseover`,(event:MouseEvent) => {
                this.app.workspace.trigger(`hover-link`, {
                    event,
                    source: ZK_NAVIGATION,
                    hoverParent: link,
                    linktext: indexFile.basename,
                    targetEl: link,
                    sourcePath: indexFile.path,
                })
            });                   
        
            let mermaid = await loadMermaid();
            
            for(let i=0;i< branchEntranceNodeArr.length;i++){
                let branchAllNodes = await this.getBranchNodes(branchEntranceNodeArr[i]);   
                
                allShowNodes = allShowNodes.concat(branchAllNodes);        
                let branchMermaidStr = await this.genericIndexMermaidStr(branchAllNodes, branchEntranceNodeArr[i]);
                let zkGraph = indexMermaidDiv.createEl("div", {cls:"zk-index-mermaid"});
                zkGraph.id = `zk-index-mermaid-${i}`
                let {svg} = await mermaid.render(zkGraph.id, branchMermaidStr);
                zkGraph.innerHTML = svg;
                indexMermaidDiv.appendChild(zkGraph);            
            }
            let indexMermaid= document.getElementById("zk-index-mermaid-container")
                        
            if(indexMermaid !== null){

                let nodeGArr = indexMermaid.querySelectorAll("[id^='flowchart-']");
                let nodeArr = indexMermaid.getElementsByClassName("nodeLabel");
                            
                for(let i=0;i<nodeArr.length;i++){
                    let link = document.createElement('a');
                    link.addClass("internal-link");
                    let nodePosStr = nodeGArr[i].id.split('-')[1];
                    let node = allShowNodes.filter(n=>n.position == Number(nodePosStr))[0];
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
        }
    }

    async getBranchEntranceNode(index:string){

       let branchNodeArr:ZKNode[] = [];

        if(this.plugin.settings.FolderOfMainNotes == ""){
            new Notice("Main note folder not set!");
        }else{

            if(this.plugin.settings.FolderOfIndexes == ""){
                new Notice("Index folder not set!");
            }else{

                const indexFile = this.app.vault.getFileByPath(`${this.plugin.settings.FolderOfIndexes}/${index}.md`);
                
                if(indexFile !== null){
                    const resolvedLinks = this.app.metadataCache.resolvedLinks;
                    let frontLinks: string[] = Object.keys(resolvedLinks[indexFile.path])
                    .filter(l=>l.endsWith("md"));                

                    if(frontLinks.length > 0){
                        for(let link of frontLinks){
                            let branchFile = this.app.vault.getFileByPath(link);  

                            if(branchFile){
                                let nodes = this.MainNotes.filter(l=>l.file.path == branchFile?.path);                       
                                if(nodes.length > 0){
                                    branchNodeArr.push(nodes[0]);
                                }
                            }
                        }
                    } 
                }  
               
                if(branchNodeArr.length == 0){
                    new Notice(`Index: "${index}" has no valid branch`);
                }    
            }              
        }
        
        return branchNodeArr;
    }

    async getBranchNodes(entranceNode: ZKNode){
            
        let branchNodes:ZKNode[] = [];
        let startNode = entranceNode;
        
        // Starting node
        switch(this.plugin.settings.StartingPoint){
            case "root":
                let frontNodes = this.MainNotes.filter(n=>entranceNode.IDStr.startsWith(n.IDStr));
                
                if(frontNodes.length > 0){
                    startNode = frontNodes[0];                     
                
                }else{
                    new Notice("Can't find the root of the branch!");
                }

                branchNodes = this.MainNotes.filter(n=>n.IDStr.startsWith(startNode.IDStr));

                break;

            case "father":
                if(entranceNode.IDArr.length > 1){
                    let fatherArr = entranceNode.IDArr.slice(0,entranceNode.IDArr.length-1);

                    let fatherNode = this.MainNotes
                        .find(n=>n.IDStr == fatherArr.toString());
                        
                    if(typeof fatherNode !== 'undefined'){
                        startNode = fatherNode;
                        
                    }else{
                        startNode = entranceNode;
                    }

                }else{
                    startNode = entranceNode;
                }
                
                // only keep the father, siblings and sons of entranceNode
                branchNodes = this.MainNotes
                    .filter(n=>n.IDStr.startsWith(startNode.IDStr))
                    .filter(n=>n.IDStr.startsWith(entranceNode.IDStr) || (n.IDArr.length <= entranceNode.IDArr.length));   
                
                break;
            default:
                branchNodes = this.MainNotes.filter(n=>n.IDStr.startsWith(entranceNode.IDStr));
                
        }

        // branch level
        if(this.plugin.settings.DisplayLevel == "next"){
            
            branchNodes = branchNodes.filter(n=>!n.IDStr.startsWith(entranceNode.IDStr) ||
                            n.IDArr.length <= entranceNode.IDArr.length + 1 );
        }       

        return branchNodes;
        
    }

    async genericIndexMermaidStr(Nodes:ZKNode[], entranceNode:ZKNode){

        //new Notice(Nodes.length.toString())
        
        let mermaidStr:string = `%%{ init: { 'flowchart': { 'cruve': '' },
        'themeVariables':{ 'fontSize': '10px'}}}%% flowchart LR;\n`;
        for(let node of Nodes){            

            mermaidStr = mermaidStr + `${node.position}("${node.displayText}");\n`;                 
            
            if(node.IDStr.startsWith(entranceNode.IDStr)){
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
                
                mermaidStr = mermaidStr + `${node.position} ---> ${son.position};\n`;
                
            }
        }
        return mermaidStr;
    }
    async onClose(){

    }

}
