<<<<<<< HEAD
import ZKNavigationPlugin from "main";
import { App, FuzzySuggestModal, Notice, SuggestModal, renderMatches } from "obsidian";
import { t } from "src/lang/helper";
import { ZKNode } from "src/view/indexView";

export interface ZKIndex {
  keyword: string,
  display: string,
  path: string,
}

export class indexModal extends SuggestModal<ZKIndex> {
  index: ZKIndex;
  onSubmit: (index: ZKIndex) => void;
  ALL_ZKIndex: ZKIndex[];
  plugin: ZKNavigationPlugin;
  query: string
  MainNotes: ZKNode[];

  constructor(app: App, plugin: ZKNavigationPlugin, MainNotes: ZKNode[], onSubmit: (index: ZKIndex) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.plugin = plugin;
    this.MainNotes = MainNotes;
    this.setPlaceholder(t("select an index"));
    this.limit = plugin.settings.maxLenIndexModel;
  }

  // Returns all available suggestions.
  getSuggestions(query: string): ZKIndex[] {
    this.ALL_ZKIndex = [];
    this.query = query

    const indexPath = this.plugin.settings.FolderOfIndexes;

    if (indexPath == "") {
      new Notice(t("Index folder not set!"));
    } else {

      // Get all indexes
      const indexFiles = this.app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith(indexPath + '/'));

      if (indexFiles.length == 0) {
        new Notice(`${t("No index can be found by path")} "${indexPath}"`)
      }

      // Get outlinks from index
      const resolvedLinks = this.app.metadataCache.resolvedLinks;

      for (let file of indexFiles) {
        let frontLinks: string[] = Object.keys(resolvedLinks[file.path])
          .filter(l => l.endsWith("md"));

        let outlinks:string[] = [];

        if (frontLinks.length > 0) {
          for (let link of frontLinks) {
           let file = this.app.vault.getFileByPath(link);
           if(file !== null){              
              let outlink = this.MainNotes.find(n=>n.file === file);
              if(typeof outlink !== 'undefined'){
                let count = this.MainNotes.filter(n=>n.IDStr.startsWith(outlink!.IDStr)).length
                outlinks.push(outlink.ID+` (${count.toString()})`);
              }else{
                outlinks.push(file.basename);
              }
           }
          }
        }

        this.ALL_ZKIndex.push({ keyword: file.basename, display: `【${file.basename}】: ${outlinks.toString()}`, path:file.path })
      }

      this.ALL_ZKIndex.sort(function (a, b) {
        return a['keyword'].localeCompare(b['keyword'])
      });

    }

    this.ALL_ZKIndex = this.ALL_ZKIndex.filter(i => i.keyword.toLowerCase().startsWith(query.toLowerCase()));

    return this.ALL_ZKIndex;
  }

  renderSuggestion(index: ZKIndex, el: HTMLElement) {
    //el.createEl('div', { text: index.display });
    renderMatches(el, index.display, [[0, this.query.length + 1]]);
  }

  onChooseSuggestion(index: ZKIndex, evt: MouseEvent | KeyboardEvent) {
    this.index = index;
    this.onSubmit(this.index);
  }
}

export class indexFuzzyModal extends FuzzySuggestModal<ZKIndex> {

  index: ZKIndex;
  onSubmit: (index: ZKIndex) => void;
  ALL_ZKIndex: ZKIndex[];
  plugin: ZKNavigationPlugin;
  MainNotes: ZKNode[];

  constructor(app: App, plugin: ZKNavigationPlugin, MainNotes: ZKNode[], onSubmit: (index: ZKIndex) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.plugin = plugin;
    this.MainNotes = MainNotes;
    this.setPlaceholder(t("select an index"));
    this.limit = plugin.settings.maxLenIndexModel;
  }

  getItems(): ZKIndex[] {

    this.ALL_ZKIndex = [];

    const indexPath = this.plugin.settings.FolderOfIndexes;

    if (indexPath == "") {
      new Notice(t("Index folder not set!"));
    } else {

      // Get all indexes
      const indexFiles = this.app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith(indexPath + '/'));

      if (indexFiles.length == 0) {
        new Notice(`${t("No index can be found by path")} "${indexPath}"`)
      }

      // Get outlinks from index
      const resolvedLinks = this.app.metadataCache.resolvedLinks;

      for (let file of indexFiles) {
        let frontLinks: string[] = Object.keys(resolvedLinks[file.path])
          .filter(l => l.endsWith("md"));

        let outlinks:string[] = [];
        
        if (frontLinks.length > 0) {
          for (let link of frontLinks) {
           let file = this.app.vault.getFileByPath(link);
           if(file !== null){              
              let outlinkArr = this.MainNotes.filter(n=>n.file === file);
              if(outlinkArr.length > 0){
                for(let outlink of outlinkArr){
                  let count = this.MainNotes.filter(n=>n.IDStr.startsWith(outlink!.IDStr)).length;
                  outlinks.push(outlink.ID+` (${count.toString()})`);
                }
              }else{
                outlinks.push(file.basename);
              }
           }
          }
        }

        this.ALL_ZKIndex.push({ keyword: file.basename, display: `【${file.basename}】: ${outlinks.toString()}`, path:file.path })
      }

      this.ALL_ZKIndex.sort(function (a, b) {
        return a['keyword'].localeCompare(b['keyword'])
      });

    }

