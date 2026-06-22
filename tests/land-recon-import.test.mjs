import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyLandReconParcelImport, buildDailyMoneyQueue } from '../src/core.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

function testSourceBackedPacketImportsButDoesNotBecomeCallable() {
  const packet = {
    sellerRows: [{
      parcelId: 'KGIS-PUBLIC-100',
      propertyAddress: '100 Proof Chain Rd, Knoxville, TN',
      ownerName: 'Public Record Owner',
      ownerMailingAddress: 'PO Box 100, Knoxville, TN',
      sourceUrl: 'https://knoxcounty.example/parcels/KGIS-PUBLIC-100',
      sourceName: 'Knox County assessor',
      sourceType: 'public parcel/owner record',
      collectedAt: '2026-06-22',
      ownerPhone: '865-555-0100',
      ownerEmail: 'owner@example.com',
      confidence: 'unknown',
      provenanceNotes: 'Phone/email copied from unverified note should not become callable.',
    }],
  };
  const result = applyLandReconParcelImport({ parcels: [] }, JSON.stringify(packet), { now: '2026-06-22T00:00:00.000Z' });
  assert.equal(result.summary.imported, 1);
  assert.equal(result.summary.rejected, 0);
  const row = result.workspace.parcels[0];
  assert.equal(row.agentIntakeStatus, 'source-backed');
  assert.equal(row.publicProofStatus, 'verified-public-source');
  assert.equal(row.skipTraceStatus, 'needs-skip-trace');
  assert.equal(row.ownerPhone, '', 'unverified contact must not be accepted from a public parcel packet');
  assert.equal(row.ownerEmail, '', 'unverified email must not be accepted from a public parcel packet');
  const daily = buildDailyMoneyQueue({ parcels: result.workspace.parcels, buyers: [], requireRealContact: true });
  assert.equal(daily.today.length, 0, 'source-backed rows without verified contact must not enter callable daily queue');
}

function testCsvRejectsRowsWithoutPublicProof() {
  const csv = 'parcelId,propertyAddress,ownerName,collectedAt\nNO-PROOF-1,"1 Missing Proof Rd",No Source Owner,2026-06-22';
  const result = applyLandReconParcelImport({ parcels: [] }, csv, { now: '2026-06-22T00:00:00.000Z' });
  assert.equal(result.summary.received, 1);
  assert.equal(result.summary.imported, 0);
  assert.equal(result.summary.rejected, 1);
  assert.match(result.rejected[0].reasons.join(' '), /missing public source URL/);
}

function testVerifiedEnrichmentCanPromoteContactButStillShowsProof() {
  const csv = 'parcelId,propertyAddress,ownerName,sourceUrl,collectedAt,candidatePhone,contactSource,matchBasis,contactConfidence\nKGIS-ENRICHED-1,"2 Verified Contact Rd",Verified Owner,https://knoxcounty.example/p/2,2026-06-22,865-555-0199,manual lookup,"owner + mailing address",91';
  const result = applyLandReconParcelImport({ parcels: [] }, csv, { now: '2026-06-22T00:00:00.000Z' });
  const row = result.workspace.parcels[0];
  assert.equal(row.agentIntakeStatus, 'contact-enriched');
  assert.equal(row.realContact, true);
  assert.equal(row.ownerPhone, '865-555-0199');
  assert.equal(row.publicProofStatus, 'verified-public-source');
}

function testLandReconImportSurfaceExists() {
  assert.match(app, /applyLandReconParcelImport/, 'App must import the Land Recon packet validator.');
  assert.match(app, /function renderLandReconImportPath/, 'Land page must render a Land Recon artifact import path.');
  assert.match(app, /id="land-recon-packet-input"/, 'Land Recon import must expose a paste target.');
  assert.match(app, /id="import-land-recon-packet"/, 'Land Recon import must expose a validate-and-append action.');
  assert.match(app, /Required: parcel\/APN or address, owner name, public source URL, and collectedAt/, 'Import surface must state the validation contract.');
  assert.match(app, /Call-ready remains gated/, 'Import status must preserve the no-shortcut call-ready boundary.');
  assert.match(css, /v1\.100 - Land Recon artifact import path validates source proof before appending to Land/, 'Phase 100 Land Recon import CSS marker missing.');
  assert.match(css, /--phase100-land-recon-import: source-backed-artifact-validation-before-ledger-append/, 'Phase 100 CSS rule marker missing.');
  assert.match(css, /\.land-recon-import-path[\s\S]{0,220}grid-template-columns: minmax\(280px, \.52fr\) minmax\(0, 1fr\)/, 'Import path must render as a calm two-column proof surface.');
}

testSourceBackedPacketImportsButDoesNotBecomeCallable();
testCsvRejectsRowsWithoutPublicProof();
testVerifiedEnrichmentCanPromoteContactButStillShowsProof();
testLandReconImportSurfaceExists();

console.log('land recon import tests passed');
