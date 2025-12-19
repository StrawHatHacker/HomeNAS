<script lang="ts">
  // Using Svelte 5 props rune
  let {
    checked = $bindable(false),
    label,
    id = Math.random().toString(36).substring(7),
  }: {
    checked?: boolean;
    label: string;
    id?: string;
  } = $props();

  let status = $derived(checked ? " [X] " : " [ ] ");
</script>

<div>
  <input type="checkbox" {id} bind:checked class="sr-only" />
  <label for={id} class="flex items-baseline cursor-pointer select-none">
    <span class="matrix-text mono text-xl">{status}</span>
    <span class="label-text ml-2 uppercase tracking-tighter mono">{label}</span>
  </label>
</div>

<style>
  .matrix-text {
    color: var(--terminal-light-green);
    text-shadow: 0 0 5px var(--terminal-green);
  }

  .label-text {
    color: var(--terminal-green);
    opacity: 0.8;
  }

  /* Hide original but keep accessible */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  label:hover .label-text {
    opacity: 1;
    text-decoration: underline;
  }
</style>
