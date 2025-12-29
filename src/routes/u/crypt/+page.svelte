<script lang="ts">
  import ContentLayout from "../contentLayout.svelte";
</script>

<ContentLayout>
  <svelte:fragment slot="title">
    <p>Crypt</p>
    <span class="text-xs text-(--lighter-grey)">Your unencrypted files</span>
  </svelte:fragment>

  <svelte:fragment slot="content">
    test
  </svelte:fragment>
</ContentLayout>
