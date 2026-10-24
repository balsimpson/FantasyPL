<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { user, clear } = useUserSession()
const route = useRoute()
const isScheduler = computed(() => route.path === '/admin/insta-scheduler')
const showNewArticle = computed(() => !isScheduler.value && !route.path.startsWith('/admin/articles'))
const pageTitle = computed(() => {
  if (route.path.startsWith('/admin/articles/')) return 'Article editor'
  if (route.path.startsWith('/admin/articles')) return 'Articles'
  if (route.path.startsWith('/admin/insta-scheduler')) return 'InstaScheduler'
  if (route.path.startsWith('/admin/sharing')) return 'Sharing'
  return 'Workspace'
})

const navigation = computed<NavigationMenuItem[][]>(() => [[
  { label: 'Articles', icon: 'i-lucide-files', to: '/admin/articles' },
  { label: 'New article', icon: 'i-lucide-file-plus-2', to: '/admin/articles/new' },
], [
  { label: 'InstaScheduler', icon: 'i-lucide-instagram', to: '/admin/insta-scheduler' },
  { label: 'Sharing', icon: 'i-lucide-share-2', to: '/admin/sharing' },
  { label: 'View site', icon: 'i-lucide-arrow-up-right', to: '/' },
]])

useSeoMeta({ robots: 'noindex, nofollow' })

async function signOut() {
  await clear()
  await navigateTo('/admin/login')
}
</script>

<template>
  <UApp>
    <UDashboardGroup storage="cookie" storage-key="fpl-admin-workspace" class="h-dvh bg-default text-default">
      <a href="#admin-content" class="sr-only z-50 rounded-md bg-primary p-3 text-inverted focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>

      <UDashboardSidebar
        id="workspace"
        collapsible
        resizable
        :min-size="14"
        :max-size="26"
        :default-size="18"
        :collapsed-size="5"
        class="bg-muted/30"
        :ui="{ footer: 'justify-between' }"
      >
        <template #header="{ collapsed }">
          <NuxtLink to="/admin/articles" class="flex w-full min-w-0 items-center gap-2 text-base font-bold tracking-tight text-highlighted" :class="collapsed ? 'justify-center' : ''" :aria-label="collapsed ? 'FPL Insights workspace' : undefined">
            <UIcon name="i-lucide-notebook-pen" class="size-5 shrink-0 text-primary" />
            <span v-if="!collapsed" class="truncate">FPL Insights</span>
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu :items="navigation" :collapsed="collapsed" :tooltip="collapsed" orientation="vertical" class="w-full" :ui="{ link: collapsed ? 'justify-center px-0' : 'justify-start' }" />
        </template>

        <template #footer="{ collapsed }">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <UAvatar v-if="user && !collapsed" :alt="user.login" size="sm" icon="i-lucide-user-round" />
            <span v-if="user && !collapsed" class="min-w-0 flex-1 truncate text-sm text-muted">{{ user.login }}</span>
          </div>
          <UButton
            :icon="collapsed ? 'i-lucide-log-out' : undefined"
            :label="collapsed ? undefined : 'Sign out'"
            color="neutral"
            variant="ghost"
            :aria-label="collapsed ? 'Sign out' : undefined"
            :class="collapsed ? 'mx-auto' : ''"
            @click="signOut"
          />
        </template>
      </UDashboardSidebar>

      <UDashboardPanel class="h-dvh min-h-0 min-w-0" :ui="{ body: isScheduler ? 'min-h-0 overflow-hidden gap-0 p-0' : undefined }">
        <template v-if="!isScheduler" #header>
          <UDashboardNavbar :title="pageTitle">
            <template #leading>
              <UDashboardSidebarCollapse />
            </template>
            <template #right>
              <UTooltip v-if="showNewArticle" text="New article">
                <UButton to="/admin/articles/new" icon="i-lucide-plus" color="neutral" variant="ghost" aria-label="New article" />
              </UTooltip>
              <UColorModeButton />
            </template>
          </UDashboardNavbar>
        </template>

        <template #body>
          <main
            id="admin-content"
            class="mx-auto w-full max-w-[96rem] px-5 py-7 sm:px-8 lg:px-10 lg:py-9"
            :class="isScheduler ? 'h-full max-w-none overflow-hidden p-0' : 'min-h-full'"
          >
            <slot />
          </main>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>
