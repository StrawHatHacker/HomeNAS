<script lang="ts">
  import { isMobileOpen } from "$lib/stores/sidebar";
  import { onMount, type Snippet } from "svelte";
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";

  import { toggleMode } from "mode-watcher";
  import { Button } from "$lib/components/ui/button/index.js";

  let {
    title,
    search,
    content,
    onFilesAdded,
  }: {
    title: Snippet;
    search: Snippet;
    content: Snippet<[() => void]>;
    onFilesAdded: (files: FileList) => Promise<void>;
  } = $props();

  let fileInput: HTMLInputElement | undefined = $state();
  let dropZone: HTMLDivElement | undefined = $state();

  const openFileExplorer = () => fileInput?.click();
  const toggleMobile = () => isMobileOpen.update((value) => !value);

  // On file input (drag & drop AND classic input)
  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) onFilesAdded(files);
  };

  // On classic input file change
  const onInputChange = (e: Event) => {
    handleFiles((e.target as HTMLInputElement).files);
  };

  onMount(() => {
    if (!dropZone) return;

    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      dropZone?.classList.add("drag-over");
    };

    const handleLeave = (e: DragEvent) => {
      e.preventDefault();
      dropZone?.classList.remove("drag-over");
    };

    const handleDrop = (e: DragEvent) => {
      handleLeave(e);
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
    };

    dropZone.addEventListener("dragover", handleDrag);
    dropZone.addEventListener("dragenter", handleDrag);
    dropZone.addEventListener("dragleave", handleLeave);
    dropZone.addEventListener("drop", handleDrop);

    return () => {
      dropZone?.removeEventListener("dragover", handleDrag);
      dropZone?.removeEventListener("dragenter", handleDrag);
      dropZone?.removeEventListener("dragleave", handleLeave);
      dropZone?.removeEventListener("drop", handleDrop);
    };
  });
</script>

<main class="flex-1 overflow-y-hidden">
  <div
    class="h-18 border-b border-(--normal-grey) px-4 flex items-center gap-2"
  >
    <button
      onclick={toggleMobile}
      class="md:hidden p-2 hover:bg-(--normal-grey) rounded-md"
    >
      <img src="/icons/menu.svg" alt="Menu" class="h-6 w-6" />
    </button>
    <div class="flex flex-col flex-1">
      {@render title()}
    </div>
    <form class="[&>input]:ml-auto flex-1 flex gap-2">
      {@render search()}
      <Button onclick={toggleMode} variant="outline" size="icon">
        <SunIcon
          class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
        />
        <MoonIcon
          class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </form>
  </div>
  <div
    id="main-drop-zone"
    class="w-full h-full overflow-y-auto p-4"
    bind:this={dropZone}
  >
    {@render content(openFileExplorer)}
    <input
      type="file"
      id="file-input"
      multiple
      hidden
      bind:this={fileInput}
      onchange={onInputChange}
    />
  </div>
</main>

<style>
  :global(#main-drop-zone.drag-over) {
    background: var(--dark-grey);
  }
</style>
