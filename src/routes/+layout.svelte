<script lang="ts">
  import "./layout.css";
  import Toast from "$lib/widgets/toast.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/logo.svg" />
</svelte:head>

<Toast />
{@render children()}
