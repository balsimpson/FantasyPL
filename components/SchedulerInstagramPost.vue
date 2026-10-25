<template>
  <article class="overflow-hidden rounded-xl border border-default bg-default shadow-sm">
    <header class="flex items-center justify-between gap-2 px-3 py-2.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <div class="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px]" aria-hidden="true">
          <div class="grid size-full place-items-center rounded-full bg-default text-[9px] font-bold text-highlighted">FPL</div>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5"><p class="text-xs font-semibold text-highlighted">fplinsights</p><slot name="identity-status" /></div>
          <div class="text-[10px] leading-4 text-muted"><slot name="subtitle">Original audio</slot></div>
        </div>
      </div>
      <slot name="header-actions" />
    </header>
    <slot />
    <div class="flex items-center gap-3 px-3 py-2" aria-hidden="true">
      <UIcon name="i-lucide-heart" class="size-5 text-highlighted" />
      <UIcon name="i-lucide-message-circle" class="size-5 text-highlighted" />
      <UIcon name="i-lucide-send" class="size-5 text-highlighted" />
      <UIcon name="i-lucide-bookmark" class="ml-auto size-5 text-highlighted" />
    </div>
    <div class="px-3 pb-3"><slot name="caption" /></div>
  </article>
</template>
