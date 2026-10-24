<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Admin sign in' })
const route = useRoute()
const { data: setup } = await useFetch('/api/admin/setup')
const message = computed(() => route.query.error === 'access'
  ? 'This GitHub account does not have admin access. Sign in with the configured admin account.'
  : route.query.error ? 'GitHub sign-in did not complete. Please try again.' : '')
</script>

<template>
  <section class="mx-auto max-w-lg py-12 sm:py-20">
    <h1 class="text-3xl font-semibold tracking-tight text-highlighted">Your content workspace</h1>
    <p class="mt-4 leading-7 text-muted">Sign in to write articles, preview your work and save private drafts.</p>
    <UAlert v-if="message" :description="message" color="error" variant="soft" class="mt-6" />
    <UAlert v-if="setup && !setup.loginReady" title="GitHub sign-in needs configuration" description="Connect the GitHub OAuth app and set the allowed admin account before signing in." color="warning" variant="soft" class="mt-6" />
    <UButton to="/auth/github" label="Continue with GitHub" icon="i-simple-icons-github" size="lg" block class="mt-8" :disabled="!setup?.loginReady" external />
    <p class="mt-4 text-sm text-muted">Access is limited to the configured admin account.</p>
  </section>
</template>
