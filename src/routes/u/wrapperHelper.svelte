<script lang="ts">
  import { isMobileOpen } from "$lib/stores/sidebar";
  import type { Snippet } from "svelte";

  let {
    title,
    search,
    content,
  }: {
    title: Snippet;
    search: Snippet;
    content: Snippet;
  } = $props();

  const toggleMobile = () => isMobileOpen.update((value) => !value);
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
    </form>
  </div>
  <div class="w-full h-full overflow-y-auto p-4">
    {@render content()}
  </div>
</main>
