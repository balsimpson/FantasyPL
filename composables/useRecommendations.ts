
import { computeScores } from './usePremiereLeague';

export const getSmartRecommendations = (players: any[]) => {
    if (!players || players.length === 0) return [];

    // 1. Calculate scores if not already calculated (though computeScores does it)
    // We use computeScores to get a robust performance metric
    const scored = computeScores(players);

    // 2. Filter available players only
    const available = scored.filter(p => p.status === 'a');

    // Helper to pick random items from an array
    const pickRandom = (arr: any[], count: number) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // 3. Define Buckets

    // A. The Essentials (Top 20 by Score) - High performing, reliable
    const topOverall = [...available]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

    // B. The Differentials (Ownership < 10%, Top 20 by Score within that group)
    const differentials = available
        .filter(p => parseFloat(p.selected_by_percent) < 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

    // C. Value Gems (Top 20 by Score/Cost ratio)
    const valueGems = available
        .sort((a, b) => (b.score / b.now_cost) - (a.score / a.now_cost))
        .slice(0, 20);

    // D. Form Kings (Top 20 by Form)
    const formKings = available
        .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
        .slice(0, 20);

    // E. Rising Stars (High transfers in, low ownership)
    const risingStars = available
        .filter(p => parseFloat(p.selected_by_percent) < 15)
        .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
        .slice(0, 20);

    // 4. Selection Strategy
    // We want a mix of these categories.
    // We'll use a Set to avoid duplicates.
    const selectedIds = new Set();
    const recommendations: any[] = [];

    const addRecommendation = (category: string, candidates: any[]) => {
        // Filter out already selected
        const validCandidates = candidates.filter(p => !selectedIds.has(p.id));

        if (validCandidates.length > 0) {
            // Pick one random from the top candidates of this category
            // We pick from the top 5 of the valid candidates to ensure quality while keeping variety
            const topBatch = validCandidates.slice(0, 5);
            const winner = topBatch[Math.floor(Math.random() * topBatch.length)];

            selectedIds.add(winner.id);
            recommendations.push({
                ...winner,
                recommendationType: category
            });
        }
    };

    // Build the list
    addRecommendation('Essential Pick', topOverall);
    addRecommendation('Differential', differentials);
    addRecommendation('Value Gem', valueGems);
    addRecommendation('Form King', formKings);
    addRecommendation('Rising Star', risingStars);

    // Add a couple more randoms from top overall to fill it out
    addRecommendation('Top Performer', topOverall);
    addRecommendation('Under the Radar', differentials);

    return recommendations;
};
