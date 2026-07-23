import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateContractDeadline, importWorkspace, exportWorkspace } from '../src/core.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

const active = calculateContractDeadline({ effectiveDate: '2026-01-01', contractTermDays: '45' }, '2026-01-15');
assert.equal(active.deadlineDate, '2026-02-15', '45-day seller agreement must produce the closing/termination deadline.');
assert.equal(active.daysLeft, 31, 'Contract clock must count days left from today to deadline.');
assert.equal(active.state, 'active');

const urgent = calculateContractDeadline({ effectiveDate: '2026-01-01', contractTermDays: '45' }, '2026-02-13');
assert.equal(urgent.daysLeft, 2);
assert.equal(urgent.state, 'urgent', 'Inside three days must force urgent extend/terminate posture.');

const expired = calculateContractDeadline({ effectiveDate: '2026-01-01', contractTermDays: '45' }, '2026-02-18');
assert.equal(expired.state, 'expired', 'Past-deadline contracts must not look active.');
assert.match(expired.nextAction, /extension|termination/i);

const restored = importWorkspace(exportWorkspace({
  markets: [], buyers: [], parcels: [], permitRecords: [], permitBuilders: [], buyerValidations: [], builderUi: {},
  contractDraft: { sellerName: 'Ada Seller', propertyAddress: '1 Rocket Rd', earnestMoney: '250', purchasePrice: '50000', contractTermDays: '45', effectiveDate: '2026-01-01' },
  contractPackets: [{ id: 'packet-1' }],
  contractStageStatus: { sellerAgreement: 'seller-signed' },
  contractDeadlineLog: [{ daysLeft: 31 }],
}));
assert.equal(restored.contractDraft.sellerName, 'Ada Seller', 'contractDraft must survive workspace reload/import.');
assert.equal(restored.contractPackets.length, 1, 'saved contract packets must survive workspace reload/import.');
assert.equal(restored.contractStageStatus.sellerAgreement, 'seller-signed');
assert.equal(restored.contractDeadlineLog[0].daysLeft, 31);

assert.match(app, /function renderContractDeadlineCockpit\(inputs = \{\}\)/, 'Closing page must render the contract deadline cockpit.');
assert.match(app, /data-contract-clock-field/, 'Deadline fields must be explicitly wired for autosave.');
assert.match(app, /form\.querySelectorAll\('\[data-contract-clock-field\]\[name\]'\)\.forEach/, 'Cockpit fields must override duplicate lower packet fields before storing.');
assert.match(app, /persistContractDeadlineDraft\(\{ render: false \}\)/, 'Contract clock must auto-save without waiting for Save draft.');
assert.match(app, /calculateContractDeadline\(values, todayIsoDate\(\)\)/, 'App must calculate the live deadline from saved seller agreement values.');
assert.match(app, /contractDeadlineLog/, 'Workspace should keep a recent clock history for audit/debugging.');
assert.match(css, /--phase291-contract-clock-rule: seller-agreement-deadline-countdown-extend-or-terminate/, 'CSS must encode the Phase 291 contract-clock rule.');
assert.match(html, /phase291-closing-contract-clock/, 'Live assets must be cache-busted for the contract clock.');
assert.match(pkg, /phase291-closing-contract-clock\.test\.mjs/, 'Full npm test must include the Phase 291 contract-clock guard.');

console.log('phase291 closing contract clock guard passed');
