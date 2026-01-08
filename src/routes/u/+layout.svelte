<script lang="ts">
  import { page } from "$app/state";
  import { ROUTES } from "$lib/types.js";
  import { isSidebarCollapsed, isMobileOpen } from "$lib/stores/sidebar";
  import UploadingProgress from "$lib/widgets/uploadingProgress.svelte";

  let { data, children } = $props();

  const sibarNavItems: Readonly<{
    [key: string]: { name: string; icon: string; href: string }[];
  }> = {
    files: [
      {
        name: "Crypt",
        icon: "file",
        href: ROUTES.crypt,
      },
      { name: "Encrypted", icon: "lock", href: ROUTES.encrypted },
      {
        name: "Shared",
        icon: "send",
        href: ROUTES.shared,
      },
      { name: "Bin", icon: "bin", href: ROUTES.bin },
    ],
  };

  const toggleSidebarCollape = () =>
    isSidebarCollapsed.update((value) => !value);
  const toggleMobile = () => isMobileOpen.update((value) => !value);
  const isActive = (href: string) =>
    page.url.pathname === href || page.url.pathname.startsWith(href + "/");
</script>

<UploadingProgress />

<div class="flex h-screen overflow-hidden relative">
  <aside
    id="col-1"
    class="flex flex-col h-full max-w-70 mask-x-to-yellow-900 border-r border-(--normal-grey) bg-black transition-all duration-300 ease-out z-50 fixed inset-y-0 left-0 md:relative md:translate-x-0"
    class:w-90={!$isSidebarCollapsed}
    class:w-20={$isSidebarCollapsed}
    class:w-full={$isMobileOpen}
    class:translate-x-0={$isMobileOpen}
    class:-translate-x-full={!$isMobileOpen}
    class:!w-full={$isMobileOpen}
  >
    <header
      class="h-18 p-4 border-b border-(--normal-grey) flex items-center overflow-hidden transition-all"
      class:justify-between={!$isSidebarCollapsed || $isMobileOpen}
      class:justify-center={$isSidebarCollapsed && !$isMobileOpen}
    >
      {#if !$isSidebarCollapsed || $isMobileOpen}
        <div class="flex items-center gap-2 min-w-max">
          <img src="/logo.svg" alt="" class="h-12 w-12" />
        </div>
      {/if}

      <button
        onclick={toggleSidebarCollape}
        class="hidden md:block hover:bg-(--normal-grey) focus:outline-none focus:ring-2 focus:ring-(--terminal-green) transition-all p-1"
        aria-label={$isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <img
          src="/icons/{$isSidebarCollapsed ? 'expand' : 'collapse'}.svg"
          alt=""
          class="h-6 w-6"
        />
      </button>

      {#if $isMobileOpen}
        <button
          onclick={toggleMobile}
          class="md:hidden p-1 hover:bg-(--normal-grey) focus:outline-none focus:ring-2 focus:ring-(--terminal-green) transition-colors"
          aria-label="Close menu"
        >
          <img src="/icons/close.svg" alt="" class="h-6 w-6" />
        </button>
      {/if}
    </header>

    <nav class="flex-1 flex flex-col justify-between p-2 overflow-x-hidden">
      <div class="flex flex-col gap-1">
        {#each Object.keys(sibarNavItems) as key}
          <span
            class="nav-title px-4 py-2 tracking-wider text-base uppercase"
            class:hidden={$isSidebarCollapsed && !$isMobileOpen}
          >
            {key}
          </span>
          {#each sibarNavItems[key] as item}
            <a
              class="nav-btn"
              class:active={isActive(item.href)}
              class:justify-center={$isSidebarCollapsed && !$isMobileOpen}
              class:collapsed={$isSidebarCollapsed && !$isMobileOpen}
              href={item.href}
              onclick={() => {
                if ($isMobileOpen) toggleMobile();
              }}
              title={$isSidebarCollapsed ? item.name : ""}
            >
              <img src="/icons/{item.icon}.svg" alt="" aria-hidden="true" />
              {#if !$isSidebarCollapsed || $isMobileOpen}
                <span class="truncate">{item.name}</span>
              {/if}
            </a>
          {/each}
        {/each}
      </div>

      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="nav-btn"
          class:justify-center={$isSidebarCollapsed && !$isMobileOpen}
          title="Settings"
        >
          <img src="/icons/settings.svg" alt="" aria-hidden="true" />
          {#if !$isSidebarCollapsed || $isMobileOpen}
            <span>Settings</span>
          {/if}
        </button>
        <button
          type="button"
          class="nav-btn"
          class:justify-center={$isSidebarCollapsed && !$isMobileOpen}
          title="Logout"
        >
          <img src="/icons/logout.svg" alt="" aria-hidden="true" />
          {#if !$isSidebarCollapsed || $isMobileOpen}
            <span>Logout</span>
          {/if}
        </button>

        <div
          class="profile mt-2 px-4 py-3 overflow-hidden"
          class:justify-center={$isSidebarCollapsed && !$isMobileOpen}
        >
          <img
            src="/icons/user.svg"
            alt=""
            class="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          {#if !$isSidebarCollapsed || $isMobileOpen}
            <span class="truncate text-base">
              {data.user.name}
            </span>
          {/if}
        </div>
      </div>
    </nav>
  </aside>
  {@render children()}
</div>

<style>
  @reference '../../routes/layout.css';

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    @apply px-4 py-2 w-full text-xl;

    &:focus-visible {
      outline: 1px solid var(--terminal-green);
    }

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
