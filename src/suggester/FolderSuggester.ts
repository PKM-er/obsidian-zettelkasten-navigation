<<<<<<< HEAD
import { AbstractInputSuggest, App, TAbstractFile, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {

    inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl
    }

    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        let folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder);
            }
        });

        return folders;
    }

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();

    }
}
=======
import { AbstractInputSuggest, App, TAbstractFile, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {

    inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl
    }

    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder);
            }
        });

        return folders;
    }

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();

    }
}
>>>>>>> 89f7fe04157fc44ef1370b1add74380d3746c140
