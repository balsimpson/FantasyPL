export const managerTransferPlans = [
  { value: 'none', label: 'No chip planned' },
  { value: 'bboost', label: 'Bench Boost' },
  { value: 'wildcard', label: 'Wildcard' },
  { value: 'freehit', label: 'Free Hit' },
  { value: '3xc', label: 'Triple Captain' },
] as const;

export type ManagerTransferChip = typeof managerTransferPlans[number]['value'];

export const managerTransferGuidance: Record<ManagerTransferChip, string> = {
  none: 'Keep the suggested XI. Review availability and useful cover among the players left out. A healthy bench player does not need a transfer just because they are on the bench.',
  bboost: 'All 15 players score this week. Check the bench goalkeeper and every outfield substitute for availability, playing time and a scheduled match.',
  wildcard: 'Review the full squad across the upcoming fixture run. These are individual replacements, not a complete Wildcard squad with a shared budget.',
  freehit: 'Focus on this gameweek only. Free Hit changes are temporary; your permanent squad returns afterwards. These are individual options, not a complete Free Hit squad.',
  '3xc': 'Keep the suggested XI and check your captain’s fitness, playing time and fixtures before using Triple Captain. A bench repair does not improve the captain’s tripled score.',
};
