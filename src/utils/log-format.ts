const MAX_STRING_LENGTH = 5000;

const truncateString = (value: string) =>
  value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...<truncated>`
    : value;

const normalizeForJson = (value: unknown, seen = new WeakSet()): unknown => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "string") {
    try {
      return normalizeForJson(JSON.parse(value), seen);
    } catch {
      return truncateString(value);
    }
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForJson(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      normalizeForJson(entryValue, seen),
    ])
  );
};

export const formatForLog = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      return truncateString(JSON.stringify(normalizeForJson(JSON.parse(value)), null, 2));
    } catch {
      return truncateString(value);
    }
  }

  return truncateString(JSON.stringify(normalizeForJson(value), null, 2));
};
