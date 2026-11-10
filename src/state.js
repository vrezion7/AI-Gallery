export const KEY = "ai-gallery.state.v1";
export function sanitize(raw, ids) {
  const valid = new Set(ids);
  const seen = new Set();
  const collectedIds = (
    Array.isArray(raw?.collectedIds) ? raw.collectedIds : []
  ).filter(
    (id) =>
      typeof id === "string" && valid.has(id) && !seen.has(id) && seen.add(id),
  );
  const p = raw?.pendingReveal;
  return {
    schemaVersion: 1,
    collectedIds,
    pendingReveal: typeof p === "string" && collectedIds.includes(p) ? p : null,
  };
}
// Featured characters are part of the collection from the start, so Summon only ever
// draws from the Mystery characters (not featured) that have not been collected yet.
export function choose(state, registry, random = Math.random) {
  const pool = Object.values(registry).filter(
    (c) => !c.featured && !state.collectedIds.includes(c.id),
  );
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))].id;
}
// Everything the visitor owns: Featured first (archive order), then Summon discoveries in the
// order they were found. Saves from older versions may already list a Featured ID in
// collectedIds; it is counted once.
export function ownedIds(state, registry) {
  const featured = Object.values(registry)
    .filter((c) => c.featured)
    .sort((a, b) => a.archiveOrder - b.archiveOrder)
    .map((c) => c.id);
  const featuredSet = new Set(featured);
  return [
    ...featured,
    ...state.collectedIds.filter((id) => !featuredSet.has(id)),
  ];
}
export function acquire(state, id) {
  return {
    ...state,
    collectedIds: [...state.collectedIds, id],
    pendingReveal: id,
  };
}
