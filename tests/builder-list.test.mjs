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

const email = generateBuilderEmail({ companyName: 'Precision Gulf Homes', contactName: 'Maya', primaryCity: 'Lehigh Acres' });
assert.match(email.subject, /Lehigh Acres/);
assert.match(email.body, /exact buy box/);
assert.match(email.body, /Closing timeline/);

const marketingEmail = generateBuilderMarketingEmailTemplate({ companyName: 'Precision Gulf Homes', contactName: 'Maya' });
assert.equal(marketingEmail.subject, 'Off-Market Lots for Builders — Let’s Connect');
assert.match(marketingEmail.body, /assortment of marketing efforts and acquisition avenues/);
assert.match(marketingEmail.body, /results in just a few weeks/);
assert.doesNotMatch(marketingEmail.body, /cold calling, SMS, and direct mail/i);
assert.doesNotMatch(marketingEmail.body, /few days/i);

const adapters = getSourceAdapterChecklist();
assert.deepEqual(adapters.map(item => item.id), ['accela', 'socrata', 'energov', 'etrakit', 'manual-csv']);

const landscape = getPermitPortalLandscape();
assert.match(landscape.summary, /No target state has a unified statewide building-permit database/);
assert.deepEqual(landscape.states.map(item => item.id), ['tn', 'fl', 'az', 'nc', 'tx']);
assert.equal(landscape.states.every(state => state.portals.every(portal => /^https:\/\//.test(portal.url))), true);
assert.ok(landscape.states.find(state => state.id === 'tx').portals.some(portal => portal.url.includes('permitvector.com')));
assert.ok(landscape.states.find(state => state.id === 'tn').portals.some(portal => portal.url.includes('buildchek.com')));
assert.ok(landscape.tiers.flatMap(tier => tier.items).some(item => item.label === 'U.S. Census Building Permits Survey'));

console.log('builder list tests passed');
