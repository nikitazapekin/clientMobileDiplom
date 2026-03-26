const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value)
);

export const hasExpectedOutputValue = (value: unknown): boolean => (
  value !== undefined &&
  (typeof value !== "string" || value.trim() !== "")
);

export const normalizeOutputValue = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

export const stringifyOutputValue = (value: unknown): string => {
  const normalized = normalizeOutputValue(value);

  if (normalized === undefined) {
    return "undefined";
  }

  if (typeof normalized === "string") {
    return normalized;
  }

  try {
    return JSON.stringify(normalized);
  } catch {
    return String(normalized);
  }
};

const compareNormalizedOutputs = (actual: unknown, expected: unknown): boolean => {
  if (actual == null && expected == null) return true;

  if (actual == null || expected == null) return false;

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return false;
    }

    return expected.every((item, index) => compareNormalizedOutputs(actual[index], item));
  }

  if (isPlainObject(expected)) {
    if (!isPlainObject(actual)) {
      return false;
    }

    return Object.entries(expected).every(([key, value]) => (
      compareNormalizedOutputs(actual[key], value)
    ));
  }

  if (Array.isArray(actual) || isPlainObject(actual)) {
    return false;
  }

  return String(actual).trim() === String(expected).trim();
};

export const compareOutputs = (actual: unknown, expected: unknown): boolean => (
  compareNormalizedOutputs(
    normalizeOutputValue(actual),
    normalizeOutputValue(expected)
  )
);
