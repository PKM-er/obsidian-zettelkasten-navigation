import ZKNavigationPlugin from "main";
import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import { FolderSuggest } from "../suggester/FolderSuggester";
import { TagSuggest } from "src/suggester/TagSuggester";
import { t } from "../lang/helper";
import { FileSuggest } from "src/suggester/FileSuggester";

export class ZKNavigationSettngTab extends PluginSettingTab {

    plugin: ZKNavigationPlugin

    constructor(app: App, plugin: ZKNavigationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display() {
        
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h1", {text: "Zettelkasten Navigation"});
        
        const settingTabDiv = containerEl.createDiv("zk-setting-tab");

        const topButtonsDiv = settingTabDiv.createDiv("top-buttons-div");

        const mainNoteButton = new ButtonComponent(topButtonsDiv);
        mainNoteButton.setButtonText(t("ZK main notes"))
        .onClick(()=>{
            this.openTabSection(0,topButtonsDiv);          
        })

        const retrievalButton = new ButtonComponent(topButtonsDiv);
        retrievalButton.setButtonText(t("Retrieval"))
        .onClick(()=>{
            this.openTabSection(1,topButtonsDiv);
        })

        const indexGraphButton = new ButtonComponent(topButtonsDiv);
        indexGraphButton.setButtonText(t("zk-index-graph-view"))
        .onClick(()=>{
            this.openTabSection(2,topButtonsDiv);
        })

        const localGraphButton = new ButtonComponent(topButtonsDiv);
        localGraphButton.setButtonText(t("zk-local-graph-view"))
        .onClick(()=>{
            this.openTabSection(3,topButtonsDiv); 
        })

        const mainNotesDiv = settingTabDiv.createDiv("zk-setting-section");
        //new Setting(settingTabDiv).setName(t("ZK main notes")).setHeading();
        new Setting(mainNotesDiv)
            .setName(t("Main notes folder location"))
            .setDesc(t("Specify a folder location to identify main notes"))
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder(t("Example: folder1/folder2"))
                    .setValue(this.plugin.settings.FolderOfMainNotes)
                    .onChange((value) => {
                        this.plugin.settings.FolderOfMainNotes = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    })
            });

        new Setting(mainNotesDiv)
            .setName(t("Main notes tag"))
            .setDesc(t("Specify a tag to identify main notes"))
            .addSearch((cb) => {
                new TagSuggest(this.app, cb.inputEl);
                cb.setValue(this.plugin.settings.TagOfMainNotes)
                    .onChange((value) => {
                        this.plugin.settings.TagOfMainNotes = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    })
            });
        
        const IDOption = new Setting(mainNotesDiv)
            .setName(t("Note ID field options"))
            .addDropdown(options => options
                .addOption("1", t("Option 1: Filename is note ID"))
                .addOption("2", t("Option 2: Metadata is note ID"))
                .addOption("3", t("Option 3: Prefix of filename is note ID"))
                .setValue(this.plugin.settings.IDFieldOption)
                .onChange((value) => {
                    this.plugin.settings.IDFieldOption = value;
                    this.plugin.RefreshIndexViewFlag = true;
                    this.display();
                })
            );

