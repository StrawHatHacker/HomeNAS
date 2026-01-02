<script lang="ts">
  import { Uploader } from "$lib/stores/uploader.svelte";
  import WrapperHelper from "../wrapperHelper.svelte";

  let viewType = $state<"grid" | "list">("grid");
  let BreadcrumbEntries = $state(["crypt", "test", "test2"]);

  const onFilesAdded = async (files: FileList) => {
    console.info("Trying to upload ", files.length, " files");

    Uploader.addFiles(files, { encrypted: false });

    // TODO figure out the breadcrumb and send it to the server and get them from the server
  };

  const navigateToDirFromBreadcrumb = (index: number) => {
    console.log(index);

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
    {#each BreadcrumbEntries as directory, i}
      <button
        onclick={() => navigateToDirFromBreadcrumb(i)}
        class:hover:underline={i < BreadcrumbEntries.length - 1}
        class:!cursor-default={i >= BreadcrumbEntries.length - 1}
      >
        {directory}
      </button>
      <span class:hidden={i === BreadcrumbEntries.length - 1}>/</span>
    {/each}
  </div>
{/snippet}

<WrapperHelper {title} {search} {content} {onFilesAdded} />

<style></style>
