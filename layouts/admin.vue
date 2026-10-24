<script setup lang="ts">
const { user, clear } = useUserSession()
const route = useRoute()
useSeoMeta({ robots: 'noindex, nofollow' })
async function signOut() {
  await clear()
  await navigateTo('/admin/login')
}
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default text-default lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <a href="#admin-content" class="sr-only z-50 rounded-md bg-primary p-3 text-inverted focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <aside class="border-b border-default bg-muted/40 px-5 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:py-7">
        <NuxtLink to="/admin/articles" class="flex items-center gap-2 text-lg font-bold tracking-tight text-highlighted">
          <UIcon name="i-lucide-notebook-pen" class="size-6 text-primary" />
          FPL Insights
        </NuxtLink>
        <p class="mt-1 text-sm text-muted">Content workspace</p>
        <nav aria-label="Admin navigation" class="mt-5 flex items-center gap-2 lg:mt-10 lg:block">
          <UButton to="/admin/research" label="Research" icon="i-lucide-search" :variant="route.path.startsWith('/admin/research') ? 'soft' : 'ghost'" color="neutral" class="justify-start lg:w-full" />
          <UButton to="/admin/articles" label="Articles" icon="i-lucide-files" :variant="route.path.startsWith('/admin/articles') ? 'soft' : 'ghost'" color="neutral" class="justify-start lg:mt-2 lg:w-full" />
          <UButton to="/" label="View site" icon="i-lucide-arrow-up-right" variant="ghost" color="neutral" class="justify-start lg:mt-2 lg:w-full" />
        </nav>
        <div class="mt-auto hidden pt-6 text-sm text-muted lg:block">
          <p>Write, preview and save.</p>
          <p class="mt-1">Your drafts stay private.</p>
        </div>
      </aside>
      <div class="min-w-0">
        <header class="flex min-h-16 items-center justify-end gap-3 border-b border-default px-5 sm:px-8">
          <span v-if="user" class="text-sm text-muted">{{ user.login }}</span>
          <UColorModeButton />
          <UButton v-if="user" label="Sign out" color="neutral" variant="ghost" size="sm" @click="signOut" />
        </header>
        <main id="admin-content" class="mx-auto w-full max-w-[96rem] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <slot />
        </main>
      </div>
    </div>
  </UApp>
</template>
