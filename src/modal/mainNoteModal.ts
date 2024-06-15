import ZKNavigationPlugin from "main";
import { App, FuzzySuggestModal, SuggestModal, renderMatches } from "obsidian";
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
    }

    getSuggestions(query: string):ZKNode[] {
      let mainNotes:ZKNode[] = [];
      this.query = query;
      mainNotes = this.MainNotes.filter(node => node.displayText.toLowerCase().startsWith(query.toLowerCase()));
      
      return mainNotes;
    }

    renderSuggestion(node: ZKNode, el:HTMLElement) {
      renderMatches(el, node.displayText, [[0, this.query.length]]);
    }

    onChooseSuggestion(node: ZKNode, evt: MouseEvent | KeyboardEvent) {
      this.selectZKNode = node;
      this.onSubmit(this.selectZKNode);
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