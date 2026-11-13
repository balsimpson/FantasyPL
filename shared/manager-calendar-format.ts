export const matchTitleLabels = {
  player: "Player",
  form: "Form",
  points: "Total points",
  gwPoints: "Gameweek points",
  lastPoints: "Last gameweek points",
  cost: "Cost",
  fixture: "Fixture",
  gameweek: "Gameweek",
} as const;

export type MatchTitlePart = keyof typeof matchTitleLabels;
export type MatchTitleValues = Partial<Record<MatchTitlePart, string>> & { fixture: string };

export const matchTitleParts = Object.keys(matchTitleLabels) as MatchTitlePart[];
export const defaultMatchTitle: MatchTitlePart[] = ["player", "form", "points", "fixture", "gameweek"];

export function readMatchTitle(value: unknown): MatchTitlePart[] {
  if (typeof value !== "string" || value.length > matchTitleParts.join(",").length) return defaultMatchTitle;
  const parts = value.split(",").filter((part): part is MatchTitlePart =>
    Object.hasOwn(matchTitleLabels, part),
  );
  return parts.length ? [...new Set(parts)] : defaultMatchTitle;
}

export function matchTitleSearch(parts: MatchTitlePart[]) {
  const title = parts.join(",");
  return title === defaultMatchTitle.join(",") ? "" : `?${new URLSearchParams({ title })}`;
}

export function formatMatchTitle(values: MatchTitleValues, parts = defaultMatchTitle) {
  return parts.map((part) => values[part]).filter(Boolean).join(" · ") || values.fixture;
}
