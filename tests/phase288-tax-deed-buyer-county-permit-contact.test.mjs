import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leeCountyTaxDeedBuyers } from '../src/taxDeedBuyers.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const html = readFileSync('index.html', 'utf8');

assert.match(app, /phase288-county-permit-contact/, 'app import must cache-bust phase288 county permit contacts');
assert.match(html, /phase288-county-permit-contact/, 'index must cache-bust phase288 live bundle');
assert.match(app, /contactUrl\.includes\('DocumentCenter'\).*'Permit'/s, 'permit-sourced contact links should label as Permit');

const esmer = leeCountyTaxDeedBuyers.find(buyer => buyer.buyerName === 'ESMER MACEDO');
assert.ok(esmer, 'Esmer buyer row must exist');
assert.equal(esmer.phone, '+1 239-771-0343', 'Esmer must receive only the verified Fort Myers permit bus phone');
assert.equal(esmer.email, '', 'Esmer must not receive unverified email data');
assert.match(esmer.contactUrl, /fortmyers\.gov\/DocumentCenter\/View\/23751\/202409---New-Projects/, 'Esmer contact source must be the public Fort Myers new-projects report');
assert.match(esmer.contactRole, /permit billing contact/, 'Esmer contact role must identify permit billing context');
assert.match(esmer.confidence, /verified_public_phone_county_permit/, 'Esmer confidence must mark county permit source');
assert.match(esmer.notes, /BLDR-046589-2024/, 'Esmer notes must preserve permit number provenance');
assert.match(esmer.notes, /POOL-046794-2024/, 'Esmer notes must preserve second permit provenance');

const nonMagalyNonEsmer = leeCountyTaxDeedBuyers.filter(buyer => !['MAGALY CRUZ PINEIRO', 'ESMER MACEDO'].includes(buyer.buyerName));
assert.equal(nonMagalyNonEsmer.length, 25, 'phase288 exhaustion guard should cover remaining 25 rows');
for (const buyer of nonMagalyNonEsmer) {
  assert.match(buyer.confidence, /phase288_county_contact_exhausted/, `${buyer.buyerName} should be marked county-contact exhausted`);
  assert.match(buyer.notes, /permit\/new-projects, business-tax, code-enforcement, Notice of Commencement/, `${buyer.buyerName} needs county enrichment route notes`);
  assert.equal(buyer.email, '', `${buyer.buyerName} should not receive unverified email data`);
}

const phoneRows = leeCountyTaxDeedBuyers.filter(buyer => buyer.phone);
assert.deepEqual(phoneRows.map(buyer => buyer.buyerName).sort(), ['ESMER MACEDO', 'MAGALY CRUZ PINEIRO'], 'only source-backed public phone rows should be callable');

console.log('phase288 county permit contact enrichment guard passed');
