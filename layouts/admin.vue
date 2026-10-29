<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { adminSchedulerToolbarKey, type AdminSchedulerToolbar } from '~/composables/adminSchedulerToolbar'

const { user, clear } = useUserSession()
const route = useRoute()
const isScheduler = computed(() => route.path === '/admin/insta-scheduler')
const showNewArticle = computed(() => !isScheduler.value && !route.path.startsWith('/admin/articles'))
const pageTitle = computed(() => {
  if (route.path.startsWith('/admin/articles/')) return 'Article editor'
  if (route.path.startsWith('/admin/articles')) return 'Articles'
  if (route.path.startsWith('/admin/insta-scheduler')) return 'InstaScheduler'
  if (route.path.startsWith('/admin/sharing')) return 'Sharing'
  if (route.path.startsWith('/admin/settings')) return 'Settings'
  return 'Workspace'
})
const articleToolbar = shallowRef<import('~/composables/adminArticleToolbar').AdminArticleToolbar | null>(null)
provide('admin-article-toolbar', articleToolbar)
const schedulerToolbar = shallowRef<AdminSchedulerToolbar | null>(null)
provide(adminSchedulerToolbarKey, schedulerToolbar)
const articleMenu = computed(() => articleToolbar.value ? [[
  { label: articleToolbar.value.editLabel, icon: articleToolbar.value.editIcon, disabled: articleToolbar.value.editDisabled, onSelect: articleToolbar.value.onToggleEdit },
  { label: articleToolbar.value.saveLabel, icon: 'i-lucide-save', disabled: articleToolbar.value.saveDisabled, onSelect: articleToolbar.value.onSave },
], [{ label: articleToolbar.value.publishLabel, icon: 'i-lucide-globe-2', disabled: articleToolbar.value.publishDisabled, onSelect: articleToolbar.value.onPublish }]] : [])

const navigation = computed<NavigationMenuItem[][]>(() => [[
  { label: 'Articles', icon: 'i-lucide-files', to: '/admin/articles' },
  { label: 'Settings', icon: 'i-lucide-settings-2', to: '/admin/settings' },
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
    <UDashboardGroup storage="local" storage-key="fpl-admin-workspace" class="h-dvh bg-default text-default">
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
        <template #header>
          <UDashboardNavbar :title="pageTitle">
            <template #leading>
              <UDashboardSidebarCollapse />
            </template>
            <template #right>
              <template v-if="articleToolbar">
                <span role="status" aria-live="polite" class="hidden min-w-28 text-right text-xs text-muted sm:inline">{{ articleToolbar.saveLabel }}</span>
                <UTooltip text="Save draft">
                  <UButton icon="i-lucide-save" color="neutral" variant="ghost" aria-label="Save draft" :loading="articleToolbar.saving" :disabled="articleToolbar.saveDisabled" @click="articleToolbar.onSave" />
                </UTooltip>
                <UTooltip text="Generate draft">
                  <UButton icon="i-lucide-sparkles" color="neutral" variant="ghost" aria-label="Generate draft" :loading="articleToolbar.generating" :disabled="articleToolbar.generatingDisabled" @click="articleToolbar.onGenerate" />
                </UTooltip>
                <UButton :label="articleToolbar.editLabel" :icon="articleToolbar.editIcon" color="neutral" variant="outline" class="hidden md:inline-flex" :disabled="articleToolbar.editDisabled" @click="articleToolbar.onToggleEdit" />
                <UTooltip text="Article details">
                  <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="ghost" aria-label="Article details" @click="articleToolbar.onDetails" />
                </UTooltip>
                <UButton :label="articleToolbar.publishLabel" icon="i-lucide-globe-2" :loading="articleToolbar.publishing" :disabled="articleToolbar.publishDisabled" class="hidden md:inline-flex" @click="articleToolbar.onPublish" />
                <UDropdownMenu :items="articleMenu" :content="{ align: 'end' }" class="md:hidden">
                  <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" aria-label="More article actions" />
                </UDropdownMenu>
              </template>
              <template v-if="isScheduler && schedulerToolbar">
                <SchedulerSavedCaptions v-if="schedulerToolbar.drafts.length || schedulerToolbar.storageError" :drafts="schedulerToolbar.drafts" :storage-error="schedulerToolbar.storageError" @remove="schedulerToolbar.onRemove" />
                <UButton icon="i-lucide-download" color="neutral" variant="ghost" size="sm" aria-label="Download PNG" :disabled="schedulerToolbar.downloadDisabled" :loading="schedulerToolbar.downloadLoading" @click="schedulerToolbar.onDownload" />
                <UButton :icon="schedulerToolbar.historyView ? 'i-lucide-arrow-left' : 'i-lucide-history'" color="neutral" variant="ghost" :label="schedulerToolbar.historyView ? 'Back to picks' : 'History'" :disabled="schedulerToolbar.historyDisabled" @click="schedulerToolbar.onToggleHistory" />
              </template>
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
