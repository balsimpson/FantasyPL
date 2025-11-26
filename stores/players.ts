import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

// Adapted Player type to match FPL data structure loosely or use any for flexibility initially
export type Player = any;

export const usePlayersStore = defineStore("players", () => {
    const players: Ref<Player[]> = ref([]);
    const bootstrap = ref<any>(null); // Store the full bootstrap object
    const loading = ref(false);
    const error = ref<string | null>(null);
    const initialLoadComplete = ref(false);

    async function fetchPlayers(force = false) {
        if (bootstrap.value && !force) return bootstrap.value;

        loading.value = true;
        error.value = null;

        try {
            const data = await $fetch('/api/bootstrap-static');

            if (!data) throw new Error("No data returned from API");

            bootstrap.value = data;
            players.value = data.elements || []; // Populate players ref for convenience
            initialLoadComplete.value = true;
        } catch (e: any) {
            console.error("Error fetching players:", e);
            error.value = e.message;
        } finally {
            loading.value = false;
        }

        return bootstrap.value;
    }

    return {
        players,
        bootstrap,
        loading,
        error,
        initialLoadComplete,
        fetchPlayers
    };
});
