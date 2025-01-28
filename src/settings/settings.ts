<<<<<<< HEAD
import ZKNavigationPlugin, { NodeCommand } from "main";
import { App, ButtonComponent, ExtraButtonComponent, Notice, PluginSettingTab, setIcon, Setting } from "obsidian";
import { FolderSuggest } from "../suggester/FolderSuggester";
import { TagSuggest } from "src/suggester/TagSuggester";
import { t } from "../lang/helper";
import { FileSuggest } from "src/suggester/FileSuggester";
import { addCommandModal } from "src/modal/addCommandModal";
import ChooseIconModal from "src/modal/chooseIconModal";
import chooseCustomNameModal from "src/modal/chooseCustomNameModal";

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
        .setClass("vertical-tab-nav-item")
        .onClick(()=>{
            this.openTabSection(0,topButtonsDiv);          
        })

        const retrievalButton = new ButtonComponent(topButtonsDiv);
        retrievalButton.setButtonText(t("Retrieval"))
        .setClass("vertical-tab-nav-item")
        .onClick(()=>{
            this.openTabSection(1,topButtonsDiv);
        })

        const indexGraphButton = new ButtonComponent(topButtonsDiv);
        indexGraphButton.setButtonText(t("zk-index-graph-view"))
        .setClass("vertical-tab-nav-item")
        .onClick(()=>{
            this.openTabSection(2,topButtonsDiv);
        })

        const localGraphButton = new ButtonComponent(topButtonsDiv);
        localGraphButton.setButtonText(t("zk-local-graph-view"))
        .setClass("vertical-tab-nav-item")
        .onClick(()=>{
            this.openTabSection(3,topButtonsDiv); 
        })

        const experimentalButton = new ButtonComponent(topButtonsDiv);
        experimentalButton.setButtonText(t("experimental"))
        .setClass("vertical-tab-nav-item")
        .onClick(()=>{
            this.openTabSection(4,topButtonsDiv); 
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
        
        const MainNoteButtonDiv = retrievalDiv.createDiv("zk-local-section zk-hidden");

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
        
        
        new Setting(MainNoteButtonDiv)
            .setName(t("List length"))
            .setDesc(t("Maximum number of notes showing in Modal."))
            .addText((cb) => {
    
                cb.inputEl.placeholder = "100(defaulf)";
                cb.setValue(this.plugin.settings.maxLenMainModel.toString())
                    .onChange((value) => {
                        if(/^[1-9]\d*$/.test(value)){
                            this.plugin.settings.maxLenMainModel = Number(value);
                        }else{
                            this.plugin.settings.maxLenMainModel = 100;                        
                        }                        
                    })
                }
            );
            
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
        
        const indexButtonDiv = retrievalDiv.createDiv("zk-local-section zk-hidden");

        new Setting(indexButtonDiv)
            .setName(t("Indexes folder location"))
            .setDesc(t("index_description"))
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

        new Setting(indexButtonDiv)
            .setName(t("List length"))
            .setDesc(t("Maximum number of notes showing in Modal."))
            .addText((cb) => {
    
                cb.inputEl.placeholder = "100(defaulf)";
                cb.setValue(this.plugin.settings.maxLenIndexModel.toString())
                    .onChange((value) => {
                        if(/^[1-9]\d*$/.test(value)){
                            this.plugin.settings.maxLenIndexModel = Number(value);
                        }else{
                            this.plugin.settings.maxLenIndexModel = 100;                        
                        }                        
                    })
                }
            );

        const indexGraphView = settingTabDiv.createDiv("zk-setting-section");
            
        new Setting(indexGraphView)
            .setName(t("Index graph styles"))
            .addDropdown(options => options
                .addOption("structure", t("structure"))
                .addOption("roadmap",t("roadmap"))
                .setValue(this.plugin.settings.graphType)
                .onChange((value) => {
                    this.plugin.settings.graphType = value;
                    this.plugin.RefreshIndexViewFlag = true;
                    structureSettingDiv.addClass("zk-hidden");
                    roadmapSettingDiv.addClass("zk-hidden");
                })
            )
            .addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    if(this.plugin.settings.graphType === "structure"){
                        this.hideDiv(structureSettingDiv);
                    }else if(this.plugin.settings.graphType === "roadmap"){
                        this.hideDiv(roadmapSettingDiv);
                    }                    
                })
            })
        
        const roadmapSettingDiv = indexGraphView.createDiv("zk-local-section zk-hidden")

        new Setting(roadmapSettingDiv)
            .setName(t("Shorten the distance between adjacent nodes"))      
            .addToggle(toggle => toggle.setValue(this.plugin.settings.nodeClose)
            .onChange((value) => {
                this.plugin.settings.nodeClose = value;
                this.plugin.RefreshIndexViewFlag = true;
            })
        );
            
        const structureSettingDiv = indexGraphView.createDiv("zk-local-section zk-hidden")
       
        new Setting(structureSettingDiv)
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

        new Setting(structureSettingDiv)
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

        new Setting(structureSettingDiv)
            .setName(t("same width for siblings"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.siblingLenToggle)
                .onChange((value) => {
                    this.plugin.settings.siblingLenToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );

        new Setting(structureSettingDiv)
            .setName(t("Set red dash line for nodes with ID ends with letter"))
            .setDesc(t("In order to distinguish nodes which ID ends with letter and number"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.RedDashLine)
                .onChange((value) => {
                    this.plugin.settings.RedDashLine = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );

        new Setting(structureSettingDiv)
            .setName(t("display created time"))
            .setDesc(t("Set datetime format"))
            .addText((cb)=>{
                cb.inputEl.placeholder = "yyyy-MM-DD HH:mm";
                cb.setValue(this.plugin.settings.datetimeFormat)
                    .onChange((value) =>{
                        if(value === ""){
                            this.plugin.settings.datetimeFormat = "yyyy-MM-DD HH:mm";
                        }else{
                            this.plugin.settings.datetimeFormat = value;
                            this.plugin.RefreshIndexViewFlag = true;
                        }
                    })
            })
            .addToggle(toggle => toggle.setValue(this.plugin.settings.displayTimeToggle)
                .onChange((value) => {
                    this.plugin.settings.displayTimeToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );

        new Setting(structureSettingDiv)
            .setName(t("Fold node toggle"))
            .setDesc(t("Open the fold icon(🟡🟢)"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.FoldToggle)
                .onChange((value) => {
                    this.plugin.settings.FoldToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                })
            );
        new Setting(structureSettingDiv)
            .setName(t("Set color for nodes"))
            .addColorPicker(color => color.setValue(this.plugin.settings.nodeColor)
                .onChange((value)=>{
                    this.plugin.settings.nodeColor =  value;
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
        
        const branchToolbarDiv = indexGraphView.createDiv("zk-local-section zk-hidden")
        /*
        new Setting(branchToolbarDiv)
        .setName(t("settings"))
        */

        new Setting(branchToolbarDiv)
                .setName(t("settings"))
                .then((setting)=>{
                    const parentEl = setting.settingEl.parentElement;
                    if(parentEl){
                        parentEl.insertBefore(createDiv(), setting.settingEl);
                    }
                    const iconEl = createDiv();
                    setting.settingEl.prepend(iconEl);
                    setIcon(iconEl, "settings");
                })
                .addToggle(toggle => toggle.setValue(this.plugin.settings.settingIcon)
                    .onChange((value) =>{
                        this.plugin.settings.settingIcon = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    }) 
                )
    
        new Setting(branchToolbarDiv)
            .setName(t("export to canvas"))
            .then((setting)=>{
                const parentEl = setting.settingEl.parentElement;
                if(parentEl){
                    parentEl.insertBefore(createDiv(), setting.settingEl);
                }
                const iconEl = createDiv();
                setting.settingEl.prepend(iconEl);
                setIcon(iconEl, "layout-dashboard");
            })
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
        
        const canvasAdditionSection = branchToolbarDiv.createDiv("zk-local-section zk-hidden")
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

        if(this.plugin.settings.MainNoteButton == true){
            new Setting(branchToolbarDiv)
                .setName(t("random main note"))
                .then((setting)=>{
                    const parentEl = setting.settingEl.parentElement;
                    if(parentEl){
                        parentEl.insertBefore(createDiv(), setting.settingEl);
                    }
                    const iconEl = createDiv();
                    setting.settingEl.prepend(iconEl);
                    setIcon(iconEl, "dice-3");
                })
                .addToggle(toggle => toggle.setValue(this.plugin.settings.RandomMainNote)
                    .onChange((value) =>{
                        this.plugin.settings.RandomMainNote = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    }) 
                )
        }

        if(this.plugin.settings.IndexButton == true){
            new Setting(branchToolbarDiv)
                .setName(t("random index"))
                .then((setting)=>{
                    const parentEl = setting.settingEl.parentElement;
                    if(parentEl){
                        parentEl.insertBefore(createDiv(), setting.settingEl);
                    }
                    const iconEl = createDiv();
                    setting.settingEl.prepend(iconEl);
                    setIcon(iconEl, "dices");
                })
                .addToggle(toggle => toggle.setValue(this.plugin.settings.RandomIndex)
                    .onChange((value) =>{
                        this.plugin.settings.RandomIndex = value;
                        this.plugin.RefreshIndexViewFlag = true;
                    }) 
                )
        }

        new Setting(branchToolbarDiv)
            .setName(t("all trees"))
            .then((setting)=>{
                const parentEl = setting.settingEl.parentElement;
                if(parentEl){
                    parentEl.insertBefore(createDiv(), setting.settingEl);
                }
                const iconEl = createDiv();
                setting.settingEl.prepend(iconEl);
                setIcon(iconEl, "trees");
            })
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showAllToggle)
                .onChange((value) =>{
                    this.plugin.settings.showAllToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )
        
        new Setting(branchToolbarDiv)
            .setName(t("table view"))
            .then((setting)=>{
                const parentEl = setting.settingEl.parentElement;
                if(parentEl){
                    parentEl.insertBefore(createDiv(), setting.settingEl);
                }
                const iconEl = createDiv();
                setting.settingEl.prepend(iconEl);
                setIcon(iconEl, "table");
            })
            .addToggle(toggle => toggle.setValue(this.plugin.settings.TableView)
                .onChange((value) =>{
                    this.plugin.settings.TableView = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )     
        
        new Setting(branchToolbarDiv)
            .setName(t("list tree"))
            .then((setting)=>{
                const parentEl = setting.settingEl.parentElement;
                if(parentEl){
                    parentEl.insertBefore(createDiv(), setting.settingEl);
                }
                const iconEl = createDiv();
                setting.settingEl.prepend(iconEl);
                setIcon(iconEl, "list-tree");
            })
            .addToggle(toggle => toggle.setValue(this.plugin.settings.ListTree)
                .onChange((value) =>{
                    this.plugin.settings.ListTree = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )

        new Setting(branchToolbarDiv)
            .setName(t("History List"))
            .then((setting)=>{
                const parentEl = setting.settingEl.parentElement;
                if(parentEl){
                    parentEl.insertBefore(createDiv(), setting.settingEl);
                }
                const iconEl = createDiv();
                setting.settingEl.prepend(iconEl);
                setIcon(iconEl, "history");
            })
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
        
        new Setting(indexGraphView)
            .setName(t("play controller"))
            .setDesc(t("play_des"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.playControllerToggle)
                .onChange((value) =>{
                    this.plugin.settings.playControllerToggle = value;
                    this.plugin.RefreshIndexViewFlag = true;
                }) 
            )

        new Setting(indexGraphView)
            .setName(t("Node menu"))
            .setDesc(t("node_menu_des"))
            .addExtraButton((cb)=>{
                cb.setIcon("settings")
                .onClick(()=>{
                    this.hideDiv(nodeMenuDiv);
                })
            })
        
        const nodeMenuDiv = indexGraphView.createDiv("zk-local-section zk-hidden")

        const commandsDiv = nodeMenuDiv.createDiv();        
        this.updateNodeMenu(commandsDiv);
        
        const addCommandBtnDiv = nodeMenuDiv.createDiv("zk-center-button setting-item");
        
        const addCommandBtn = new ButtonComponent(addCommandBtnDiv);
        addCommandBtn
        .setButtonText(t("Add command"))
        .setCta()
        .onClick(async()=>{
            let command = await new addCommandModal(this.app, this.plugin).awaitSelection();
            let icon;
            if(!command.hasOwnProperty("icon")){
                icon = await new ChooseIconModal(this.app, this.plugin).awaitSelection();
            }
            let name = await new chooseCustomNameModal(this.app, command.name).awaitSelection();
            let newCommand:NodeCommand = {
                id: command.id,
                name: name || command.name,
                icon: icon ?? command.icon!,
                copyType: 0,
                active: true,
            }
            this.plugin.settings.NodeCommands.push(newCommand);
            this.updateNodeMenu(commandsDiv);
        })

        const localGraphView = settingTabDiv.createDiv("zk-setting-section");
        //new Setting(settingTabDiv).setName(t("zk-local-graph-view")).setHeading(); 
        new Setting(localGraphView)
            .setName(t("Open close-relative graph"))
            .setDesc(t("Mermaid graph to display parent, siblings and sons"))
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
        
        const familySectionDiv = localGraphView.createDiv("zk-local-section zk-hidden")

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
        
        const inlinksSectionDiv = localGraphView.createDiv("zk-local-section zk-hidden")
        
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
        
        const outlinksSectionDiv = localGraphView.createDiv("zk-local-section zk-hidden")

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

        const experimentalDiv = settingTabDiv.createDiv("zk-setting-section");
        new Setting(experimentalDiv)
            .setName(t("multiple IDs for main notes"))
            .setDesc(t("multiple IDs description"))
            .addToggle(toggle => toggle.setValue(this.plugin.settings.multiIDToggle)
                .onChange((value) => {
                    this.plugin.settings.multiIDToggle = value;
                })
            ).addExtraButton((cb)=>{
                
            cb.setIcon("settings")
            .onClick(()=>{
                this.hideDiv(multiIDDiv);                    
            })            
        })  
        
        const multiIDDiv = experimentalDiv.createDiv("zk-local-section zk-hidden")
        
        new Setting(multiIDDiv)
        .setName(t("Specify a frontmatter field(list) for multiple IDs"))
        .addText((cb) =>
            cb.setValue(this.plugin.settings.multiIDField)
                .onChange((value) => {
                    this.plugin.settings.multiIDField = value;
                })
        );

        
        this.initDiv(topButtonsDiv);

    }

    openTabSection(selectNo:number, topButtonsDiv: HTMLDivElement){
        const sections = document.getElementsByClassName("zk-setting-section");
        const buttons = topButtonsDiv.querySelectorAll('button');

        for(let i=0; i<sections.length;i++){
            sections[i].addClass("zk-hidden")

            buttons[i].removeClass("is-active"); 
        }

        sections[selectNo].removeClass("zk-hidden")
        buttons[selectNo].addClass("is-active");
        this.plugin.settings.SectionTab = selectNo;
    }

    initDiv(topButtonsDiv: HTMLDivElement){
        this.openTabSection(this.plugin.settings.SectionTab,topButtonsDiv);
    }

    hideDiv(div:HTMLDivElement){

        if(!div.classList.contains("zk-hidden")){
            div.addClass("zk-hidden");
        }else{
            div.removeClass("zk-hidden");
        }
    }

    async updateNodeMenu(nodeMenuDiv:HTMLDivElement){ 
        
        nodeMenuDiv.empty();

        const commandsLen = this.plugin.settings.NodeCommands.length;
        for(let i=0;i<commandsLen;i++){
            let command = this.plugin.settings.NodeCommands[i];
            let commandDiv = nodeMenuDiv.createEl('div',{cls:'setting-item'});
            
            new ExtraButtonComponent(commandDiv.createEl('div'))
            .setIcon(command.icon)
            .onClick(async ()=>{
                let icon = await new ChooseIconModal(this.app, this.plugin).awaitSelection();
                command.icon = icon;
                this.updateNodeMenu(nodeMenuDiv);
            })
            
            commandDiv.createEl('div',{text:command.name,cls:'command-text'});
            let copyIcon = '';
            let copyText = ''
            switch(command.copyType){
                case 1:
                    copyIcon = 'copy';
                    copyText = 'id';
                    break;
                case 2:
                    copyIcon = 'documents';
                    copyText = t('file path');
                    break;
                case 3:
                    copyIcon = 'calendar';
                    copyText = t('created time');
                    break;
                default:
                    copyIcon = 'circle-dashed';
                    copyText = t('none');
                    break;
            }

            new ExtraButtonComponent(commandDiv.createEl('div'))
            .setIcon(copyIcon)
            .setTooltip(t("auto-copy: ") + copyText)
            .onClick(async ()=>{
                command.copyType = (command.copyType + 1) % 4;
                this.updateNodeMenu(nodeMenuDiv);             
            })            

            new ExtraButtonComponent(commandDiv.createEl('div'))
            .setIcon('arrow-down')
            .onClick(async ()=>{
                if(commandsLen > 1){
                    [this.plugin.settings.NodeCommands[i],this.plugin.settings.NodeCommands[(i+1)%commandsLen]] =                     
                    [this.plugin.settings.NodeCommands[(i+1)%commandsLen], this.plugin.settings.NodeCommands[i]]
                }
                this.updateNodeMenu(nodeMenuDiv);             
            })

            new ExtraButtonComponent(commandDiv.createEl('div'))
            .setIcon('arrow-up')
            .onClick(async ()=>{
                if(commandsLen > 1){
                    [this.plugin.settings.NodeCommands[i],this.plugin.settings.NodeCommands[(i-1+commandsLen)%commandsLen]] =                     
                    [this.plugin.settings.NodeCommands[(i-1+commandsLen)%commandsLen], this.plugin.settings.NodeCommands[i]]
                }
                this.updateNodeMenu(nodeMenuDiv);                      
            })

            new ButtonComponent(commandDiv)
            .setIcon('trash').setCta()
            .setClass('mod-warning')
            .onClick(()=>{
                this.plugin.settings.NodeCommands.splice(i,1);
                this.updateNodeMenu(nodeMenuDiv);   
            })
        }
    }

    async hide() {
        if(this.plugin.RefreshIndexViewFlag === true){
            this.app.workspace.trigger("zk-navigation:refresh-index-graph");
        }
        this.plugin.saveData(this.plugin.settings);
    }
}
=======
import ZKNavigationPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
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
                    .setName("Specify a separator for splitting ID and title")
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
>>>>>>> 89f7fe04157fc44ef1370b1add74380d3746c140
