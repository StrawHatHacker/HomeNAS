<script lang="ts">
  import { page } from "$app/state";
  import { ROUTES, USER_FOLDERS_TYPES } from "$lib/types.js";
  import type { Component } from "svelte";
  import { isSidebarCollapsed, isMobileOpen } from "$lib/stores/sidebar";
  import UploadingProgress from "$lib/widgets/uploadingProgress.svelte";
  import Button, {
    buttonVariants,
  } from "$lib/components/ui/button/button.svelte";
  import ExpandIcon from "$lib/widgets/icons/expandIcon.svelte";
  import CollapseIcon from "$lib/widgets/icons/collapseIcon.svelte";
  import FileIcon from "$lib/widgets/icons/fileIcon.svelte";
  import OptionsIcon from "$lib/widgets/icons/optionsIcon.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import CloseIcon from "$lib/widgets/icons/closeIcon.svelte";
  import { setMode } from "mode-watcher";
  import { StringUtil } from "$lib/utils/stringUtil.js";

  let { data, children } = $props();

  const sibarNavItems: Readonly<{
    [key: string]: { name: string; icon: Component; href: string }[];
  }> = {
    files: [
      {
        name: StringUtil.capitalizeFirst(USER_FOLDERS_TYPES.crypt),
        icon: FileIcon,
        href: ROUTES.crypt,
      },
    ],
  };

  const toggleSidebarCollape = () =>
    isSidebarCollapsed.update((value) => !value);
  const toggleMobile = () => isMobileOpen.update((value) => !value);
  const isActive = (href: string) =>
    page.url.pathname === href || page.url.pathname.startsWith(href + "/");

  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
    }).then(() => {
      window.location.href = ROUTES.home;
    });
  };
</script>

<UploadingProgress />

<div class="flex h-screen overflow-hidden relative">
  <aside
    id="col-1"
    class="flex flex-col h-full max-w-70 mask-x-to-yellow-900 border-r border-border bg-background transition-all duration-300 ease-out z-50 fixed inset-y-0 left-0 md:relative md:translate-x-0"
    class:w-90={!$isSidebarCollapsed}
    class:w-16={$isSidebarCollapsed}
    class:w-full={$isMobileOpen}
    class:translate-x-0={$isMobileOpen}
    class:-translate-x-full={!$isMobileOpen}
    class:!w-full={$isMobileOpen}
  >
    <header
      class="h-18 p-4 border-b border-border flex items-center overflow-hidden transition-all"
      class:justify-between={!$isSidebarCollapsed || $isMobileOpen}
      class:justify-center={$isSidebarCollapsed && !$isMobileOpen}
    >
      {#if !$isSidebarCollapsed || $isMobileOpen}
        <div class="flex items-center gap-2 min-w-max">
          <img src="/logo.svg" alt="" class="h-12 w-12" />
        </div>
      {/if}
      <Button
        onclick={toggleSidebarCollape}
        class="hidden md:inline-flex"
        variant="outline"
        size="icon-lg"
        aria-label={$isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {#if $isSidebarCollapsed}
          <ExpandIcon />
        {:else}
          <CollapseIcon />
        {/if}
      </Button>

      {#if $isMobileOpen}
        <Button
          variant="outline"
          size="icon-lg"
          onclick={toggleMobile}
          class="md:hidden"
          aria-label="Close menu"
        >
          <CloseIcon class="size-6" />
        </Button>
      {/if}
    </header>

    <nav class="flex-1 flex flex-col justify-between p-2 overflow-x-hidden">
      <div class="flex flex-col gap-1">
        {#each Object.keys(sibarNavItems) as key}
          <span
            class="text-muted-foreground font-bold px-3 py-1 text-xs uppercase"
            class:hidden={$isSidebarCollapsed && !$isMobileOpen}
          >
            {key}
          </span>
          {#each sibarNavItems[key] as item}
            <div
              class="nav-btn"
              class:collapsed={$isSidebarCollapsed && !$isMobileOpen}
            >
              <Button
                class="w-full {$isSidebarCollapsed && !$isMobileOpen
                  ? 'justify-center'
                  : 'justify-start'} {isActive(item.href)
                  ? 'bg-secondary'
                  : ''}"
                href={item.href}
                variant="ghost"
                size="sm"
                onclick={() => {
                  if ($isMobileOpen) toggleMobile();
                }}
                title={$isSidebarCollapsed ? item.name : ""}
              >
                <item.icon />
                {#if !$isSidebarCollapsed || $isMobileOpen}
                  <span class="ml-2 truncate">{item.name}</span>
                {/if}
              </Button>
            </div>
          {/each}
        {/each}
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <div
            class="flex h-12 w-full p-2 items-center
             {$isSidebarCollapsed && !$isMobileOpen
              ? 'justify-center'
              : 'justify-start gap-2'}
              {buttonVariants({
              variant: 'ghost',
            })}
            "
          >
            <div
              class="rounded-full bg-secondary text-secondary-foreground h-8 w-8 grid items-center"
            >
              {data.user.name.slice(0, 1)}
            </div>

            {#if !$isSidebarCollapsed || $isMobileOpen}
              <div class="flex-1 flex flex-col min-w-0 text-left">
                <span
                  class="truncate text-sm font-medium leading-none text-foreground"
                >
                  {data.user.name}
                </span>
                <span
                  class="truncate text-xs font-normal text-muted-foreground mt-1"
                >
                  {data.user.email}
                </span>
              </div>
              <OptionsIcon class="size-4 shrink-0" />
            {/if}
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-56" align="end">
          <DropdownMenu.Label>My Account</DropdownMenu.Label>
          <DropdownMenu.Group>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Theme</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item onclick={() => setMode("light")}>
                  Light
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => setMode("dark")}>
                  Dark
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.Item>Settings</DropdownMenu.Item>
            <DropdownMenu.Item class="text-destructive" onclick={logout}>
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </nav>
  </aside>
  {@render children()}
</div>

<style>
  @reference '../../routes/layout.css';

  .nav-btn {
    &.collapsed {
      @apply flex justify-center;
    }
  }

  img {
    flex-shrink: 0;
  }
</style>
