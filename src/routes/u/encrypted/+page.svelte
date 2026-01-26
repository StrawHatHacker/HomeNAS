<script lang="ts">
  import { USER_FOLDERS_TYPES, type BreadCrumbsEntry } from "$lib/types";
  import { StringUtil } from "$lib/utils/stringUtil";
  import { onMount } from "svelte";
  import WrapperHelper from "../wrapperHelper.svelte";
  import { LocalStorageUtil, type FSEntryViewMode } from "$lib/utils/localstorageUtil";

  let { data } = $props();

  let viewType = $state<FSEntryViewMode>(
    LocalStorageUtil.defaultfsEntryViewMode,
  );
  let BreadcrumbEntries = $state<BreadCrumbsEntry[]>([]);

  // Handle the back button
  const handlePopState = (event: PopStateEvent) => {
    // If we are deeper than the root folder, go back one level
    // if (BreadcrumbEntries.length > 1) {
    //   // Remove the last breadcrumb (length - 2 is the index of the previous folder)
    //   navigateBackFromBreadcrumb(BreadcrumbEntries.length - 2);
    // }
  };

  onMount(() => {
    window.addEventListener("popstate", handlePopState);

    viewType = LocalStorageUtil.fsEntryViewMode;

    const cryptData = data.user.rootFolder.subFolders.find(
      (f) => f.name === USER_FOLDERS_TYPES.encrypted,
    );
    if (!cryptData) return;

    BreadcrumbEntries = [
      {
        id: cryptData.id,
        name: cryptData.name,
      },
    ];

    // getCurrentDirData(true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  });
</script>

{#snippet title()}
  <h2 class="font-medium">
    {StringUtil.capitalizeFirst(USER_FOLDERS_TYPES.encrypted)}
  </h2>
  <span class="text-xs text-muted-foreground">Your encrypted files</span>
{/snippet}

{#snippet search()}
  <!-- <Input
    type="text"
    placeholder="Search files"
    bind:value={searchValue}
    disabled={isPageLoading}
    class="max-w-60"
  /> -->
{/snippet}

<!-- svelte-ignore block_empty -->
{#snippet content(openFileExplorer: () => void)}{/snippet}

<WrapperHelper {title} {search} {content} onFilesAdded={async () => {}} />
