import {
  getCalendarGameweeks,
  getCalendarSeason,
  getDeadlineCalendarEvents,
} from "~~/utils/deadline-calendar.js";
import { plannerPlayerName } from "../../utils/manager-planner";
import { fetchFplJson } from "../../utils/fpl-fetch";
import { formatMatchTitle, type MatchTitlePart, type MatchTitleValues } from "../../shared/manager-calendar-format";
import { getCachedFplBootstrap } from "./fpl-bootstrap";
import { getFplFixtureSchedule } from "./manager-fixtures";
import { stadiums2026 } from "./fpl-stadiums";

type ManagerPick = {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
};

const getGameweekPoints = defineCachedFunction(async (_season: number, gameweek: number) => {
  const data = await fetchFplJson(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`,
    (value): value is { elements: { id: number; stats?: { total_points?: number } }[] } =>
      Boolean(value && typeof value === "object" && "elements" in value && Array.isArray(value.elements)));
  return Object.fromEntries(data.elements.flatMap(({ id, stats }) =>
    Number.isInteger(id) && Number.isInteger(stats?.total_points) ? [[id, stats!.total_points]] : [],
  ));
}, { name: "manager-calendar-gameweek-points", maxAge: 600 });

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

export async function getManagerCalendar(id: string, origin: string, titleParts?: MatchTitlePart[]) {
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
  const pointsWeek = data.events.find((week: Record<string, any>) => week.is_current === true)?.id;
  const lastFinishedWeek = gameweeks.findLast((week) => data.events.some((event: Record<string, any>) =>
    event.id === week.id && event.finished === true))?.id;
  const clubsWithLivePoints = new Set(fixtures
    .filter((fixture) => fixture.event === pointsWeek && fixture.started)
    .flatMap((fixture) => [fixture.team_h, fixture.team_a]));
  const [currentPicks, lastPointsByPlayer] = await Promise.all([
    current ? getPublishedPicks(id, current.id) : null,
    lastFinishedWeek && lastFinishedWeek !== pointsWeek && (!titleParts || titleParts.includes("lastPoints"))
      ? getGameweekPoints(season, lastFinishedWeek).catch(() => undefined)
      : undefined,
  ]);
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
      details.push(`Players with no scheduled fixture: ${playersWithoutFixture.join(", ")}.`);
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

    const starters = picks.flatMap((pick) => {
      const player = players.get(pick.element);
      if (pick.position > 11 || !player || (player.team !== fixture.team_h && player.team !== fixture.team_a)) return [];
      const role: "C" | "VC" | "" = confirmed && pick.is_captain ? "C" : confirmed && pick.is_vice_captain ? "VC" : "";
      const points = typeof player.total_points === "number" && Number.isFinite(player.total_points) ? player.total_points : undefined;
      const hasGameweekPoints = fixture.event === pointsWeek && clubsWithLivePoints.has(player.team);
      const gwPoints = hasGameweekPoints && Number.isInteger(player.event_points) ? player.event_points : undefined;
      const lastPoints = lastFinishedWeek && lastFinishedWeek === pointsWeek ? player.event_points : lastPointsByPlayer?.[player.id];
      const cost = Number.isInteger(player.now_cost) && player.now_cost > 0 ? player.now_cost / 10 : undefined;
      const form = typeof player.form === "string" && player.form.trim() && Number.isFinite(Number(player.form)) ? player.form : undefined;
      return [{ name: player.web_name || plannerPlayerName(player), team: player.team, role, position: pick.position, points, gwPoints, lastPoints, cost, form }];
    });
    if (!starters.length) return [];

    const roleOrder = { C: 0, VC: 1, "": 2 };
    starters.sort((left, right) => roleOrder[left.role] - roleOrder[right.role] || left.position - right.position);
    const lead = starters[0]!;
    const titleValues: MatchTitleValues = {
      player: lead.role ? `${lead.name} (${lead.role})` : lead.name,
      form: lead.form,
      points: lead.points === undefined ? undefined : `${lead.points} pts`,
      gwPoints: lead.gwPoints === undefined ? undefined : `${lead.gwPoints} GW pts`,
      lastPoints: Number.isInteger(lead.lastPoints) ? `${lead.lastPoints} pts (GW${lastFinishedWeek})` : undefined,
      cost: lead.cost === undefined ? undefined : `£${lead.cost.toFixed(1)}m`,
      fixture: lead.team === fixture.team_h
        ? `${home.name} vs ${away.name}`
        : `${away.name} vs ${home.name}`,
      gameweek: `GW${fixture.event}`,
    };

    return [{
      uid: `fpl-${season}-manager-${id}-fixture-${fixture.id}@sportsync.in`,
      start: new Date(kickoff).toISOString(),
      durationMinutes: 90,
      title: formatMatchTitle(titleValues, titleParts),
      titleValues,
      location: season === 2026 ? stadiums2026[home.code] : undefined,
      url: managerUrl,
    }];
  });

  return {
    name: `${manager.name} · FPL Calendar`,
    events: [...deadlines, ...matches].sort((left, right) => left.start.localeCompare(right.start)),
    now,
  };
}
