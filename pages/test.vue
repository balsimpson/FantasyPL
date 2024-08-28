<template>
	<div>
		<p v-if="loading">Loading...</p>
		<p v-else-if="error">Error: {{ error }}</p>
		<div v-else-if="data">
			<!-- Display your data here -->
			<pre>{{ JSON.stringify(data, null, 2) }}</pre>
		</div>
		<button @click="fetchData">Fetch Data</button>
	</div>
</template>

<script setup>
	// No need for import statement
	const { data, loading, error, fetchData } = useApiData();

	// If you want to fetch data when the component mounts:
	//   onMounted(() => {
	//     fetchData()
	//   })
</script>
