<script lang="ts">
  import type { FSEntries } from "$lib/types";
  import type { SvelteSet } from "svelte/reactivity";

  let {
    entry,
    selectedFiles,
    toggleSelection,
  }: {
    entry: FSEntries[0];
    selectedFiles: SvelteSet<number>;
    toggleSelection: (id: number) => void;
  } = $props();

  let isFlipped = $state(false);

  function handleRightClick(e: MouseEvent) {
    e.preventDefault();
    if (selectedFiles.size > 0) return;
    isFlipped = !isFlipped;
  }

  $effect(() => {
    // Flip all the cards if the user is in select "mode"
    if (selectedFiles.size > 0) isFlipped = false;
  })
</script>

<div class="perspective-1000 w-full h-56">
  <div
    role="presentation"
    class="group relative flex flex-col w-full h-full border border-(--normal-grey) hover:border-(--light-grey) duration-500 transition-all preserve-3d cursor-pointer"
    class:border-(--terminal-green)={selectedFiles.has(entry.id)}
    class:hover:border-(--terminal-green)={selectedFiles.has(entry.id)}
    class:rotate-y-180={isFlipped}
    oncontextmenu={handleRightClick}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="absolute inset-0 backface-hidden flex flex-col w-full h-full bg-black transform-front"
      onclick={() => !isFlipped && toggleSelection(entry.id)}
    >
      {#if !entry.isDir}
        <input
          type="checkbox"
          onclick={(e) => e.stopPropagation()}
          onchange={() => toggleSelection(entry.id)}
          checked={selectedFiles.has(entry.id)}
          class="absolute top-2 left-2 z-10 h-4 w-4 opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity"
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
        class="flex flex-col justify-between p-2 h-1/2 border-t border-(--normal-grey) bg-black"
      >
        <p
          class="text-sm line-clamp-2 break-all transition-colors text-(--terminal-green)"
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
            <span>{Math.round(entry.size / 1024)} KB</span>
          {/if}
        </div>
      </div>
    </div>

    <div
      class="absolute inset-0 backface-hidden rotate-y-180 bg-black p-4 flex flex-col items-start gap-2 border border-(--normal-grey) transform-back"
    >
      <p class="text-(--terminal-green) text-xs line-clamp-2">
        {entry.isDir ? "FOLDER" : ""}
        {entry.name}
      </p>

      <div class="flex flex-col gap-2 w-full">
        <button
          class="btn-simple text-sm"
          onclick={(e) => {
            e.stopPropagation();
            console.log("Rename", entry.id);
          }}
        >
          _RENAME_
        </button>
        <button
          class="btn-simple text-sm"
          onclick={(e) => {
            e.stopPropagation();
            console.log("Delete", entry.id);
          }}
        >
          _DELETE_
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .perspective-1000 {
    perspective: 1000px;
  }
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
    transform: translateZ(2px);
  }
  .transform-back {
    transform: rotateY(180deg) translateZ(2px);
  }
</style>
