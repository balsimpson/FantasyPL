<template>
	<div>
		<!-- <pre>{{ team }}</pre> -->
		<div v-if="alignment == 'left'">
			<div class="grid items-center grid-cols-4">
				<div
					class="col-span-3 pr-2 font-bold"
					:class="[size && size == 'large' ? 'text-2xl' : '']"
				>
					{{ team.name }}
				</div>
				<img
					:src="`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`"
					:alt="team.name"
					:class="[size && size == 'large' ? 'w-12' : 'w-6']"
				/>
			</div>
		</div>

		<div v-else >
            <div class="grid items-center grid-cols-4">
                <img
				:src="`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`"
				:alt="team.name"
				:class="[size && size == 'large' ? 'w-12' : 'w-6']"
			/>
			<div
				class="col-span-3 pl-2 font-bold"
				:class="[size && size == 'large' ? 'text-2xl' : '']"
			>
				{{ team.name }}
			</div>
            </div>
			
		</div>
	</div>
</template>

<script setup>
	const props = defineProps({
		team: {
			type: Object,
			required: true,
		},
		size: {
			type: String,
		},
		alignment: {
			type: String,
			default: "left",
		},
	});
</script>
