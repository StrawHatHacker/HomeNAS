<script lang="ts">
  import {
    USER_FOLDERS_TYPES,
    type BreadCrumbsEntry,
    type FSEntries,
    type ModalState,
  } from "$lib/types";
  import { FileUtil } from "$lib/utils/fileUtil";
  import type { FSEntryViewMode } from "$lib/utils/localstorageUtil";
  import { focusOnMount } from "$lib/utils/ui";
  import type { SvelteSet } from "svelte/reactivity";
  import { onMount } from "svelte";
  import Modal from "./modal.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";

  let {
    entry,
    selectedFiles,
    toggleSelection,
    pageState = $bindable(),
    relativePathToCrypt,
    viewType,
    onRename,
    onDeleteClick,
    nagivateToDir,
  }: {
    entry: FSEntries[0];
    selectedFiles: SvelteSet<number>;
    toggleSelection: (id: number) => void;
    pageState: "initLoading" | "loading" | "loaded";
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

  function handleRightClick(e: MouseEvent) {
    e.preventDefault();
    if (selectedFiles.size > 0) return;
    isFlipped = !isFlipped;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // If flipped, we don't select, we just let user interact with back buttons
      // If not flipped, we toggle selection
      if (!isFlipped && !entry.isDir) toggleSelection(entry.id);
    }

    // Allow flipping via keyboard (e.g., 'f' key or Ctrl+Enter)
    if (e.key === "f" && selectedFiles.size === 0) {
      isFlipped = !isFlipped;
    }
  }

  $effect(() => {
    // Flip all the cards to the front if the user selects a card
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

{#if viewType === "grid"}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <Card.Root
    id={entry.id.toString()}
    role="button"
    class="h-56 cursor-pointer relative p-0 overflow-clip group"
    oncontextmenu={handleRightClick}
    onkeydown={handleKeyDown}
    onclick={(e) => {
      e.stopPropagation();
      if (entry.isDir)
        nagivateToDir({
          id: entry.id,
          name: entry.name,
        });
    }}
  >
    <Checkbox
      onclick={(e) => e.stopPropagation()}
      onchange={(e) => {
      console.log(1);
      
        toggleSelection(entry.id);
      }}
      bind:checked={isSelected}
      class="absolute top-2 left-2 z-10 h-4 w-4 opacity-0 group-hover:opacity-100 group-visible:opacity-100 checked:opacity-100 transition-opacity cursor-pointer"
    />

    <Card.Content class="flex flex-col h-full p-3 ">
      <!-- Icon Section (Top Half) -->
      <div
        class="h-9/20 w-full flex items-center justify-center flex-col gap-2"
      >
        <img
          src={entry.isDir ? "/icons/folder.svg" : "/icons/fileOutlined.svg"}
          alt=""
          class="h-12 w-12 transition-all duration-300 opacity-50 group-hover:opacity-80"
        />
        <!-- TODO show proper file icon PDF for pdf, img icons for images etc -->
        <!-- {#if !entry.isDir && entry.ext}
        <span
          class="text-muted-foreground font-bold text-xs group-hover:text-(--lighter-grey) transition-all duration-300"
        >
          {entry.ext}
        </span>
      {/if} -->
      </div>

      <div class="flex flex-col justify-between h-11/20 gap-1">
        <p
          class="text-sm line-clamp-3 break-all"
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

          <div class="flex justify-between items-center">
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
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="group border border-(--normal-grey) p-2
           flex flex-col gap-2
           lg:grid lg:grid-cols-[2rem_minmax(0,1fr)_14rem_6rem] lg:items-center lg:gap-4
           hover:border-(--light-grey) transition-all duration-300
           focus-visible:ring-1 focus-visible:ring-(--terminal-green) relative cursor-pointer"
    tabindex="0"
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
    <input
      type="checkbox"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onchange={() => toggleSelection(entry.id)}
      checked={selectedFiles.has(entry.id)}
      class="absolute top-2 left-2 z-10 h-4 w-4 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 checked:opacity-100 transition-opacity cursor-pointer"
    />

    <div class="flex items-center gap-2 shrink-0">
      {#if entry.isDir}
        <img
          src="/icons/folder.svg"
          alt="Folder"
          class="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
        />
      {:else}
        <img
          src="/icons/file.svg"
          alt="File"
          class="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
        />
      {/if}

      <div class="lg:hidden min-w-0">
        <span
          class="block text-sm text-(--terminal-green) line-clamp-2 break-all"
        >
          {entry.name}
        </span>
        {#if !entry.isDir && entry.mimeType}
          <span
            class="block text-xs text-(--lighter-grey) line-clamp-2 break-all"
          >
            {entry.mimeType}
          </span>
        {/if}
      </div>
    </div>

    <div class="hidden lg:block min-w-0">
      <span
        class="block text-sm text-(--terminal-green) line-clamp-2 break-all"
      >
        {entry.name}
      </span>
      {#if !entry.isDir && entry.mimeType}
        <span
          class="block text-xs text-(--lighter-grey) line-clamp-2 break-all"
        >
          {entry.mimeType}
        </span>
      {/if}
    </div>

    <div
      class="flex text-xs text-(--lighter-grey) flex-row justify-between items-center lg:flex-col lg:items-end lg:text-right lg:whitespace-nowrap shrink-0"
    >
      <span>
        {entry.isDir ? "FOLDER" : new Date(entry.modifiedAt).toLocaleString()}
      </span>
      {#if !entry.isDir && entry.size}
        <span>{FileUtil.sizeToReadable(entry.size)}</span>
      {/if}
    </div>

    <div class="flex justify-end gap-2 shrink-0">
      <button
        class="btn btn-square"
        aria-label="Rename"
        onclick={() => (renameModalState = "open")}
        disabled={pageState === "initLoading" ||
          pageState === "loading" ||
          selectedFiles.size > 0}
      >
        <img src="/icons/edit.svg" alt="" class="h-6 w-6" />
      </button>
      <button
        class="btn btn-square"
        aria-label="Delete"
        onclick={(e) => {
          e.stopPropagation();
          onDeleteClick([entry.id]);
        }}
        disabled={pageState === "initLoading" ||
          pageState === "loading" ||
          selectedFiles.size > 0}
      >
        <img src="/icons/bin.svg" alt="" class="h-6 w-6" />
      </button>
    </div>
  </div>
{/if}

<Modal bind:modalState={renameModalState}>
  <form onsubmit={rename} class="flex flex-col gap-2">
    <h2 class="text-start">Rename: {entry.name}</h2>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      placeholder="New name"
      bind:value={renameValue}
      use:focusOnMount
    />
    <span class="text-xs text-(--clr-error) break-all">{renameError}</span>
    <!-- <Button loading={pageState === "loading"} classes="w-full">Rename</Button> -->
  </form>
</Modal>
