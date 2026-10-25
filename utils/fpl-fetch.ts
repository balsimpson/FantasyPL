type FplRecord = Record<string, any>;

export function isFplBootstrap(data: unknown): data is FplRecord {
  const value = data as FplRecord | null;
  return Boolean(value && Array.isArray(value.elements) && value.elements.length
    && Array.isArray(value.events) && value.events.length
    && Array.isArray(value.teams) && value.teams.length);
}

// Retry a short upstream interruption once. Refused and missing resources are not retried.
export async function fetchFplJson<T>(url: string, validate: (data: unknown) => data is T): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let statusCode = 502;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      statusCode = response.status;
      if (!response.ok) throw new Error("FPL request failed");
      const data: unknown = await response.json();
      if (!validate(data)) throw new Error("Invalid FPL response");
      return data;
    } catch {
      const transient = statusCode < 400 || [408, 429, 500, 502, 503, 504].includes(statusCode);
      if (attempt === 0 && transient) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      throw Object.assign(new Error("FPL data is temporarily unavailable"), {
        statusCode: statusCode >= 400 ? statusCode : 502,
      });
    }
  }
}
