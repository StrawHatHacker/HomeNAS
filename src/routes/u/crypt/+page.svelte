<script lang="ts">
  import { Uploader } from "$lib/stores/uploader.svelte";
  import { onMount } from "svelte";
  import WrapperHelper from "../wrapperHelper.svelte";
  import {
    USER_FOLDERS_TYPES,
    type BreadCrumbsEntry,
    type DirContents,
  } from "$lib/types.js";
  import { modal } from "$lib/stores/modal.svelte.js";
  import Button from "$lib/widgets/button.svelte";

  let { data } = $props();

  let createDirValue = $state("");
  let createDirError = $state("");
  let viewType = $state<"grid" | "list">("grid");
  let isPageLoading = $state(false);
  let BreadcrumbEntries = $state<BreadCrumbsEntry[]>([]);
  let currentDirData = $state<DirContents>([]);

  let lastBreadcrumbEntry = $derived(
    BreadcrumbEntries[BreadcrumbEntries.length - 1]
  );
  let relativePathToCrypt = $derived(
    BreadcrumbEntries.map((e) => e.name).slice(1) // remove '/crypt'
  );

  onMount(async () => {
    const cryptData = data.user.rootFolder.subFolders.find(
      (f) => f.name === USER_FOLDERS_TYPES.crypt
    );
    if (!cryptData) return;

    BreadcrumbEntries = [
      {
        id: cryptData.id,
        name: cryptData.name,
      },
      {
        id: cryptData.id,
        name: "test",
      },
    ];

    await getCurrentDirData();
  });

  const onFilesAdded = async (files: FileList) => {
    Uploader.queueFiles(
      files,
      relativePathToCrypt,
      lastBreadcrumbEntry.id,
      USER_FOLDERS_TYPES.crypt
    );
  };

  const getCurrentDirData = async () => {
    try {
      isPageLoading = true;

      const res = await fetch(
        `/api/files/dir?currentDirId=${lastBreadcrumbEntry.id}`,
        {
          method: "GET",
        }
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.message);

      currentDirData = body as DirContents;
    } catch (e) {
      console.error(e);
    } finally {
      isPageLoading = false;
    }
  };

  const createFolder = async () => {
    try {
      if (isPageLoading || createDirValue === "") return;
      isPageLoading = true;
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
      isPageLoading = false;
      modal.isLoading = false;
    }
  };

  const navigateToDirFromBreadcrumb = (index: number) => {
    if (index < 0) return;
    BreadcrumbEntries = BreadcrumbEntries.slice(0, index + 1);
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
  <input type="text" placeholder="Search" />
  <button class="btn-simple btn-square">
    <img src="/icons/search.svg" alt="Search" class="h-6 w-6" />
  </button>
{/snippet}

{#snippet content(openFileExplorer: () => void)}
  <div id="toolbar" class="w-full flex gap-2 items-stretch">
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
          isPageLoading = false;
        })}
    >
      <img src="/icons/addFolder.svg" alt="" class="h-6 w-6" />
    </button>
    <div class="w-full"></div>
    <button
      class="btn-simple btn-square shrink-0"
      onclick={() => (viewType = viewType === "grid" ? "list" : "grid")}
      disabled={isPageLoading}
    >
      <img
        src={viewType === "grid" ? "/icons/grid.svg" : "/icons/list.svg"}
        alt="grid and list switch"
        class="h-6 w-6"
      />
    </button>
  </div>
  <div
    id="breadcrumbs"
    class="flex flex-wrap gap-2 text-(--lighter-grey) text-sm py-4"
  >
    {#each BreadcrumbEntries as entry, i}
      <button
        class="bg-(--dark-grey) px-1"
        onclick={() => navigateToDirFromBreadcrumb(i)}
        class:hover:underline={i < BreadcrumbEntries.length - 1}
        class:!cursor-default={i >= BreadcrumbEntries.length - 1}
        class:bg-transparent={i >= BreadcrumbEntries.length - 1}
      >
        {entry.name}
      </button>
      <span
        class:hidden={i === BreadcrumbEntries.length - 1}
        class="cursor-default">&gt;</span
      >
    {/each}
  </div>
  <div id="dir-contents-container">
    {#if isPageLoading}
      <div class="text-md text-(--lighter-grey) text-center">Loading...</div>
    {:else if currentDirData}
      <div id="files" class="flex flex-wrap gap-2">
        {#each currentDirData as ddEntry}
          {@render dirDataCard(ddEntry)}
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
  <form onsubmit={createFolder} class="flex flex-col gap-2 items-center">
    <input type="text" placeholder="Folder name" bind:value={createDirValue} />
    <span class="text-xs text-(--clr-error) break-all">{createDirError}</span>
    <Button loading={isPageLoading}>Create</Button>
  </form>
{/snippet}

<!-- TODO show the correct icon based on mime/type -->
{#snippet dirDataCard(entry: DirContents[0])}
  <div
    class="flex flex-col w-42 aspect-square border border-(--normal-grey) overflow-hidden"
  >
    <div class="h-full w-full flex items-center justify-center">
      {#if entry.isDir}
        <img
          src="/icons/folder.svg"
          alt="Folder"
          class="h-1/2 w-1/2 object-contain"
        />
      {:else}
        <p class="text-4xl text-(--lighter-grey) text-center tracking-wider">
          {entry.ext}
        </p>
      {/if}
    </div>

    <div class="text-sm h-[6em] w-full px-2">
      <p class="line-clamp-3 break-all tracking-tight">
        {entry.isDir ? entry.name : entry.baseName}
      </p>
    </div>
  </div>
{/snippet}

<WrapperHelper {title} {search} {content} {onFilesAdded} />
