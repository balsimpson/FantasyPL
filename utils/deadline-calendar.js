const reminderMinutes = [24 * 60, 2 * 60, 15];

function escapeCalendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toCalendarDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line) {
  const encoder = new TextEncoder();
  const folded = [];
  let current = "";
  let byteLength = 0;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    if (byteLength + characterBytes > 75) {
      folded.push(current);
      current = ` ${character}`;
      byteLength = 1 + characterBytes;
    } else {
      current += character;
      byteLength += characterBytes;
    }
  }

  folded.push(current);
  return folded.join("\r\n");
}

function makeAlarm(gameweek, minutes) {
  const reminderText = minutes === 15
    ? `Update your team before the Gameweek ${gameweek} deadline`
    : `Gameweek ${gameweek} deadline is approaching`;
  const trigger = minutes >= 60 ? `-PT${minutes / 60}H` : `-PT${minutes}M`;

  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeCalendarText(reminderText)}`,
    `TRIGGER:${trigger}`,
    "END:VALARM",
  ];
}

/**
 * @param {unknown} events
 * @returns {{ id: number, deadline_time: string }[] | null}
 */
export function getCalendarGameweeks(events) {
  if (!Array.isArray(events)) return null;
  const publishedEvents = events
    .filter((gameweek) => Number.isInteger(gameweek?.id) && typeof gameweek.deadline_time === "string" && !Number.isNaN(new Date(gameweek.deadline_time).getTime()))
    .sort((left, right) => left.id - right.id);

  return publishedEvents.length ? publishedEvents : null;
}

/** @param {{ id: number, deadline_time: string }[]} publishedEvents */
export function getCalendarSeason(publishedEvents) {
  const firstGameweek = publishedEvents.find((gameweek) => gameweek.id === 1) || publishedEvents[0];
  return new Date(firstGameweek.deadline_time).getUTCFullYear();
}

/**
 * @param {{ id: number, deadline_time: string }[]} publishedEvents
 * @param {string} siteUrl
 */
export function getDeadlineCalendarEvents(publishedEvents, siteUrl, now = new Date()) {
  const season = getCalendarSeason(publishedEvents);
  return publishedEvents.filter((gameweek) => Date.parse(gameweek.deadline_time) >= now.getTime()).map((gameweek) => ({
    uid: `fpl-deadline-${season}-gw-${gameweek.id}@sportsync.in`,
    start: new Date(gameweek.deadline_time).toISOString(),
    durationMinutes: 15,
    title: `Gameweek ${gameweek.id} deadline`,
    description: [
      `Make your transfers and update your team before the Gameweek ${gameweek.id} deadline.`,
      "",
      `FPL Insights: ${siteUrl}`,
      "Official Fantasy Premier League: https://fantasy.premierleague.com/",
    ].join("\n"),
    url: siteUrl,
    deadlineGameweek: gameweek.id,
  }));
}

/**
 * @param {string} name
 * @param {{ uid: string, start: string, durationMinutes?: number, title: string, location?: string, description: string, url: string, deadlineGameweek?: number }[]} events
 * @param {Date} now
 */
export function serializeCalendarFeed(name, events, now = new Date()) {
  const stamp = toCalendarDate(now);
  const eventLines = events.flatMap((event) => {
    const start = new Date(event.start);
    const end = event.durationMinutes ? new Date(start.getTime() + event.durationMinutes * 60 * 1000) : null;
    return [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toCalendarDate(start)}`,
      ...(end ? [`DTEND:${toCalendarDate(end)}`] : []),
      `SUMMARY:${escapeCalendarText(event.title)}`,
      ...(event.location ? [`LOCATION:${escapeCalendarText(event.location)}`] : []),
      `DESCRIPTION:${escapeCalendarText(event.description)}`,
      `URL:${event.url}`,
      ...(event.deadlineGameweek ? reminderMinutes.flatMap((minutes) => makeAlarm(event.deadlineGameweek, minutes)) : []),
      "END:VEVENT",
    ];
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FPL Insights//FPL Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeCalendarText(name)}`,
    ...eventLines,
    "END:VCALENDAR",
    "",
  ].map(foldLine).join("\r\n");
}

export function createDeadlineCalendarFeed(events, siteUrl = "https://www.sportsync.in", now = new Date()) {
  const gameweeks = getCalendarGameweeks(events);
  return gameweeks ? serializeCalendarFeed("FPL Deadlines", getDeadlineCalendarEvents(gameweeks, siteUrl, now), now) : null;
}
