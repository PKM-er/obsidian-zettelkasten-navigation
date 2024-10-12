import { AbstractInputSuggest, App, Command } from "obsidian";

export class CommanderSuggester extends AbstractInputSuggest<Command> {

    inputEl: HTMLInputElement;
    
    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl
    }

    getSuggestions(inputStr: string): Command[] {
        const allCommands = Object.values(this.app.commands.commands);
        let commands: Command[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        allCommands.forEach((command: Command) => {
            if (
                command.name.toLowerCase().contains(lowerCaseInputStr)
            ) {
                commands.push(command);
            }
        });

        return commands;
    }

    renderSuggestion(command: Command, el: HTMLElement): void {
        el.setText(command.name);
    }

    selectSuggestion(command: Command): void {
        this.inputEl.value = command.name;
        this.inputEl.trigger("input");
        this.close();

    }
}
