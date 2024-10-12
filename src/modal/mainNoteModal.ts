import ZKNavigationPlugin from "main";
import { App, FuzzySuggestModal, Notice, SuggestModal, renderMatches } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNode } from "src/view/indexView";

export class mainNoteModal extends SuggestModal<ZKNode>{
    selectZKNode: ZKNode
    onSubmit: (selectZKNode: ZKNode) => void;
    plugin: ZKNavigationPlugin;
    MainNotes: ZKNode[];
    query: string;
  
    constructor(app: App, plugin: ZKNavigationPlugin, MainNotes: ZKNode[], onSubmit: (selectZKNode: ZKNode) => void) {
      super(app);
      this.onSubmit = onSubmit;
      this.plugin = plugin;
      this.MainNotes = MainNotes;
      this.setPlaceholder(t("select a main note"));
      this.limit = plugin.settings.maxLenMainModel;
    }

    getSuggestions(query: string):ZKNode[] {
      let mainNotes:ZKNode[] = [];
      this.query = query;
      mainNotes = this.MainNotes.filter(node => node.ID.toLowerCase().startsWith(query.toLowerCase()) 
      || node.title.toLowerCase().startsWith(query.toLowerCase()));
      
      return mainNotes;
    }

    renderSuggestion(node: ZKNode, el:HTMLElement) {
      let displayText = `${node.ID}: ${node.title}`;
      renderMatches(el, displayText, [[0, this.query.length]], this.getPosition(node));
    }

    onChooseSuggestion(node: ZKNode, evt: MouseEvent | KeyboardEvent) {
      this.selectZKNode = node;
      this.onSubmit(this.selectZKNode);
    }

    getPosition(node:ZKNode){
      let position:number = 0;
      if(node.ID.toLocaleLowerCase().startsWith(this.query.toLocaleLowerCase())){
        position = 0
      }else{
        position = node.ID.length + 2;
      }
      return position;
    }

}

export class mainNoteFuzzyModal extends FuzzySuggestModal<ZKNode> {

    selectZKNode: ZKNode
    onSubmit: (selectZKNode: ZKNode) => void;
    plugin: ZKNavigationPlugin;
    MainNotes: ZKNode[];
  
    constructor(app: App, plugin: ZKNavigationPlugin, MainNotes: ZKNode[], onSubmit: (selectZKNode: ZKNode) => void) {
      super(app);
      this.onSubmit = onSubmit;
      this.plugin = plugin;
      this.MainNotes = MainNotes;
      this.setPlaceholder(t("select a main note"));
      this.limit = plugin.settings.maxLenMainModel;
    }
  
    getItems(): ZKNode[] {

      return this.MainNotes;
      
    }
  
    getItemText(node: ZKNode): string {
      return `${node.ID}: ${node.title}`;
    }
  
    onChooseItem(selectZKNode: ZKNode, evt: MouseEvent | KeyboardEvent) {
      this.selectZKNode = selectZKNode;
      this.onSubmit(this.selectZKNode);
    }
  }