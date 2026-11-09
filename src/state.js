export const KEY = "ai-gallery.state.v1";
export function sanitize(raw, ids) {
  const valid = new Set(ids);
  const seen = new Set();
  const collectedIds = (Array.isArray(raw?.collectedIds) ? raw.collectedIds : []).filter(
    (id) => typeof id === "string" && valid.has(id) && !seen.has(id) && seen.add(id),
  );
  const p = raw?.pendingReveal;
  return {
    schemaVersion: 1,
    collectedIds,
    pendingReveal: typeof p === "string" && collectedIds.includes(p) ? p : null,
  };
}
// Mystery characters are always drawn first, so every early pull is a real reveal.
// Featured characters (already visible in the Archive) only enter the pool once
// every Mystery has been collected.
export function choose(state, registry, random = Math.random) {
  const remaining = Object.values(registry).filter((c) => !state.collectedIds.includes(c.id));
  const mysteries = remaining.filter((c) => !c.featured);
  const pool = mysteries.length ? mysteries : remaining;
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))].id;
}
export function acquire(state, id) {
  return { ...state, collectedIds: [...state.collectedIds, id], pendingReveal: id };
}
