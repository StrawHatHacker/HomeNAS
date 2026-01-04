<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    loading = false,
    children,
    onclick,
  }: {
    loading: boolean;
    children: Snippet;
    onclick?: (e: MouseEvent) => void;
  } = $props();
</script>

<button
  class="btn-simple flex items-center justify-center w-fit"
  disabled={loading}
  {onclick}
>
  {@render children()}

  {#if loading}
    <img src="/icons/spinner.svg" alt="spinner" class="h-4 w-4 ml-2 animate-spin" />
  {/if}
</button>
