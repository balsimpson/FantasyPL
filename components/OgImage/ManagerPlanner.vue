<script setup lang="ts">
const rows = [1, 4, 4, 2];
useHead({ style: [], link: [] });
</script>

<template>
  <div style="position: relative; display: flex; width: 1200px; height: 630px; overflow: hidden; background-color: #101a16; color: #f5f5ef;">
    <div style="position: absolute; right: 0; top: 0; display: flex; width: 500px; height: 630px; background-color: #1a3928;" />
    <div style="position: absolute; top: 52px; right: 59px; bottom: 52px; display: flex; width: 380px; border: 2px solid #81a98e; border-radius: 16px;">
      <div style="position: absolute; left: 0; top: 50%; width: 100%; height: 2px; background-color: #81a98e;" />
      <div style="position: absolute; left: 139px; top: 212px; width: 98px; height: 98px; border: 2px solid #81a98e; border-radius: 50%;" />
      <div style="position: absolute; left: 103px; top: 0; width: 170px; height: 70px; border: 2px solid #81a98e; border-top: 0;" />
      <div style="position: absolute; left: 103px; bottom: 0; width: 170px; height: 70px; border: 2px solid #81a98e; border-bottom: 0;" />
      <template v-for="(row, index) in rows" :key="index">
        <div v-for="player in row" :key="player" :style="{ position: 'absolute', left: `${player * 376 / (row + 1) - 22}px`, top: `${45 + index * 128}px`, width: '44px', height: '44px', borderRadius: '50%', border: '4px solid #1a3928', backgroundColor: index === 0 ? '#bef264' : '#f5f5ef' }" />
      </template>
    </div>
    <div style="position: absolute; left: 62px; top: 58px; color: #bef264; font-size: 25px; font-weight: 700;">FPL Insights</div>
    <div style="position: absolute; left: 62px; top: 170px; display: flex; flex-direction: column; width: 610px;">
      <div style="font-size: 84px; line-height: 1.03; font-weight: 800; letter-spacing: -3px;">FPL Team</div>
      <div style="font-size: 84px; line-height: 1.03; font-weight: 800; letter-spacing: -3px; color: #bef264;">Planner</div>
      <div style="margin-top: 32px; font-size: 26px; color: #d0ded3;">Squad, fixtures and transfer ideas</div>
    </div>
    <div style="position: absolute; left: 62px; bottom: 55px; font-size: 23px; color: #d0ded3;">sportsync.in/manager</div>
  </div>
</template>
