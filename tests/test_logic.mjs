/* Node unit tests for js/logic.js. Run: node tests/test_logic.mjs */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const L = require('../js/logic.js');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass += 1; }
  else { fail += 1; console.log('FAIL: ' + name); }
}
function throws(fn, name) {
  try { fn(); fail += 1; console.log('FAIL (no throw): ' + name); }
  catch (e) { pass += 1; }
}

/* create + add + rename */
const m = L.createMap('Test');
ok(m.nodes.length === 1 && m.nodes[0].id === 'root', 'createMap has root only');
const a = L.addNode(m, 'root', 'Alpha');
const b = L.addNode(m, 'root', 'Beta');
const a1 = L.addNode(m, a.id, 'Alpha One');
ok(m.nodes.length === 4, 'addNode grows map to 4');
ok(L.children(m, 'root').length === 2, 'root has 2 children');
ok(L.depthOf(m, a1.id) === 2, 'grandchild depth is 2');
ok(L.descendants(m, 'root').length === 3, 'descendants of root is 3');
L.renameNode(m, a.id, 'Alpha Renamed');
ok(L.byId(m, a.id).label === 'Alpha Renamed', 'rename works');
throws(() => L.renameNode(m, a.id, '   '), 'empty rename throws');
throws(() => L.renameNode(m, a.id, 'x'.repeat(101)), 'overlong rename throws');
throws(() => L.addNode(m, 'nope', 'X'), 'add to missing parent throws');
throws(() => L.addNode(m, 'root', ''), 'empty add throws');

/* delete subtree + root protection */
const removed = L.deleteNode(m, a.id);
ok(removed === 2, 'delete removes node + its child (2)');
ok(m.nodes.length === 2, 'map back to 2 nodes after delete');
throws(() => L.deleteNode(m, 'root'), 'root delete throws');
throws(() => L.deleteNode(m, 'missing'), 'missing delete throws');

/* move + clamp */
L.moveNode(m, b.id, 5000, -10);
ok(L.byId(m, b.id).x === 2400 && L.byId(m, b.id).y === 0, 'move clamps to world bounds');
L.moveNode(m, b.id, 300, 400);
ok(L.byId(m, b.id).x === 300 && L.byId(m, b.id).y === 400, 'move sets exact coords');
throws(() => L.moveNode(m, b.id, NaN, 10), 'NaN move throws');

/* collapse + hidden */
const c = L.addNode(m, b.id, 'Beta Child');
ok(L.isHidden(m, c.id) === false, 'child visible before collapse');
L.toggleCollapse(m, b.id);
ok(L.isHidden(m, c.id) === true, 'child hidden after parent collapse');
ok(L.stats(m).visible === 2, 'visible count drops when collapsed');
L.toggleCollapse(m, b.id);
ok(L.isHidden(m, c.id) === false, 'child visible after expand');

/* layout: parent centred over children, depth rows */
const lm = L.createMap('Layout');
const l1 = L.addNode(lm, 'root', 'One');
const l2 = L.addNode(lm, 'root', 'Two');
L.addNode(lm, l1.id, 'One A');
L.addNode(lm, l1.id, 'One B');
L.layout(lm);
const root = L.byId(lm, 'root');
ok(root.y === 60, 'layout root y is 60');
ok(L.byId(lm, l1.id).y === 210 && L.byId(lm, l2.id).y === 210, 'layout children y is 210');
ok(root.x === Math.round((L.byId(lm, l1.id).x + L.byId(lm, l2.id).x) / 2), 'layout root centred over children');
ok(L.byId(lm, l1.id).x < L.byId(lm, l2.id).x, 'layout orders children left to right');

/* stats */
const st = L.stats(lm);
ok(st.total === 5 && st.leaves === 3 && st.maxDepth === 2, 'stats total/leaves/depth exact');

/* export / import round-trip */
const ser = L.serialize(lm);
const res = L.validateImport(JSON.parse(ser));
ok(res.ok === true, 'own export validates');
ok(res.map.nodes.length === 5 && res.map.title === 'Layout', 'import round-trip preserves data');

/* malformed imports rejected */
const good = JSON.parse(ser);
const bad = (mut) => { const d = JSON.parse(JSON.stringify(good)); mut(d); return L.validateImport(d).ok === false; };
ok(bad(d => { d.app = 'other'; }), 'wrong app rejected');
ok(bad(d => { d.version = 2; }), 'wrong version rejected');
ok(bad(d => { d.nodes = []; }), 'empty nodes rejected');
ok(bad(d => { d.nodes.push(JSON.parse(JSON.stringify(d.nodes[0]))); }), 'duplicate id rejected');
ok(bad(d => { d.nodes[1].parentId = 'ghost'; }), 'ghost parent rejected');
ok(bad(d => { d.nodes[1].label = ''; }), 'empty label rejected');
ok(bad(d => { d.nodes[1].x = 'far'; }), 'non-number x rejected');
ok(bad(d => { d.nodes[1].collapsed = 'yes'; }), 'non-boolean collapsed rejected');
ok(bad(d => { d.nodes[1].color = 9; }), 'out-of-range color rejected');
ok(bad(d => { d.nodes.push({ id: 'root2', parentId: null, label: 'Second', x: 0, y: 0, collapsed: false, color: 0 }); }), 'second root rejected');
ok(bad(d => { d.nodes[1].parentId = d.nodes[1].id; }), 'self-parent cycle rejected');
ok(L.validateImport(null).ok === false, 'null rejected');
ok(L.validateImport('nope').ok === false, 'string rejected');
ok(L.validateImport({ app: 'mindmap-bd', version: 1, title: 'T', nodes: [
  { id: 'root', parentId: null, label: 'R', x: 0, y: 0, collapsed: false, color: 0 },
  { id: 'x', parentId: 'y', label: 'X', x: 0, y: 0, collapsed: false, color: 0 },
  { id: 'y', parentId: 'x', label: 'Y', x: 0, y: 0, collapsed: false, color: 0 }
]}).ok === false, 'two-node cycle rejected');

console.log('UNIT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
