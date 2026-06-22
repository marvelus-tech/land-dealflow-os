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
  assert.equal(row.agentIntakeStatus, 'contact-candidate');
  assert.equal(row.publicProofStatus, 'verified-public-source');
  assert.equal(row.skipTraceStatus, 'needs-skip-trace');
  assert.equal(row.ownerPhone, '', 'unverified contact must not be accepted from a public parcel packet');
  assert.equal(row.ownerEmail, '', 'unverified email must not be accepted from a public parcel packet');
  assert.equal(row.unverifiedOwnerPhone, '865-555-0100', 'unverified contact should remain visible as candidate evidence');
  assert.equal(row.unverifiedOwnerEmail, 'owner@example.com', 'unverified email should remain visible as candidate evidence');
  const daily = buildDailyMoneyQueue({ parcels: result.workspace.parcels, buyers: [], requireRealContact: true });
  assert.equal(daily.today.length, 0, 'source-backed rows without verified contact must not enter callable daily queue');
}

function testCsvKeepsRowsWithoutPublicProofVisible() {
  const csv = 'parcelId,propertyAddress,ownerName,collectedAt,confidence\nNO-PROOF-1,"1 Missing Proof Rd",No Source Owner,2026-06-22,12';
  const result = applyLandReconParcelImport({ parcels: [] }, csv, { now: '2026-06-22T00:00:00.000Z' });
  assert.equal(result.summary.received, 1);
  assert.equal(result.summary.imported, 1);
  assert.equal(result.summary.rejected, 0);
  const row = result.workspace.parcels[0];
  assert.equal(row.agentIntakeStatus, 'needs-public-proof');
  assert.equal(row.publicProofStatus, 'needs-public-proof');
  assert.equal(row.visibleIntake, true);
  assert.deepEqual(row.intakeMissing, ['missing public source URL']);
  assert.equal(row.intakeConfidence, 12);
}

