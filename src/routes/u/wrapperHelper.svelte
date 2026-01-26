<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { isMobileOpen } from "$lib/stores/sidebar";
  import { onMount, type Snippet } from "svelte";

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
  <div class="h-18 border-b border-border p-2 flex items-center gap-2">
    <Button
      onclick={toggleMobile}
      class="md:hidden"
      variant="outline"
      size="icon-lg"
    >
      <img src="/icons/menu.svg" alt="Menu" class="h-6 w-6" />
    </Button>
    <div class="flex flex-col flex-1">
      {@render title()}
    </div>
    <form class="[&>input]:ml-auto flex-1 flex gap-2">
      {@render search()}
    </form>
  </div>
  <div
    id="main-drop-zone"
    class="w-full h-full overflow-y-auto py-4 px-2 md:px-4"
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
    background: var(--muted);
  }
</style>
