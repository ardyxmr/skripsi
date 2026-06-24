// Resolve only after at least `ms` have elapsed since `start` (a Date.now() taken when
// the work began). Used to keep a refresh-spinner visible for at least one full rotation
// even when the underlying refetch resolves near-instantly (otherwise the icon just
// "vibrates"). `animate-spin` is a 1s/rotation animation, so the default guarantees one
// complete turn.
export const ensureMinDuration = (start, ms = 1000) => {
  const elapsed = Date.now() - start;
  return elapsed < ms ? new Promise((resolve) => setTimeout(resolve, ms - elapsed)) : Promise.resolve();
};
