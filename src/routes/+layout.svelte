<script lang="ts">
  import "./layout.css";
  import Toast from "$lib/widgets/toast.svelte";
  import Modal from "$lib/widgets/modal.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href='/logo.svg' />
</svelte:head>

<Modal />
<Toast />
{@render children()}
