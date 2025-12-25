<script lang="ts">
  let { data } = $props();
  let isCollapsed = $state(false);
  let isMobileOpen = $state(false);

  const filesNavItems = [
    {
      name: "Crypt",
      icon: "file",
      description: "Your unencrypted files that you can share.",
    },
    { name: "Encrypted", icon: "lock", description: "Your encrypted files." },
    {
      name: "Shared",
      icon: "send",
      description: "Your shared with you and shared with others files.",
    },
    { name: "Trash", icon: "bin", description: "Your deleted files." },
  ];
  let currentTabIndex = $state(0);

  const toggleSidebar = () => (isCollapsed = !isCollapsed);
  const toggleMobile = () => (isMobileOpen = !isMobileOpen);
</script>

<div class="flex h-screen overflow-hidden relative">
  <aside
    id="col-1"
    class="flex flex-col h-full border-r border-(--normal-grey) bg-black transition-all duration-300 ease-out z-50
           fixed inset-y-0 left-0 md:relative md:translate-x-0"
    class:w-90={!isCollapsed}
    class:w-20={isCollapsed}
    class:translate-x-0={isMobileOpen}
    class:-translate-x-full={!isMobileOpen}
    class:!w-full={isMobileOpen}
  >
    <header
      class="h-18 p-4 border-b border-(--normal-grey) flex items-center overflow-hidden transition-all"
      class:justify-between={!isCollapsed || isMobileOpen}
      class:justify-center={isCollapsed && !isMobileOpen}
    >
      {#if !isCollapsed || isMobileOpen}
        <div class="flex items-center gap-2 min-w-max">
          <img src="/icons/nas.svg" alt="" class="h-6 w-6" />
          <h2 class="font-bold truncate text-2xl">StrawHat NAS</h2>
        </div>
      {/if}

      <button
        onclick={toggleSidebar}
        class="hidden md:block hover:bg-(--normal-grey) transition-all p-1 rounded-md"
      >
        <img
          src="/icons/{isCollapsed ? 'expand' : 'collapse'}.svg"
          alt="Toggle"
          class="h-6 w-6"
        />
      </button>

      {#if isMobileOpen}
        <button
          onclick={toggleMobile}
          class="md:hidden p-1 hover:bg-(--normal-grey) rounded-md transition-colors"
        >
          <img src="/icons/close.svg" alt="Close Menu" class="h-6 w-6" />
        </button>
      {/if}
    </header>

    <nav class="flex-1 flex flex-col justify-between p-2 overflow-x-hidden">
      <div class="flex flex-col gap-1">
        <span
          class="nav-title px-4 py-2 tracking-wider text-base"
          class:hidden={isCollapsed && !isMobileOpen}
        >
          FILES
        </span>
        {#each filesNavItems as item, i}
          <button
            class="nav-btn"
            class:active={currentTabIndex === i}
            class:justify-center={isCollapsed && !isMobileOpen}
            class:collapsed={isCollapsed && !isMobileOpen}
            onclick={() => {
              currentTabIndex = i;
              isMobileOpen = false;
            }}
            title={isCollapsed ? item.name : ""}
          >
            <img src="/icons/{item.icon}.svg" alt="" />
            {#if !isCollapsed || isMobileOpen}
              <span class="truncate">{item.name}</span>
            {/if}
          </button>
        {/each}
      </div>

      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="nav-btn"
          class:justify-center={isCollapsed && !isMobileOpen}
          title="Settings"
        >
          <img src="/icons/settings.svg" alt="" />
          {#if !isCollapsed || isMobileOpen}
            <span>Settings</span>
          {/if}
        </button>
        <button
          type="button"
          class="nav-btn"
          class:justify-center={isCollapsed && !isMobileOpen}
          title="Settings"
        >
          <img src="/icons/logout.svg" alt="" />
          {#if !isCollapsed || isMobileOpen}
            <span>Logout</span>
          {/if}
        </button>

        <div
          class="profile mt-2 px-4 py-3 overflow-hidden"
          class:justify-center={isCollapsed && !isMobileOpen}
        >
          <img src="/icons/user.svg" alt="User" class="h-6 w-6 shrink-0" />
          {#if !isCollapsed || isMobileOpen}
            <span class="truncate text-base">
              {data.user.name}
            </span>
          {/if}
        </div>
      </div>
    </nav>
  </aside>

  <main class="flex-1 overflow-y-hidden">
    <div
      class="h-18 border-b border-(--normal-grey) px-4 flex items-center gap-2"
    >
      <button
        onclick={toggleMobile}
        class="md:hidden p-2 hover:bg-(--normal-grey) rounded-md"
      >
        <img src="/icons/menu.svg" alt="Menu" class="h-6 w-6" />
      </button>
      <div class="flex flex-col">
        <p>{filesNavItems[currentTabIndex].name}</p>
        <span class="text-xs text-(--lighter-grey)">{filesNavItems[currentTabIndex].description}</span>
      </div>
    </div>
    <div class="w-full h-full overflow-y-auto p-4">test</div>
  </main>
</div>

<style>
  @reference '../../../routes/layout.css';

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    @apply px-4 py-2 w-full transition-colors rounded-xs text-xl;

    &:hover {
      background-color: var(--dark-grey);
    }
    &.active {
      background-color: var(--normal-grey);
    }

    img {
      height: 1.25rem;
      width: 1.25rem;
    }

    &.collapsed {
      @apply py-4;
    }
  }

  img {
    flex-shrink: 0;
  }

  .nav-title {
    color: var(--light-grey);
    font-weight: 900;
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.2rem;
    background-color: var(--dark-grey);
  }
</style>
