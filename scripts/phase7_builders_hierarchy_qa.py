#!/usr/bin/env python3
import asyncio, base64, json, shutil, subprocess, tempfile, time, urllib.request
from pathlib import Path
import websockets

ROOT = Path('/root/land-dealflow-os')
OUT = ROOT / 'artifacts' / 'phase7-builders-hierarchy-lock'
OUT.mkdir(parents=True, exist_ok=True)
PORT = 9447
BASE = 'http://127.0.0.1:4175/?v=phase7-local#builders/state/FL/market/polk'

def chrome_bin():
    for name in ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']:
        p = shutil.which(name)
        if p:
            return p
    raise SystemExit('Chrome not found')

def get_json(url, attempts=100):
    last = None
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=1) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            last = e
            time.sleep(0.1)
    raise RuntimeError(f'could not fetch {url}: {last}')

class CDP:
    def __init__(self, ws):
        self.ws = ws
        self.i = 0
    async def call(self, method, params=None):
        self.i += 1
        msg_id = self.i
        await self.ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get('id') == msg_id:
                if 'error' in msg:
                    raise RuntimeError(f'{method}: {msg["error"]}')
                return msg.get('result', {})

async def eval_js(c, expr):
    res = await c.call('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
    if 'exceptionDetails' in res:
        raise RuntimeError(str(res['exceptionDetails']))
    return res.get('result', {}).get('value')

async def run_view(c, label, width, height, mobile=False):
    await c.call('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': mobile, 'screenWidth': width, 'screenHeight': height})
    if mobile:
        await c.call('Emulation.setUserAgentOverride', {'userAgent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'})
    await c.call('Page.navigate', {'url': BASE})
    for _ in range(120):
        ok = await eval_js(c, "!!document.querySelector('#buyer-validation-command.phase7-builders-hierarchy-lock .validation-queue-item')")
        if ok:
            break
        await asyncio.sleep(0.15)
    await asyncio.sleep(0.8)

    async def shot(name, scroll_expr):
        await eval_js(c, scroll_expr)
        await asyncio.sleep(0.35)
        data = await c.call('Page.captureScreenshot', {'format': 'png', 'fromSurface': False, 'captureBeyondViewport': False})
        path = OUT / name
        path.write_bytes(base64.b64decode(data['data']))
        return str(path)

    shots = []
    shots.append(await shot(f'{label}-top.png', "window.scrollTo(0,0); 'ok'"))
    shots.append(await shot(f'{label}-queue-detail.png', "document.querySelector('.validation-grid-main')?.scrollIntoView({block:'start'}); 'ok'"))
    shots.append(await shot(f'{label}-form.png', "document.querySelector('.buybox-capture-sheet')?.scrollIntoView({block:'center'}); 'ok'"))

    metrics = await eval_js(c, r"""
(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const rect = s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), display: getComputedStyle(el).display, overflow: getComputedStyle(el).overflow}; };
  const all = s => [...document.querySelectorAll(s)].filter(el => el.offsetParent !== null).length;
  const labelBoxes = [...document.querySelectorAll('.builder-command-market-name')].slice(0,8).map(el => { const r = el.getBoundingClientRect(); return {text: el.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), whiteSpace: getComputedStyle(el).whiteSpace, overflowWrap: getComputedStyle(el).overflowWrap}; });
  const outcomeParent = document.querySelector('.phase3-outcome-capture.inspector-outcome-capture')?.closest('.validation-focus-card.builder-inspector-v3')?.id || '';
  const visibleHeroCount = [...document.querySelectorAll('.builder-market-hero, .builders-index-hero')].filter(el => getComputedStyle(el).display !== 'none' && el.offsetHeight > 20).length;
  const offenders = [...document.querySelectorAll('body[data-active-view="builders"] #buyer-validation-command *')]
    .map(el => { const r = el.getBoundingClientRect(); return {tag: el.tagName, cls: String(el.className), id: el.id, width: Math.ceil(r.width), right: Math.ceil(r.right)}; })
    .filter(x => x.right > vw + 1 || x.width > vw + 1).slice(0, 20);
  return {
    vw, sw, noHorizontalOverflow: sw <= vw + 1, offenders,
    commandMarker: !!document.querySelector('#buyer-validation-command.phase7-builders-hierarchy-lock[data-builder-hierarchy="single-queue-selected-inspector"]'),
    queueSurfaceCount: all('[data-builder-queue-surface]'),
    queueResultsCount: all('[data-builder-queue-results]'),
    visibleHeroCount,
    marketRail: rect('.builder-command-market-scroll'),
    grid: rect('.validation-grid-main'),
    queue: rect('.validation-queue[data-builder-queue-surface]'),
    inspector: rect('.validation-focus-card.builder-inspector-v3'),
    outcome: rect('.phase3-outcome-capture.inspector-outcome-capture'),
    outcomeParent,
    form: rect('.validation-form.validation-buybox-grid'),
    labelBoxes,
    badCopyPresent: /implementation label|Phase 3 builder call execution console|Selected-builder outcome/i.test(document.body.textContent)
  };
})()
""")
    return {'label': label, 'viewport': [width, height], 'url': BASE, 'screenshots': shots, 'metrics': metrics}

async def main():
    user_dir = tempfile.mkdtemp(prefix='phase7-chrome-')
    log = open(OUT / 'chrome-stderr.log', 'w')
    proc = subprocess.Popen([chrome_bin(), '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', f'--remote-debugging-port={PORT}', f'--user-data-dir={user_dir}', '--window-size=1440,1100', 'about:blank'], stdout=subprocess.DEVNULL, stderr=log)
    try:
        tabs = get_json(f'http://127.0.0.1:{PORT}/json')
        page_ws = next(t['webSocketDebuggerUrl'] for t in tabs if t.get('type') == 'page')
        async with websockets.connect(page_ws, max_size=80_000_000) as ws:
            c = CDP(ws)
            await c.call('Page.enable'); await c.call('Runtime.enable'); await c.call('DOM.enable')
            reports = []
            reports.append(await run_view(c, 'desktop', 1440, 1100, False))
            reports.append(await run_view(c, 'mobile', 390, 844, True))
            report = {'reports': reports}
            (OUT / 'phase7-builders-hierarchy-qa-report.json').write_text(json.dumps(report, indent=2))
            print(json.dumps(report, indent=2))
            for r in reports:
                m = r['metrics']
                assert m['commandMarker'], f"{r['label']}: missing phase7 marker"
                assert m['queueSurfaceCount'] == 1, f"{r['label']}: duplicate/missing queue surface {m['queueSurfaceCount']}"
                assert m['queueResultsCount'] == 1, f"{r['label']}: duplicate/missing queue results {m['queueResultsCount']}"
                assert m['visibleHeroCount'] == 0, f"{r['label']}: secondary hero visible"
                assert m['outcomeParent'] == 'selected-builder-card', f"{r['label']}: outcomes detached"
                assert not m['badCopyPresent'], f"{r['label']}: implementation copy visible"
                assert m['noHorizontalOverflow'], f"{r['label']}: horizontal overflow {m['offenders']}"
    finally:
        proc.terminate()
        try: proc.wait(timeout=5)
        except Exception: proc.kill()
        log.close(); shutil.rmtree(user_dir, ignore_errors=True)

asyncio.run(main())
