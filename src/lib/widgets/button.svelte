<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    loading = false,
    children,
    onclick,
    classes = "",
  }: {
    loading: boolean;
    children: Snippet;
    onclick?: (e: MouseEvent) => void;
    classes?: string;
  } = $props();
</script>

<button
  class="btn-simple flex items-center justify-center w-fit {classes}"
  disabled={loading}
  {onclick}
>
  {@render children()}

  {#if loading}
    <img
      src="/icons/spinner.svg"
      alt="spinner"
      class="h-4 w-4 ml-2 animate-spin"
    />
  {/if}
</button>
