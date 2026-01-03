<script lang="ts">
  import { Uploader } from "$lib/stores/uploader.svelte";
</script>

{#if Uploader.tasks.length > 0}
  <div
    class="fixed bottom-4 right-4 w-full z-50 max-w-90 max-h-120 overflow-y-auto flex flex-col gap-4 p-4 bg-(--darker-grey) border border-(--normal-grey)"
  >
    <div class="flex justify-between items-center mb-2 text-xs">
      <span class="font-bold uppercase tracking-wider text-(--lighter-grey)">
        Uploads ({Uploader.activeCount} active)
      </span>
      <button
        onclick={() => Uploader.clearFinished()}
        class="hover:text-white text-(--lighter-grey)"
      >
        Clear Done
      </button>
    </div>

    {#each Uploader.tasks as task (task.id)}
      <div class="flex flex-col w-full">
        <div class="text-sm break-all">
          {task.file.name}
        </div>

        <div class="flex items-baseline gap-4">
          <div class="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              class="h-full bg-white transition-all duration-300"
              style="width: {Math.min(100, task.progress)}%"
            ></div>
          </div>

          <span class="shrink-0 text-xs text-right">
            {#if task.status === "error"}
              <span class="text-(--clr-error)">Error</span>
            {:else if task.status === "done"}
              <span class="text-(--terminal-green)">Done</span>
            {:else if task.status === "waiting"}
              <span class="text-(--lighter-grey)">Waiting</span>
            {:else}
              <span class="text-(--lighter-grey)">
                {Math.min(100, task.progress)}%</span
              >
            {/if}
          </span>
        </div>
        {#if task.errorMessage !== undefined || task.errorMessage !== ""}
          <p class="text-xs text-(--clr-error) break-all">
            {task.errorMessage}
          </p>
        {/if}
      </div>
    {/each}
  </div>
{/if}
