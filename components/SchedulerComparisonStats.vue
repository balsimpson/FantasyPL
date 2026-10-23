<script setup lang="ts">
import type { InstagramPlayer, InstagramStatKey } from '~/utils/instagram-templates'
import { formatInstagramStat, instagramStatLabel } from '~/utils/instagram-templates'
import { getInstagramStatSignals, getInstagramStatSignalColor } from '~/utils/instagram-designs'
const props = withDefaults(defineProps<{ players: InstagramPlayer[], stats: InstagramStatKey[], mode?: 'ledger' | 'bars' | 'tiles' | 'ribbon', colours?: string[] }>(), { mode: 'ledger', colours: () => ['currentColor', 'currentColor'] })
function proportion(players: InstagramPlayer[], key: InstagramStatKey, index: number) {
  const values = players.map(player => Math.max(0, player.stats[key] ?? 0))
  const max = Math.max(...values, 0)
  return max ? (values[index] ?? 0) / max * 100 : 0
}
function statCue(player: InstagramPlayer | undefined, index: number, key: InstagramStatKey) {
  if (!player) return undefined
  const signal = getInstagramStatSignals(player, props.stats)[key]
  return signal ? getInstagramStatSignalColor(signal, props.colours[index] ?? 'currentColor') : undefined
}
</script>

<template>
  <dl class="grid h-full min-h-0" :class="mode === 'tiles' ? 'grid-cols-3 gap-x-7 gap-y-4' : mode === 'ribbon' ? 'grid-flow-col auto-cols-fr gap-4' : 'grid-cols-1'" data-comparison-stats :data-stat-layout="mode">
    <div v-for="key in stats" :key="key" class="flex min-h-0 flex-col justify-center border-t border-current/20" :class="['tiles', 'ribbon'].includes(mode) ? 'py-3' : 'py-2'" :data-comparison-stat="key">
      <template v-if="mode === 'tiles' || mode === 'ribbon'">
        <dt class="mb-2 text-center font-medium leading-tight" :class="mode === 'ribbon' ? 'text-[19px]' : 'text-[22px]'">{{ instagramStatLabel(key) }}</dt>
        <div class="flex items-baseline justify-around gap-2 font-[FPLNumbers] font-bold leading-none tabular-nums" :class="mode === 'ribbon' ? 'flex-col items-center gap-3 text-[38px]' : 'text-[46px]'">
          <div v-for="index in [0, 1]" :key="index" class="flex min-w-0 flex-col items-center">
            <dd>{{ players[index] ? formatInstagramStat(players[index]!, key) : '—' }}</dd>
            <span v-if="statCue(players[index], index, key)" aria-hidden="true" class="mt-2 h-[3px] w-7 rounded-full" :style="{ backgroundColor: statCue(players[index], index, key) }" />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="grid grid-cols-[1fr_1.2fr_1fr] items-center gap-3">
          <div class="flex min-w-0 flex-col items-start"><dd class="font-[FPLNumbers] text-[43px] font-bold leading-none tabular-nums">{{ players[0] ? formatInstagramStat(players[0], key) : '—' }}</dd><span v-if="statCue(players[0], 0, key)" aria-hidden="true" class="mt-2 h-[3px] w-7 rounded-full" :style="{ backgroundColor: statCue(players[0], 0, key) }" /></div>
          <dt class="text-center text-[22px] font-medium leading-tight">{{ instagramStatLabel(key) }}</dt>
          <div class="flex min-w-0 flex-col items-end"><dd class="text-right font-[FPLNumbers] text-[43px] font-bold leading-none tabular-nums">{{ players[1] ? formatInstagramStat(players[1], key) : '—' }}</dd><span v-if="statCue(players[1], 1, key)" aria-hidden="true" class="mt-2 h-[3px] w-7 rounded-full" :style="{ backgroundColor: statCue(players[1], 1, key) }" /></div>
        </div>
        <div v-if="mode === 'bars'" class="mt-3 grid grid-cols-2 gap-10" aria-hidden="true"><div class="flex h-1.5 justify-end"><div class="h-full rounded-full" :style="{ width: `${proportion(players, key, 0)}%`, backgroundColor: colours[0] }" /></div><div class="h-1.5"><div class="h-full rounded-full" :style="{ width: `${proportion(players, key, 1)}%`, backgroundColor: colours[1] }" /></div></div>
      </template>
    </div>
  </dl>
</template>
