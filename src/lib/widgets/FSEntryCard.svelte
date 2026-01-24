<script lang="ts">
  import {
    USER_FOLDERS_TYPES,
    type BreadCrumbsEntry,
    type FSEntries,
    type ModalState,
    type PageState,
  } from "$lib/types";
  import { FileUtil } from "$lib/utils/fileUtil";
  import type { FSEntryViewMode } from "$lib/utils/localstorageUtil";
  import { focusOnMount } from "$lib/utils/ui";
  import type { SvelteSet } from "svelte/reactivity";
  import { onMount } from "svelte";
  import Modal from "./modal.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import FolderOutlineIcon from "./icons/folderOutlineIcon.svelte";
  import FileOutlineIcon from "./icons/fileOutlineIcon.svelte";

  let {
    entry,
    selectedFiles,
    toggleSelection,
    pageState = $bindable(),
    isPageLoading,
    relativePathToCrypt,
    viewType,
    onRename,
    onDeleteClick,
    nagivateToDir,
  }: {
    entry: FSEntries[0];
    selectedFiles: SvelteSet<number>;
    toggleSelection: (id: number) => void;
    pageState: PageState;
    isPageLoading: boolean;
    relativePathToCrypt: string[];
    viewType: FSEntryViewMode;
    onRename: (fsEntryId: number, newName: string) => void;
    onDeleteClick: (ids: number[]) => void;
    nagivateToDir: (bcEntry: BreadCrumbsEntry) => void;
  } = $props();

  let isFlipped = $state(false);
  let renameValue = $state("");
  let renameModalState = $state<ModalState>("closed");
  let renameError = $state("");

  let isSelected = $derived(selectedFiles.has(entry.id));

  onMount(() => {
    renameValue = entry.name;
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isFlipped && !entry.isDir) toggleSelection(entry.id);
      if (entry.isDir) nagivateToDir({ id: entry.id, name: entry.name });
    }

    if (e.key === "f" && selectedFiles.size === 0) {
      isFlipped = !isFlipped;
    }
  }

  $effect(() => {
    if (selectedFiles.size > 0) isFlipped = false;
  });

  const rename = async (e: Event) => {
    e.preventDefault();
    try {
      if (pageState !== "loaded" || !renameValue.trim()) return;

      renameError = "";
      renameModalState = "loading";
      pageState = "loading";

      const res = await fetch("/api/fsentries", {
        method: "PUT",
        body: JSON.stringify({
          relativePath: relativePathToCrypt.join("/"),
          folderType: USER_FOLDERS_TYPES.crypt,
          oldName: entry.name,
          newName: renameValue,
          fsEntryId: entry.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message);
      }

      renameModalState = "closed";
      onRename(entry.id, renameValue);
    } catch (e) {
      if (e instanceof Error) renameError = e.message;
      else renameError = "Failed to rename file.";
      renameModalState = "open";
    } finally {
      pageState = "loaded";
    }
  };
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    {#if viewType === "grid"}
      <Card.Root
        id={entry.id.toString()}
        role="button"
        tabindex={0}
        class="group relative h-56 cursor-pointer p-0 transition-all 
               outline-none ring-offset-background
               focus-visible:ring-2 focus-visible:ring-ring
               {isSelected ? 'ring-2 ring-primary ' : 'border-transparent'}"
        onkeydown={handleKeyDown}
        onclick={() => {
          if (entry.isDir)
            nagivateToDir({
              id: entry.id,
              name: entry.name,
            });
        }}
      >
        <Checkbox
          onclick={(e) => e.stopPropagation()}
          onchange={() => toggleSelection(entry.id)}
          bind:checked={isSelected}
          class="absolute left-2 top-2 z-10 h-5 w-5 cursor-pointer opacity-50 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 checked:opacity-100
          {isSelected ? 'opacity-100' : ''}"
        />

        <Card.Content class="flex h-full flex-col p-3">
          <div
            class="h-9/20 flex w-full flex-col items-center justify-center gap-2"
          >
            {#if entry.isDir}
              <FolderOutlineIcon
                class="h-12 w-12 opacity-50 transition-all duration-200 group-hover:opacity-80"
              />
            {:else}
              <FileOutlineIcon
                class="h-12 w-12 opacity-50 transition-all duration-200 group-hover:opacity-80"
              />
            {/if}
          </div>

          <div class="h-11/20 flex flex-col justify-between gap-1">
            <p
              class="line-clamp-3 break-all text-sm font-medium"
              class:text-xs={entry.name.length > 30}
            >
              {entry.name}
            </p>

            <div class="flex flex-col gap-1 text-xs">
              {#if !entry.isDir && entry.mimeType}
                <span class="line-clamp-1 break-all text-muted-foreground">
                  {entry.mimeType}
                </span>
              {/if}

              <div class="flex items-center justify-between">
                <span class="text-xs">
                  {entry.isDir
                    ? "FOLDER"
                    : new Date(entry.modifiedAt).toLocaleDateString()}
                </span>

                {#if !entry.isDir && entry.size}
                  <span>
                    {FileUtil.sizeToReadable(entry.size)}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    {:else if viewType === "list"}
      <Card.Root
        id={entry.id.toString()}
        role="button"
        tabindex={0}
        class="group relative w-full cursor-pointer transition-all 
               outline-none ring-offset-background
               focus-visible:ring-2 focus-visible:ring-ring
               {isSelected ? 'ring-2 ring-primary ' : ''}"
        onkeydown={handleKeyDown}
        onclick={(e) => {
          e.preventDefault();
          if (entry.isDir)
            nagivateToDir({
              id: entry.id,
              name: entry.name,
            });
        }}
      >
        <Card.Content
          class="flex items-center pl-2 pr-4 lg:flex justify-between gap-2"
        >
          <div class="flex items-center justify-center">
            <Checkbox
              onclick={(e) => e.stopPropagation()}
              onchange={() => toggleSelection(entry.id)}
              bind:checked={isSelected}
              class="h-5 w-5 cursor-pointer opacity-50 duration-200 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 checked:opacity-100 {isSelected
                ? 'opacity-100'
                : ''}"
            />
          </div>

          <div class="min-w-0 flex flex-1 items-center gap-2">
            <div class="shrink-0">
              {#if entry.isDir}
                <FolderOutlineIcon
                  class="h-8 w-8 opacity-50 transition-all duration-200 group-hover:opacity-80"
                />
              {:else}
                <FileOutlineIcon
                  class="h-8 w-8 opacity-50 transition-all duration-200 group-hover:opacity-80"
                />
              {/if}
            </div>
            <div class="min-w-0">
              <span class="block truncate text-sm font-medium">
                {entry.name}
              </span>
              {#if !entry.isDir && entry.mimeType}
                <span class="block truncate text-xs text-muted-foreground">
                  {entry.mimeType}
                </span>
              {/if}
            </div>
          </div>

          <div class="text-xs flex flex-col text-end">
            <span>
              {entry.isDir
                ? "FOLDER"
                : new Date(entry.modifiedAt).toLocaleDateString()}
            </span>
            <span>
              {!entry.isDir && entry.size
                ? FileUtil.sizeToReadable(entry.size)
                : ""}
            </span>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-52">
    <ContextMenu.Label class="truncate text-sm">
      {entry.name}
    </ContextMenu.Label>
    <ContextMenu.Separator />
    <ContextMenu.Item>View</ContextMenu.Item>
    <ContextMenu.Item onclick={() => (renameModalState = "open")}>
      Rename
    </ContextMenu.Item>
    <ContextMenu.Item
      variant="destructive"
      onclick={() => onDeleteClick([entry.id])}
    >
      Delete
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>

<Modal bind:modalState={renameModalState}>
  <form onsubmit={rename} class="modal-content">
    <h2 class="modal-title">Rename {entry.name}</h2>
    <Input
      type="text"
      placeholder="New name"
      bind:value={renameValue}
      {focusOnMount}
    />
    <span class="text-destructive break-all text-xs">{renameError}</span>
    <Button disabled={isPageLoading} variant="outline" type="submit">
      Rename
    </Button>
  </form>
</Modal>
