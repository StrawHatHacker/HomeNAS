<script lang="ts">
  import "./layout.css";
  import Toast from "$lib/widgets/toast.svelte";
  import { ModeWatcher } from "mode-watcher";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/logo.svg" />
</svelte:head>

<ModeWatcher />
<Toast />
{@render children()}
