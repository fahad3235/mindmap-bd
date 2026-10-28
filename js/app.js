/* Mindmap BD - UI: render, drag, edit, persist, export/import. No network calls. */
(function () {
  'use strict';
  var L = window.MindmapLogic;
  var I18n = window.MindmapI18n;
  var STORE_KEY = 'mindmap-bd:v1';
  var LANG_KEY = 'mindmap-bd:lang';
  var COLORS = ['#dbeafe', '#dcfce7', '#fef9c3', '#fee2e2', '#ede9fe', '#ffedd5'];

  var lang = localStorage.getItem(LANG_KEY) || 'en';
  if (lang !== 'en' && lang !== 'bn') lang = 'en';
  var map = load() || L.createMap();
  var selectedId = 'root';
  var pendingDeleteId = null;

  function t(key) { return I18n.STR[lang][key] || I18n.STR.en[key] || key; }
  function num(n) { return lang === 'bn' ? I18n.toBnDigits(n) : String(n); }

  function save() {
    try { localStorage.setItem(STORE_KEY, L.serialize(map)); } catch (e) { /* storage full: keep working in memory */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var res = L.validateImport(JSON.parse(raw));
      return res.ok ? res.map : null;
    } catch (e) { return null; }
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function $(id) { return document.getElementById(id); }

  function applyLang() {
    $('appName').textContent = t('appName');
    $('tagline').textContent = t('tagline');
    $('langBtn').textContent = t('langLabel');
    $('btnAdd').textContent = '+ ' + t('addChild');
    $('btnRename').textContent = t('rename');
    $('btnDelete').textContent = t('delete');
    $('btnLayout').textContent = t('autoLayout');
    $('btnNew').textContent = t('newMap');
    $('btnSample').textContent = t('sample');
    $('btnExport').textContent = t('exportBtn');
    $('btnImport').textContent = t('importBtn');
    $('btnErase').textContent = t('erase');
    $('hint').textContent = t('hint');
    $('titleInput').placeholder = t('titlePlaceholder');
    $('footerText').textContent = t('footer');
    $('eraseHint').textContent = t('eraseHint');
    document.documentElement.lang = (lang === 'bn') ? 'bn' : 'en';
  }

  function updateStats() {
    var s = L.stats(map);
    $('stats').textContent = num(s.total) + ' ' + t('nodes') + ' | ' +
      t('depth') + ' ' + num(s.maxDepth) + ' | ' + num(s.leaves) + ' ' + t('leaves');
  }

  function render() {
    $('titleInput').value = map.title;
    updateStats();
    var nodesEl = $('nodes');
    var svg = $('lines');
    nodesEl.innerHTML = '';
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var visible = map.nodes.filter(function (n) { return !L.isHidden(map, n.id); });
    visible.forEach(function (n) {
      var div = document.createElement('div');
      div.className = 'node c' + n.color + (n.id === selectedId ? ' selected' : '');
      div.dataset.id = n.id;
      div.style.left = n.x + 'px';
      div.style.top = n.y + 'px';
      var hasKids = L.children(map, n.id).length > 0;
      var label = document.createElement('span');
      label.className = 'label';
      label.textContent = n.label;
      label.title = t('hint');
      div.appendChild(label);
      var row = document.createElement('div');
      row.className = 'nodebtns';
      var add = document.createElement('button');
      add.type = 'button'; add.className = 'mini'; add.textContent = '+';
      add.title = t('addChild');
      add.addEventListener('click', function (e) { e.stopPropagation(); select(n.id); addChildTo(n.id); });
      row.appendChild(add);
      if (hasKids) {
        var col = document.createElement('button');
        col.type = 'button'; col.className = 'mini';
        col.textContent = n.collapsed ? '>' : 'v';
        col.title = n.collapsed ? t('expand') : t('collapse');
        col.addEventListener('click', function (e) { e.stopPropagation(); L.toggleCollapse(map, n.id); save(); render(); });
        row.appendChild(col);
      }
      div.appendChild(row);
      div.addEventListener('click', function () { select(n.id); });
      div.addEventListener('dblclick', function (e) { e.preventDefault(); startEdit(n.id); });
      enableDrag(div, n);
      nodesEl.appendChild(div);
    });
    drawLines();
  }

  function drawLines() {
    var svg = $('lines');
    var canvas = $('canvas');
    var crect = canvas.getBoundingClientRect();
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var els = {};
    var divs = document.querySelectorAll('#nodes .node');
    for (var i = 0; i < divs.length; i++) els[divs[i].dataset.id] = divs[i];
    map.nodes.forEach(function (n) {
      if (n.parentId === null || L.isHidden(map, n.id)) return;
      var a = els[n.parentId], b = els[n.id];
      if (!a || !b) return;
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var x1 = ra.left - crect.left + ra.width / 2, y1 = ra.top - crect.top + ra.height;
      var x2 = rb.left - crect.left + rb.width / 2, y2 = rb.top - crect.top;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  }

  function select(id) {
    selectedId = id;
    var divs = document.querySelectorAll('#nodes .node');
    for (var i = 0; i < divs.length; i++) divs[i].classList.toggle('selected', divs[i].dataset.id === id);
    $('btnDelete').disabled = (id === 'root');
    $('btnRename').disabled = false;
  }

  function addChildTo(parentId) {
    try {
      var node = L.addNode(map, parentId, 'New branch');
      if (L.byId(map, parentId).collapsed) L.toggleCollapse(map, parentId);
      selectedId = node.id;
      save(); render(); startEdit(node.id);
    } catch (e) { toast(e.message); }
  }

  function startEdit(id) {
    var div = document.querySelector('#nodes .node[data-id="' + id + '"]');
    if (!div) return;
    var label = div.querySelector('.label');
    var node = L.byId(map, id);
    var input = document.createElement('input');
    input.type = 'text'; input.className = 'editinput'; input.value = node.label;
    input.maxLength = 100;
    label.replaceWith(input);
    input.focus(); input.select();
    var done = false;
    function commit() {
      if (done) return; done = true;
      var v = input.value;
      try { L.renameNode(map, id, v); save(); } catch (e) { toast(t('toastEmptyLabel')); }
      render();
    }
    function cancel() { if (done) return; done = true; render(); }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') cancel();
      e.stopPropagation();
    });
    input.addEventListener('blur', commit);
    input.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function enableDrag(div, node) {
    div.addEventListener('pointerdown', function (e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      select(node.id);
      var canvas = $('canvas');
      var crect = canvas.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY;
      var origX = node.x, origY = node.y;
      var scrollLeft = canvas.parentElement.scrollLeft, scrollTop = canvas.parentElement.scrollTop;
      function onMove(ev) {
        var dx = ev.clientX - startX, dy = ev.clientY - startY;
        node.x = Math.max(0, Math.min(2400, origX + dx));
        node.y = Math.max(0, Math.min(1600, origY + dy));
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';
        drawLines();
      }
      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        canvas.parentElement.scrollLeft = scrollLeft; canvas.parentElement.scrollTop = scrollTop;
        try { L.moveNode(map, node.id, node.x, node.y); } catch (err) { /* keep dragged position */ }
        save(); render();
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }

  function showDeleteConfirm(id) {
    pendingDeleteId = id;
    var n = L.byId(map, id);
    var kids = L.descendants(map, id).length;
    $('confirmText').textContent = t('deleteConfirm') + (kids ? ' (' + num(kids) + ' ' + t('nodes') + ')' : '');
    $('confirmBar').classList.remove('hidden');
  }
  function hideDeleteConfirm() { pendingDeleteId = null; $('confirmBar').classList.add('hidden'); }

  function loadSample() {
    var m = L.createMap('Study Plan Sample');
    var root = 'root';
    var a = L.addNode(m, root, 'Bangla').id;
    var b = L.addNode(m, root, 'English').id;
    var c = L.addNode(m, root, 'Math').id;
    L.addNode(m, a, 'Grammar');
    L.addNode(m, a, 'Literature');
    L.addNode(m, b, 'Vocabulary');
    L.addNode(m, c, 'Algebra');
    L.addNode(m, c, 'Geometry');
    L.layout(m);
    map = m; selectedId = 'root';
    save(); render(); toast(t('toastSample'));
  }

  function bind() {
    $('langBtn').addEventListener('click', function () {
      lang = (lang === 'en') ? 'bn' : 'en';
      localStorage.setItem(LANG_KEY, lang);
      applyLang(); render();
    });
    $('btnAdd').addEventListener('click', function () { addChildTo(selectedId); });
    $('btnRename').addEventListener('click', function () { startEdit(selectedId); });
    $('btnDelete').addEventListener('click', function () { if (selectedId !== 'root') showDeleteConfirm(selectedId); });
    $('btnLayout').addEventListener('click', function () { L.layout(map); save(); render(); });
    $('btnNew').addEventListener('click', function () {
      map = L.createMap();
      if (lang === 'bn') map.nodes[0].label = t('rootLabel');
      selectedId = 'root'; hideDeleteConfirm(); save(); render();
    });
    $('btnSample').addEventListener('click', loadSample);
    $('btnExport').addEventListener('click', function () {
      var blob = new Blob([L.serialize(map)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mindmap-bd.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('btnImport').addEventListener('click', function () { $('fileInput').click(); });
    $('fileInput').addEventListener('change', function () {
      var f = $('fileInput').files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var res = L.validateImport(JSON.parse(reader.result));
          if (!res.ok) throw new Error(res.error);
          map = res.map; selectedId = 'root'; save(); render(); toast(t('toastImported'));
        } catch (e) { toast(t('toastImportFailed')); }
        $('fileInput').value = '';
      };
      reader.readAsText(f);
    });
    $('titleInput').addEventListener('change', function () {
      var v = $('titleInput').value.trim();
      if (v) { map.title = v.slice(0, 100); save(); render(); }
      else $('titleInput').value = map.title;
    });
    $('confirmYes').addEventListener('click', function () {
      if (!pendingDeleteId) return;
      try { L.deleteNode(map, pendingDeleteId); } catch (e) { toast(e.message); }
      selectedId = 'root'; hideDeleteConfirm(); save(); render();
    });
    $('confirmNo').addEventListener('click', hideDeleteConfirm);
    $('btnErase').addEventListener('click', function () {
      if ($('eraseInput').value === 'DELETE') {
        localStorage.removeItem(STORE_KEY);
        map = L.createMap(); selectedId = 'root'; $('eraseInput').value = '';
        save(); render(); toast(t('toastErased'));
      } else { toast(t('toastImportFailed')); }
    });
  }

  /* Test hook for the headless smoke suite: UI actions stay the real path. */
  window.__mm = { getMap: function () { return map; }, getLang: function () { return lang; },
    getSelected: function () { return selectedId; }, logic: L };

  bind();
  applyLang();
  render();
})();
