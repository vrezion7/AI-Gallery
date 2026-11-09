import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sanitize, choose, acquire } from "../src/state.js";
const registry = JSON.parse(fs.readFileSync(new URL("../data/characters.json", import.meta.url))),
  ids = Object.keys(registry);
test("corrupt, unknown and duplicate IDs sanitized; pending must be owned", () => {
  assert.deepEqual(
    sanitize(
      { collectedIds: ["bad", "G-002", "G-002", null, "G-001"], pendingReveal: "G-005" },
      ids,
    ),
    { schemaVersion: 1, collectedIds: ["G-002", "G-001"], pendingReveal: null },
  );
  assert.deepEqual(sanitize(null, ids).collectedIds, []);
});
test("every first draw interval selects a mystery; featured remain unowned", () => {
  for (let i = 0; i < 600; i++) {
    const id = choose(sanitize(null, ids), registry, () => i / 600);
    assert.equal(registry[id].featured, false);
  }
});
test("nine pulls complete without duplicates over 1000 random runs; persistence retains pending", () => {
  for (let run = 0; run < 1000; run++) {
    let s = sanitize(null, ids);
    for (let n = 0; n < 9; n++) {
      const id = choose(s, registry);
      assert.ok(id);
      assert.ok(!s.collectedIds.includes(id));
      s = acquire(s, id);
      s = sanitize(JSON.parse(JSON.stringify(s)), ids);
      assert.equal(s.pendingReveal, id);
    }
    assert.equal(new Set(s.collectedIds).size, 9);
    assert.equal(choose(s, registry), null);
  }
});
test("later selection equally partitions remaining Mystery IDs only", () => {
  const s = acquire(sanitize(null, ids), "G-001"),
    pool = ids.filter((i) => i !== "G-001" && !registry[i].featured);
  assert.equal(pool.length, 5);
  for (let i = 0; i < pool.length; i++)
    assert.equal(
      choose(s, registry, () => (i + 0.5) / pool.length),
      pool[i],
    );
});
test("all six Mystery characters come before any Featured, over 1000 random runs", () => {
  const mysteryCount = ids.filter((i) => !registry[i].featured).length;
  for (let run = 0; run < 1000; run++) {
    let s = sanitize(null, ids);
    for (let n = 0; n < 9; n++) {
      const id = choose(s, registry);
      assert.equal(registry[id].featured, n >= mysteryCount, `pull ${n + 1} returned ${id}`);
      s = acquire(s, id);
    }
  }
});
test("Featured become available once Mysteries are exhausted, even with old saved progress", () => {
  // Progress saved under the old rule may already hold a Featured character.
  let s = sanitize({ collectedIds: ["G-006", "G-002"] }, ids);
  const seen = [];
  while (true) {
    const id = choose(s, registry);
    if (!id) break;
    seen.push(id);
    s = acquire(s, id);
  }
  assert.deepEqual(
    seen.slice(0, 5).every((id) => !registry[id].featured),
    true,
  );
  assert.deepEqual(seen.slice(5).sort(), ["G-005", "G-009"]);
});
test("archive fixed slots and featured set", () => {
  assert.deepEqual(
    Object.values(registry)
      .filter((c) => c.featured)
      .map((c) => c.id),
    ["G-002", "G-005", "G-009"],
  );
  assert.deepEqual(
    Object.values(registry)
      .sort((a, b) => a.archiveOrder - b.archiveOrder)
      .slice(0, 6)
      .map((c) => c.id),
    ["G-002", "G-001", "G-005", "G-003", "G-009", "G-004"],
  );
});
