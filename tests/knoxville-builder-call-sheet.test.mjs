import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/enrich-knoxville-builder-call-sheet.mjs'], { stdio: 'pipe' });

const callSheet = JSON.parse(fs.readFileSync('data/real/knoxville/buyer_call_sheet.json', 'utf8'));
const csv = fs.readFileSync('data/real/knoxville/buyer_call_sheet.csv', 'utf8');

assert.equal(callSheet.rows.length, 10);
assert.equal(callSheet.summary.total, 10);
assert.equal(callSheet.summary.callablePublicBusinessContacts, 9);
assert.ok(callSheet.summary.totalRecentBuildSignals >= 300);

for (const row of callSheet.rows) {
  assert.ok(row.builderId.startsWith('knoxville-builder-'));
  assert.ok(row.sourceUrl, `${row.name} missing source url`);
  assert.ok(row.sourceEvidence, `${row.name} missing source evidence`);
  assert.match(row.callScript, /exact land buy box|exact land demand|exact land/i, `${row.name} call script should ask exact land demand`);
  assert.match(row.callScript, /max lot price|max price/i, `${row.name} call script should ask max price`);
  assert.match(row.callScript, /kills a lot|deal killers/i, `${row.name} call script should ask kill criteria`);
}

const definity = callSheet.rows.find(row => row.name === 'DEFINITY CONSTRUCTION LLC');
assert.ok(definity);
assert.equal(definity.route, 'humanReview');
assert.equal(definity.phone, '');
assert.doesNotMatch(JSON.stringify(definity), /623-745-8065|6237458065/);
assert.match(definity.nextAction, /Find official business-facing contact/);

const davinci = callSheet.rows.find(row => row.name === 'DAVINCI DESIGN AND CONTRACTING LLC');
assert.ok(davinci);
assert.equal(davinci.route, 'humanReview');
assert.equal(davinci.contactStatus, 'directory-contact-human-review');

const saddlebrook = callSheet.rows.find(row => /SADDLEBROOK/.test(row.name));
assert.equal(saddlebrook.phone, '865-966-8700');
assert.equal(saddlebrook.email, 'info@saddlebrookproperties.com');

assert.match(csv, /BALL HOMES/);
assert.match(csv, /DEFINITY CONSTRUCTION LLC/);

console.log('knoxville builder call-sheet tests passed');
