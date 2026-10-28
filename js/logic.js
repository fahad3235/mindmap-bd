/* Mindmap BD - pure map model. No DOM, no network. Works in Node and browser. */
(function (global) {
  'use strict';

  var APP = 'mindmap-bd';
  var VERSION = 1;
  var MAX_LABEL = 100;
  var WORLD_W = 2400;
  var WORLD_H = 1600;
  var COLORS = 6;
  var seq = 0;

  function uid() {
    seq += 1;
    return 'n' + Date.now().toString(36) + '_' + seq.toString(36) + '_' +
      Math.floor(Math.random() * 100000).toString(36);
  }

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function cleanLabel(label) {
    if (typeof label !== 'string') throw new Error('label must be a string');
    var t = label.replace(/\s+/g, ' ').trim();
    if (!t) throw new Error('label must not be empty');
    if (t.length > MAX_LABEL) throw new Error('label too long');
    return t;
  }

  function createMap(title) {
    var t = (typeof title === 'string' && title.trim()) ? title.trim().slice(0, 100) : 'My Mind Map';
    return {
      app: APP, version: VERSION, title: t,
      nodes: [{ id: 'root', parentId: null, label: 'Main Idea', x: 1050, y: 60, collapsed: false, color: 0 }]
    };
  }

  function byId(map, id) {
    for (var i = 0; i < map.nodes.length; i++) if (map.nodes[i].id === id) return map.nodes[i];
    return null;
  }

  function children(map, id) {
    var out = [];
    for (var i = 0; i < map.nodes.length; i++) if (map.nodes[i].parentId === id) out.push(map.nodes[i]);
    return out;
  }

  function descendants(map, id) {
    var out = [];
    var stack = children(map, id).slice();
    while (stack.length) {
      var n = stack.pop();
      out.push(n);
      var ch = children(map, n.id);
      for (var i = 0; i < ch.length; i++) stack.push(ch[i]);
    }
    return out;
  }

  function depthOf(map, id) {
    var d = 0, n = byId(map, id), guard = 0;
    while (n && n.parentId !== null && guard <= map.nodes.length) { d += 1; n = byId(map, n.parentId); guard += 1; }
    return d;
  }

  function addNode(map, parentId, label) {
    var parent = byId(map, parentId);
    if (!parent) throw new Error('parent not found');
    var node = {
      id: uid(), parentId: parentId, label: cleanLabel(label),
      x: clamp(parent.x + 40, 0, WORLD_W), y: clamp(parent.y + 150, 0, WORLD_H),
      collapsed: false, color: (depthOf(map, parentId) + 1) % COLORS
    };
    map.nodes.push(node);
    return node;
  }

  function renameNode(map, id, label) {
    var n = byId(map, id);
    if (!n) throw new Error('node not found');
    n.label = cleanLabel(label);
    return n;
  }

  function deleteNode(map, id) {
    if (id === 'root') throw new Error('root cannot be deleted');
    var n = byId(map, id);
    if (!n) throw new Error('node not found');
    var doomed = descendants(map, id).map(function (x) { return x.id; });
    doomed.push(id);
    map.nodes = map.nodes.filter(function (x) { return doomed.indexOf(x.id) === -1; });
    return doomed.length;
  }

  function moveNode(map, id, x, y) {
    var n = byId(map, id);
    if (!n) throw new Error('node not found');
    if (!isNum(x) || !isNum(y)) throw new Error('coordinates must be numbers');
    n.x = clamp(Math.round(x), 0, WORLD_W);
    n.y = clamp(Math.round(y), 0, WORLD_H);
    return n;
  }

  function toggleCollapse(map, id) {
    var n = byId(map, id);
    if (!n) throw new Error('node not found');
    n.collapsed = !n.collapsed;
    return n.collapsed;
  }

  function isHidden(map, id) {
    var n = byId(map, id), guard = 0;
    while (n && n.parentId !== null && guard <= map.nodes.length) {
      var p = byId(map, n.parentId);
      if (p && p.collapsed) return true;
      n = p; guard += 1;
    }
    return false;
  }

  /* Tidy tree layout: leaves get slots left to right, parents centre over children. */
  function layout(map) {
    var nextLeaf = 0;
    function place(node) {
      var ch = children(map, node.id);
      if (!ch.length) {
        node.x = 60 + nextLeaf * 240;
        nextLeaf += 1;
      } else {
        for (var i = 0; i < ch.length; i++) place(ch[i]);
        node.x = Math.round((ch[0].x + ch[ch.length - 1].x) / 2);
      }
      node.y = 60 + depthOf(map, node.id) * 150;
    }
    var root = byId(map, 'root');
    if (root) place(root);
    return map;
  }

  function stats(map) {
    var maxDepth = 0, leaves = 0, visible = 0;
    for (var i = 0; i < map.nodes.length; i++) {
      var d = depthOf(map, map.nodes[i].id);
      if (d > maxDepth) maxDepth = d;
      if (!children(map, map.nodes[i].id).length) leaves += 1;
      if (!isHidden(map, map.nodes[i].id)) visible += 1;
    }
    return { total: map.nodes.length, visible: visible, maxDepth: maxDepth, leaves: leaves };
  }

  function validateImport(data) {
    function fail(msg) { return { ok: false, error: msg }; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return fail('not an object');
    if (data.app !== APP) return fail('wrong app');
    if (data.version !== VERSION) return fail('unsupported version');
    if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 100) return fail('bad title');
    if (!Array.isArray(data.nodes) || !data.nodes.length) return fail('no nodes');
    if (data.nodes.length > 500) return fail('too many nodes');
    var ids = {}, roots = 0;
    for (var i = 0; i < data.nodes.length; i++) {
      var n = data.nodes[i];
      if (!n || typeof n !== 'object') return fail('bad node');
      if (typeof n.id !== 'string' || !n.id) return fail('bad node id');
      if (ids[n.id]) return fail('duplicate node id');
      ids[n.id] = true;
      if (n.parentId === null) roots += 1;
      else if (typeof n.parentId !== 'string' || !ids[n.parentId] && data.nodes.every(function (m) { return m.id !== n.parentId; })) return fail('bad parent');
      if (typeof n.label !== 'string') return fail('bad label');
      try { cleanLabel(n.label); } catch (e) { return fail('bad label'); }
      if (!isNum(n.x) || !isNum(n.y)) return fail('bad coordinates');
      if (typeof n.collapsed !== 'boolean') return fail('bad collapsed flag');
      if (!isNum(n.color) || n.color < 0 || n.color >= COLORS || Math.floor(n.color) !== n.color) return fail('bad color');
    }
    if (roots !== 1) return fail('must have exactly one root');
    /* Cycle check: follow parent links with a visited set. */
    var index = {};
    for (var m = 0; m < data.nodes.length; m++) index[data.nodes[m].id] = data.nodes[m];
    for (var p = 0; p < data.nodes.length; p++) {
      var seen = {}, walk = data.nodes[p];
      while (walk.parentId !== null) {
        if (seen[walk.id]) return fail('cycle in tree');
        seen[walk.id] = true;
        walk = index[walk.parentId];
        if (!walk) return fail('bad parent');
      }
    }
    var map = { app: APP, version: VERSION, title: data.title.trim(), nodes: [] };
    for (var q = 0; q < data.nodes.length; q++) {
      var s = data.nodes[q];
      map.nodes.push({ id: s.id, parentId: s.parentId, label: cleanLabel(s.label),
        x: clamp(Math.round(s.x), 0, WORLD_W), y: clamp(Math.round(s.y), 0, WORLD_H),
        collapsed: s.collapsed, color: s.color });
    }
    return { ok: true, map: map };
  }

  function serialize(map) { return JSON.stringify(map); }

  var api = { APP: APP, VERSION: VERSION, WORLD_W: WORLD_W, WORLD_H: WORLD_H, COLORS: COLORS,
    createMap: createMap, byId: byId, children: children, descendants: descendants,
    depthOf: depthOf, addNode: addNode, renameNode: renameNode, deleteNode: deleteNode,
    moveNode: moveNode, toggleCollapse: toggleCollapse, isHidden: isHidden,
    layout: layout, stats: stats, validateImport: validateImport, serialize: serialize };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.MindmapLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
