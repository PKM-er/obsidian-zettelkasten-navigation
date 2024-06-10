import ZKNavigationPlugin from "main";
import { App, FuzzySuggestModal } from "obsidian";
import { ZKNode } from "src/view/indexView";


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