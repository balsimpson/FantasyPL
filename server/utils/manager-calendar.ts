import {
  getCalendarGameweeks,
  getCalendarSeason,
  getDeadlineCalendarEvents,
} from "~~/utils/deadline-calendar.js";
import { plannerPlayerName } from "../../utils/manager-planner";
import { getCachedFplBootstrap } from "./fpl-bootstrap";
import { getFplFixtureSchedule } from "./manager-fixtures";

type ManagerPick = {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
};

export function readManagerCalendarParams(id: string | undefined, xi: unknown) {
  if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid Manager ID." });
  }
  if (xi !== undefined && xi !== "1") {
    throw createError({ statusCode: 400, statusMessage: "Invalid calendar option." });
  }
  return { id, includeStartingXI: xi === "1" };
}

async function getPublishedPicks(id: string, gameweek: number) {
  try {
    return await $fetch<ManagerPick[]>("/api/managers/picks", { query: { id, gw: gameweek }, retry: 0 });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return null;
    throw error;
  }
}

export async function getManagerCalendar(id: string, includeStartingXI: boolean, origin: string) {
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
  const clubs = new Map<number, string>(data.teams.map((team: Record<string, any>) => [team.id, team.name]));

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
      const role = pick.is_captain ? "Captain" : pick.is_vice_captain ? "Vice-captain" : "";
      return [{ name: plannerPlayerName(player), role, position: pick.position, home: player.team === fixture.team_h }];
    });
    const relevantPicks = matchPicks.filter((pick) => pick.role || (includeStartingXI && pick.position <= 11));
    if (!relevantPicks.length) return [];

    const match = `${home} vs ${away}`;
    const lead = relevantPicks.find((pick) => pick.role === "Captain") ?? relevantPicks.find((pick) => pick.role === "Vice-captain");
    const title = confirmed && lead
      ? `Your ${lead.role.toLowerCase()} ${lead.name} faces ${lead.home ? away : home}`
      : match;
    const details = [match];
    if (confirmed) {
      for (const pick of matchPicks) {
        const label = pick.role || (pick.position <= 11 ? "Starting XI" : "Bench");
        details.push(`${label}: ${pick.name}`);
      }
    }
    details.push(managerUrl);

    return [{
      uid: `fpl-${season}-manager-${id}-fixture-${fixture.id}@sportsync.in`,
      start: new Date(kickoff).toISOString(),
      title: `GW${fixture.event} · ${title}`,
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
