import ZKNavigationPlugin from "main";
import { ItemView, Notice, TFile, WorkspaceLeaf, debounce, loadMermaid } from "obsidian";
import { ZKNode, ZK_NAVIGATION } from "./indexView";
import * as d3 from "d3";

export const ZK_GRAPH_TYPE: string = "zk-graph-type"
export const ZK_GRAPH_VIEW: string = "zk-local-graph"

export class ZKGraphView extends ItemView {

    plugin: ZKNavigationPlugin;
    MainNotes: ZKNode[] = [];
    mainNoteFiles: TFile[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: ZKNavigationPlugin) {
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

        let { containerEl } = this;
        containerEl.empty();

        const graphMermaidDiv = containerEl.createDiv("zk-graph-mermaid-container");

        const refresh_graph = async () => {

            const currentFile = this.app.workspace.getActiveFile();

            graphMermaidDiv.empty();

            if (currentFile !== null) {

                let mermaid = await loadMermaid();

                if (this.plugin.settings.FamilyGraphToggle == true) {

                    let familyNodeArr: ZKNode[] = await this.getFamilyNodes(currentFile);
                    let familyMermaidStr: string = await this.genericFamilyMermaidStr(currentFile, familyNodeArr);


                    const familyGraphContainer = graphMermaidDiv.createDiv("zk-family-graph-container");
                    const familyGraphTextDiv = familyGraphContainer.createDiv("zk-graph-link");

                    familyGraphTextDiv.empty();
                    familyGraphTextDiv.createEl('span', { text: `close relative` })

                    const familyTreeDiv = familyGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });

                    familyTreeDiv.id = "zk-family-tree";

                    let { svg } = await mermaid.render(`${familyTreeDiv.id}-svg`, `${familyMermaidStr}`);
                    familyTreeDiv.insertAdjacentHTML('beforeend', svg);
                    graphMermaidDiv.appendChild(familyTreeDiv);
               
                    let svgs = d3.select("[id=zk-family-tree] svg");
                    
                    svgs.each(function () {
                        var svg = d3.select(this);
                        svg.html("<g>" + svg.html() + "</g>");
                        var inner = svg.select("g");
                        var zoom = d3.zoom().on("zoom", function (event) {
                            inner.attr("transform", event.transform);
                        });
                        svg.call(zoom);
                    });

                    let nodeGArr = familyTreeDiv.querySelectorAll("[id^='flowchart-']");
                    let nodeArr = familyTreeDiv.getElementsByClassName("nodeLabel");

                    for (let i = 0; i < nodeArr.length; i++) {
                        let link = document.createElement('a');
                        link.addClass("internal-link");
                        let nodePosStr = nodeGArr[i].id.split('-')[1];
                        let node = familyNodeArr.filter(n=>n.position == Number(nodePosStr))[0];
                        link.textContent = nodeArr[i].getText();
                        nodeArr[i].textContent = "";
                        nodeArr[i].appendChild(link);
                        nodeArr[i].addEventListener("click", () => {
                            this.app.workspace.openLinkText("", node.file.path, 'tab');
                        })

                        nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                            this.app.workspace.trigger(`hover-link`, {
                                event,
                                source: ZK_NAVIGATION,
                                hoverParent: this,
                                linktext: "",
                                targetEl: link,
                                sourcePath: node.file.path,
                            })
                        });
                    }
                    
                }

                if (this.plugin.settings.InlinksGraphToggle == true) {

                    let inlinkArr: TFile[] = await this.getInlinks(currentFile);
                    let inlinkMermaidStr: string = await this.genericLinksMermaidStr(currentFile, inlinkArr, 'in');

                    const inlinksGraphContainer = graphMermaidDiv.createDiv("zk-inlinks-graph-container");
                    const inlinksGraphTextDiv = inlinksGraphContainer.createDiv("zk-graph-text");

                    inlinksGraphTextDiv.empty();
                    inlinksGraphTextDiv.createEl('span', { text: `inlinks` });

                    const inlinksDiv = inlinksGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });
                    inlinksDiv.id = "zk-inlinks";
                    let { svg } = await mermaid.render(`${inlinksDiv.id}-svg`, inlinkMermaidStr);
                    inlinksDiv.insertAdjacentHTML('beforeend', svg);
                    graphMermaidDiv.appendChild(inlinksDiv);
                    
                    let svgs = d3.select("[id=zk-inlinks] svg");
                    svgs.each(function () {
                        var svg = d3.select(this);
                        svg.html("<g>" + svg.html() + "</g>");
                        var inner = svg.select("g");
                        var zoom = d3.zoom().on("zoom", function (event) {
                            inner.attr("transform", event.transform);
                        });
                        svg.call(zoom);
                    });
                    

                    let nodeGArr = inlinksDiv.querySelectorAll("[id^='flowchart-']");
                    let nodeArr = inlinksDiv.getElementsByClassName("nodeLabel");

                    inlinkArr.push(currentFile);
                    for (let i = 0; i < nodeArr.length; i++) {
                        let link = document.createElement('a');
                        link.addClass("internal-link");
                        let nodePosStr = nodeGArr[i].id.split('-')[1];
                        let node = inlinkArr[Number(nodePosStr)];
                        link.textContent = nodeArr[i].getText();
                        nodeArr[i].textContent = "";
                        nodeArr[i].appendChild(link);
                        nodeArr[i].addEventListener("click", () => {
                            this.app.workspace.openLinkText("", node.path, 'tab');
                        })

                        nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                            this.app.workspace.trigger(`hover-link`, {
                                event,
                                source: ZK_NAVIGATION,
                                hoverParent: this,
                                linktext: "",
                                targetEl: link,
                                sourcePath: node.path,
                            })
                        });
                    }
                    
                }

                if (this.plugin.settings.OutlinksGraphToggle == true) {

                    let outlinkArr: TFile[] = [];

                    if (currentFile.extension === 'md') {
                        outlinkArr = await this.getOutlinks(currentFile);
                    }
                    let outlinkMermaidStr: string = await this.genericLinksMermaidStr(currentFile, outlinkArr, 'out');

                    const outlinksGraphContainer = graphMermaidDiv.createDiv("zk-outlinks-graph-container");
                    const outlinksGraphTextDiv = outlinksGraphContainer.createDiv("zk-graph-text");

                    outlinksGraphTextDiv.empty();
                    outlinksGraphTextDiv.createEl('span', { text: `outlinks` })

                    const outlinksDiv = outlinksGraphContainer.createEl("div", { cls: "zk-graph-mermaid" });
                    outlinksDiv.id = "zk-outlinks";
                    let { svg } = await mermaid.render(`${outlinksDiv.id}-svg`, outlinkMermaidStr);
                    outlinksDiv.insertAdjacentHTML('beforeend', svg);
                    graphMermaidDiv.appendChild(outlinksDiv);
                    
                    let svgs = d3.select("[id=zk-outlinks] svg");
                    svgs.each(function () {
                        var svg = d3.select(this);
                        svg.html("<g>" + svg.html() + "</g>");
                        var inner = svg.select("g");
                        var zoom = d3.zoom().on("zoom", function (event) {
                            inner.attr("transform", event.transform);
                        });
                        svg.call(zoom);
                    }); 
                   
                    let nodeGArr = outlinksDiv.querySelectorAll("[id^='flowchart-']");
                    let nodeArr = outlinksDiv.getElementsByClassName("nodeLabel");
                    outlinkArr.push(currentFile);
                    for (let i = 0; i < nodeArr.length; i++) {
                        let link = document.createElement('a');
                        link.addClass("internal-link");
                        let nodePosStr = nodeGArr[i].id.split('-')[1];
                        let node = outlinkArr[Number(nodePosStr)];
                        link.textContent = nodeArr[i].getText();
                        nodeArr[i].textContent = "";
                        nodeArr[i].appendChild(link);
                        nodeArr[i].addEventListener("click", () => {
                            this.app.workspace.openLinkText("", node.path, 'tab');
                        })

                        nodeArr[i].addEventListener(`mouseover`, (event: MouseEvent) => {
                            this.app.workspace.trigger(`hover-link`, {
                                event,
                                source: ZK_NAVIGATION,
                                hoverParent: this,
                                linktext: "",
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

        this.registerEvent(this.app.workspace.on("file-open", () => {
            refresh();
        }));
    }

    async getFamilyNodes(currentFile: TFile) {
        let familyNodeArr: ZKNode[] = [];
        this.MainNotes = [];

        this.mainNoteFiles = this.app.vault.getMarkdownFiles();

        if (this.plugin.settings.FolderOfMainNotes !== '') {
            this.mainNoteFiles = this.mainNoteFiles.filter(
                file => {
                    return file.path.replace(file.name, "").startsWith(this.plugin.settings.FolderOfMainNotes + '/');
                })
        }

        if (this.plugin.settings.TagOfMainNotes !== '') {

            this.mainNoteFiles = this.mainNoteFiles.filter(
                file => {
                    return this.app.metadataCache.getFileCache(file)?.frontmatter?.tags?.includes(
                        this.plugin.settings.TagOfMainNotes.substring(1)
                    );
                }
            )
        }

        for (let note of this.mainNoteFiles) {
            let IDArr: string[] = [];

            let node: ZKNode = {
                ID: '',
                IDArr: IDArr,
                IDStr: '',
                position: 0,
                file: note,
                title: '',
                displayText: '',
            }

            let nodeCache = this.app.metadataCache.getFileCache(note);

            switch (this.plugin.settings.IDFieldOption) {
                case "1":
                    node.ID = note.basename;

                    node.IDArr = await this.ID_formatting(node.ID, node.IDArr);

                    node.IDStr = IDArr.toString();
                    if (nodeCache !== null) {
                        if (typeof nodeCache.frontmatter !== 'undefined' && this.plugin.settings.TitleField !== "") {
                            let title = nodeCache.frontmatter[this.plugin.settings.TitleField];
                            if (typeof title == "string" && title.length > 0) {
                                node.title = title;
                            }
                        }
                    }
                    break;
                case "2":
                    if (nodeCache !== null) {
                        if (typeof nodeCache.frontmatter !== 'undefined' && this.plugin.settings.IDField !== "") {
                            let id = nodeCache.frontmatter[this.plugin.settings.IDField];
                            if (typeof id == "string" && id.length > 0) {
                                node.ID = id;
                                node.IDArr = await this.ID_formatting(node.ID, node.IDArr);
                                node.IDStr = node.IDArr.toString();
                                node.title = note.basename;
                            }
                        }
                    }
                    if (node.ID == '') {
                        continue;
                    }
                    break;
                case "3":
                    node.ID = note.basename.split(this.plugin.settings.Separator)[0];
                    node.IDArr = await this.ID_formatting(node.ID, node.IDArr);
                    node.IDStr = IDArr.toString();
                    if (node.ID.length < note.basename.length - 1) {
                        node.title = note.basename.substring(node.ID.length + 1);
                    }
                    break;
                default:
                // do nothing
            }

            switch (this.plugin.settings.NodeText) {
                case "id":
                    node.displayText = node.ID;
                    break;
                case "title":
                    if (node.title == "") {
                        node.displayText = node.ID;
                    } else {
                        node.displayText = node.title;
                    }
                    break;
                case "both":
                    node.displayText = `${node.ID} ${node.title}`;
                    break;
                default:
                //do nothing
            }

            this.MainNotes.push(node);
        }
        this.MainNotes.sort((a, b) => a.IDStr.localeCompare(b.IDStr));

        for (let i = 0; i < this.MainNotes.length; i++) {

            this.MainNotes[i].position = i;

        }

        let currentNode = this.MainNotes.filter(n => n.file == currentFile)[0];

        if (typeof currentNode !== 'undefined') {

            if (currentNode.IDArr.length > 1) {
                let fatherArr = currentNode.IDArr.slice(0, currentNode.IDArr.length - 1);

                let fatherNode = this.MainNotes
                    .filter(n => n.IDStr == fatherArr.toString());

                if (fatherNode.length > 0) {

                    familyNodeArr = this.MainNotes.filter(n => n.IDStr.startsWith(fatherNode[0].IDStr))
                        .filter(n => n.IDArr.length <= currentNode.IDArr.length ||
                            (n.IDStr.startsWith(currentNode.IDStr) && n.IDArr.length == currentNode.IDArr.length + 1)
                        );

                } else {
                    familyNodeArr = this.MainNotes.filter(n => n.IDStr.startsWith(currentNode.IDStr)
                        && n.IDArr.length <= currentNode.IDArr.length + 1);
                }

            } else {
                familyNodeArr = this.MainNotes.filter(n => n.IDStr.startsWith(currentNode.IDStr)
                    && n.IDArr.length <= currentNode.IDArr.length + 1);
            }
        }

        return familyNodeArr;
    }

    async ID_formatting(id: string, arr: string[]): Promise<string[]> {
        if (/^[0-9]$/.test(id[0])) {
            let numStr = id.match(/\d+/g);
            if (numStr && numStr.length > 0) {
                arr.push(numStr[0].padStart(4, "0"));
                let len = numStr[0].length;
                if (len < id.length) {
                    return await this.ID_formatting(id.slice(len), arr);
                } else {
                    return arr;
                }
            } else {
                return arr;
            }
        } else if (/^[a-zA-Z]$/.test(id[0])) {
            arr.push(id[0])
            if (id.length === 1) {
                return arr;
            } else {
                return await this.ID_formatting(id.slice(1), arr);
            }
        } else {
            if (id.length === 1) {
                return arr;
            } else {
                return await this.ID_formatting(id.slice(1), arr);
            }
        }
    }

    async getInlinks(currentFile: TFile) {

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

    async getOutlinks(currentFile: TFile) {


        let outlinkArr: TFile[] = [];
        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        let outlinks: string[] = Object.keys(resolvedLinks[currentFile.path]);

        for (let outlink of outlinks) {
            let outlinkFile = this.app.vault.getFileByPath(outlink);
            if (outlinkFile !== null) {
                outlinkArr.push(outlinkFile);
            }
        }

        return outlinkArr;

    }

    async genericLinksMermaidStr(currentFile: TFile, linkArr: TFile[], direction: string = 'in') {

        let mermaidStr: string = `%%{ init: { 'flowchart': { 'cruve': '' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart TB;\n`


        let currentNode: ZKNode[] = [];

        if (this.MainNotes.length > 0) {
            currentNode = this.MainNotes.filter(n => n.file === currentFile);
        }

        if (currentNode.length > 0) {
            mermaidStr = mermaidStr + `${linkArr.length}("${currentNode[0].displayText}");
            style ${linkArr.length} fill:#ffa,stroke:#333,stroke-width:1px \n`;;
        } else {
            mermaidStr = mermaidStr + `${linkArr.length}("${currentFile.basename}");
            style ${linkArr.length} fill:#ffa,stroke:#333,stroke-width:1px \n`;;
        }

        for (let i = 0; i < linkArr.length; i++) {
            let node = this.MainNotes.find(n => n.file == linkArr[i]);
            if (typeof node !== 'undefined') {
                mermaidStr = mermaidStr + `${i}("${node.displayText}");\n`;
            } else {
                mermaidStr = mermaidStr + `${i}("${linkArr[i].basename}");\n`;
            }
            mermaidStr = mermaidStr + `style ${i} fill:#fff; \n`;
            if (direction == 'in') {
                mermaidStr = mermaidStr + `${i} --> ${linkArr.length};\n`;
            } else {
                mermaidStr = mermaidStr + `${linkArr.length} --> ${i};\n`;
            }
        }

        return mermaidStr;

    }

    async genericFamilyMermaidStr(currentFile: TFile, Nodes: ZKNode[]) {
        let mermaidStr: string = `%%{ init: { 'flowchart': { 'cruve': '' },
        'themeVariables':{ 'fontSize': '12px'}}}%% flowchart LR;`;

        for (let node of Nodes) {
            mermaidStr = mermaidStr + `${node.position}("${node.displayText}");\n`;

            if (node.file == currentFile) {
                //黄底                
                mermaidStr = mermaidStr + `style ${node.position} fill:#ffa,stroke:#333,stroke-width:1px \n`;
            } else {
                //白底
                mermaidStr = mermaidStr + `style ${node.position} fill:#fff; \n`;
            }

            
        }

        for (let node of Nodes) {

            let sonNodes = Nodes.filter(n => (n.IDArr.length - 1 == node.IDArr.length)
                && n.IDStr.startsWith(node.IDStr) && n.ID.startsWith(node.ID));

            for (let son of sonNodes) {

                mermaidStr = mermaidStr + `${node.position} --> ${son.position};\n`;

            }
        }

        if(this.plugin.settings.RedDashLine === true){

            for (let node of Nodes){
                if (/^[a-zA-Z]$/.test(node.file.basename.slice(-1))) {
                    //红色虚线边
                    mermaidStr = mermaidStr + `style ${node.position} stroke:#f66,stroke-width:2px,stroke-dasharray: 1 \n`;
                }
            }
        }

        return mermaidStr;
    }

    async onClose() {

    }
}
