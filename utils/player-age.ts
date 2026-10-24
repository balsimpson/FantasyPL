export function getPlayerAge(birthDate: unknown, asOf: string | Date = new Date()): number | null {
  if (typeof birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const today = asOf instanceof Date ? asOf : new Date(`${asOf}T00:00:00Z`);
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(today.getTime())) return null;
  if (birth.toISOString().slice(0, 10) !== birthDate || birth > today) return null;

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth()
    || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}
