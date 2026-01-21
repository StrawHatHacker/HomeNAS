<script lang="ts">
  import { Uploader } from "$lib/stores/uploader.svelte";
  import {
    USER_FOLDERS_TYPES,
    type BreadCrumbsEntry,
    type FSEntries,
    type ModalState,
  } from "$lib/types.js";
  import {
    LocalStorageUtil,
    type FSEntryViewMode,
  } from "$lib/utils/localstorageUtil.js";
  import { focusOnMount } from "$lib/utils/ui";
  import { onMount } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import WrapperHelper from "../wrapperHelper.svelte";
  import Modal from "$lib/widgets/modal.svelte";
  import FSEntryCard from "$lib/widgets/FSEntryCard.svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { StringUtil } from "$lib/utils/stringUtil.js";

  let { data } = $props();

  let createDirValue = $state("");
  let viewType = $state<FSEntryViewMode>(
    LocalStorageUtil.defaultfsEntryViewMode,
  );

  // 'disruptiveLoading' shows "Loading..." and 'loading' just disables the UI
  let pageState = $state<"disruptiveLoading" | "loading" | "loaded">(
    "disruptiveLoading",
  );
  let selectedFSEntries = $state(new SvelteSet<number>());
  let BreadcrumbEntries = $state<BreadCrumbsEntry[]>([]);
  let fsEntries = $state<FSEntries>([]);
  let searchValue = $state("");

  let createDirModalState = $state<ModalState>("closed");
  let createDirError = $state("");
  let deleteFSEntriesModalState = $state<ModalState>("closed");
  let deleteFSEntriesError = $state("");

  let lastBreadcrumbEntry = $derived(
    BreadcrumbEntries[BreadcrumbEntries.length - 1],
  );
  let relativePathToCrypt = $derived(
    BreadcrumbEntries.map((e) => e.name).slice(1), // remove '/crypt'
  );
  let isSelectingFiles = $derived(selectedFSEntries.size > 0);
  let isPageLoading = $derived(
    pageState === "loading" || pageState === "disruptiveLoading",
  );

  onMount(async () => {
    viewType = LocalStorageUtil.fsEntryViewMode;

    const cryptData = data.user.rootFolder.subFolders.find(
      (f) => f.name === USER_FOLDERS_TYPES.crypt,
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
      USER_FOLDERS_TYPES.crypt,
    );
  };

  const getCurrentDirData = async (disruptiveLoading = false) => {
    try {
      pageState = disruptiveLoading ? "disruptiveLoading" : "loading";
      selectedFSEntries = new SvelteSet();

      const res = await fetch(
        `/api/dir?currentDirId=${lastBreadcrumbEntry.id}`,
        {
          method: "GET",
        },
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

  const createFolder = async (e: Event) => {
    e.preventDefault();
    try {
      if (pageState !== "loaded" || createDirValue === "") return;
      pageState = "loading";
      createDirModalState = "loading";

      const res = await fetch("/api/dir", {
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

      createDirModalState = "closed";
      await getCurrentDirData();
    } catch (e) {
      if (e instanceof Error) createDirError = e.message;
      else createDirError = "Failed to create directory.";
      createDirModalState = "open";
    } finally {
      pageState = "loaded";
    }
  };

  const navigateBackFromBreadcrumb = (index: number) => {
    if (index < 0 || index === BreadcrumbEntries.length - 1) return;

    BreadcrumbEntries = BreadcrumbEntries.slice(0, index + 1);
    getCurrentDirData(true);
  };

  const nagivateToDir = (bcEntry: BreadCrumbsEntry) => {
    BreadcrumbEntries = [...BreadcrumbEntries, bcEntry];
    getCurrentDirData(true);
  };

  const toggleSelection = (id: number) => {
    selectedFSEntries.has(id)
      ? selectedFSEntries.delete(id)
      : selectedFSEntries.add(id);
    selectedFSEntries = selectedFSEntries;
  };

  const selectAll = () =>
    (selectedFSEntries = new SvelteSet(fsEntries.map((f) => f.id)));
  const deselectAll = () => (selectedFSEntries = new SvelteSet());

  Uploader.onUploadSuccess = async (task) => {
    const areWeInThisDir = () =>
      task.relativePath.join("/") === relativePathToCrypt.join("/");

    // If we navigated elsewhere return
    if (!areWeInThisDir()) return;

    try {
      const res = await fetch(
        `/api/fsentries/getBy?checksum=${task.checksum}`,
        {
          method: "GET",
        },
      );
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

  const onRename = (fsEntryId: number, newName: string) => {
    // Find that fsEntry and rename it
    fsEntries = fsEntries.map((f) => {
      if (f.id === fsEntryId) f.name = newName;
      return f;
    });
  };

  const deleteFSEntries = async (fsEntryIds: number[]) => {
    try {
      pageState = "loading";
      deleteFSEntriesModalState = "loading";

      const res = await fetch("/api/fsentries", {
        method: "DELETE",
        body: JSON.stringify({
          fsEntryIds,
          relativePath: relativePathToCrypt.join("/"),
          folderType: USER_FOLDERS_TYPES.crypt,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete files");

      fsEntries = fsEntries.filter((f) => !fsEntryIds.includes(f.id));
      deleteFSEntriesModalState = "closed";
    } catch (e) {
      if (e instanceof Error) console.error(e);
      else console.error("Failed to delete files.");
      deleteFSEntriesModalState = "open";
    } finally {
      pageState = "loaded";
      selectedFSEntries = new SvelteSet();
    }
  };

  const onDeleteClick = (fsEntryIds: number[]) => {
    selectedFSEntries = new SvelteSet(fsEntryIds);
    deleteFSEntriesModalState = "open";
  };
</script>

<svelte:head>
  <title>HomeNAS - Crypt</title>
</svelte:head>

<Modal bind:modalState={createDirModalState}>
  <form onsubmit={createFolder} class="flex flex-col gap-2">
    <h2 class="text-start">Create Folder</h2>
    <input
      type="text"
      placeholder="Folder name"
      bind:value={createDirValue}
      use:focusOnMount
    />
    <span class="text-xs text-(--clr-error) break-all">{createDirError}</span>
    <!-- <Button loading={pageState === "loading"} classes="w-full">Create</Button> -->
  </form>
</Modal>

<Modal bind:modalState={deleteFSEntriesModalState}>
  <h2>
    Are you sure you want to permanently delete
    {selectedFSEntries.size > 1 ? "these" : "this"}
    file{selectedFSEntries.size > 1 ? "s" : ""}?
  </h2>
  {#each selectedFSEntries as slId}
    {@const sl = fsEntries.find((e) => e.id === slId)}
    <p class="text-sm text-(--terminal-green)">{sl?.name}</p>
  {/each}
  <button
    class="btn w-full"
    onclick={() => {
      deleteFSEntries(Array.from(selectedFSEntries));
      deleteFSEntriesModalState = "closed";
    }}
  >
    Delete
  </button>
</Modal>

{#snippet title()}
  <h2 class="font-medium">{StringUtil.capitalizeFirst(USER_FOLDERS_TYPES.crypt)}</h2>
  <span class="text-xs text-muted-foreground">Your unencrypted files</span>
{/snippet}

{#snippet search()}
  <Input
    type="text"
    placeholder="Search files"
    bind:value={searchValue}
    disabled={isPageLoading}
    class="max-w-60"
  />
{/snippet}

{#snippet content(openFileExplorer: () => void)}
  <div id="toolbar" class="w-full flex gap-2 items-stretch">
    {#if isSelectingFiles}
      <button
        class="btn btn-square"
        onclick={() => (deleteFSEntriesModalState = "open")}
        disabled={isPageLoading}
      >
        <img src="/icons/bin.svg" alt="" class="h-8 w-8" />
      </button>
      <div class="w-full"></div>
      <button class="btn shrink-0" onclick={selectAll} disabled={isPageLoading}>
        Select All
      </button>
      <button
        class="btn shrink-0"
        onclick={deselectAll}
        disabled={isPageLoading}
      >
        Deselect All
      </button>
    {:else}
      <ButtonGroup.Root>
        <Button
          onclick={openFileExplorer}
          disabled={isPageLoading}
          variant="outline"
          size="icon-lg"
        >
          <img src="/icons/upload.svg" alt="" class="h-6 w-6" />
        </Button>
        <Button
          onclick={() => (createDirModalState = "open")}
          disabled={isPageLoading}
          variant="outline"
          size="icon-lg"
        >
          <img src="/icons/addFolder.svg" alt="" class="h-6 w-6" />
        </Button>
      </ButtonGroup.Root>
      <div class="w-full"></div>
      <ButtonGroup.Root>
        <Button
          onclick={toggleView}
          disabled={isPageLoading}
          variant="outline"
          size="icon-lg"
        >
          <img
            src={viewType === "grid" ? "/icons/grid.svg" : "/icons/list.svg"}
            alt="grid and list switch"
            class="h-6 w-6"
          />
        </Button>
      </ButtonGroup.Root>
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
        class="px-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 rounded-sm text-muted-foreground cursor-pointer transition-all"
        class:hover:underline={!isLast}
        class:hover:text-primary={!isLast}
        class:cursor-default!={isLast}
        class:focus-visible:ring-0={isLast}
        class:text-primary={isLast}
        onclick={() => !isLast && navigateBackFromBreadcrumb(i)}
        aria-current={isLast ? "page" : undefined}
        tabindex={isLast ? -1 : 0}
      >
        {i === 0 ?StringUtil.capitalizeFirst(entry.name) : entry.name}
      </button>

      {#if !isLast}
        <span class="cursor-default select-none text-muted-foreground" aria-hidden="true">&gt;</span>
      {/if}
    {/each}
  </div>
  <div id="dir-contents-container">
    {#if pageState === "disruptiveLoading"}
      <div class="text-md text-(--lighter-grey) text-center">Loading...</div>
    {:else if fsEntries}
      <div
        id="files"
        class:fsentries-grid={viewType === "grid"}
        class:fsentries-list={viewType === "list"}
      >
        {#each fsEntries as fsEntry (fsEntry.id)}
          {#if !searchValue || fsEntry.name
              .toLowerCase()
              .includes(searchValue.toLowerCase())}
            <FSEntryCard
              entry={fsEntry}
              selectedFiles={selectedFSEntries}
              {toggleSelection}
              {relativePathToCrypt}
              {viewType}
              {onRename}
              {onDeleteClick}
              {nagivateToDir}
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
    gap: 0.5rem;
  }
</style>
