<script lang="ts">
  import type { FSEntries } from "$lib/types";
  import { FileUtil } from "$lib/utils/fileUtil";
  import type { FSEntryViewMode } from "$lib/utils/localstorageUtil";
  import type { SvelteSet } from "svelte/reactivity";

  let {
    entry,
    selectedFiles,
    toggleSelection,
    pageState = $bindable(),
    viewType,
  }: {
    entry: FSEntries[0];
    selectedFiles: SvelteSet<number>;
    toggleSelection: (id: number) => void;
    pageState: "initLoading" | "loading" | "loaded";
    viewType: FSEntryViewMode;
  } = $props();

  let isFlipped = $state(false);

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

  const rename = async (e: MouseEvent) => {
    e.stopPropagation();
    // TODO open rename modal with a callback from parent
  };
</script>

{#if viewType === "grid"}
  <div
    class="perspective-distant w-full h-56"
    class:opacity-50={pageState === "initLoading" || pageState === "loading"}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      id={entry.id.toString()}
      role="button"
      tabindex="0"
      class="group relative flex flex-col w-full h-full border transition-all duration-500 preserve-3d cursor-pointer focus:outline-none"
      class:border-(--normal-grey)={!selectedFiles.has(entry.id)}
      class:hover:border-(--light-grey)={!selectedFiles.has(entry.id)}
      class:border-white={selectedFiles.has(entry.id)}
      class:ring-2={selectedFiles.has(entry.id)}
      class:ring-white={selectedFiles.has(entry.id)}
      class:focus:ring-2={true}
      class:focus:ring-(--terminal-green)={true}
      class:focus:border-(--terminal-green)={true}
      class:rotate-y-180={isFlipped}
      oncontextmenu={handleRightClick}
      onkeydown={handleKeyDown}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="absolute inset-0 backface-hidden flex flex-col w-full h-full bg-black transform-front"
        onclick={(e) => {
          e.stopPropagation();
          // TODO show file
        }}
      >
        {#if !entry.isDir}
          <input
            type="checkbox"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onchange={() => toggleSelection(entry.id)}
            checked={selectedFiles.has(entry.id)}
            class="absolute top-2 left-2 z-10 h-4 w-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 checked:opacity-100 transition-opacity cursor-pointer"
          />
        {/if}

        <div
          class="h-1/2 w-full flex items-center justify-center flex-col overflow-hidden bg-(--darker-grey)"
        >
          {#if entry.isDir}
            <img
              src="/icons/folder.svg"
              alt="Folder"
              class="h-16 w-16 transition-transform duration-300 group-hover:scale-105"
            />
          {:else}
            <div
              class="flex flex-col items-center justify-center text-4xl font-bold text-(--light-grey) group-hover:text-(--lighter-grey) transition-colors tracking-tight"
            >
              <span>{entry.ext ?? ""}</span>
              <span class="text-xs">{entry.mimeType ?? ""}</span>
            </div>
          {/if}
        </div>

        <div
          class="flex flex-col justify-between p-2 h-1/2 border-t border-(--normal-grey) bg-black overflow-hidden"
        >
          <p
            class="text-sm line-clamp-2 wrap-break-word overflow-hidden transition-colors text-(--terminal-green)"
          >
            {entry.isDir ? entry.name : entry.baseName}
          </p>

          <div
            class="flex text-xs flex-col justify-between items-center mt-auto text-(--lighter-grey)"
          >
            <span class="uppercase">
              {entry.isDir
                ? "Folder"
                : new Date(entry.modifiedAt).toLocaleString()}
            </span>
            {#if !entry.isDir && entry.size}
              <span>{FileUtil.sizeToReadable(entry.size)}</span>
            {/if}
          </div>
        </div>
      </div>

      <div
        class="absolute inset-0 backface-hidden rotate-y-180 bg-black p-4 flex flex-col w-full items-start gap-2 border border-(--normal-grey) transform-back"
      >
        <p
          class="text-(--terminal-green) text-xs line-clamp-2 break-all w-full"
        >
          {entry.isDir ? "FOLDER" : ""}
          {entry.name}
        </p>

        <div class="flex flex-col gap-2 w-full">
          <span class="text-xs text-(--lighter-grey)">EXECUTE CMD_</span>
          <button
            class="btn-simple text-sm justify-start!"
            tabindex={isFlipped ? 0 : -1}
            onclick={rename}
            disabled={pageState === "initLoading" || pageState === "loading"}
          >
            &gt; RENAME
          </button>
          <button
            class="btn-simple text-sm justify-start!"
            tabindex={isFlipped ? 0 : -1}
            onclick={(e) => {
              e.stopPropagation();
              console.log("Delete", entry.id);
            }}
            disabled={pageState === "initLoading" || pageState === "loading"}
          >
            &gt; DELETE
          </button>
        </div>
      </div>
    </div>
  </div>
{:else if viewType === "list"}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="group border border-(--normal-grey) h-16 grid grid-cols-[4rem_1fr_14rem_6rem] items-center px-4 gap-4 hover:border-(--light-grey) transition-all duration-300 focus:ring-1 focus:ring-(--terminal-green) relative"
    tabindex="0"
    onkeydown={handleKeyDown}
  >
    {#if !entry.isDir}
      <input
        type="checkbox"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onchange={() => toggleSelection(entry.id)}
        checked={selectedFiles.has(entry.id)}
        class="absolute top-2 left-2 z-10 h-4 w-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 checked:opacity-100 transition-opacity cursor-pointer"
      />
    {/if}

    <div class="shrink-0 flex justify-center">
      {#if entry.isDir}
        <img
          src="/icons/folder.svg"
          alt="Folder"
          class="h-8 transition-transform duration-300 group-hover:scale-110"
        />
      {:else}
        <div
          class="font-bold text-(--light-grey) group-hover:text-(--lighter-grey) transition-colors tracking-tight text-center"
        >
          <span class="block">{entry.ext ?? ""}</span>
          <span class="text-xs block break-all">
            {entry.mimeType ?? ""}
          </span>
        </div>
      {/if}
    </div>

    <div class="min-w-0">
      <span class="line-clamp-2 break-all text-sm text-(--terminal-green)">
        {entry.isDir ? entry.name : entry.baseName}
      </span>
    </div>

    <div
      class="flex text-xs flex-col justify-center items-end text-right text-(--lighter-grey) whitespace-nowrap"
    >
      <span class="uppercase">
        {entry.isDir ? "Folder" : new Date(entry.modifiedAt).toLocaleString()}
      </span>
      {#if !entry.isDir && entry.size}
        <span>{FileUtil.sizeToReadable(entry.size)}</span>
      {/if}
    </div>

    <div class="flex justify-end gap-2">
      <button class="btn-simple btn-square">
        <img src="/icons/edit.svg" alt="" class="h-6 w-6" />
      </button>
      <button class="btn-simple btn-square">
        <img src="/icons/bin.svg" alt="" class="h-6 w-6" />
      </button>
    </div>
  </div>
{/if}

<style>
  .preserve-3d {
    transform-style: preserve-3d;
    position: relative;
  }
  .backface-hidden {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    /* Essential for Safari/Chrome to keep the layers distinct */
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }

  /* Separate the planes so the front doesn't block the back */
  .transform-front {
    transform: translateZ(1px);
  }
  .transform-back {
    transform: rotateY(180deg) translateZ(1px);
  }
</style>
