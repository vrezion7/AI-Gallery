import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sanitize, choose, acquire, ownedIds } from "../src/state.js";
const registry = JSON.parse(
    fs.readFileSync(new URL("../data/characters.json", import.meta.url)),
  ),
  ids = Object.keys(registry);
test("corrupt, unknown and duplicate IDs sanitized; pending must be owned", () => {
  assert.deepEqual(
    sanitize(
      {
        collectedIds: ["bad", "G-002", "G-002", null, "G-001"],
        pendingReveal: "G-005",
      },
      ids,
    ),
    { schemaVersion: 1, collectedIds: ["G-002", "G-001"], pendingReveal: null },
  );
  assert.deepEqual(sanitize(null, ids).collectedIds, []);
});
test("Summon never draws a Featured character", () => {
  for (let i = 0; i < 600; i++) {
    const id = choose(sanitize(null, ids), registry, () => i / 600);
    assert.equal(registry[id].featured, false);
  }
});
test("ten pulls exhaust the Mystery pool without duplicates, over 1000 random runs", () => {
  const mysteries = ids.filter((i) => !registry[i].featured);
  assert.equal(mysteries.length, 10);
  for (let run = 0; run < 1000; run++) {
    let s = sanitize(null, ids);
    for (let n = 0; n < 10; n++) {
      const id = choose(s, registry);
      assert.ok(id);
      assert.ok(!s.collectedIds.includes(id));
      s = acquire(s, id);
      s = sanitize(JSON.parse(JSON.stringify(s)), ids);
      assert.equal(s.pendingReveal, id);
    }
    assert.equal(new Set(s.collectedIds).size, 10);
    assert.deepEqual([...s.collectedIds].sort(), [...mysteries].sort());
    assert.equal(choose(s, registry), null);
    assert.equal(ownedIds(s, registry).length, 13);
  }
});
test("selection partitions the remaining Mystery IDs equally", () => {
  const s = acquire(sanitize(null, ids), "G-001"),
    pool = ids.filter((i) => i !== "G-001" && !registry[i].featured);
  assert.equal(pool.length, 9);
  for (let i = 0; i < pool.length; i++)
    assert.equal(
      choose(s, registry, () => (i + 0.5) / pool.length),
      pool[i],
    );
});
test("a new visitor already owns exactly the three Featured, in archive order", () => {
  assert.deepEqual(ownedIds(sanitize(null, ids), registry), [
    "G-002",
    "G-005",
    "G-009",
  ]);
});
test("owned list: Featured first, then Summon discoveries in discovery order", () => {
  let s = sanitize(null, ids);
  s = acquire(s, "G-006");
  s = acquire(s, "G-001");
  assert.deepEqual(ownedIds(s, registry), [
    "G-002",
    "G-005",
    "G-009",
    "G-006",
    "G-001",
  ]);
});
test("saves from v0.1.0/v0.1.1 that already list a Featured ID are counted once and still finish", () => {
  let s = sanitize({ collectedIds: ["G-006", "G-002"] }, ids);
  assert.deepEqual(ownedIds(s, registry), ["G-002", "G-005", "G-009", "G-006"]);
  const seen = [];
  for (let id; (id = choose(s, registry));) {
    seen.push(id);
    s = acquire(s, id);
  }
  assert.equal(seen.length, 9);
  assert.equal(ownedIds(s, registry).length, 13);
  assert.ok(seen.every((id) => !registry[id].featured));
});
test("archive fixed slots (G-010 to G-013 appended) and featured set", () => {
  assert.deepEqual(
    Object.values(registry)
      .filter((c) => c.featured)
      .map((c) => c.id),
    ["G-002", "G-005", "G-009"],
  );
  assert.deepEqual(
    Object.values(registry)
      .sort((a, b) => a.archiveOrder - b.archiveOrder)
      .map((c) => c.id),
    [
      "G-002",
      "G-001",
      "G-005",
      "G-003",
      "G-009",
      "G-004",
      "G-006",
      "G-007",
      "G-008",
      "G-010",
      "G-011",
      "G-012",
      "G-013",
    ],
  );
});
