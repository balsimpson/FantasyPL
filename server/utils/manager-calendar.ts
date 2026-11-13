import {
  getCalendarGameweeks,
  getCalendarSeason,
  getDeadlineCalendarEvents,
} from "~~/utils/deadline-calendar.js";
import { plannerPlayerName } from "../../utils/manager-planner";
import { getCachedFplBootstrap } from "./fpl-bootstrap";
import { getFplFixtureSchedule } from "./manager-fixtures";
import { stadiums2026 } from "./fpl-stadiums";

type ManagerPick = {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
};

export function readManagerCalendarId(id: string | undefined) {
  if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid Manager ID." });
  }
  return id;
}

async function getPublishedPicks(id: string, gameweek: number) {
  try {
    return await $fetch<ManagerPick[]>("/api/managers/picks", { query: { id, gw: gameweek }, retry: 0 });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return null;
    throw error;
  }
}

export async function getManagerCalendar(id: string, origin: string) {
  const [manager, { data }, fixtures] = await Promise.all([
    $fetch<{ name: string; current_event: number | null }>(`/api/managers/${id}`, { retry: 0 }),
    getCachedFplBootstrap(),
    getFplFixtureSchedule(),
  ]);
  const gameweeks = getCalendarGameweeks(data.events);
  if (!gameweeks) {
    throw createError({ statusCode: 503, statusMessage: "No published FPL deadlines are available." });
  }

  const now = new Date();
  const season = getCalendarSeason(gameweeks);
  const managerUrl = new URL(`/manager/${id}`, origin).href;
  const next = gameweeks.find((week) => Date.parse(week.deadline_time) > now.getTime());
  const current = gameweeks.findLast((week) => Date.parse(week.deadline_time) <= now.getTime());
  const currentPicks = current ? await getPublishedPicks(id, current.id) : null;
  const lastPublished = gameweeks.find((week) => week.id === manager.current_event && Date.parse(week.deadline_time) <= now.getTime());
  const lastPicks = currentPicks ?? (next && lastPublished && lastPublished.id !== current?.id
    ? await getPublishedPicks(id, lastPublished.id)
    : null);
  const players = new Map<number, Record<string, any>>(data.elements.map((player: Record<string, any>) => [player.id, player]));
  const clubs = new Map<number, { name: string; code: number }>(
    data.teams.map((team: Record<string, any>) => [team.id, { name: team.name, code: team.code }]),
  );

  const nextFixtures = fixtures.filter((fixture) => fixture.event === next?.id);
  const scheduledClubs = new Set(nextFixtures.flatMap((fixture) => [fixture.team_h, fixture.team_a]));
  const playersWithoutFixture = scheduledClubs.size ? (lastPicks ?? []).flatMap((pick) => {
    const player = players.get(pick.element);
    return pick.position <= 11 && player && !scheduledClubs.has(player.team) ? [plannerPlayerName(player)] : [];
  }) : [];
  const deadlines = getDeadlineCalendarEvents(gameweeks, origin, now).map((deadline) => {
    const details = [`Review your team for Gameweek ${deadline.deadlineGameweek}.`];
    if (deadline.deadlineGameweek === next?.id && playersWithoutFixture.length) {
      details.push(`Players from your last published XI with no scheduled fixture: ${playersWithoutFixture.join(", ")}.`);
    }
    return { ...deadline, description: [...details, managerUrl].join("\n"), url: managerUrl };
  });
  const matches = fixtures.flatMap((fixture) => {
    const confirmed = fixture.event === current?.id && Boolean(currentPicks);
    const kickoff = typeof fixture.kickoff_time === "string" ? Date.parse(fixture.kickoff_time) : NaN;
    const isUpcoming = (fixture.event === next?.id || fixture.event === current?.id) && kickoff >= now.getTime();
    const picks = confirmed ? currentPicks : isUpcoming ? lastPicks : null;
    const home = clubs.get(fixture.team_h);
    const away = clubs.get(fixture.team_a);
    if (!picks || !home || !away || !Number.isFinite(kickoff)) return [];

    const matchPicks = picks.flatMap((pick) => {
      const player = players.get(pick.element);
      if (!player || (player.team !== fixture.team_h && player.team !== fixture.team_a)) return [];
      const name = plannerPlayerName(player);
      const role: "C" | "VC" | "" = confirmed && pick.is_captain ? "C" : confirmed && pick.is_vice_captain ? "VC" : "";
      return [{ name, shortName: player.web_name || name, role, position: pick.position }];
    });
    const starters = matchPicks.filter((pick) => pick.position <= 11);
    if (!starters.length) return [];

    const roleOrder = { C: 0, VC: 1, "": 2 };
    starters.sort((left, right) => roleOrder[left.role] - roleOrder[right.role] || left.position - right.position);
    const playerNames = starters.map((pick) => pick.role ? `${pick.name} (${pick.role})` : pick.name);
    const lead = starters[0]!;
    const leadName = lead.role ? `${lead.shortName} (${lead.role})` : lead.shortName;
    const matchTitle = `${home.name} vs ${away.name} · GW${fixture.event}`;
    const lineupLabel = confirmed ? "Your FPL starters" : "Your last published XI";
    const details = [matchTitle, `${lineupLabel}: ${playerNames.join(", ")}`];
    if (confirmed) {
      const bench = matchPicks.filter((pick) => pick.position > 11).map((pick) => pick.name);
      if (bench.length) details.push(`Bench: ${bench.join(", ")}`);
    }
    details.push(managerUrl);

    return [{
      uid: `fpl-${season}-manager-${id}-fixture-${fixture.id}@sportsync.in`,
      start: new Date(kickoff).toISOString(),
      title: `${leadName} · ${matchTitle}`,
      matchTitle,
      playerNames,
      location: season === 2026 ? stadiums2026[home.code] : undefined,
      description: details.join("\n"),
      url: managerUrl,
    }];
  });

  return {
    name: `${manager.name} · FPL Calendar`,
    events: [...deadlines, ...matches].sort((left, right) => left.start.localeCompare(right.start)),
    now,
  };
}
