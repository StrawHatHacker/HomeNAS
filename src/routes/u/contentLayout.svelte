<script lang="ts">
  import { isMobileOpen } from "$lib/stores/sidebar";

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
    <div class="flex flex-col">
      <slot name="title">Someone forgot to add a title</slot>
    </div>
    <div class="ml-auto">search bar</div>
  </div>
  <div class="w-full h-full overflow-y-auto p-4">
    <slot name="content">Someone forgot to add content</slot>
  </div>
</main>
