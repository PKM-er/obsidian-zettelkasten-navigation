import ZKNavigationPlugin from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { FolderSuggest } from "../suggester/FolderSuggester";
import { TagSuggest } from "src/suggester/TagSuggester";

export class ZKNavigationSettngTab extends PluginSettingTab {

    plugin: ZKNavigationPlugin

    constructor(app: App, plugin: ZKNavigationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {

        const { containerEl } = this;
        this.containerEl.empty();

        new Setting(this.containerEl).setName("ZK main notes").setHeading();
        new Setting(this.containerEl)
            .setName("Main notes folder location")
            .setDesc("Specify a folder location to identify main notes")
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder("Example: folder1/folder2")
                    .setValue(this.plugin.settings.FolderOfMainNotes)
                    .onChange((value) => {
                        this.plugin.settings.FolderOfMainNotes = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            });

        new Setting(this.containerEl)
            .setName("Main notes tag")
            .setDesc("Specify a tag to identify main notes")
            .addSearch((cb) => {
                new TagSuggest(this.app, cb.inputEl);
                cb.setValue(this.plugin.settings.TagOfMainNotes)
                    .onChange((value) => {
                        this.plugin.settings.TagOfMainNotes = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            });
        
        const IDOption = new Setting(this.containerEl)
            .setName("Note ID field options")
            .setDesc("")
            .addDropdown(options => options
                .addOption("1", "Option 1: Filename is note ID")
                .addOption("2", "Option 2: Metadata is note ID")
                .addOption("3", "Option 3: Prefix of filename is note ID")
                .setValue(this.plugin.settings.IDFieldOption)
                .onChange((value) => {
                    this.plugin.settings.IDFieldOption = value;
                    this.plugin.saveData(this.plugin.settings);
                    this.display();
                })
            )

        switch (this.plugin.settings.IDFieldOption) {
            case "1":
                new Setting(this.containerEl)
                    .setName("Specify a frontmatter field for note's title")
                    .addText((cb) =>
                        cb.setValue(this.plugin.settings.TitleField)
                            .onChange((value) => {
                                this.plugin.settings.TitleField = value;
                                this.plugin.saveData(this.plugin.settings);
                            })
                    );
                break;
            case "2":
                new Setting(this.containerEl)
                    .setName("Specify a frontmatter field for note's ID")
                    .addText((cb) =>
                        cb.setValue(this.plugin.settings.IDField)
                            .onChange((value) => {
                                this.plugin.settings.IDField = value;
                                this.plugin.saveData(this.plugin.settings);
                            })
                    );
                break;
            case "3":
                new Setting(this.containerEl)
                    .setName("Specify a separator between ID and title")
                    .addDropdown(options => options
                        .addOption(" ", `" "(blank)`)
                        .addOption("-", `"-"(hyphen)`)
                        .addOption("_", `"_"(underscore)`)
                        .setValue(this.plugin.settings.Separator)
                        .onChange((value) => {
                            this.plugin.settings.Separator = value;
                            this.plugin.saveData(this.plugin.settings);
                            this.display();
                        })
                    );
                break
            default:
            //do nothing.
        }

        new Setting(this.containerEl).setName("ZK index file").setHeading();
        new Setting(this.containerEl)
            .setName("Indexes folder location")
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder("Example: folder1/folder2")
                    .setValue(this.plugin.settings.FolderOfIndexes)
                    .onChange((value) => {
                        this.plugin.settings.FolderOfIndexes = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            });
        
        new Setting(this.containerEl).setName("zk-index-graph-view").setHeading();        

        new Setting(this.containerEl)
            .setName("Name of index button")
            .addText((cb) =>
                cb.setValue(this.plugin.settings.IndexButtonText)
                    .onChange((value) => {
                        this.plugin.settings.IndexButtonText = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            );
        
        new Setting(this.containerEl)
            .setName("Suggest mode of index modal")
            .addDropdown(options => options
                .addOption("keywordOrder", "Keyword Order")
                .addOption("fuzzySuggest", "Fuzzy Suggest")
                .setValue(this.plugin.settings.SuggestMode)
                .onChange((value) => {
                    this.plugin.settings.SuggestMode = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            )

        new Setting(this.containerEl)
            .setName("Set red dash line for nodes with ID ends with letter")
            .setDesc("In order to distinguish nodes which ID ends with letter and number")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.RedDashLine)
                .onChange((value) => {
                    this.plugin.settings.RedDashLine = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            );

        new Setting(this.containerEl)
            .setName("Fold node toggle")
            .setDesc("Open the fold icon(🟡🟢)")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.FoldToggle)
                .onChange((value) => {
                    this.plugin.settings.FoldToggle = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            );

        new Setting(this.containerEl).setName("zk-local-graph-view").setHeading(); 
        new Setting(this.containerEl)
            .setName("Open close-relative graph")
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
