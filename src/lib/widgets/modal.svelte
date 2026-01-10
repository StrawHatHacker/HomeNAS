<script lang="ts">
  import { modal } from "$lib/stores/modal.svelte";
  import { fade, scale } from "svelte/transition";
</script>

{#if modal.isOpen && modal.content}
  <div
    class="modal-backdrop"
    transition:fade={{ duration: 200 }}
    onclick={() => {
      if (!modal.isLoading) modal.close();
    }}
    role="presentation"
  >
    <button
      class="modal-content"
      transition:scale={{ start: 0.95, duration: 200 }}
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      {#if modal.content.type === "snippet"}
        {@render modal.content.value(modal.content.props)}
      {:else}
        <svelte:component this={modal.content.value} {...modal.content.props} />
      {/if}
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
    background: rgba(0, 0, 0, 0.7);
    display: grid;
    place-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--darker-grey);
    width: clamp(300px, 90%, 400px);
    max-width: 90%;
    overflow: clip;
    padding: 1rem;
    border: 1px solid var(--normal-grey);
    @apply py-4 px-6 cursor-default;
  }
</style>
