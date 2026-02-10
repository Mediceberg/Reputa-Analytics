export const toStringParam = (value: unknown) => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? String(first) : undefined;
  }
  if (typeof value === 'string') {
    return String(value);
  }
  return undefined;
};

export const toNumberParam = (value: unknown, fallback: number) => {
  const raw = toStringParam(value);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};
