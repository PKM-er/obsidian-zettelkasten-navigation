<<<<<<< HEAD
import { AbstractInputSuggest, App } from "obsidian";

export class TagSuggest extends AbstractInputSuggest<string> {

    inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl
    }
    getSuggestions(inputStr: string): string[] {
        // @ts-expect-error
        const allTags = Object.keys(this.app.metadataCache.getTags());
        let tags: string[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        allTags.forEach((tag: string) => {
            if (
                tag.toLowerCase().contains(lowerCaseInputStr)
            ) {
                tags.push(tag);
            }
        });
        
        return tags;
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
=======
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
>>>>>>> 89f7fe04157fc44ef1370b1add74380d3746c140
