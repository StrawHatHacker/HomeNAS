<script lang="ts">
  import { Uploader } from "$lib/stores/uploader.svelte";
  import { onMount } from "svelte";
  import WrapperHelper from "../wrapperHelper.svelte";
  import { USER_FOLDERS_TYPES, type BreadCrumbsEntry } from "$lib/types.js";

  let { data } = $props();

  let viewType = $state<"grid" | "list">("grid");
  let BreadcrumbEntries = $state<BreadCrumbsEntry[]>([]);

  let lastBreadcrumbEntry = $derived(
    BreadcrumbEntries[BreadcrumbEntries.length - 1]
  );

  onMount(() => {
    const cryptData = data.user.rootFolder.subFolders.find(
      (f) => f.name === USER_FOLDERS_TYPES.crypt
    );
    if (!cryptData) return;

    BreadcrumbEntries = [
      {
        id: cryptData.id,
        name: cryptData.name,
      },
    ];
  });

  const onFilesAdded = async (files: FileList) => {
    console.info("Trying to upload ", files.length, " files");

    const relativePathToCrypt: string[] = BreadcrumbEntries.map(
      (e) => e.name
    ).slice(1); // remove '/crypt'
    
    Uploader.queueFiles(
      files,
      relativePathToCrypt,
      lastBreadcrumbEntry.id,
      USER_FOLDERS_TYPES.crypt
    );
  };

  const navigateToDirFromBreadcrumb = (index: number) => {
    if (index < 0) return;
    BreadcrumbEntries = BreadcrumbEntries.slice(0, index + 1);
  };
</script>

{#snippet title()}
  <p>Crypt</p>
  <span class="text-xs text-(--lighter-grey)">Your unencrypted files</span>
{/snippet}

{#snippet search()}
  <input type="text" placeholder="Search" />
  <button class="btn-simple btn-square">
    <img src="/icons/search.svg" alt="Search" class="h-6 w-6" />
  </button>
{/snippet}

{#snippet content(openFileExplorer: () => void)}
  <div id="toolbar" class="w-full flex gap-2 items-stretch">
    <button class="btn-simple btn-square shrink-0" onclick={openFileExplorer}>
      <img src="/icons/upload.svg" alt="" class="h-6 w-6" />
    </button>
    <button class="btn-simple btn-square shrink-0">
      <img src="/icons/addFolder.svg" alt="" class="h-6 w-6" />
    </button>
    <div class="w-full"></div>
    <button
      class="btn-simple btn-square shrink-0"
      onclick={() => (viewType = viewType === "grid" ? "list" : "grid")}
    >
      <img
        src={viewType === "grid" ? "/icons/grid.svg" : "/icons/list.svg"}
        alt=""
        class="h-6 w-6"
      />
    </button>
  </div>
  <div id="breadcrumbs" class="flex gap-2 text-(--lighter-grey) text-sm py-4">
    {#each BreadcrumbEntries as entry, i}
      <button
        onclick={() => navigateToDirFromBreadcrumb(i)}
        class:hover:underline={i < BreadcrumbEntries.length - 1}
        class:!cursor-default={i >= BreadcrumbEntries.length - 1}
      >
        {entry.name}
      </button>
      <span class:hidden={i === BreadcrumbEntries.length - 1}>&gt;</span>
    {/each}
  </div>
{/snippet}

<WrapperHelper {title} {search} {content} {onFilesAdded} />

<style></style>
