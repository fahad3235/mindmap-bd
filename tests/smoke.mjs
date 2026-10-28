/* Headless-Chrome smoke test via raw CDP (no puppeteer in this VM).
   Run: node tests/smoke.mjs  (from the project root) */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'file://' + path.join(ROOT, 'index.html');
const PORT = 9224;
const PROFILE = '/tmp/mm-smoke-profile';
const CHROME = '/opt/meta-chromium/chrome';

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass += 1; }
  else { fail += 1; console.log('FAIL: ' + name); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await sleep(200);
  }
  console.log('TIMEOUT: ' + label);
  return false;
}

fs.rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE, 'about:blank'],
  { stdio: 'ignore' });

let ws;
const pending = new Map();
let seq = 0;
const pageErrors = [];
try {
  await waitFor(async () => {
    try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); return r.ok; } catch (e) { return false; }
  }, 'chrome DevTools port');
  const tabRes = await fetch('http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' });
  const tab = await tabRes.json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    }
    if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.exception.description || 'exception');
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') pageErrors.push(msg.params.entry.text);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('evaluate failed: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');

  await waitFor(async () => { try { return await ev('!!window.__mm'); } catch (e) { return false; } }, 'app boot');
  /* Fresh state: clear storage and reload so counts are deterministic. */
  await ev('localStorage.clear()');
  await send('Page.reload', { ignoreCache: true });
  await waitFor(async () => { try { return await ev('!!window.__mm'); } catch (e) { return false; } }, 'app reboot');

  ok(await ev('document.title.includes("Mindmap")'), 'page title');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 1'), 'starts with root only');
  ok(await ev('document.querySelector("#nodes .node .label").textContent === "Main Idea"'), 'root label is Main Idea');
  ok(await ev('document.getElementById("stats").textContent.includes("1")'), 'stats show 1 node');
  ok(await ev('document.querySelectorAll("#lines line").length === 0'), 'no lines with one node');

  /* Add a branch via the real Add button, rename via the inline editor. */
  await ev('document.getElementById("btnAdd").click()');
  ok(await ev('!!document.querySelector(".editinput")'), 'add opens inline editor');
  await ev('(()=>{const i=document.querySelector(".editinput"); i.value="My Branch"; i.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})); return true;})()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 2'), 'node count 2 after add');
  ok(await ev('[...document.querySelectorAll("#nodes .node .label")].some(e=>e.textContent==="My Branch")'), 'renamed branch label present');
  ok(await ev('document.querySelectorAll("#lines line").length === 1'), 'one line connects root and branch');

  /* Select root, add a second branch, auto-layout rows. */
  await ev('document.querySelector("#nodes .node[data-id=\\"root\\"]").click()');
  await ev('document.getElementById("btnAdd").click()');
  await ev('(()=>{const i=document.querySelector(".editinput"); i.value="Second"; i.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})); return true;})()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 3'), 'node count 3 after second add');
  await ev('document.getElementById("btnLayout").click()');
  ok(await ev('(()=>{const ns=[...document.querySelectorAll("#nodes .node")]; const ys=ns.map(n=>parseInt(n.style.top,10)); return ys.filter(y=>y===60).length===1 && ys.filter(y=>y===210).length===2;})()'), 'auto-layout rows: root 60, children 210');

  /* Collapse hides children, expand restores them. */
  await ev('(()=>{const root=document.querySelector("#nodes .node[data-id=\\"root\\"]"); const btns=root.querySelectorAll(".mini"); btns[btns.length-1].click(); return true;})()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 1'), 'collapse hides children');
  await ev('(()=>{const root=document.querySelector("#nodes .node[data-id=\\"root\\"]"); const btns=root.querySelectorAll(".mini"); btns[btns.length-1].click(); return true;})()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 3'), 'expand restores children');

  /* Language toggle to Bengali, then back. */
  await ev('document.getElementById("langBtn").click()');
  ok(await ev('document.getElementById("langBtn").textContent === "English"'), 'lang button flips to English in BN mode');
  ok(await ev('document.getElementById("appName").textContent !== "Mindmap BD"'), 'app name renders Bengali');
  ok(await ev('document.getElementById("stats").textContent.includes("\\u09e9")'), 'stats use Bengali digits');
  await ev('document.getElementById("langBtn").click()');
  ok(await ev('document.getElementById("langBtn").textContent === "Bangla"'), 'lang button back to Bangla');

  /* Persistence across reload. */
  await send('Page.reload', { ignoreCache: true });
  await waitFor(async () => { try { return await ev('!!window.__mm'); } catch (e) { return false; } }, 'app reboot 2');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 3'), '3 nodes persist after reload');

  /* Delete flow: select a child, confirm, count drops. */
  await ev('(()=>{const ns=[...document.querySelectorAll("#nodes .node")]; ns.find(n=>n.dataset.id!=="root").click(); return true;})()');
  await ev('document.getElementById("btnDelete").click()');
  ok(await ev('!document.getElementById("confirmBar").classList.contains("hidden")'), 'delete confirm bar appears');
  await ev('document.getElementById("confirmYes").click()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 2'), 'node count 2 after delete');

  /* Sample map, then typed-DELETE erase. */
  await ev('document.getElementById("btnSample").click()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 9'), 'sample loads 9 nodes');
  await ev('(()=>{const i=document.getElementById("eraseInput"); i.value="DELETE"; return true;})()');
  await ev('document.getElementById("btnErase").click()');
  ok(await ev('document.querySelectorAll("#nodes .node").length === 1'), 'erase resets to root only');
  ok(await ev('document.getElementById("titleInput").value === "My Mind Map"'), 'erase resets title');

  /* Mobile: 390px viewport, no body horizontal overflow. */
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(500);
  ok(await ev('document.body.scrollWidth <= 390'), '390px: no body horizontal overflow');
  await send('Emulation.clearDeviceMetricsOverride');

  /* No external network resources, no console/page errors. */
  ok(await ev('performance.getEntriesByType("resource").filter(r=>r.name.startsWith("http")).length === 0'), 'zero http(s) resource requests');
  ok(pageErrors.length === 0, 'zero console/page errors (got ' + pageErrors.length + ': ' + pageErrors.slice(0, 3).join(' | ') + ')');

  console.log('SMOKE: ' + pass + ' passed, ' + fail + ' failed');
} catch (e) {
  console.log('SMOKE ERROR: ' + (e && e.message ? e.message : e));
  fail += 1;
} finally {
  try { ws && ws.close(); } catch (e) { /* ignore */ }
  try { chrome.kill('SIGKILL'); } catch (e) { /* ignore */ }
  process.exit(fail ? 1 : 0);
}
