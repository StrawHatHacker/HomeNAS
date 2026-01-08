<script lang="ts">
  import { Uploader } from "$lib/stores/uploader.svelte";
  import { onMount } from "svelte";
  import WrapperHelper from "../wrapperHelper.svelte";
  import {
    USER_FOLDERS_TYPES,
    type BreadCrumbsEntry,
    type FSEntries,
  } from "$lib/types.js";
  import { modal } from "$lib/stores/modal.svelte.js";
  import Button from "$lib/widgets/button.svelte";
  import { SvelteSet } from "svelte/reactivity";
  import FSentryCard from "$lib/widgets/FSEntryCard.svelte";
  import {
    LocalStorageUtil,
    type FSEntryViewMode,
  } from "$lib/utils/localstorageUtil.js";

  let { data } = $props();

  let createDirValue = $state("");
  let createDirError = $state("");
  let viewType = $state<FSEntryViewMode>(
    LocalStorageUtil.defaultfsEntryViewMode
  );
  let pageState = $state<"initLoading" | "loading" | "loaded">("initLoading");
  let selectedFiles = $state(new SvelteSet<number>());
  let BreadcrumbEntries = $state<BreadCrumbsEntry[]>([]);
  let fsEntries = $state<FSEntries>([]);
  let searchValue = $state("");

  let lastBreadcrumbEntry = $derived(
    BreadcrumbEntries[BreadcrumbEntries.length - 1]
  );
  let relativePathToCrypt = $derived(
    BreadcrumbEntries.map((e) => e.name).slice(1) // remove '/crypt'
  );
  let isSelectingFiles = $derived(selectedFiles.size > 0);
  let isPageLoading = $derived(
    pageState === "loading" || pageState === "initLoading"
  );

  onMount(async () => {
    viewType = LocalStorageUtil.fsEntryViewMode;

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

    await getCurrentDirData(true);
  });

  const onFilesAdded = async (files: FileList) => {
    Uploader.queueFiles(
      files,
      relativePathToCrypt,
      lastBreadcrumbEntry.id,
      USER_FOLDERS_TYPES.crypt
    );
  };

  const getCurrentDirData = async (initLoading = false) => {
    try {
      pageState = initLoading ? "initLoading" : "loading";

      const res = await fetch(
        `/api/files/dir?currentDirId=${lastBreadcrumbEntry.id}`,
        {
          method: "GET",
        }
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.message);

      fsEntries = body as FSEntries;
    } catch (e) {
      console.error(e);
    } finally {
      pageState = "loaded";
    }
  };

  const createFolder = async () => {
    try {
      if (pageState !== "loaded" || createDirValue === "") return;
      pageState = "loading";
      modal.isLoading = true;

      const res = await fetch("/api/files/dir", {
        method: "POST",
        body: JSON.stringify({
          dirName: createDirValue,
          relativePath: relativePathToCrypt,
          parentDirId: lastBreadcrumbEntry.id,
          type: USER_FOLDERS_TYPES.crypt,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message);
      }

      modal.close();
      await getCurrentDirData();
    } catch (e) {
      if (e instanceof Error) createDirError = e.message;
      else createDirError = "Failed to create directory.";
    } finally {
      pageState = "loaded";
      modal.isLoading = false;
    }
  };

  const navigateToDirFromBreadcrumb = (index: number) => {
    if (index < 0 || index === BreadcrumbEntries.length - 1) return;
    BreadcrumbEntries = BreadcrumbEntries.slice(0, index + 1);
  };

  const focusOnMount = (node: HTMLElement) => node.focus();

  const toggleSelection = (id: number) => {
    selectedFiles.has(id) ? selectedFiles.delete(id) : selectedFiles.add(id);
    selectedFiles = selectedFiles;
  };

  const selectAll = () =>
    (selectedFiles = new SvelteSet(
      fsEntries.filter((f) => !f.isDir).map((f) => f.id)
    ));
  const deselectAll = () => (selectedFiles = new SvelteSet());

  Uploader.onUploadSuccess = async (task) => {
    const areWeInThisDir = () =>
      task.relativePath.join("/") === relativePathToCrypt.join("/");

    // If we navigated elsewhere return
    if (!areWeInThisDir()) return;

    try {
      const res = await fetch(`/api/files/getBy?checksum=${task.checksum}`, {
        method: "GET",
      });
      let body = (await res.json()) as FSEntries[0];
      if (!res.ok) throw new Error((body as any).message);

      // Check again if we navigated elsewhere
      // This works because of arrow function closure
      if (!areWeInThisDir()) return;

      // Check if the file already exists (upsert)
      if (fsEntries.some((item) => item.id === body.id)) return;

      const index = fsEntries.findIndex((item) => {
        // Skip folders: If current item is a folder, we haven't reached files yet
        if (item.isDir) return false;

        // Alphabetical check: First file that comes "after" our new file is the spot
        return (
          item.name.localeCompare(body.name, undefined, {
            sensitivity: "base",
            numeric: true,
          }) > 0
        );
      });

      const indexToInsertTo = index === -1 ? fsEntries.length : index;
      fsEntries = fsEntries.toSpliced(indexToInsertTo, 0, body);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleView = () => {
    if (viewType === "list") {
      viewType = "grid";
      LocalStorageUtil.fsEntryViewMode = "grid";
    } else {
      viewType = "list";
      LocalStorageUtil.fsEntryViewMode = "list";
    }
  };
</script>

<svelte:head>
  <title>HomeNAS - Crypt</title>
</svelte:head>

{#snippet title()}
  <p>Crypt</p>
  <span class="text-xs text-(--lighter-grey)">Your unencrypted files</span>
{/snippet}

{#snippet search()}
  <input
    type="text"
    placeholder="Search"
    bind:value={searchValue}
    class="max-w-80"
  />
  <!-- <button class="btn-simple btn-square">
    <img src="/icons/search.svg" alt="Search" class="h-6 w-6" />
  </button> -->
{/snippet}

{#snippet content(openFileExplorer: () => void)}
  <div id="toolbar" class="w-full flex gap-2 items-stretch">
    {#if isSelectingFiles}
      <button
        class="btn-simple shrink-0"
        onclick={selectAll}
        disabled={isPageLoading}
      >
        Select All
      </button>
      <button
        class="btn-simple shrink-0"
        onclick={deselectAll}
        disabled={isPageLoading}
      >
        Deselect All
      </button>
    {:else}
      <button
        class="btn-simple btn-square shrink-0"
        onclick={openFileExplorer}
        disabled={isPageLoading}
      >
        <img src="/icons/upload.svg" alt="" class="h-6 w-6" />
      </button>
      <button
        class="btn-simple btn-square shrink-0"
        disabled={isPageLoading}
        onclick={() =>
          modal.openSnippet(createFolderModal, {}, () => {
            createDirValue = "";
            createDirError = "";
            pageState = "loaded";
          })}
      >
        <img src="/icons/addFolder.svg" alt="" class="h-6 w-6" />
      </button>
      <div class="w-full"></div>
      <button
        class="btn-simple btn-square shrink-0"
        onclick={toggleView}
        disabled={isPageLoading}
      >
        <img
          src={viewType === "grid" ? "/icons/grid.svg" : "/icons/list.svg"}
          alt="grid and list switch"
          class="h-6 w-6"
        />
      </button>
    {/if}
  </div>

  <div
    id="breadcrumbs"
    class="flex flex-wrap gap-2 text-(--lighter-grey) text-sm py-4"
  >
    {#each BreadcrumbEntries as entry, i}
      {@const isLast = i === BreadcrumbEntries.length - 1}
      <button
        type="button"
        class="bg-(--dark-grey) px-1 transition-colors focus:outline-none focus:ring-1 focus:ring-(--terminal-green)"
        class:hover:underline={!isLast}
        class:opacity-80={isLast}
        onclick={() => !isLast && navigateToDirFromBreadcrumb(i)}
        aria-current={isLast ? "page" : undefined}
      >
        {entry.name}
      </button>

      {#if !isLast}
        <span class="cursor-default select-none" aria-hidden="true">&gt;</span>
      {/if}
    {/each}
  </div>
  <div id="dir-contents-container">
    {#if pageState === "initLoading"}
      <div class="text-md text-(--lighter-grey) text-center">Loading...</div>
    {:else if fsEntries}
      <div
        id="files"
        class:fsentries-grid={viewType === "grid"}
        class:fsentries-list={viewType === "list"}
      >
        {#each fsEntries as fsEntry}
          {#if !searchValue || fsEntry.name
              .toLowerCase()
              .includes(searchValue.toLowerCase())}
            <FSentryCard
              entry={fsEntry}
              {selectedFiles}
              {toggleSelection}
              {viewType}
              bind:pageState
            />
          {/if}
        {/each}
      </div>
    {:else}
      <div class="text-md text-(--lighter-grey) text-center">
        No files found
      </div>
    {/if}
  </div>
{/snippet}

{#snippet createFolderModal()}
  <form onsubmit={createFolder} class="flex flex-col gap-2">
    <h2 class="text-start">Create Folder</h2>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      placeholder="Folder name"
      bind:value={createDirValue}
      use:focusOnMount
    />
    <span class="text-xs text-(--clr-error) break-all">{createDirError}</span>
    <Button loading={pageState === "loading"} classes="w-full">Create</Button>
  </form>
{/snippet}

<WrapperHelper {title} {search} {content} {onFilesAdded} />

<style>
  .fsentries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
    gap: 1rem;
  }

  .fsentries-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