function testWeakContactIsVisibleButNotCallable() {
  const csv = 'parcelId,propertyAddress,ownerName,sourceUrl,collectedAt,candidatePhone,contactSource,matchBasis,contactConfidence,enrichmentStatus\nKGIS-WEAK-1,"3 Weak Contact Rd",Weak Owner,https://knoxcounty.example/p/3,2026-06-22,865-555-0111,manual lookup,name only,31,weak';
  const result = applyLandReconParcelImport({ parcels: [] }, csv, { now: '2026-06-22T00:00:00.000Z' });
  const row = result.workspace.parcels[0];
  assert.equal(row.agentIntakeStatus, 'contact-candidate');
  assert.equal(row.publicProofStatus, 'verified-public-source');
  assert.equal(row.ownerPhone, '', 'weak contact must not become callable ownerPhone');
  assert.equal(row.unverifiedOwnerPhone, '865-555-0111');
  assert.equal(row.unverifiedContactCandidates.length, 1);
  const daily = buildDailyMoneyQueue({ parcels: result.workspace.parcels, buyers: [], requireRealContact: true });
  assert.equal(daily.today.length, 0, 'weak contact candidate must not enter callable daily queue');
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

function testLandReconDuplicateSafeMergeUsesParcelAddressAndSourceUrl() {
  const first = { sellerRows: [{
    parcelId: 'KGIS-DUPE-1',
    propertyAddress: '44 Duplicate Road, Knoxville, TN',
    ownerName: 'Duplicate Owner',
    sourceUrl: 'https://knoxcounty.example/parcels/KGIS-DUPE-1?utm=agent',
    collectedAt: '2026-06-22',
    provenanceNotes: 'first pull',
  }] };
  const initial = applyLandReconParcelImport({ parcels: [] }, JSON.stringify(first), { now: '2026-06-22T00:00:00.000Z' });
  const second = { sellerRows: [{
    apn: 'KGIS-DUPE-1',
    propertyAddress: '44 Duplicate Rd Knoxville TN',
    ownerName: 'Duplicate Owner',
    sourceUrl: 'https://knoxcounty.example/parcels/KGIS-DUPE-1',
    collectedAt: '2026-06-23',
    provenanceNotes: 'second pull should merge, not render a second row',
  }] };
  const merged = applyLandReconParcelImport(initial.workspace, JSON.stringify(second), { now: '2026-06-23T00:00:00.000Z' });
  assert.equal(merged.workspace.parcels.length, 1, 'duplicate-safe import must merge repeated APN/address/source URL rows before UI display');
  assert.equal(merged.summary.created, 0);
  assert.equal(merged.summary.updated, 1);
  assert.equal(merged.summary.duplicateMerged, 1);
  assert.equal(merged.workspace.parcels[0].duplicateMergedCount, 1);
  assert.ok(merged.workspace.parcels[0].duplicateKeyIndex.some(key => key.startsWith('parcel:')), 'row must persist duplicate guard keys for future runs');
}

function testLandReconImportSurfaceExists() {
  assert.match(app, /applyLandReconParcelImport/, 'App must import the Land Recon packet validator.');
  assert.match(app, /function renderLandReconImportPath/, 'Land page must render a Land Recon artifact import path.');
  assert.match(app, /id="land-recon-packet-input"/, 'Land Recon import must expose a paste target.');
  assert.match(app, /id="import-land-recon-packet"/, 'Land Recon import must expose a validate-and-append action.');
  assert.match(app, /preserves first, promotes second/, 'Import surface must describe visible-first ingestion.');
  assert.match(app, /needs-public-proof/, 'Import surface must expose visible proof-needed status.');
  assert.match(app, /Confidence ranks; call-ready remains gated/, 'Import status must preserve ranking and no-shortcut call-ready boundary.');
  assert.match(app, /merged \$\{result\.summary\.duplicateMerged \|\| 0\} duplicate/, 'Import status must report duplicate merges.');
  assert.match(app, /APN, normalized address, owner\+address, and source URL keys merge duplicates/, 'Import copy must explain the duplicate-safe gate.');
  assert.match(app, /duplicate-merge-note/, 'Selected listing must surface duplicate merge history.');
  assert.match(app, /function parcelSelectionKey\(parcel = \{\}\)/, 'Land row selection needs a stable key helper for generated rows without id fields.');
  assert.match(app, /parcelSelectionKey\(parcel\) === selectedParcelId/, 'Selected parcel lookup must use the stable parcel key, not only parcel.id.');
  assert.match(app, /data-select-parcel="\$\{h\(parcelKey\)\}"/, 'Land rows must render non-empty selection keys from parcelId/address fallback.');
  assert.doesNotMatch(app, /data-select-parcel="\$\{h\(parcel\.id\)\}"/, 'Land rows must not render blank data-select-parcel for generated parcelId-only rows.');
  assert.match(css, /v1\.102 - Deals duplicate-safe ledger \+ Builders-nav parity \+ screenshot QA fixes/, 'Phase 102 CSS marker missing.');
  assert.match(css, /--phase102-rule: builders-nav-parity-land-ledger-duplicate-safe/, 'Phase 102 CSS rule marker missing.');
  assert.match(css, /html body > header\.nav\.nav[\s\S]{0,520}border-radius: 999px/, 'Global nav must inherit Builders-style pill rail on every route.');
  assert.match(css, /body\[data-active-view="deals"\] #parcels \.land-listing-row[\s\S]{0,220}grid-template-areas/, 'Deals listing rows must have a non-overlapping grid layout.');
  assert.match(css, /body\[data-active-view="deals"\] #parcels a\.is-disabled/, 'Locked call actions must be visibly disabled instead of pretending to be callable.');
  assert.match(css, /v1\.100 - Land Recon artifact import path validates source proof before appending to Land/, 'Phase 100 Land Recon import CSS marker missing.');
  assert.match(css, /--phase100-land-recon-import: source-backed-artifact-validation-before-ledger-append/, 'Phase 100 CSS rule marker missing.');
  assert.match(css, /v1\.101 - Land agent findings are visible-first/, 'Phase 101 visible intake CSS marker missing.');
  assert.match(css, /--phase101-land-visible-intake: all-useful-agent-findings-visible-ranked-not-hidden/, 'Phase 101 CSS rule marker missing.');
  assert.match(css, /\.land-recon-import-path[\s\S]{0,220}grid-template-columns: minmax\(280px, \.52fr\) minmax\(0, 1fr\)/, 'Import path must render as a calm two-column proof surface.');
}

testSourceBackedPacketImportsButDoesNotBecomeCallable();
testCsvKeepsRowsWithoutPublicProofVisible();
testWeakContactIsVisibleButNotCallable();
testVerifiedEnrichmentCanPromoteContactButStillShowsProof();
testLandReconDuplicateSafeMergeUsesParcelAddressAndSourceUrl();
testLandReconImportSurfaceExists();

console.log('land recon import tests passed');
