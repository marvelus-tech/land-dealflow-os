import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildTaxDeedOwnerRunway,
  parseTaxDeedOwnerRunwayImport,
  exportTaxDeedOwnerRunwayCsv,
  importWorkspace,
  isTaxDeedVacantLandCandidate,
} from '../src/core.mjs';

const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

const rows = parseTaxDeedOwnerRunwayImport(`state,county,ownerName,ownerPhone,parcelId,propertyAddress,propertyUse,auctionDate,sourceUrl,countyPageUrl,buyerFit
TN,Knox,Avery Owner,865-555-0101,KGIS-1,"123 Future Auction Rd",vacant residential lot,2026-08-15,https://county.example/taxsale,https://county.example/parcel/KGIS-1,Knox builder lot fit
TN,Knox,No Contact,,KGIS-2,"456 Mail First Rd",vacant land,2026-09-10,https://county.example/taxsale,https://county.example/parcel/KGIS-2,Buyer fit pending
TN,Knox,Improved Owner,865-555-0199,KGIS-3,"789 House Rd",Single family dwelling,2026-09-12,https://county.example/taxsale,https://county.example/parcel/KGIS-3,Buyer fit pending`);
const runway = buildTaxDeedOwnerRunway(rows, { today: '2026-07-23', minRunwayDays: 21 });

assert.equal(rows.length, 3, 'CSV import must parse future owner rows.');
assert.equal(runway.stats.total, 2, 'Runway must count only vacant/residential land owner rows.');
assert.equal(runway.stats.rejectedNonLand, 1, 'Runway must reject obvious improved/non-land rows.');
assert.equal(isTaxDeedVacantLandCandidate({ propertyUse: 'Vacant residential lot' }), true, 'Vacant lot rows must pass the land filter.');
assert.equal(isTaxDeedVacantLandCandidate({ propertyUse: 'Single family dwelling' }), false, 'Improved residential structures must not enter the land-owner runway.');
assert.equal(runway.rows[0].daysUntilAuction, 23, 'Runway must calculate days until auction.');
assert.equal(runway.rows[0].runwayStage, 'work-now', '21-75 day source-backed rows should be work-now.');
assert.match(runway.rows[0].nextAction, /Call now/, 'Verified contact with enough runway must become call-now.');
assert.match(runway.rows[1].nextAction, /Skip trace|mail/i, 'No-contact rows with enough runway must become enrichment/mail work.');
assert.match(exportTaxDeedOwnerRunwayCsv(runway.rows), /daysUntilAuction,runwayStage,priority/, 'Runway export must include deadline/priority columns.');
assert.match(exportTaxDeedOwnerRunwayCsv(runway.rows), /countyPageUrl/, 'Runway export must include direct county parcel/review URLs.');
assert.equal(runway.rows[0].countyPageUrl, 'https://county.example/parcel/KGIS-1', 'Runway rows must preserve direct county page links.');
assert.deepEqual(importWorkspace({ taxDeedOwnerRunwayRows: rows }).taxDeedOwnerRunwayRows, rows, 'Workspace import must preserve tax deed owner runway bucket.');

assert.match(app, /renderTaxDeedOwnerRunwayConsole/, 'Land page must render the owner runway console.');
assert.match(app, /County page/, 'Land page must expose direct county parcel review links per owner row.');
assert.match(app, /countyPageUrl/, 'Land page import template must accept direct county parcel review URLs.');
assert.match(app, /#import-tax-deed-owner-runway/, 'App must wire owner runway import action.');
assert.match(app, /#export-tax-deed-owner-runway/, 'App must wire owner runway export action.');
assert.match(app, /phase292-tax-deed-owner-runway/, 'App must carry Phase 292 runway marker.');
assert.match(css, /--phase292-tax-deed-owner-runway-rule: forward-looking-owner-list-before-auction/, 'CSS must encode the Phase 292 owner-runway rule.');
assert.match(html, /phase292-tax-deed-owner-runway/, 'Live assets must be cache-busted for Phase 292.');
assert.match(pkg, /phase292-tax-deed-owner-runway\.test\.mjs/, 'npm test must include Phase 292 guard.');

console.log('phase292 tax deed owner runway guard passed');
