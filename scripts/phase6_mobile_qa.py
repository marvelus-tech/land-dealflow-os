#!/usr/bin/env python3
import asyncio, json, os, shutil, subprocess, tempfile, time, urllib.request
from pathlib import Path

import websockets

ROOT = Path('/root/land-dealflow-os')
OUT = ROOT / 'artifacts' / 'phase6-mobile-a11y'
OUT.mkdir(parents=True, exist_ok=True)
URL = 'http://127.0.0.1:4175/?v=phase6-local#builders/state/FL/market/polk'
PORT = 9333

def chrome_bin():
    for name in ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']:
        p = shutil.which(name)
        if p:
            return p
    raise SystemExit('Chrome not found')

def get_json(url, attempts=80):
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

async def main():
    user_dir = tempfile.mkdtemp(prefix='phase6-chrome-')
    chrome_log = open(OUT / 'chrome-stderr.log', 'w')
    proc = subprocess.Popen([
        chrome_bin(), '--headless=new', '--no-sandbox', '--disable-gpu',
        '--disable-dev-shm-usage', '--hide-scrollbars',
        f'--remote-debugging-port={PORT}', f'--user-data-dir={user_dir}',
        '--window-size=390,844', 'about:blank'
    ], stdout=subprocess.DEVNULL, stderr=chrome_log)
    try:
        ver = get_json(f'http://127.0.0.1:{PORT}/json/version')
        async with websockets.connect(ver['webSocketDebuggerUrl'], max_size=20_000_000) as ws:
            c = CDP(ws)
            await c.call('Target.setDiscoverTargets', {'discover': True})
            target = get_json(f'http://127.0.0.1:{PORT}/json/new?{URL}') if False else None
        tabs = get_json(f'http://127.0.0.1:{PORT}/json')
        page_ws = next(t['webSocketDebuggerUrl'] for t in tabs if t.get('type') == 'page')
        async with websockets.connect(page_ws, max_size=60_000_000) as ws:
            c = CDP(ws)
            await c.call('Page.enable')
            await c.call('Runtime.enable')
            await c.call('DOM.enable')
            await c.call('Accessibility.enable')
            await c.call('Emulation.setDeviceMetricsOverride', {
                'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True,
                'screenWidth': 390, 'screenHeight': 844
            })
            await c.call('Emulation.setUserAgentOverride', {
                'userAgent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            })
            await c.call('Page.navigate', {'url': URL})
            # Wait for builders route.
            for _ in range(100):
                res = await c.call('Runtime.evaluate', {'expression': "!!document.querySelector('#buyer-validation-command .validation-queue-item')", 'returnByValue': True})
                if res.get('result', {}).get('value'):
                    break
                await asyncio.sleep(0.15)
            await asyncio.sleep(0.8)

            async def eval_js(expr):
                return (await c.call('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})).get('result', {}).get('value')
            async def screenshot(name, scroll_js):
                await eval_js(scroll_js)
                await asyncio.sleep(0.35)
                data = await c.call('Page.captureScreenshot', {'format': 'png', 'fromSurface': False, 'captureBeyondViewport': False})
                import base64
                path = OUT / name
                path.write_bytes(base64.b64decode(data['data']))
                return str(path)

            shots = []
            shots.append(await screenshot('mobile-top.png', "window.scrollTo(0,0); 'ok'"))
            shots.append(await screenshot('mobile-queue.png', "document.querySelector('.builder-queue-results')?.scrollIntoView({block:'start'}); 'ok'"))
            shots.append(await screenshot('mobile-selected-detail.png', "document.querySelector('.validation-focus-card.builder-inspector-v3')?.scrollIntoView({block:'center'}); 'ok'"))
            shots.append(await screenshot('mobile-form.png', "document.querySelector('.buybox-capture-sheet')?.scrollIntoView({block:'center'}); 'ok'"))

            metrics = await eval_js(r"""
(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const offenders = [...document.querySelectorAll('body[data-active-view="builders"] #buyer-validation-command *')]
    .map(el => ({tag: el.tagName, cls: el.className && String(el.className), id: el.id, width: Math.ceil(el.getBoundingClientRect().width), right: Math.ceil(el.getBoundingClientRect().right)}))
    .filter(x => x.right > vw + 1 || x.width > vw + 1).slice(0, 20);
  const controls = [...document.querySelectorAll('body[data-active-view="builders"] #buyer-validation-command button, body[data-active-view="builders"] #buyer-validation-command a[href], body[data-active-view="builders"] #buyer-validation-command input, body[data-active-view="builders"] #buyer-validation-command select, body[data-active-view="builders"] #buyer-validation-command textarea, body[data-active-view="builders"] #buyer-validation-command summary')]
    .filter(el => el.offsetParent !== null)
    .map(el => { const r = el.getBoundingClientRect(); return {name: (el.getAttribute('aria-label') || el.textContent || el.placeholder || el.tagName).trim().replace(/\s+/g,' ').slice(0,80), tag: el.tagName, cls: String(el.className), w: Math.round(r.width), h: Math.round(r.height)}; });
  const tooSmall = controls.filter(x => x.h < 44 && !/Source links/.test(x.name)).slice(0, 25);
  const hiddenNamedControls = controls.filter(x => x.w <= 0 || x.h <= 0).slice(0, 10);
  return {vw, sw, noHorizontalOverflow: sw <= vw + 1, offenders, controls: controls.length, tooSmall, hiddenNamedControls};
})()
""")
            ax = await c.call('Accessibility.getFullAXTree')
            ax_actions = []
            for n in ax.get('nodes', []):
                role = (n.get('role') or {}).get('value')
                name = (n.get('name') or {}).get('value')
                if role in {'button','link','textbox','searchbox','combobox'} and name:
                    ax_actions.append({'role': role, 'name': name[:120]})
            must = ['Call not logged', 'Email open', 'Mail open', 'Select ', 'ALL', 'CALLABLE', 'Buyer-specific', 'Call', 'Email', 'Draft', 'Save validation']
            tree_text = '\n'.join(f"{x['role']}: {x['name']}" for x in ax_actions)
            found = {m: (m.lower() in tree_text.lower()) for m in must}
            report = {'url': URL, 'screenshots': shots, 'metrics': metrics, 'accessibility_action_count': len(ax_actions), 'required_accessibility_names_found': found, 'sample_accessibility_actions': ax_actions[:80]}
            (OUT / 'phase6-mobile-a11y-report.json').write_text(json.dumps(report, indent=2))
            print(json.dumps(report, indent=2))
            if not metrics.get('noHorizontalOverflow'):
                raise SystemExit('horizontal overflow detected')
            if metrics.get('tooSmall'):
                raise SystemExit('tap-size violations detected')
            if any(not v for v in found.values()):
                raise SystemExit('missing required accessibility action names')
            if metrics.get('hiddenNamedControls'):
                raise SystemExit('hidden named controls detected')
    finally:
        proc.terminate()
        try: proc.wait(timeout=5)
        except Exception: proc.kill()
        try: chrome_log.close()
        except Exception: pass
        shutil.rmtree(user_dir, ignore_errors=True)

asyncio.run(main())
