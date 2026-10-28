# Mindmap BD

An offline, bilingual (English / Bangla) mind-map maker for students, teachers,
and planners in Bangladesh. Start from one central idea, grow branches by
dragging nodes around a canvas, and keep the whole map in your browser - no
account, no server, no upload.

## Problem

Brainstorming on paper is fast but hard to rearrange; most online mind-map
tools need an account and an internet connection. Mindmap BD gives you a
single-page canvas that works offline: add branches, rename them in place,
collapse subtrees, auto-arrange the tree, and export it as JSON whenever you
want a copy.

## Features

1. **Branching canvas** - a central root node with unlimited child branches,
   rendered as nodes on a 2400 x 1600 canvas with connector lines.
2. **Drag to rearrange** - grab any node and move it; connector lines follow
   live. Positions are saved automatically.
3. **Inline editing** - double-click a label (or use Rename) to edit it in
   place. Empty and over-long names are rejected with a message.
4. **Collapse / expand** - hide a subtree behind its parent, then bring it back.
5. **Auto layout** - one click arranges the tree tidily: leaves left to right,
   each parent centred over its children, one row per depth.
6. **Bilingual UI** - EN / Bangla toggle, persisted, with Bengali digits in
   the stats bar when Bangla is active.
7. **Persistence + data tools** - the map is saved to localStorage on every
   change; export JSON, import with strict validation (a bad file is rejected
   and your map stays intact), load a labelled study-plan sample, and erase
   everything only after typing `DELETE`.
8. **Offline by design** - zero network requests at runtime; everything runs
   from static files.

## Stack

- Plain HTML, CSS, and JavaScript (no framework, no build step, no dependencies).
- `js/logic.js` - the pure map model (add / rename / delete / move /
  collapse / layout / stats / import validation). It has no DOM access, so
  the same file is unit-tested in Node and loaded in the browser.
- `js/i18n.js` - English and Bangla strings (Bangla written as `\uXXXX`
  escapes, so every source file is pure ASCII).
- `js/app.js` - rendering, dragging, editing, persistence, export / import.
- `tests/test_logic.mjs` - Node unit tests.
- `tests/smoke.mjs` - headless-Chromium smoke tests over raw CDP.

## Prerequisites

- Any modern browser (Chrome, Firefox, Edge, Safari).
- Node.js 18+ only if you want to run the tests.

## Install and run

No install step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Development commands

```sh
node tests/test_logic.mjs   # unit tests
node tests/smoke.mjs        # headless-Chrome smoke tests (needs /opt/meta-chromium/chrome on this VM;
                            # on another machine, point CHROME at your Chromium binary)
```

## Data format

Exported files are JSON: `{ app: "mindmap-bd", version: 1, title, nodes: [...] }`.
Each node is `{ id, parentId, label, x, y, collapsed, color }`. Import
validation rejects a file with the wrong app or version, duplicate ids, a
missing parent, a second root, a cycle, an empty or over-long label, bad
coordinates, a non-boolean `collapsed`, or an out-of-range color. The canvas
is 2400 x 1600 and coordinates are clamped into it.

## Testing

- Unit: 42/42 checks in `tests/test_logic.mjs` (add / rename / delete /
  move / collapse / layout / stats / export-import round-trip / 13 malformed
  imports rejected).
- Smoke: 26/26 checks in `tests/smoke.mjs` against headless Chromium
  (boot, add + rename, connector lines, auto-layout rows, collapse / expand,
  Bangla toggle + Bengali digits, reload persistence, delete confirm, sample
  load, typed-DELETE erase, 390 px no-overflow, zero network requests, zero
  console / page errors).

See `TEST_RESULTS.md` for the exact verified values.

## Deployment

Static files only - host anywhere that serves static content, e.g. GitHub
Pages (repository root, `main` branch). No server, database, or environment
variables are involved.

## Limitations

- Maps live in one browser's localStorage; there is no sync between devices.
- A single map is kept at a time (export JSON to keep copies).
- Node labels are capped at 100 characters and a map at 500 nodes.
- Connector lines are straight; there is no curved or elbow routing.
- The sample map is a labelled example, not real user data.

## Status

Complete MVP. All unit and smoke tests pass with zero console errors.
