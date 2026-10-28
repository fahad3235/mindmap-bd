# Mindmap BD - test results

Run date: 2026-10-28 (Asia/Dhaka). All tests run locally before publishing.

## Unit tests - 42/42 passed, 0 failed

Command: `node tests/test_logic.mjs`

Hand-verified values:
- createMap starts with exactly 1 node (root, "Main Idea").
- Adding Alpha, Beta, Alpha One gives 4 nodes; grandchild depth is 2;
  descendants of root is 3.
- Deleting Alpha removes 2 nodes (itself + its child); map returns to 2 nodes.
- moveNode(5000, -10) clamps to x=2400, y=0 (world bounds 2400 x 1600).
- Collapse: child hidden, visible count drops to 2; expand restores it.
- Layout: root y=60, children y=210, root x exactly centred over its children.
- Stats on the layout fixture: total 5, leaves 3, maxDepth 2.
- Export -> import round-trip preserves all 5 nodes and the title.
- Malformed imports rejected (13 cases): wrong app, wrong version, empty
  nodes, duplicate id, ghost parent, empty label, non-number x, non-boolean
  collapsed, out-of-range color, second root, self-parent cycle, two-node
  cycle, plus null and string inputs.

## Smoke tests - 26/26 passed, 0 failed, 0 console/page errors

Command: `node tests/smoke.mjs` (raw CDP against headless Chromium, file:// page)

Verified in a real browser: page title, root-only start, "Main Idea" label,
stats, zero connector lines at start, Add button opening the inline editor,
rename to "My Branch", 1 connector line, second branch "Second", auto-layout
rows (1 node at y=60, 2 nodes at y=210), collapse hiding children (1 node)
and expand restoring them (3 nodes), Bangla toggle (button flips to
"English", app name renders Bengali, stats use Bengali digits), 3 nodes
persisting across a full page reload, delete-confirm bar appearing and the
count dropping 3 -> 2, sample loading 9 nodes, typed-DELETE erase resetting to
1 node titled "My Mind Map", 390 px viewport with body scrollWidth <= 390,
zero http(s) resource requests, zero console/page errors.

## Source hygiene

- `grep -P '[^\x00-\x7F]'` over index.html, css, js, tests: zero matches -
  all sources are pure ASCII; Bengali strings live as \uXXXX escapes in
  js/i18n.js and decode in the browser (verified by the smoke test's Bengali
  app-name and Bengali-digit assertions).
- `node --check` passes for js/logic.js, js/i18n.js, js/app.js.

## Repairs during this run

None. Both suites passed on the first run; no app-logic or test-harness fix
was needed.
