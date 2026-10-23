<script setup lang="ts">
import { getInstagramTransfers, compactInstagramNumber } from '~/utils/instagram-designs'
const props = withDefaults(defineProps<{ incoming: number | null, outgoing: number | null, combined?: boolean, dark?: boolean }>(), { combined: false, dark: false })
const transfers = computed(() => getInstagramTransfers(props.incoming, props.outgoing))
</script>

<template>
  <div class="flex h-[124px] flex-col justify-between border-t border-current/25 py-5" data-transfer-bar :data-transfers-in="incoming" :data-transfers-out="outgoing" :data-transfers-total="transfers.total" :aria-label="`${combined ? 'Combined gameweek transfers' : 'Gameweek transfers'}: ${incoming ?? 'unavailable'} in, ${outgoing ?? 'unavailable'} out`">
    <div class="flex items-center justify-between text-[18px] font-medium leading-none tracking-[0.12em] uppercase opacity-75">
      <span>{{ combined ? 'Combined GW transfers' : 'GW transfers' }}</span><span>{{ compactInstagramNumber(transfers.total) }}{{ transfers.total != null ? ' total' : '' }}</span>
    </div>
    <div class="flex h-2.5 w-full shrink-0 overflow-hidden rounded-full" :class="dark ? 'bg-white/15' : 'bg-black/10'" aria-hidden="true">
      <div data-transfer-in-segment class="h-full" :class="dark ? 'bg-[#bafa55]' : 'bg-[#3b8b51]'" :style="{ width: `${transfers.inPercent}%` }" />
      <div data-transfer-out-segment class="h-full" :class="dark ? 'bg-[#ff477a]' : 'bg-[#c63c62]'" :style="{ width: `${transfers.outPercent}%` }" />
    </div>
    <div class="flex justify-between text-[19px] font-semibold leading-none tracking-[0.08em] uppercase"><span>In {{ compactInstagramNumber(incoming) }}</span><span>Out {{ compactInstagramNumber(outgoing) }}</span></div>
  </div>
</template>
