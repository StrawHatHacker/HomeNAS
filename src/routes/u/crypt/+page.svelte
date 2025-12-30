<script lang="ts">
  import WrapperHelper from "../wrapperHelper.svelte";

  let viewType = $state<"grid" | "list">("grid");
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

{#snippet content()}
  <div id="toolbar" class="w-full flex gap-2 items-stretch">
    <button class="btn-simple btn-square shrink-0">
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
{/snippet}

<WrapperHelper {title} {search} {content} />

<style></style>
