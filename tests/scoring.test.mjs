import assert from 'node:assert/strict';
import {
  scoreMarket,
  computeOffer,
  classifyParcelRisk,
  rankBuyers,
  parseCsvRecords,
  scoreParcelDeal,
  applyCrmUpdate,
  exportWorkspace,
  importWorkspace,
  getLehighImportTemplate,
  buildTopCallList,
  exportParcelsCsv,
  normalizeCsvToParcels,
  findDuplicateParcels,
  reportMissingData,
  getDataSourceChecklist,
} from '../src/core.mjs';

function testScoreMarketRewardsBuilderDemandAndStandardizedLots() {
  const market = {
    newBuilds90d: 42,
    activeBuilders: 12,
    vacantLotSales90d: 99,
    offMarketVacantLots: 2200,
    lotStandardization: 9,
    growthSignal: 8,
    complianceSimplicity: 7,
    buildabilityRisk: 3,
  };
  const score = scoreMarket(market);
  assert.equal(score.grade, 'A');
  assert.ok(score.total >= 80, `expected A market, got ${score.total}`);
  assert.ok(score.reasons.includes('strong builder base'));
}

function testScoreMarketKillsThinBuilderMarkets() {
  const market = {
    newBuilds90d: 4,
    activeBuilders: 2,
    vacantLotSales90d: 8,
    offMarketVacantLots: 30,
    lotStandardization: 2,
    growthSignal: 4,
    complianceSimplicity: 8,
    buildabilityRisk: 2,
  };
  const score = scoreMarket(market);
  assert.equal(score.grade, 'D');
  assert.ok(score.flags.includes('too few builders'));
  assert.ok(score.flags.includes('too little new construction'));
}

function testOfferEngineKeepsSpreadAndSellerNetLogic() {
  const offer = computeOffer({
    buyerMaxPrice: 50000,
    desiredSpreadPct: 0.16,
    closingCosts: 1800,
    riskDiscount: 1500,
    lowestActiveListing: 56000,
  });
  assert.equal(offer.buyerPrice, 50000);
  assert.equal(offer.targetSpread, 8000);
  assert.equal(offer.initialSellerOffer, 38700);
  assert.equal(offer.maxSellerOffer, 42000);
  assert.equal(offer.killPrice, 42500);
}

function testParcelRiskClassification() {
  const risky = classifyParcelRisk({
    wetlands: 'likely',
    floodZone: true,
    roadAccess: false,
    utilities: 'unknown',
    slope: 'steep',
    wildlifeFlag: true,
  });
  assert.equal(risky.status, 'Kill');
  assert.ok(risky.flags.length >= 4);

  const clean = classifyParcelRisk({
    wetlands: 'none',
    floodZone: false,
    roadAccess: true,
    utilities: 'water+sewer',
    slope: 'flat',
    wildlifeFlag: false,
  });
  assert.equal(clean.status, 'Pass');
}

function testRankBuyersPrioritizesRepeatScatteredLotBuilders() {
  const ranked = rankBuyers([
    { name: 'Investor Lowball LLC', recentBuilds: 0, scatteredLots: false, hasBuyBox: true, closeSpeedDays: 30, repeatDemand: 3 },
    { name: 'Precision Homes', recentBuilds: 18, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 14, repeatDemand: 9 },
  ]);
  assert.equal(ranked[0].name, 'Precision Homes');
  assert.ok(ranked[0].score > ranked[1].score);
}

testScoreMarketRewardsBuilderDemandAndStandardizedLots();
testScoreMarketKillsThinBuilderMarkets();
testOfferEngineKeepsSpreadAndSellerNetLogic();
testParcelRiskClassification();
testRankBuyersPrioritizesRepeatScatteredLotBuilders();

function testCsvParserHandlesQuotedFieldsAndTypeCoercion() {
  const csv = 'address,market,buyerMaxPrice,roadAccess,notes\n"12, Canal Rd",lehigh,42000,true,"seller says, call after 5"';
  const records = parseCsvRecords(csv);
  assert.equal(records.length, 1);
  assert.equal(records[0].address, '12, Canal Rd');
  assert.equal(records[0].buyerMaxPrice, 42000);
  assert.equal(records[0].roadAccess, true);
  assert.equal(records[0].notes, 'seller says, call after 5');
}

