// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { TFile } from "obsidian";
import { TextInputSuggest } from "./suggest";

export class TagSuggest extends TextInputSuggest<string> {
    
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
