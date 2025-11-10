
<template>
  <div class="player-card">
    <div class="card-content" :class="`step-${animationStep}`">
      <!-- Header -->
      <div class="header">
        <span class="gameweek">GAMEWEEK 11</span>
        <div class="team-badge">CITY</div>
      </div>

      <!-- Player Info -->
      <div class="player-info">
        <h1 class="name">{{ player.name }}</h1>
        <div class="meta">
          <span class="price">{{ player.price }}</span>
          <span class="position">{{ player.position }}</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <!-- <div class="stats-grid" v-show="animationStep >= 3">
        <StatItem label="Played" :value="player.minutes" suffix="min" />
        <StatItem label="Age" :value="player.age" />
        <StatItem label="Selected by" :value="player.selectedBy" />
        <StatItem label="Points per game" :value="player.pointsPerGame" />
        <StatItem label="Bonus" :value="player.bonus" />
        <StatItem label="Total points" :value="player.totalPoints" />
      </div> -->

      <!-- Fixtures -->
      <div class="fixtures" v-show="animationStep >= 4">
        <h3>Upcoming games</h3>
        <!-- <div class="fixture-list">
          <FixtureItem 
            v-for="(fixture, i) in player.fixtures" 
            :key="i"
            :difficulty="fixture.difficulty"
            :isHome="fixture.isHome"
            :index="i"
          />
        </div> -->
      </div>

      <!-- Goals & Assists -->
      <div class="attack-stats" v-show="animationStep >= 5">
        <div class="stat-circle">
          <span class="value">{{ player.goals }}</span>
          <label>GOALS</label>
        </div>
        <div class="stat-circle">
          <span class="value">{{ player.assists }}</span>
          <label>ASSISTS</label>
        </div>
      </div>

      <!-- Advanced Stats -->
      <div class="advanced-stats" v-show="animationStep >= 6">
        <div class="stat-row">
          <span>EXPECTED GOALS (xG)</span>
          <span class="value">{{ player.xG }}</span>
        </div>
        <div class="stat-row">
          <span>THREAT</span>
          <span class="value">{{ player.threat }}</span>
        </div>
      </div>

      <!-- Elite Comparison -->
      <div class="elite-bar" v-show="animationStep >= 7">
        <div class="bar-bg">
          <div class="bar-fill" :style="{ width: '70%' }"></div>
        </div>
        <span class="label">ELITE AVERAGE</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  player: Object,
  animationStep: { type: Number, default: 0 }
})
</script>

<style scoped>
.player-card {
  @apply w-full h-full p-8 text-white flex flex-col justify-center;
}

.card-content {
  @apply opacity-0 scale-90 transition-all duration-500;
}

.card-content.step-1 {
  @apply opacity-100 scale-100;
}

@keyframes fadeInUp {
  from { @apply opacity-0 translate-y-8; }
  to { @apply opacity-100 translate-y-0; }
}

.header, .player-info, .stats-grid, .fixtures, .attack-stats, .advanced-stats, .elite-bar {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

.header { animation-delay: 0.2s; }
.player-info { animation-delay: 0.4s; }
.stats-grid { animation-delay: 0.8s; }
.fixtures { animation-delay: 1.2s; }
.attack-stats { animation-delay: 1.6s; }
.advanced-stats { animation-delay: 2.0s; }
.elite-bar { animation-delay: 2.4s; }

/* Add more styles for StatItem, FixtureItem components */
</style>