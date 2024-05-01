import { AbstractInputSuggest, App } from "obsidian";

export class TagSuggest extends AbstractInputSuggest<string> {

    inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl
    }
    getSuggestions(inputStr: string): string[] {

        // @ts-expect-error
        return Object.keys(this.app.metadataCache.getTags());
    }

    renderSuggestion(tag: string, el: HTMLElement): void {
        el.setText(tag);
    }

    selectSuggestion(tag: string): void {
        this.inputEl.value = tag;
        this.inputEl.trigger("input");
        this.close();
    }
}
