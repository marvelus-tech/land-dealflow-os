import assert from 'node:assert/strict';
import {
  buildPermitVerifiedBuilders,
  generateBuilderCallScript,
  generateBuilderEmail,
  generateBuilderMarketingEmailTemplate,
  getSourceAdapterChecklist,
  getPermitPortalLandscape,
  isQualifyingResidentialPermit,
  normalizeBuilderName,
} from '../src/core.mjs';

const records = [
  { permitNumber: 'A1', permitStatus: 'Issued', permitType: 'New Single Family Residence', issueDate: '2026-05-01', jurisdiction: 'Lee County', siteAddress: '1 Main', contractorName: 'Precision Gulf Homes LLC', licenseNumber: 'CBC1', phone: '239-555-0100', email: 'land@example.com', website: 'https://example.com' },
  { permitNumber: 'A2', permitStatus: 'Approved', permitType: 'Residential New Construction SFR', issueDate: '2026-04-01', jurisdiction: 'Lee County', siteAddress: '2 Main', contractorName: 'Precision Gulf Homes, LLC', licenseNumber: 'CBC1', phone: '239-555-0100', email: 'land@example.com', website: 'https://example.com' },
  { permitNumber: 'A3', permitStatus: 'Final', permitType: 'Single Family Dwelling New', issueDate: '2026-03-01', jurisdiction: 'Lee County', siteAddress: '3 Main', contractorName: 'Precision Gulf Homes', licenseNumber: 'CBC1', phone: '239-555-0100', email: 'land@example.com', website: 'https://example.com' },
  { permitNumber: 'BAD1', permitStatus: 'Issued', permitType: 'Roofing', issueDate: '2026-05-01', jurisdiction: 'Lee County', contractorName: 'Precision Gulf Homes LLC', licenseNumber: 'CBC1' },
  { permitNumber: 'BAD2', permitStatus: 'Denied', permitType: 'New Single Family Residence', issueDate: '2026-05-01', jurisdiction: 'Lee County', contractorName: 'Other Builder', licenseNumber: 'CBC2' },
  { permitNumber: 'OLD1', permitStatus: 'Issued', permitType: 'New Single Family Residence', issueDate: '2023-01-01', jurisdiction: 'Lee County', contractorName: 'Old Builder', licenseNumber: 'CBC3' },
];

assert.equal(normalizeBuilderName('Precision Gulf Homes, LLC'), 'precision gulf');
assert.equal(isQualifyingResidentialPermit(records[0]), true);
assert.equal(isQualifyingResidentialPermit(records[3]), false);
assert.equal(isQualifyingResidentialPermit(records[4]), false);

const builders = buildPermitVerifiedBuilders(records, { minimumPermits: 3, months: 12, now: '2026-06-18' });
assert.equal(builders.length, 1);
assert.equal(builders[0].qualifyingPermitCount, 3);
assert.equal(builders[0].recentPermits.length, 3);
assert.equal(builders[0].contactConfidence, 100);
assert.ok(builders[0].score >= 58);

const script = generateBuilderCallScript({ companyName: 'Precision Gulf Homes', contactName: 'Maya', primaryCity: 'Lehigh Acres' });
assert.match(script, /off-market residential lots/i);
assert.match(script, /zip codes/i);
assert.match(script, /max price/i);

const email = generateBuilderEmail({
  companyName: 'Smithbilt Homes',
  name: 'Smithbilt Homes',
  marketName: 'Knoxville',
  sourceType: 'KGIS',
  recentBuilds: 70,
  topPermit: '25-B1211',
  topPermitAddress: '8362 LAKE VILLAGE CIR',
});
assert.equal(email.subject, 'Quick question on Knoxville lots');
assert.match(email.body, /Good afternoon/);
assert.match(email.body, /My name is Okeito, and I run MarvelUs Intel LLC/);
assert.match(email.body, /I saw Smithbilt Homes is building in Knoxville/);
assert.match(email.body, /I bring builders off-market land opportunities/);
assert.match(email.body, /make the screening easy/);
assert.match(email.body, /save you money versus buying on-market/);
assert.match(email.body, /Is there anything specific you’re looking for right now, and what range would you want to pay\?/);
assert.doesNotMatch(email.body, /What zip codes\/subdivisions|Flood, wetlands|Best person to send a clean parcel package|not trying to blast you/);
assert.ok(email.body.length < 520, 'relationship email should stay short enough to scan quickly');
assert.match(email.body, /Okeito S\.\nMarvelUs Intel LLC/);

const marketingEmail = generateBuilderMarketingEmailTemplate({ companyName: 'Precision Gulf Homes', contactName: 'Maya', primaryCity: 'Lehigh Acres' });
assert.equal(marketingEmail.subject, 'Quick question on Lehigh Acres lots');
assert.match(marketingEmail.body, /MarvelUs Intel LLC/);
assert.doesNotMatch(marketingEmail.body, /assortment of marketing efforts and acquisition avenues/);
assert.doesNotMatch(marketingEmail.body, /few weeks|few days/i);

const adapters = getSourceAdapterChecklist();
assert.deepEqual(adapters.map(item => item.id), ['accela', 'socrata', 'energov', 'etrakit', 'manual-csv']);

const landscape = getPermitPortalLandscape();
assert.match(landscape.summary, /No target state has a unified statewide building-permit database/);
assert.deepEqual(landscape.states.map(item => item.id), ['tn', 'fl', 'az', 'nc', 'tx', 'oh', 'pa', 'ga', 'id']);
assert.equal(landscape.states.every(state => state.portals.every(portal => /^https:\/\//.test(portal.url))), true);
assert.ok(landscape.states.find(state => state.id === 'tx').portals.some(portal => portal.url.includes('permitvector.com')));
assert.ok(landscape.states.find(state => state.id === 'tn').portals.some(portal => portal.url.includes('buildchek.com')));
assert.ok(landscape.tiers.flatMap(tier => tier.items).some(item => item.label === 'U.S. Census Building Permits Survey'));

console.log('builder list tests passed');