function testParcelDealScorePrioritizesCleanHighSpreadBuyerFit() {
  const buyer = { id: 'precision', market: 'lehigh', maxPrice: 42000, buyBox: '0.25 acre infill paved road', score: 86 };
  const parcel = {
    market: 'lehigh',
    buyerId: 'precision',
    buyerMaxPrice: 42000,
    lowestActiveListing: 48000,
    askingPrice: 28500,
    paid: 6000,
    heldYears: 12,
    owner: 'Absentee owner',
    wetlands: 'none',
    floodZone: false,
    roadAccess: true,
    utilities: 'nearby',
    slope: 'flat',
  };
  const scored = scoreParcelDeal(parcel, buyer);
  assert.ok(scored.score >= 80, `expected call-now score, got ${scored.score}`);
  assert.equal(scored.action, 'Call now');
  assert.ok(scored.reasons.includes('clean buildability pass'));
  assert.ok(scored.metrics.spread >= 8000);
}

function testParcelDealScoreKillsSevereBuildabilityRisk() {
  const scored = scoreParcelDeal({
    market: 'lehigh',
    buyerMaxPrice: 42000,
    lowestActiveListing: 47000,
    askingPrice: 35000,
    paid: 3000,
    heldYears: 17,
    owner: 'Inherited owner',
    wetlands: 'likely',
    floodZone: true,
    roadAccess: false,
    utilities: 'unknown',
    slope: 'flat',
    wildlifeFlag: true,
  });
  assert.equal(scored.risk.status, 'Kill');
  assert.equal(scored.action, 'Kill');
  assert.ok(scored.score <= 35);
}

function testCrmUpdateAndWorkspaceExportImportRoundTrip() {
  const workspace = {
    markets: [],
    buyers: [],
    parcels: [{ id: 'p1', address: '123 Grant Blvd', crmStatus: 'New', notes: '' }],
  };
  const updated = applyCrmUpdate(workspace, 'p1', { crmStatus: 'Contacted', notes: 'Left voicemail', nextFollowUp: '2026-06-20' });
  assert.equal(updated.parcels[0].crmStatus, 'Contacted');
  assert.equal(updated.parcels[0].notes, 'Left voicemail');
  assert.notEqual(updated, workspace, 'CRM updates should be immutable for predictable localStorage writes');

  const exported = exportWorkspace(updated);
  const restored = importWorkspace(exported);
  assert.deepEqual(restored.parcels[0], updated.parcels[0]);
}

function testLehighTemplateIncludesContactsAndParsesBack() {
  const template = getLehighImportTemplate();
  assert.ok(template.startsWith('address,market,buyerId'));
  assert.ok(template.includes('ownerName'));
  assert.ok(template.includes('ownerPhone'));
  assert.ok(template.includes('buyerContactName'));
  assert.ok(template.includes('skipTraceConfidence'));
  const records = parseCsvRecords(template);
  assert.ok(records.length >= 3);
  assert.equal(records[0].market, 'lehigh');
  assert.ok(records[0].ownerPhone);
  assert.ok(records[0].buyerContactName);
}

function testTopCallListRanksOnlyCallableParcelsWithContactFields() {
  const buyers = [{ id: 'precision', market: 'lehigh', maxPrice: 42000, score: 86, contactName: 'Maya', phone: '239-555-0100', email: 'maya@example.com' }];
  const parcels = [
    { id: 'a', market: 'lehigh', buyerId: 'precision', address: 'A St', ownerName: 'A Owner', ownerPhone: '239-555-0001', ownerEmail: '', buyerMaxPrice: 42000, lowestActiveListing: 48000, askingPrice: 26000, heldYears: 12, paid: 5000, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'nearby', slope: 'flat' },
    { id: 'b', market: 'lehigh', buyerId: 'precision', address: 'B St', ownerName: 'B Owner', ownerPhone: '', ownerEmail: '', buyerMaxPrice: 42000, lowestActiveListing: 48000, askingPrice: 24000, heldYears: 12, paid: 5000, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'nearby', slope: 'flat' },
    { id: 'c', market: 'lehigh', buyerId: 'precision', address: 'C St', ownerName: 'C Owner', ownerPhone: '239-555-0003', ownerEmail: '', buyerMaxPrice: 42000, lowestActiveListing: 48000, askingPrice: 35000, heldYears: 2, paid: 30000, wetlands: 'likely', floodZone: true, roadAccess: false, utilities: 'unknown', slope: 'flat' },
  ];
  const calls = buildTopCallList({ parcels, buyers, limit: 20 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].address, 'A St');
  assert.equal(calls[0].ownerPhone, '239-555-0001');
  assert.equal(calls[0].buyerContactName, 'Maya');
  assert.equal(calls[0].callPriority, 1);
}

