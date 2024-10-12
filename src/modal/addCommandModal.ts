// copy from obsidian-commander plugin: https://github.com/phibr0/obsidian-commander

import ZKNavigationPlugin from "main";
import { Command, setIcon, FuzzySuggestModal, FuzzyMatch, App } from "obsidian";
import { t } from "src/lang/helper";

export class addCommandModal extends FuzzySuggestModal<Command>{

    plugin: ZKNavigationPlugin;
    commands: Command[];

    constructor(app:App, plugin: ZKNavigationPlugin){
        super(app);
        this.plugin = plugin;
        this.commands = Object.values(app.commands.commands);
        this.setPlaceholder(t("choose a command to add"));

        this.setInstructions([
			{
				command: "↑↓",
				purpose: t("to navigate"),
			},
			{
				command: "↵",
				purpose: t("to choose an icon"),
			},
			{
				command: "esc",
				purpose: t("to cancel"),
			},
		]);
    }

    
	public async awaitSelection(): Promise<Command> {
		this.open();
		return new Promise((resolve, reject) => {
			this.onChooseItem = (item): void => resolve(item);
			//This is wrapped inside a setTimeout, because onClose is called before onChooseItem
			this.onClose = (): number =>
				window.setTimeout(() => reject("No Command selected"), 0);
		});
	}

	public renderSuggestion(item: FuzzyMatch<Command>, el: HTMLElement): void {
		el.addClass("mod-complex");
		const content = el.createDiv({ cls: "suggestion-content" });
		content.createDiv({ cls: "suggestion-title" }).setText(item.item.name);

		//Append the icon if available
		if (item.item.icon) {
			const aux = el.createDiv({ cls: "suggestion-aux" });
			setIcon(
				aux.createSpan({ cls: "suggestion-flair" }),
				item.item.icon
			);
		}
	}

	public getItems(): Command[] {
		return this.commands;
	}

	public getItemText(item: Command): string {
		return item.name;
	}

	// This will be overriden anyway, but typescript complains if it's not declared
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
	public onChooseItem(item: Command, evt: MouseEvent | KeyboardEvent): void {}
    
}