const reminderMinutes = [24 * 60, 2 * 60, 15];

function escapeCalendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
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

export function createDeadlineCalendarFeed(events, siteUrl = "https://www.sportsync.in", now = new Date()) {
  if (!Array.isArray(events)) return null;

  const publishedEvents = events
    .filter((gameweek) => Number.isInteger(gameweek?.id) && typeof gameweek.deadline_time === "string" && !Number.isNaN(new Date(gameweek.deadline_time).getTime()))
    .sort((left, right) => left.id - right.id);

  if (!publishedEvents.length) return null;

  const firstGameweek = publishedEvents.find((gameweek) => gameweek.id === 1) || publishedEvents[0];
  const season = new Date(firstGameweek.deadline_time).getUTCFullYear();
  const stamp = toCalendarDate(now);
  const upcomingEvents = publishedEvents.filter((gameweek) => new Date(gameweek.deadline_time).getTime() >= new Date(now).getTime());
  const eventLines = upcomingEvents.flatMap((gameweek) => {
    const start = new Date(gameweek.deadline_time);
    const finish = new Date(start.getTime() + 15 * 60 * 1000);
    const description = escapeCalendarText([
      `Make your transfers and update your team before the Gameweek ${gameweek.id} deadline.`,
      "",
      `FPL Insights: ${siteUrl}`,
      "Official Fantasy Premier League: https://fantasy.premierleague.com/",
    ].join("\n"));

    return [
      "BEGIN:VEVENT",
      `UID:fpl-deadline-${season}-gw-${gameweek.id}@sportsync.in`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toCalendarDate(start)}`,
      `DTEND:${toCalendarDate(finish)}`,
      `SUMMARY:${escapeCalendarText(`Gameweek ${gameweek.id} deadline`)}`,
      `DESCRIPTION:${description}`,
      `URL:${siteUrl}`,
      ...reminderMinutes.flatMap((minutes) => makeAlarm(gameweek.id, minutes)),
      "END:VEVENT",
    ];
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FPL Insights//FPL Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:FPL Deadlines",
    ...eventLines,
    "END:VCALENDAR",
    "",
  ].map(foldLine).join("\r\n");
}
