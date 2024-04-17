import ZKNavigationPlugin from "main";
import { App, FuzzySuggestModal, Notice} from "obsidian";

export interface ZKIndex {
  keyword: string,
  display: string
}

export class indexModal extends FuzzySuggestModal<ZKIndex> {

    index: String;
    onSubmit: (index: String) => void;
    ALL_ZKIndex: ZKIndex[];
    plugin: ZKNavigationPlugin;

    constructor(app: App, plugin: ZKNavigationPlugin, onSubmit: (index: string) => void) {
      super(app);
      this.onSubmit = onSubmit;
      this.plugin= plugin;
    }
    
    getItems(): ZKIndex[] {

      this.ALL_ZKIndex = [];

      const indexPath = this.plugin.settings.FolderOfIndexes;
      
      if( indexPath == ""){
        new Notice("Index folder not set!");
      }else{

        // Get all indexes
        const indexFiles = this.app.vault.getMarkdownFiles()
            .filter(f=>f.path.startsWith(indexPath));
        
        if(indexFiles.length == 0){
          new Notice(`No index can be found by path "${indexPath}"`)
        }
        
        // Get outlinks from index
        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        for(let file of indexFiles){
          let frontLinks: string[] = Object.keys(resolvedLinks[file.path])
          .filter(l=>l.endsWith("md"));

          let outlinks = [];        

          if(frontLinks.length > 0){
            for(let link of frontLinks){
              let name = this.app.vault.getFileByPath(link)?.basename;
              if(name){
                outlinks.push(name)
              }
            }
          }

          this.ALL_ZKIndex.push({keyword:file.basename,display:`<${file.basename[0].toUpperCase()}> 【${file.basename}】: ${outlinks.toString()}`})
        }
                
        this.ALL_ZKIndex.sort(function(a,b){
          return a['keyword'].localeCompare(b['keyword'])
        });

      }

      return this.ALL_ZKIndex;
    }
  
    getItemText(index: ZKIndex): string {
      return index.display;
    }
  
    onChooseItem(index: ZKIndex, evt: MouseEvent | KeyboardEvent) {
      this.index = index.keyword;
      this.onSubmit(this.index);
    }
  }
