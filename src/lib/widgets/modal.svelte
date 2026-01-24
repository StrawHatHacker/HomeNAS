<script lang="ts">
  import type { ModalState } from "$lib/types";
  import type { Snippet, SvelteComponent } from "svelte";
  import { fade, scale } from "svelte/transition";

  let {
    modalState = $bindable(),
    children,
  }: {
    modalState: ModalState;
    children: Snippet;
  } = $props();

  let isLoading = $state(false);
</script>

{#if modalState === "open" || modalState === "loading"}
  <div
    class="modal-backdrop"
    transition:fade={{ duration: 200 }}
    onclick={() => {
      if (!isLoading) modalState = "closed";
    }}
    role="presentation"
  >
    <button
      class="modal-dialog"
      transition:scale={{ start: 0.9, duration: 200 }}
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      {@render children()}
    </button>
  </div>
{/if}

<style>
  @reference '../../routes/layout.css';

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    z-index: 1000;
    @apply bg-background/70;
  }

  .modal-dialog {
    overflow: clip;
    @apply bg-background w-full max-w-[600px] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg cursor-default;
  }

  :global(.modal-title) {
    @apply text-start font-bold;
  }

  :global(.modal-content) {
    @apply flex flex-col gap-2;
  }
</style>
