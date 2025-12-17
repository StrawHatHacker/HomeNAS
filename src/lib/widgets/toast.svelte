<script lang="ts">
  import { fly } from "svelte/transition";
  import { toasts, type ToastData } from "$lib/stores/toast";

  const toastColors = {
    success: "--terminal-dark-green",
    info: "--color-info",
  } as const;
  const toastMap = (type: ToastData["type"]) => {
    switch (type) {
      case "success":
        return { color: toastColors.success };
      default:
        return { color: toastColors.info };
    }
  };
</script>

<div class="fixed top-5 right-5 z-50 flex flex-col">
  {#each $toasts as toast (toast.id)}
    <div in:fly={{ x: 200, duration: 200 }} out:fly={{ x: 200, duration: 150 }}>
      <div
        style="background: var({toastMap(toast.type).color})"
        class="text-white py-2 px-4"
      >
        {toast.message}
      </div>
    </div>
  {/each}
</div>