        switch (this.plugin.settings.IDFieldOption) {
            case "1":
                new Setting(mainNotesDiv)
                    .setName(t("Specify a frontmatter field for note's title"))
                    .addText((cb) =>
                        cb.setValue(this.plugin.settings.TitleField)
                            .onChange((value) => {
                                this.plugin.settings.TitleField = value;
                                this.plugin.RefreshIndexViewFlag = true;
                            })
                    );
                break;
            case "2":
                new Setting(mainNotesDiv)
                    .setName(t("Specify a frontmatter field for note's ID"))
                    .addText((cb) =>
                        cb.setValue(this.plugin.settings.IDField)
                            .onChange((value) => {
                                this.plugin.settings.IDField = value;
                                this.plugin.RefreshIndexViewFlag = true;
                            })
                    );
                break;
            case "3":
                new Setting(mainNotesDiv)
                    .setName(t("Specify a separator between ID and title"))
                    .addDropdown(options => options
                        .addOption(" ", t('" "(blank)'))
                        .addOption("-", t('"-"(hyphen)'))
                        .addOption("_", t('"_"(underscore)'))
                        .setValue(this.plugin.settings.Separator)
                        .onChange((value) => {
                            this.plugin.settings.Separator = value;
                            this.plugin.RefreshIndexViewFlag = true;
                        })
                    );
                break
            default:
            //do nothing.
        }

        
        new Setting(mainNotesDiv)
        .setName(t("Custom created time(optional)"))
        .setDesc(t("Specify a frontmatter field for time of note created time"))
        .addText((cb) =>
            cb.setValue(this.plugin.settings.CustomCreatedTime)
                .onChange((value) => {
                    this.plugin.settings.CustomCreatedTime = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
        );

        const retrievalDiv = settingTabDiv.createDiv("zk-setting-section");
        
        new Setting(retrievalDiv)
            .setName(t("Main Notes button"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.MainNoteButton)
                .onChange((value) => {
                    this.plugin.settings.MainNoteButton = value;
                    this.plugin.RefreshIndexViewFlag = true;
                    this.display();
                })
            ).addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(MainNoteButtonDiv);                    
                })
            })
        
        const MainNoteButtonDiv = retrievalDiv.createDiv("zk-local-section");

        new Setting(MainNoteButtonDiv)
            .setName(t("Name of main note button"))
            .addText((cb) =>
                cb.setValue(this.plugin.settings.MainNoteButtonText)
                    .onChange((value) => {
                        this.plugin.settings.MainNoteButtonText = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    })
            );

        new Setting(MainNoteButtonDiv)
            .setName(t("Suggest mode of main note modal"))
            .addDropdown(options => options
                .addOption("IDOrder", t("ID Order"))
                .addOption("fuzzySuggest", t("Fuzzy Suggest"))
                .setValue(this.plugin.settings.MainNoteSuggestMode)
                .onChange((value) => {
                    this.plugin.settings.MainNoteSuggestMode = value;
                })
            )  
            
        new Setting(retrievalDiv)
            .setName(t("Index button"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.IndexButton)
                .onChange((value) => {
                    this.plugin.settings.IndexButton = value;
                    this.plugin.RefreshIndexViewFlag = true;
                    this.display();
                })
            ).addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(indexButtonDiv);
                })
            })
        
        const indexButtonDiv = retrievalDiv.createDiv("zk-local-section");

        new Setting(indexButtonDiv)
            .setName(t("Indexes folder location"))
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder(t("Example: folder1/folder2"))
                    .setValue(this.plugin.settings.FolderOfIndexes)
                    .onChange((value) => {
                        this.plugin.settings.FolderOfIndexes = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    })
            });

        new Setting(indexButtonDiv)
            .setName(t("Name of index button"))
            .addText((cb) =>
                cb.setValue(this.plugin.settings.IndexButtonText)
                    .onChange((value) => {
                        this.plugin.settings.IndexButtonText = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    })
            );
        
        new Setting(indexButtonDiv)
            .setName(t("Suggest mode of index modal"))
            .addDropdown(options => options
                .addOption("keywordOrder", t("Keyword Order"))
                .addOption("fuzzySuggest", t("Fuzzy Suggest"))
                .setValue(this.plugin.settings.SuggestMode)
                .onChange((value) => {
                    this.plugin.settings.SuggestMode = value;
                })
            )        

        const indexGraphView = settingTabDiv.createDiv("zk-setting-section");
            
        new Setting(indexGraphView)
            .setName(t("Index graph styles"))
            .addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(branchSectionDiv);
                })
            })
        
        const branchSectionDiv = indexGraphView.createDiv("zk-local-section")
       
        new Setting(branchSectionDiv)
        .setName(t("direction of graph"))
        .addDropdown(options => options
            .addOption("LR", t('"LR": feft to right'))
            .addOption("RL", t('"RL": right to left'))
            .addOption("TB", t('"TB": top to bottom'))
            .addOption("BT", t('"BT": bottom to top'))
            .setValue(this.plugin.settings.DirectionOfBranchGraph)
            .onChange((value) => {
                this.plugin.settings.DirectionOfBranchGraph = value;
                this.plugin.RefreshIndexViewFlag = true;
            })
        );

        new Setting(branchSectionDiv)
            .setName(t("siblings order"))
            .setDesc(t("siblings order description"))
            .addDropdown(options => options
                .addOption("number", t('number first'))
                .addOption("letter", t('letter first'))
                .setValue(this.plugin.settings.siblingsOrder)
                .onChange((value) => {
                    this.plugin.settings.siblingsOrder = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );

        new Setting(branchSectionDiv)
            .setName(t("Set red dash line for nodes with ID ends with letter"))
            .setDesc(t("In order to distinguish nodes which ID ends with letter and number"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.RedDashLine)
                .onChange((value) => {
                    this.plugin.settings.RedDashLine = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );

        new Setting(branchSectionDiv)
            .setName(t("Fold node toggle"))
            .setDesc(t("Open the fold icon(🟡🟢)"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.FoldToggle)
                .onChange((value) => {
                    this.plugin.settings.FoldToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );

        
        new Setting(indexGraphView)
            .setName(t("Toolbar"))
            .setDesc(t("Open the icons(commands) in the branch graph."))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.BranchToolbra)
                .onChange((value) =>{
                    this.plugin.settings.BranchToolbra = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            ).addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(branchToolbarDiv);
                });
            })        
        
        const branchToolbarDiv = indexGraphView.createDiv("zk-local-section")

        new Setting(branchToolbarDiv)
                .setName(t("settings"))
                .addToggle(toggle => toggle.setValue(this.plugin.settings.settingIcon)
                    .onChange((value) =>{
                        this.plugin.settings.settingIcon = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    }) 
                )
    
        new Setting(branchToolbarDiv)
            .setName(t("export to canvas"))
            .addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(canvasAdditionSection);
                });
            })
            .addToggle(toggle => toggle.setValue(this.plugin.settings.exportCanvas)
                .onChange((value) =>{
                    this.plugin.settings.exportCanvas = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )
        
        const canvasAdditionSection = branchToolbarDiv.createDiv("zk-local-section")
        new Setting(canvasAdditionSection)
            .setName(t("set the fixed path for exported canvas file"))
            .setDesc(t("if empty, it will create a new canvas file every time"))
                .addSearch((cb) =>{
                    new FileSuggest(this.app, cb.inputEl);
                    cb.setPlaceholder(t("Example: folder/filename.canvas"))
                    .setValue(this.plugin.settings.canvasFilePath)
                    .onChange((value) => {
                        if(value.endsWith(".canvas")){
                            this.plugin.settings.canvasFilePath = value;
                        }else{
                            this.plugin.settings.canvasFilePath = "";
                        }
                    })
                }
        )
        new Setting(canvasAdditionSection)
            .setName(t("set default width and height for cards"))
            .addText((cb) => {

                cb.inputEl.placeholder = t("card width");
                cb.setValue(this.plugin.settings.cardWidth.toString())
                    .onChange((value) => {
                        if(/^[1-9]\d*$/.test(value)){
                            this.plugin.settings.cardWidth = Number(value);
                        }else{
                            this.plugin.settings.cardWidth = 400;                        
                        }
                        
                    })
                }
            )
            .addText((cb) => {
                cb.inputEl.placeholder = t("card height");
                cb.setValue(this.plugin.settings.cardHeight.toString())
                    .onChange((value) => {
                        if(/^[1-9]\d*$/.test(value)){
                            this.plugin.settings.cardHeight = Number(value);
                        }else{
                            this.plugin.settings.cardHeight = 240;                        
                        }
                        
                    })
                }
            )

        if(this.plugin.settings.IndexButton == true){
            new Setting(branchToolbarDiv)
                .setName(t("random index"))
                .addToggle(toggle => toggle.setValue(this.plugin.settings.RandomIndex)
                    .onChange((value) =>{
                        this.plugin.settings.RandomIndex = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    }) 
                )
        }

        if(this.plugin.settings.MainNoteButton == true){
            new Setting(branchToolbarDiv)
                .setName(t("random main note"))
                .addToggle(toggle => toggle.setValue(this.plugin.settings.RandomMainNote)
                    .onChange((value) =>{
                        this.plugin.settings.RandomMainNote = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    }) 
                )
        }

        new Setting(branchToolbarDiv)
            .setName(t("all trees"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showAllToggle)
                .onChange((value) =>{
                    this.plugin.settings.showAllToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )

        new Setting(branchToolbarDiv)
            .setName(t("growing animation"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.play)
                .onChange((value) =>{
                    this.plugin.settings.play = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )
        
        new Setting(branchToolbarDiv)
            .setName(t("table view"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.TableView)
                .onChange((value) =>{
                    this.plugin.settings.TableView = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )     
        
        new Setting(branchToolbarDiv)
            .setName(t("list tree"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.ListTree)
                .onChange((value) =>{
                    this.plugin.settings.ListTree = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )

        new Setting(branchToolbarDiv)
            .setName(t("History List"))
            .setDesc(t("And set the list length"))
            .addSlider((cb) =>{
                cb.setLimits(10,50,5)
                .setValue(this.plugin.settings.HistoryMaxCount)
                .setDynamicTooltip()
                .onChange(async (value) =>{
                    this.plugin.settings.HistoryMaxCount = value;

                })
            }).addToggle(toggle => toggle.setValue(this.plugin.settings.HistoryToggle)
            .onChange((value) =>{
                this.plugin.settings.HistoryToggle = value;
                this.plugin.RefreshIndexViewFlag = true;
            }) 
        )

        const localGraphView = settingTabDiv.createDiv("zk-setting-section");
        //new Setting(settingTabDiv).setName(t("zk-local-graph-view")).setHeading(); 
        new Setting(localGraphView)
            .setName(t("Open close-relative graph"))
            .setDesc(t("Mermaid graph to display father, siblings and sons"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.FamilyGraphToggle)
                .onChange((value) => {
                    this.plugin.settings.FamilyGraphToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            ).addExtraButton((cb)=>{
                
            cb.setIcon("settings")
            .onClick(()=>{
                this.hideDiv(familySectionDiv);                    
            })            
        })  
        
        const familySectionDiv = localGraphView.createDiv("zk-local-section")
        
        new Setting(familySectionDiv)
        .setName(t("Height of close-relative graph"))
        .setDesc(t("Enter a number to set the height of graph in pixels."))
        .addText((cb) => {

            cb.inputEl.placeholder = "200(defaulf)";
            cb.setValue(this.plugin.settings.HeightOfFamilyGraph.toString())
                .onChange((value) => {
                    if(/^[1-9]\d*$/.test(value)){
                        this.plugin.settings.HeightOfFamilyGraph = Number(value);
                    }else{
                        this.plugin.settings.HeightOfFamilyGraph = 200;                        
                    }
                    this.plugin.RefreshIndexViewFlag = true;
                    
                })
            }
        );

        new Setting(familySectionDiv)
        .setName(t("direction of graph"))
        .addDropdown(options => options
            .addOption("LR", t('"LR": feft to right'))
            .addOption("RL", t('"RL": right to left'))
            .addOption("TB", t('"TB": top to bottom'))
            .addOption("BT", t('"BT": bottom to top'))
            .setValue(this.plugin.settings.DirectionOfFamilyGraph)
            .onChange((value) => {
                this.plugin.settings.DirectionOfFamilyGraph = value;
                this.plugin.RefreshIndexViewFlag = true;
            })
        );

        new Setting(localGraphView)
            .setName(t("Open inlinks graph"))
            .setDesc(t("Mermaid graph to display inlinks"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.InlinksGraphToggle)
                .onChange((value) => {
                    this.plugin.settings.InlinksGraphToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            ).addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(inlinksSectionDiv);
                })
            })
        
        const inlinksSectionDiv = localGraphView.createDiv("zk-local-section")
        
        new Setting(inlinksSectionDiv)
        .setName(t("Height of inlinks graph"))
        .setDesc(t("Enter a number to set the height of graph in pixels."))
        .addText((cb) => {

            cb.inputEl.placeholder = "200(defaulf)";
            cb.setValue(this.plugin.settings.HeightOfInlinksGraph.toString())
                .onChange((value) => {
                    if(/^[1-9]\d*$/.test(value)){
                        this.plugin.settings.HeightOfInlinksGraph = Number(value);
                    }else{
                        this.plugin.settings.HeightOfInlinksGraph = 200;                        
                    }
                    this.plugin.RefreshIndexViewFlag = true;
                    
                })
            }
        );

        new Setting(inlinksSectionDiv)
        .setName(t("direction of graph"))
        .addDropdown(options => options
            .addOption("LR", t('"LR": feft to right'))
            .addOption("RL", t('"RL": right to left'))
            .addOption("TB", t('"TB": top to bottom'))
            .addOption("BT", t('"BT": bottom to top'))
            .setValue(this.plugin.settings.DirectionOfInlinksGraph)
            .onChange((value) => {
                this.plugin.settings.DirectionOfInlinksGraph = value;
                this.plugin.RefreshIndexViewFlag = true;
            })
        );

        new Setting(localGraphView)
            .setName(t("Open outlinks graph"))
            .setDesc(t("Mermaid graph to display outlinks"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.OutlinksGraphToggle)
                .onChange((value) => {
                    this.plugin.settings.OutlinksGraphToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            ).addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(outlinksSectionDiv);
                })
            })
        
        const outlinksSectionDiv = localGraphView.createDiv("zk-local-section")
        
        new Setting(outlinksSectionDiv)
        .setName(t("Height of outlinks graph"))
        .setDesc(t("Enter a number to set the height of graph in pixels."))
        .addText((cb) => {

            cb.inputEl.placeholder = "200(defaulf)";
            cb.setValue(this.plugin.settings.HeightOfOutlinksGraph.toString())
                .onChange((value) => {
                    if(/^[1-9]\d*$/.test(value)){
                        this.plugin.settings.HeightOfOutlinksGraph = Number(value);
                    }else{
                        this.plugin.settings.HeightOfOutlinksGraph = 200;                        
                    }
                    this.plugin.RefreshIndexViewFlag = true;
                    
                })
            }
        );

        new Setting(outlinksSectionDiv)
        .setName(t("direction of graph"))
        .addDropdown(options => options
            .addOption("LR", t('"LR": feft to right'))
            .addOption("RL", t('"RL": right to left'))
            .addOption("TB", t('"TB": top to bottom'))
            .addOption("BT", t('"BT": bottom to top'))
            .setValue(this.plugin.settings.DirectionOfOutlinksGraph)
            .onChange((value) => {
                this.plugin.settings.DirectionOfOutlinksGraph = value;
                this.plugin.RefreshIndexViewFlag = true;
            })
        );
        
        new Setting(outlinksSectionDiv)
        .setName(t("Detect file extensions"))
        .addDropdown(options => options
            .addOption("all", t("all file extension"))
            .addOption("md", t(".md only"))
            .setValue(this.plugin.settings.FileExtension)
            .onChange((value) => {
                this.plugin.settings.FileExtension = value;
                this.plugin.RefreshIndexViewFlag = true;
            })
        )
        
        this.initDiv(topButtonsDiv);

    }

    openTabSection(selectNo:number, topButtonsDiv: HTMLDivElement){
        const sections = document.getElementsByClassName("zk-setting-section");
        const buttons = topButtonsDiv.querySelectorAll('button');

        for(let i=0; i<sections.length;i++){
            sections[i].setAttribute("style", "display:none");
            buttons[i].removeClass("top-button-select")
        }

        sections[selectNo].setAttribute("style", "display:block");
        buttons[selectNo].addClass("top-button-select")
        this.plugin.settings.SectionTab = selectNo;
    }

    initDiv(topButtonsDiv: HTMLDivElement){
        this.openTabSection(this.plugin.settings.SectionTab,topButtonsDiv);
    }

    hideDiv(div:HTMLDivElement){

        if(div.getAttr("style") == "display:block"){                        
            div.setAttribute("style","display:none") ;
        }else{                      
            div.setAttribute("style","display:block") ;
        }
    }

    async hide() {
        if(this.plugin.RefreshIndexViewFlag === true){
            this.app.workspace.trigger("zk-navigation:refresh-index-graph");
        }
        this.plugin.saveData(this.plugin.settings);
    }
}
