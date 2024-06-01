import ZKNavigationPlugin from "main";
import { App, Notice, PluginSettingTab, Setting, setIcon } from "obsidian";
import { FolderSuggest } from "../suggester/FolderSuggester";
import { TagSuggest } from "src/suggester/TagSuggester";
import { t } from "../lang/helper";

export class ZKNavigationSettngTab extends PluginSettingTab {

    plugin: ZKNavigationPlugin

    constructor(app: App, plugin: ZKNavigationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {

        const { containerEl } = this;
        this.containerEl.empty();

        new Setting(this.containerEl).setName(t("ZK main notes")).setHeading();
        new Setting(this.containerEl)
            .setName(t("Main notes folder location"))
            .setDesc(t("Specify a folder location to identify main notes"))
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder(t("Example: folder1/folder2"))
                    .setValue(this.plugin.settings.FolderOfMainNotes)
                    .onChange((value) => {
                        this.plugin.settings.FolderOfMainNotes = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            });

        new Setting(this.containerEl)
            .setName(t("Main notes tag"))
            .setDesc(t("Specify a tag to identify main notes"))
            .addSearch((cb) => {
                new TagSuggest(this.app, cb.inputEl);
                cb.setValue(this.plugin.settings.TagOfMainNotes)
                    .onChange((value) => {
                        this.plugin.settings.TagOfMainNotes = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            });
        
        const IDOption = new Setting(this.containerEl)
            .setName(t("Note ID field options"))
            .addDropdown(options => options
                .addOption("1", t("Option 1: Filename is note ID"))
                .addOption("2", t("Option 2: Metadata is note ID"))
                .addOption("3", t("Option 3: Prefix of filename is note ID"))
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
                    .setName(t("Specify a frontmatter field for note's title"))
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
                    .setName(t("Specify a frontmatter field for note's ID"))
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
                    .setName(t("Specify a separator between ID and title"))
                    .addDropdown(options => options
                        .addOption(" ", t('" "(blank)'))
                        .addOption("-", t('"-"(hyphen)'))
                        .addOption("_", t('"_"(underscore)'))
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

        new Setting(this.containerEl).setName(t("ZK index file")).setHeading();
        new Setting(this.containerEl)
            .setName(t("Indexes folder location"))
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder(t("Example: folder1/folder2"))
                    .setValue(this.plugin.settings.FolderOfIndexes)
                    .onChange((value) => {
                        this.plugin.settings.FolderOfIndexes = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            });
        
        new Setting(this.containerEl).setName(t("zk-index-graph-view")).setHeading();        

        new Setting(this.containerEl)
            .setName(t("Name of index button"))
            .addText((cb) =>
                cb.setValue(this.plugin.settings.IndexButtonText)
                    .onChange((value) => {
                        this.plugin.settings.IndexButtonText = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            );
        
        new Setting(this.containerEl)
            .setName(t("Suggest mode of index modal"))
            .addDropdown(options => options
                .addOption("keywordOrder", t("Keyword Order"))
                .addOption("fuzzySuggest", t("Fuzzy Suggest"))
                .setValue(this.plugin.settings.SuggestMode)
                .onChange((value) => {
                    this.plugin.settings.SuggestMode = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            )

        new Setting(this.containerEl)
            .setName(t("Set red dash line for nodes with ID ends with letter"))
            .setDesc(t("In order to distinguish nodes which ID ends with letter and number"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.RedDashLine)
                .onChange((value) => {
                    this.plugin.settings.RedDashLine = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            );

        new Setting(this.containerEl)
            .setName(t("Fold node toggle"))
            .setDesc(t("Open the fold icon(🟡🟢)"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.FoldToggle)
                .onChange((value) => {
                    this.plugin.settings.FoldToggle = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            );
        
        new Setting(this.containerEl)
        .setName(t("Height of branch graph"))
        .setDesc(t("Enter a number to set the height of branch graph in pixels."))
        .addText((cb) => {

            cb.inputEl.placeholder = "530(defaulf)";
            cb.setValue(this.plugin.settings.HeightOfBranchGraph.toString())
                .onChange((value) => {
                    if(/^[1-9]\d*$/.test(value)){
                        this.plugin.settings.HeightOfBranchGraph = Number(value);
                    }else{
                        this.plugin.settings.HeightOfBranchGraph = 530;                        
                    }
                    this.plugin.saveData(this.plugin.settings);
                    
                })
            }
        );        

        new Setting(this.containerEl).setName(t("zk-local-graph-view")).setHeading(); 
        new Setting(this.containerEl)
            .setName(t("Open close-relative graph"))
            .setDesc(t("Mermaid graph to display father, siblings and sons"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.FamilyGraphToggle)
                .onChange((value) => {
                    this.plugin.settings.FamilyGraphToggle = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            );

        new Setting(this.containerEl)
            .setName(t("Open inlinks graph"))
            .setDesc(t("Mermaid graph to display inlinks"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.InlinksGraphToggle)
                .onChange((value) => {
                    this.plugin.settings.InlinksGraphToggle = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            );

        new Setting(this.containerEl)
            .setName(t("Open outlinks graph"))
            .setDesc(t("Mermaid graph to display outlinks"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.OutlinksGraphToggle)
                .onChange((value) => {
                    this.plugin.settings.OutlinksGraphToggle = value;
                    this.plugin.saveData(this.plugin.settings);
                })
            ).addDropdown(options => options
                .addOption("all", t("all file extension"))
                .addOption("md", t(".md only"))
                .setValue(this.plugin.settings.FileExtension)
                .onChange((value) => {
                    this.plugin.settings.FileExtension = value;
                    this.plugin.saveData(this.plugin.settings);
                    this.display();
                })
            )

    }

}
