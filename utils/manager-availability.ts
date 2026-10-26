type ManagerPlayerAvailability = {
  status?: unknown;
  chance_of_playing_next_round?: unknown;
};

export function isManagerPlayerAvailable(player: ManagerPlayerAvailability): boolean {
  if (player.status !== 'a') return false;
  const chance = player.chance_of_playing_next_round;
  // FPL can omit the playing chance for an available, unflagged player.
  return chance === null || chance === undefined || chance === '' || Number(chance) === 100;
}
