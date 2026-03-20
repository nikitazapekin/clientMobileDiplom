export const compareOutputs = (actual: any, expected: any): boolean => {
  if (actual == null && expected == null) return true;

  if (actual == null || expected == null) return false;

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;

    return actual.every(
      (item, index) => JSON.stringify(item) === JSON.stringify(expected[index])
    );
  }

  if (typeof actual === "object" && typeof expected === "object") {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  return String(actual).trim() === String(expected).trim();
};
