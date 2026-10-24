<script setup lang="ts">
import { getInstagramTransfers, compactInstagramNumber } from '~/utils/instagram-designs'
const props = withDefaults(defineProps<{ incoming: number | null, outgoing: number | null, combined?: boolean, dark?: boolean, compact?: boolean }>(), { combined: false, dark: false, compact: false })
const transfers = computed(() => getInstagramTransfers(props.incoming, props.outgoing))
</script>

<template>
  <div class="flex flex-col justify-between border-t border-current/25" :class="compact ? 'gap-2 pt-3' : 'h-[124px] py-5'" data-transfer-bar :data-transfers-in="incoming" :data-transfers-out="outgoing" :data-transfers-total="transfers.total" :aria-label="`${combined ? 'Combined gameweek transfers' : 'Gameweek transfers'}: ${incoming ?? 'unavailable'} in, ${outgoing ?? 'unavailable'} out`">
    <div class="flex items-center justify-between font-medium leading-none tracking-[0.12em] uppercase opacity-75" :class="compact ? 'gap-2 text-[10px]' : 'text-[18px]'">
      <span>{{ combined ? 'Combined GW transfers' : 'GW transfers' }}</span><span>{{ compactInstagramNumber(transfers.total) }}{{ transfers.total != null ? ' total' : '' }}</span>
    </div>
    <div class="flex w-full shrink-0 overflow-hidden rounded-full" :class="[compact ? 'h-1.5' : 'h-2.5', dark ? 'bg-white/15' : 'bg-black/10']" aria-hidden="true">
      <div data-transfer-in-segment class="h-full" :class="dark ? 'bg-[#bafa55]' : 'bg-[#3b8b51]'" :style="{ width: `${transfers.inPercent}%` }" />
      <div data-transfer-out-segment class="h-full" :class="dark ? 'bg-[#ff477a]' : 'bg-[#c63c62]'" :style="{ width: `${transfers.outPercent}%` }" />
    </div>
    <div class="flex justify-between font-semibold leading-none tracking-[0.08em] uppercase" :class="compact ? 'gap-2 text-[11px]' : 'text-[19px]'"><span>In {{ compactInstagramNumber(incoming) }}</span><span>Out {{ compactInstagramNumber(outgoing) }}</span></div>
  </div>
</template>
