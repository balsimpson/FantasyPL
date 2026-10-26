<template>
  <ManagerRecommendationPlayer :player="player" :label="label" :align="align" compact />
</template>

<script setup>
import { plannerPlayerName } from '~/utils/manager-planner';

const props = defineProps({
  pick: { type: Object, required: true },
  label: { type: String, required: true },
  align: { type: String, default: 'left' },
});
const player = computed(() => ({ ...props.pick.element, name: plannerPlayerName(props.pick.element), position: props.pick.element_type, team: props.pick.team?.name ?? '' }));
</script>
