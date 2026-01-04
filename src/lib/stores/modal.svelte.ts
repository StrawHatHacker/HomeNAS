// src/lib/stores/modal.svelte.ts
import type { Component, Snippet } from "svelte";

type ModalContent =
    | { type: 'component'; value: Component<any>; props: any; onClose?: () => void }
    | { type: 'snippet'; value: Snippet<[any]>; props: any; onClose?: () => void }
    | null;

class ModalState {
    isOpen = $state(false);
    isLoading = $state(false);
    content = $state<ModalContent>(null);

    open(value: Component<any>, props = {}, onClose?: () => void) {
        this.content = { type: 'component', value, props, onClose };
        this.isOpen = true;
    }

    openSnippet(value: Snippet<any>, props = {}, onClose?: () => void) {
        this.content = { type: 'snippet', value, props, onClose };
        this.isOpen = true;
    }

    close() {
        // Execute the callback if it exists before closing
        if (this.content?.onClose) {
            this.content.onClose();
        }
        this.isOpen = false;
        this.isLoading = false;
        this.content = null;
    }
}

export const modal = new ModalState();