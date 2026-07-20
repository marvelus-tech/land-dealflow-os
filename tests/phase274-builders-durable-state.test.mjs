import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBuyerValidationCommandCenter, exportWorkspace, importWorkspace } from '../src/core.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const core = readFileSync('src/core.mjs', 'utf8');
const rows = JSON.parse(readFileSync('data/real/knoxville/buyer_call_sheet.json', 'utf8')).rows;
const nonFirst = rows[2];

const savedWorkspace = {
  markets: [],
  buyers: [],
  parcels: [],
  permitRecords: [],
  permitBuilders: [],
  builderUi: {
    selectedBuilderMarketState: 'TN',
    selectedBuilderMarketKey: 'knoxville-tn',
    selectedValidationBuilderId: nonFirst.builderId,
  },
  buyerValidations: [{
    builderId: nonFirst.builderId,
    callStatus: 'spoke_to_decision_maker',
    lastContacted: '2026-07-20',
    callbackDate: '2026-07-23',
    callNotes: 'Exact language survives reload.',
    outreach: {
      phone: { contacted: true, at: '2026-07-20' },
      email: { contacted: true, at: '2026-07-20' },
      mail: { contacted: true, at: '2026-07-21' },
    },
    buyBox: {
      geography: 'West Knoxville / Karns',
      lotSize: '0.25-1 ac',
      maxPrice: 65000,
      closeSpeed: '14-30 days',
      packageRecipient: 'land desk',
      utilitiesAccess: 'road, water, electric at street',
      productType: 'single-family lots',
      dealKillers: ['flood', 'wetlands', 'no frontage'],
    },
  }],
};

const restored = importWorkspace(exportWorkspace(savedWorkspace));
assert.equal(restored.builderUi.selectedValidationBuilderId, nonFirst.builderId, 'selected non-first builder must survive export/import hydration');
assert.equal(restored.builderUi.selectedBuilderMarketKey, 'knoxville-tn', 'selected Builders market must survive export/import hydration');
assert.equal(restored.buyerValidations[0].callbackDate, '2026-07-23', 'callback date must persist with builder validation row');
assert.equal(restored.buyerValidations[0].outreach.mail.contacted, true, 'mail outreach must survive builder validation hydration');
assert.deepEqual(restored.buyerValidations[0].buyBox.dealKillers, ['flood', 'wetlands', 'no frontage'], 'buy-box list fields must survive hydration');

const center = buildBuyerValidationCommandCenter(rows, restored.buyerValidations);
const selected = center.items.find(item => item.builderId === nonFirst.builderId);
assert.equal(selected.callNotes, 'Exact language survives reload.');
assert.equal(selected.outreach.phone.contacted, true);
assert.equal(selected.outreach.email.contacted, true);
assert.equal(selected.outreach.mail.contacted, true);
assert.equal(selected.buyBox.geography, 'West Knoxville / Karns');
assert.equal(selected.callbackDate, '2026-07-23');
assert.ok(center.items[0].builderId !== nonFirst.builderId || rows[0].builderId !== nonFirst.builderId, 'fixture intentionally exercises a non-first source row');

assert.match(core, /builderUi: parsed\.builderUi && typeof parsed\.builderUi === 'object' \? parsed\.builderUi : \{\}/, 'workspace import must preserve builderUi selection state');
assert.match(app, /function hydrateBuilderUiState\(\)/, 'app must hydrate Builders route/row selection from local workspace state');
assert.match(app, /function rememberBuilderSelection\(patch = \{\}, options = \{\}\)/, 'app must centralize durable Builders selection persistence');
assert.match(app, /selectedValidationBuilderId = validationBuilderButton\.dataset\.selectValidationBuilder;[\s\S]{0,140}rememberBuilderSelection\(\{ selectedValidationBuilderId \}\)/, 'clicking a non-first builder row must persist selected builder id before rerender');
assert.match(app, /const validationContactButton = event\.target\.closest\('\[data-toggle-validation-contact\]'\);[\s\S]{0,1600}rememberBuilderSelection\(\{ selectedValidationBuilderId: builderId \}, \{ write: false \}\);[\s\S]{0,120}persistWorkspace\(\)/, 'outreach toggles must persist row selection and contact state in one workspace write');
assert.match(app, /function readBuyerValidationForm\(form\)/, 'buy-box/status/date/note capture must use one shared form reader');
assert.match(app, /function persistBuyerValidationFormDraft\(form, \{ render = false, promote = false \} = \{\}\)/, 'builder validation forms need a durable draft-persistence path');
assert.match(app, /document\.addEventListener\('input'[\s\S]{0,620}persistBuyerValidationFormDraft\(validationForm, \{ render: false, promote: false \}\)/, 'typing notes or buy-box fields must auto-save drafts without row reselection');
assert.match(app, /document\.addEventListener\('change'[\s\S]{0,620}persistBuyerValidationFormDraft\(validationForm, \{ render: false, promote: false \}\)/, 'status/date/select changes must auto-save drafts without waiting for the save button');
assert.match(app, /persistBuyerValidationFormDraft\(form, \{ render: false, promote: true \}\)/, 'Save validation must reuse the durable form draft path and only then promote eligible buyer rows');
assert.match(app, /async function loadKnoxvilleBuyerCallSheet\(\)[\s\S]{0,420}cachedBuilderSwitchboardEntries = null;[\s\S]{0,80}builderPanelRenderSequence \+= 1;/, 'Knoxville builder data load must invalidate cached state/index cards and force a Builders rerender');
assert.match(app, /async function loadBuilderMarketData\(\)[\s\S]{0,900}cachedBuilderSwitchboardEntries = null;[\s\S]{0,120}builderPanelRenderSequence \+= 1;/, 'Async market data load must force the Builders index to repaint populated counts instead of freezing zero-count cards');

console.log('phase274 Builders durable state guard passed');
