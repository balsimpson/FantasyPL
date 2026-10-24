<template>
  <HomeDeadlinePanel :deadline="targetDate" />
</template>

<script setup lang="ts">
defineProps<{
  targetDate: string | Date;
}>();
</script>
