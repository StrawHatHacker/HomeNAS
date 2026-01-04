<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";
  import Toast from "$lib/widgets/toast.svelte";
  import Modal from "$lib/widgets/modal.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Modal />
<Toast />
{@render children()}
