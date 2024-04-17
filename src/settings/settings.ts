import ZKNavigationPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { FolderSuggest } from "../suggester/FolderSuggester";

export class ZKNavigationSettngTab extends PluginSettingTab{

    plugin: ZKNavigationPlugin

    constructor(app:App, plugin:ZKNavigationPlugin){
        super(app, plugin);
        this.plugin = plugin;
    }    

    async display() { 
        
        const {containerEl} = this;
        this.containerEl.empty();

        containerEl.createEl("h6", {text: "ZK main notes settings"});
        new Setting(this.containerEl)
        .setName("Main notes folder location")
        .addSearch((cb) => {
            new FolderSuggest(cb.inputEl);
            cb.setPlaceholder("Example: folder1/folder2")
            .setValue(this.plugin.settings.FolderOfMainNotes)
            .onChange((new_folder) => {
                this.plugin.settings.FolderOfMainNotes = new_folder;
                this.plugin.saveData(this.plugin.settings);
            })
        });

        new Setting(this.containerEl)
        .setName("frontmatter field for note's title")
        .addText((cb) =>
            cb.setValue(this.plugin.settings.TitleField)
            .onChange((value) => {
                this.plugin.settings.TitleField = value;
                this.plugin.saveData(this.plugin.settings);
            })
        );

        containerEl.createEl("h6", {text: "ZK index file settings"});
        new Setting(this.containerEl)
        .setName("Indexes folder location")
        .addSearch((cb) => {
            new FolderSuggest(cb.inputEl);
            cb.setPlaceholder("Example: folder1/folder2")
            .setValue(this.plugin.settings.FolderOfIndexes)
            .onChange((new_folder) => {
                this.plugin.settings.FolderOfIndexes = new_folder;
                this.plugin.saveData(this.plugin.settings);                
            })
        });

        containerEl.createEl("h6", {text: "zk-local-graph-view settings"});
        new Setting(this.containerEl)
        .setName("Open close relative graph")
        .setDesc("Mermaid graph to display father, siblings and sons")
        .addToggle(toggle => toggle.setValue(this.plugin.settings.FamilyGraphToggle)
        .onChange((value) => {
            this.plugin.settings.FamilyGraphToggle = value;
            this.plugin.saveData(this.plugin.settings);
        })
        );

        new Setting(this.containerEl)
        .setName("Open inlinks graph")
        .setDesc("Mermaid graph to display inlinks")
        .addToggle(toggle => toggle.setValue(this.plugin.settings.InlinksGraphToggle)
        .onChange((value) => {
            this.plugin.settings.InlinksGraphToggle = value;
            this.plugin.saveData(this.plugin.settings);
        })
        );

        new Setting(this.containerEl)
        .setName("Open outlinks graph")
        .setDesc("Mermaid graph to display outlinks")
        .addToggle(toggle => toggle.setValue(this.plugin.settings.OutlinksGraphToggle)
        .onChange((value) => {
            this.plugin.settings.OutlinksGraphToggle = value;
            this.plugin.saveData(this.plugin.settings);
        })
        );
        
    }

}