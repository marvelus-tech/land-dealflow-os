import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BUILDER_CALL_OUTCOMES,
  buildBuilderCallExecutionConsole,
  exportBuilderCallQueueCsv,
  exportBuilderCallQueueJson,
} from '../src/core.mjs';

const rows = JSON.parse(readFileSync('data/real/knoxville/buyer_call_sheet.json', 'utf8')).rows;
const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

const saved = [{
  builderId: 'knoxville-builder-ball-homes',
  callStatus: 'validated_buy_box',
  lastContacted: '2026-07-20',
  callbackDate: '2026-07-22',
  outreach: { phone: { contacted: true, at: '2026-07-20' } },
  buyBox: {
    geography: 'West Knoxville / Karns',
    lotSize: '0.25-1 ac',
    maxPrice: 65000,
    closeSpeed: '14-30 days',
    packageRecipient: 'land desk',
    dealKillers: ['flood', 'wetlands', 'no frontage'],
  },
}];

const consoleModel = buildBuilderCallExecutionConsole(rows, saved, { limit: 25 });
assert.ok(consoleModel.queue.length > 0, 'Phase 3 call queue should include callable source-backed builders');
assert.ok(consoleModel.queue.length <= 25, 'Phase 3 call queue must cap at a phone-friendly top 25');
assert.ok(consoleModel.stats.total >= rows.length, 'Phase 3 stats must carry the whole active validation scope');
assert.ok(consoleModel.stats.validated >= 1, 'validated buy boxes must count toward seller-sourcing unlock');
assert.ok(consoleModel.stats.sellerLocked > 0, 'seller sourcing must remain locked for incomplete builder rows');
assert.ok(BUILDER_CALL_OUTCOMES.some(outcome => outcome.id === 'left_voicemail'), 'one-click outcomes must include left voicemail');
assert.ok(BUILDER_CALL_OUTCOMES.some(outcome => outcome.id === 'not_a_buyer'), 'one-click outcomes must include dead/not-a-buyer');

const csv = exportBuilderCallQueueCsv(consoleModel.queue);
assert.match(csv.split('\n')[0], /rank,builderId,name,marketName,phone,email,callStatus,lastTouch,nextFollowUp,score,permits,buyBoxComplete,buyBoxTotal,sellerUnlocked,nextAction/, 'Phase 3 CSV export must include contact, progress, score, gate fields');
assert.match(csv, /knoxville-builder-/, 'Phase 3 CSV export must include real source-backed builder ids');
const json = JSON.parse(exportBuilderCallQueueJson(consoleModel.queue));
assert.equal(json.length, consoleModel.queue.length, 'Phase 3 JSON export must serialize the same call queue');
assert.ok(json[0].nextAction, 'Phase 3 JSON rows need the operator next action');

assert.match(app, /function renderBuilderPhase3CallConsole/, 'Builders route must render a Phase 3 call execution console');
assert.match(app, /Phase 3 · today's call queue/, 'Phase 3 console needs visible Today queue copy');
assert.match(app, /Top 25 callable builders ranked by follow-up urgency/, 'Phase 3 queue order must be explained to operators');
assert.match(app, /data-phase3-call-outcome/, 'Phase 3 console must expose one-click selected-builder outcome controls');
assert.match(app, /id="export-builder-call-queue-csv"/, 'Phase 3 console must export CSV from the Builders route');
assert.match(app, /id="export-builder-call-queue-json"/, 'Phase 3 console must export JSON from the Builders route');
assert.match(app, /buildBuilderCallExecutionConsole\(activeRows, workspace\.buyerValidations \|\| \[\], \{ limit: 25 \}\)/, 'download handlers must export the active Builders scope, not a stale fixture');
assert.match(app, /mergeBuyerValidationPatch\(builderId,[\s\S]{0,520}callStatus: status/, 'Phase 3 outcome buttons must persist selected builder call status through buyerValidations');
assert.match(app, /seller search stays parked until a buy box is captured|Seller search locked until buy box is complete|Seller sourcing stays parked until a buy box is captured/i, 'seller sourcing must remain explicitly gated behind buy-box proof');
assert.match(css, /v1\.99\.4 - Builders Phase 3 call execution console/, 'Phase 3 CSS marker must be appended after Phase 1');
assert.match(css, /\.phase3-builder-call-console[\s\S]{0,500}grid-template-columns/, 'Phase 3 console needs a real layout, not unstyled markup');
assert.match(html, /phase275-builders-call-execution-console/, 'index.html must cache-bust Phase 3 app/CSS changes');

console.log('phase275 Builders call execution console guard passed');