    return this.ALL_ZKIndex;
  }

  getItemText(index: ZKIndex): string {
    return index.display;
  }

  onChooseItem(index: ZKIndex, evt: MouseEvent | KeyboardEvent) {
    
    this.index = index;
    this.onSubmit(this.index);
  }
=======
import ZKNavigationPlugin from "main";
import { App, FuzzySuggestModal, Notice, SuggestModal, renderMatches } from "obsidian";
import { ZKNode } from "src/view/indexView";

export interface ZKIndex {
  keyword: string,
  display: string
}

export class indexModal extends SuggestModal<ZKIndex> {
  index: String;
  onSubmit: (index: String) => void;
  ALL_ZKIndex: ZKIndex[];
  plugin: ZKNavigationPlugin;
  query: string
  MainNotes: ZKNode[];

  constructor(app: App, plugin: ZKNavigationPlugin, MainNotes: ZKNode[], onSubmit: (index: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.plugin = plugin;
    this.MainNotes = MainNotes;

  }

  // Returns all available suggestions.
  getSuggestions(query: string): ZKIndex[] {
    this.ALL_ZKIndex = [];
    this.query = query

    const indexPath = this.plugin.settings.FolderOfIndexes;

    if (indexPath == "") {
      new Notice("Index folder not set!");
    } else {

      // Get all indexes
      const indexFiles = this.app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith(indexPath + '/'));

      if (indexFiles.length == 0) {
        new Notice(`No index can be found by path "${indexPath}"`)
      }

      // Get outlinks from index
      const resolvedLinks = this.app.metadataCache.resolvedLinks;

      for (let file of indexFiles) {
        let frontLinks: string[] = Object.keys(resolvedLinks[file.path])
          .filter(l => l.endsWith("md"));

        let outlinks:string[] = [];

        if (frontLinks.length > 0) {
          for (let link of frontLinks) {
           let file = this.app.vault.getFileByPath(link);
           if(file !== null){              
              let outlink = this.MainNotes.find(n=>n.file === file);
              if(typeof outlink !== 'undefined'){
                outlinks.push(outlink.ID);
              }else{
                outlinks.push(file.basename);
              }
           }
          }
        }

        this.ALL_ZKIndex.push({ keyword: file.basename, display: `【${file.basename}】: ${outlinks.toString()}` })
      }

      this.ALL_ZKIndex.sort(function (a, b) {
        return a['keyword'].localeCompare(b['keyword'])
      });

    }

    this.ALL_ZKIndex = this.ALL_ZKIndex.filter(i => i.keyword.toLowerCase().startsWith(query.toLowerCase()));

    return this.ALL_ZKIndex;
  }

  renderSuggestion(index: ZKIndex, el: HTMLElement) {
    //el.createEl('div', { text: index.display });
    renderMatches(el, index.display, [[0, this.query.length + 1]]);
  }

  onChooseSuggestion(index: ZKIndex, evt: MouseEvent | KeyboardEvent) {
    this.index = index.keyword;
    this.onSubmit(this.index);
  }
}

export class indexFuzzyModal extends FuzzySuggestModal<ZKIndex> {

  index: String;
  onSubmit: (index: String) => void;
  ALL_ZKIndex: ZKIndex[];
  plugin: ZKNavigationPlugin;

  constructor(app: App, plugin: ZKNavigationPlugin, onSubmit: (index: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.plugin = plugin;
  }

  getItems(): ZKIndex[] {

    this.ALL_ZKIndex = [];

    const indexPath = this.plugin.settings.FolderOfIndexes;

    if (indexPath == "") {
      new Notice("Index folder not set!");
    } else {

      // Get all indexes
      const indexFiles = this.app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith(indexPath + '/'));

      if (indexFiles.length == 0) {
        new Notice(`No index can be found by path "${indexPath}"`)
      }

      // Get outlinks from index
      const resolvedLinks = this.app.metadataCache.resolvedLinks;

      for (let file of indexFiles) {
        let frontLinks: string[] = Object.keys(resolvedLinks[file.path])
          .filter(l => l.endsWith("md"));

        let outlinks = [];

        if (frontLinks.length > 0) {
          for (let link of frontLinks) {
            let name = this.app.vault.getFileByPath(link)?.basename;
            if (name) {
              outlinks.push(name)
            }
          }
        }

        this.ALL_ZKIndex.push({ keyword: file.basename, display: `【${file.basename}】: ${outlinks.toString()}` })
      }

      this.ALL_ZKIndex.sort(function (a, b) {
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
>>>>>>> 89f7fe04157fc44ef1370b1add74380d3746c140
}