function testFilteredCsvExportIncludesHeadersAndEscapesCommas() {
  const csv = exportParcelsCsv([
    { address: '12, Canal Rd', ownerName: 'A Owner', ownerPhone: '239-555-0001', buyerContactName: 'Maya', score: 91, action: 'Call now', notes: 'seller says, call after 5' },
  ]);
  const lines = csv.split('\n');
  assert.ok(lines[0].includes('address,ownerName,ownerPhone'));
  assert.ok(lines[1].includes('"12, Canal Rd"'));
  assert.ok(lines[1].includes('"seller says, call after 5"'));
}

function testNormalizationPresetMapsCountyAndPropstreamExports() {
  const countyCsv = 'Situs Address,Parcel Number,Owner Name,Mailing Address,Just Value\n123 Grant Blvd,30-44-27-L1,Avery Santos,"88 Pine St, Tampa FL",41000';
  const county = normalizeCsvToParcels(countyCsv, 'lee-county');
  assert.equal(county[0].address, '123 Grant Blvd');
  assert.equal(county[0].parcelId, '30-44-27-L1');
  assert.equal(county[0].ownerName, 'Avery Santos');
  assert.equal(county[0].market, 'lehigh');
  assert.equal(county[0].buyerId, 'precision');

  const propstreamCsv = 'Property Address,APN,Owner 1 Full Name,Owner Mailing Address,Estimated Value,Phone 1\n2511 W 9th St,30-44-27-L2,Jordan Estate,"PO Box 44, Fort Myers FL",46500,239-555-0199';
  const propstream = normalizeCsvToParcels(propstreamCsv, 'propstream');
  assert.equal(propstream[0].parcelId, '30-44-27-L2');
  assert.equal(propstream[0].ownerPhone, '239-555-0199');
  assert.equal(propstream[0].lowestActiveListing, 46500);
}

function testDuplicateDetectionUsesApnThenNormalizedAddress() {
  const duplicates = findDuplicateParcels([
    { id: 'a', parcelId: '30-44-27-L1', address: '123 Grant Blvd, Lehigh Acres FL' },
    { id: 'b', parcelId: '30-44-27-L1', address: 'Different address' },
    { id: 'c', parcelId: '', address: '123 grant boulevard lehigh acres fl' },
    { id: 'd', parcelId: '', address: '999 Clean St' },
  ]);
  assert.equal(duplicates.length, 2);
  assert.deepEqual(duplicates.map(group => group.ids.sort()), [['a', 'b'], ['a', 'c']]);
}

function testMissingDataReportRanksCriticalGaps() {
  const report = reportMissingData([
    { id: 'a', address: 'A St', ownerName: 'Owner', ownerPhone: '', ownerEmail: '', roadAccess: true, utilities: 'nearby', wetlands: 'none', floodZone: false, buyerMaxPrice: 42000, askingPrice: 28000 },
    { id: 'b', address: 'B St', ownerName: '', ownerPhone: '239-555-0002', roadAccess: '', utilities: 'unknown', wetlands: '', floodZone: '', buyerMaxPrice: '', askingPrice: '' },
  ]);
  assert.equal(report.totalParcels, 2);
  assert.equal(report.rows[0].id, 'b');
  assert.ok(report.rows[0].missing.includes('ownerName'));
  assert.ok(report.rows[0].missing.includes('buildability'));
  assert.ok(report.rows[0].missing.includes('pricing'));
  assert.equal(report.summary.ownerContactMissing, 1);
}

function testDataSourceChecklistDefinesMinimumImportGates() {
  const checklist = getDataSourceChecklist('lehigh');
  assert.ok(checklist.some(item => item.id === 'county-parcel-export' && item.required));
  assert.ok(checklist.some(item => item.id === 'owner-contact-enrichment' && item.blocksCallList));
  assert.ok(checklist.some(item => item.id === 'buildability-screen' && item.blocksCallList));
}

testNormalizationPresetMapsCountyAndPropstreamExports();
testDuplicateDetectionUsesApnThenNormalizedAddress();
testMissingDataReportRanksCriticalGaps();
testDataSourceChecklistDefinesMinimumImportGates();

testCsvParserHandlesQuotedFieldsAndTypeCoercion();
testParcelDealScorePrioritizesCleanHighSpreadBuyerFit();
testParcelDealScoreKillsSevereBuildabilityRisk();
testCrmUpdateAndWorkspaceExportImportRoundTrip();
testLehighTemplateIncludesContactsAndParsesBack();
testTopCallListRanksOnlyCallableParcelsWithContactFields();
testFilteredCsvExportIncludesHeadersAndEscapesCommas();
console.log('scoring tests passed');
