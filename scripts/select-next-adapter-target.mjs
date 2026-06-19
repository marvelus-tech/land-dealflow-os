import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIORITY_PERMIT_MARKETS, PERMIT_STATE_PRIORITY } from './priority-permit-markets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const cursorPath = resolve(repoRoot, 'data', 'ops', 'adapter-build-cursor.json');

function asArray(value) { return Array.isArray(value) ? value : []; }
function readJson(path, fallback) {
  try { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback; }
  catch { return fallback; }
}
function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
function nextStateAfter(state) {
  const current = PERMIT_STATE_PRIORITY.indexOf(state);
  return PERMIT_STATE_PRIORITY[(current + 1) % PERMIT_STATE_PRIORITY.length];
}
function loadCursor() {
  const cursor = readJson(cursorPath, {});
  return {
    stateCursor: PERMIT_STATE_PRIORITY,
    nextState: PERMIT_STATE_PRIORITY.includes(cursor.nextState) ? cursor.nextState : 'TN',
    attempts: asArray(cursor.attempts),
    blockedMarkets: asArray(cursor.blockedMarkets),
  };
}
function builderCountFor(market) {
  if (!market.realDir) return 0;
  const rows = readJson(resolve(repoRoot, 'data', 'real', market.realDir, 'builder_signals.json'), []);
  return asArray(rows).length;
}
function unresolvedMarketForState(state) {
  const blocked = new Set(loadCursor().blockedMarkets.map(item => typeof item === 'string' ? item : item.market).filter(Boolean));
  return PRIORITY_PERMIT_MARKETS
    .filter(market => market.state === state)
    .filter(market => !blocked.has(market.id))
    .map(market => ({ ...market, activeBuilderSignals: builderCountFor(market) }))
    .find(market => !market.directAdapter || market.activeBuilderSignals < 20);
}
export function selectNextAdapterTarget({ advance = false, now = new Date().toISOString() } = {}) {
  const cursor = loadCursor();
  let selectedState = cursor.nextState;
  let target = null;
  for (let i = 0; i < PERMIT_STATE_PRIORITY.length; i += 1) {
    const state = PERMIT_STATE_PRIORITY[(PERMIT_STATE_PRIORITY.indexOf(cursor.nextState) + i) % PERMIT_STATE_PRIORITY.length];
    target = unresolvedMarketForState(state);
    if (target) { selectedState = state; break; }
  }
  const result = {
    selectedAt: now,
    state: selectedState,
    nextState: nextStateAfter(selectedState),
    target: target ? {
      id: target.id,
      name: target.name,
      state: target.state,
      city: target.city,
      county: target.county,
      platform: target.platform,
      portalUrl: target.portalUrl,
      directAdapter: target.directAdapter || '',
      activeBuilderSignals: target.activeBuilderSignals,
      requiredFloor: 20,
      reason: target.directAdapter
        ? 'adapter exists but is below the 20 unique permit-active builder floor'
        : 'highest-priority unresolved market in the rotating state cursor',
      nextAction: target.directAdapter
        ? `Fix/run ${target.directAdapter} until it produces 20+ unique permit-active builders.`
        : `Prove the public permit source for ${target.name}, build a direct adapter, and require 20+ unique permit-active builders.`,
    } : null,
  };
  if (advance) {
    const nextCursor = {
      ...cursor,
      nextState: result.nextState,
      attempts: [
        ...cursor.attempts,
        { at: now, state: selectedState, market: target?.id || '', outcome: 'selected' },
      ].slice(-100),
    };
    writeJson(cursorPath, nextCursor);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const advance = process.argv.includes('--advance');
  const result = selectNextAdapterTarget({ advance });
  if (!result.target) {
    console.log('No unresolved priority permit adapter target found.');
  } else {
    console.log(`# Friday Adapter-Build Target`);
    console.log('');
    console.log(`State cursor: ${result.state} → next ${result.nextState}`);
    console.log(`Market: ${result.target.name}`);
    console.log(`Platform: ${result.target.platform}`);
    console.log(`Portal: ${result.target.portalUrl}`);
    console.log(`Current adapter: ${result.target.directAdapter || 'none'}`);
    console.log(`Builder signals: ${result.target.activeBuilderSignals}/${result.target.requiredFloor}`);
    console.log(`Reason: ${result.target.reason}`);
    console.log(`Next action: ${result.target.nextAction}`);
  }
}
