import assert from 'node:assert/strict';
import {
  CALL_OUTCOMES,
  applyCallOutcome,
  buildCallScript,
  buildDailyMoneyQueue,
  buildBuyerContactQueue,
  buildBuyerFirstBoard,
  buildExecutionConveyor,
  exportMatchedSellerBatchCsv,
  matchSellerParcelsToBuyerBox,
  applyBuyerContactImport,
  applySkipTraceImport,
  exportDailyCallSheetCsv,
} from '../src/core.mjs';

const buyers = [{
  id: 'precision',
  name: 'Precision Gulf Homes',
  contactName: 'Maya Chen',
  phone: '239-555-0100',
  email: 'maya@precisiongulf.example',
  market: 'lehigh',
  maxPrice: 42000,
  recentBuilds: 18,
  scatteredLots: true,
  hasBuyBox: true,
  closeSpeedDays: 14,
  repeatDemand: 8,
  buyBox: 'Paved quarter-acre infill lots under $42k',
  acquisitionNotes: 'Wants clean road access and no wetlands.',
}];

const parcels = [{
  id: 'parcel-1',
  parcelId: 'LEH-001',
  address: '123 Grant Blvd, Lehigh Acres, FL',
  market: 'lehigh',
  buyerId: 'precision',
  lotSize: '0.25 ac',
  ownerName: 'Avery Santos',
  ownerPhone: '239-555-0131',
  ownerMailingAddress: '88 Pine St, Tampa FL',
  askingPrice: 28500,
  lowestActiveListing: 48000,
  buyerMaxPrice: 42000,
  heldYears: 11,
  paid: 6200,
  roadAccess: true,
  utilities: true,
  wetlands: 'none',
  floodZone: '',
  crmStatus: 'New',
}, {
  id: 'parcel-2',
  parcelId: 'LEH-002',
  address: '2511 W 9th St, Lehigh Acres, FL',
  market: 'lehigh',
  buyerId: 'precision',
  lotSize: '0.23 ac',
  ownerName: 'Jordan Estate',
  ownerPhone: '239-555-0199',
  askingPrice: 31000,
  lowestActiveListing: 46500,
  buyerMaxPrice: 42000,
  heldYears: 14,
  paid: 4500,
  roadAccess: true,
  utilities: 'unknown',
  wetlands: 'none',
  floodZone: '',
  crmStatus: 'New',
}];

function testDailyMoneyQueueRanksCallReadySellersWithScriptsAndBuyerBacking() {
  const queue = buildDailyMoneyQueue({ parcels, buyers, limit: 2, now: '2026-06-17T09:00:00.000Z' });
  assert.equal(queue.today.length, 1);
  assert.equal(queue.today[0].ownerName, 'Avery Santos');
  assert.equal(queue.today[0].callScript.opening, 'Hi Avery, this is Okeito. I’m calling about the lot at 123 Grant Blvd, Lehigh Acres, FL — would you consider a clean cash offer if we covered closing costs?');
  assert.equal(queue.today[0].offerAnchor, queue.today[0].offer.initialSellerOffer);
  assert.match(queue.today[0].buyerBacking.summary, /Precision Gulf Homes/);
  assert.equal(queue.followUps.length, 0);
  assert.equal(queue.stats.callReady, 1);
}

function testFollowUpsDueAreSeparatedFromFreshCalls() {
  const queue = buildDailyMoneyQueue({
    parcels: [{ ...parcels[0], crmStatus: 'Contacted', nextFollowUp: '2026-06-17' }, parcels[1]],
    buyers,
    now: '2026-06-17T09:00:00.000Z',
  });
  assert.equal(queue.today.length, 0);
  assert.equal(queue.followUps.length, 1);
  assert.equal(queue.followUps[0].moneyStage, 'Follow-up due');
}

function testCallOutcomeUpdatesCrmStatusAndNextFollowUp() {
  const updated = applyCallOutcome({ parcels }, 'parcel-1', 'seller_interested', { now: '2026-06-17T09:00:00.000Z' });
  const parcel = updated.parcels.find(item => item.id === 'parcel-1');
  assert.equal(parcel.crmStatus, 'Negotiating');
  assert.equal(parcel.callOutcome, 'seller_interested');
  assert.equal(parcel.nextFollowUp, '2026-06-18');
  assert.match(parcel.notes, /Seller interested/);
  assert.equal(CALL_OUTCOMES.seller_interested.label, 'Interested');
}

function testCallScriptExplainsWhatToSayAndOffer() {
  const script = buildCallScript({ parcel: parcels[0], buyer: buyers[0] });
  assert.match(script.opening, /Avery/);
  assert.match(script.motivationQuestion, /What would make selling worth it/);
  assert.match(script.anchorLine, /start around/);
  assert.match(script.buyerProof, /Precision Gulf Homes/);
}

function testDailyCallSheetExportsMoneyFields() {
  const queue = buildDailyMoneyQueue({ parcels, buyers, limit: 1 });
  const csv = exportDailyCallSheetCsv(queue.today);
  assert.match(csv, /ownerName,ownerPhone,address,initialOffer,maxOffer,buyerName,buyerPhone,projectedSpread,callScript,status,nextFollowUp/);
  assert.match(csv, /Avery Santos/);
  assert.match(csv, /Precision Gulf Homes/);
  assert.match(csv, /Call now/);
}

function testSkipTraceImportMatchesRealPublicLeadAndPromotesToToday() {
  const publicLead = {
    id: '274527L4110560090',
    parcelId: '274527L4110560090',
    address: '1050 BELL BLVD S LEHIGH ACRES, FL',
    market: 'lehigh',
    buyerId: 'precision',
    lotSize: '0.252 ac',
    lotSizeAcres: 0.252,
    ownerName: 'MONTEAN PETER & WENDY',
    ownerMailingAddress: '37 HARWOOD DR, BARRIE CANADA',
    askingPrice: 12062,
    lowestActiveListing: 42000,
    buyerMaxPrice: 42000,
    heldYears: 20,
    roadAccess: true,
    utilities: true,
    wetlands: 'none',
    floodZone: '',
    sourceId: 'lehigh-public-vacant-parcels-fdor-2025',
    crmStatus: 'Needs skip trace',
  };
  const csv = 'parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n274527L4110560090,MONTEAN PETER & WENDY,239-555-7722,owner@example.com,91';
  const result = applySkipTraceImport({ parcels: [] }, csv, { candidateParcels: [publicLead] });
  assert.equal(result.summary.matched, 1);
  assert.equal(result.workspace.parcels[0].ownerPhone, '239-555-7722');
  assert.equal(result.workspace.parcels[0].crmStatus, 'New');
  const queue = buildDailyMoneyQueue({ parcels: result.workspace.parcels, buyers, limit: 5, requireRealContact: true });
  assert.equal(queue.today.length, 1);
  assert.equal(queue.today[0].parcelId, '274527L4110560090');
}

function testBuyerContactImportAndValidationQueue() {
  const publicBuilder = { id: 'lehigh-builder-career-financial-corp', name: 'CAREER FINANCIAL CORP', market: 'lehigh', recentBuilds: 27, maxPrice: 42000, validationStatus: 'needs-call-confirmation' };
  const before = buildBuyerContactQueue([publicBuilder]);
  assert.equal(before.length, 1);
  const csv = 'buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice\nlehigh-builder-career-financial-corp,CAREER FINANCIAL CORP,Acquisitions,239-555-8822,deals@career.example,https://career.example,"Lehigh quarter-acre lots under $42k",42000';
  const result = applyBuyerContactImport({ buyers: [] }, csv, { candidateBuyers: [publicBuilder] });
  assert.equal(result.summary.matched, 1);
  assert.equal(result.workspace.buyers[0].phone, '239-555-8822');
  assert.equal(result.workspace.buyers[0].validationStatus, 'buy-box-validated');
  assert.equal(buildBuyerContactQueue(result.workspace.buyers).length, 0);
}

function testBuyerFirstBoardPrioritizesValidatedBuyBoxBeforeSellerSkipTrace() {
  const buyer = {
    id: 'career',
    name: 'CAREER FINANCIAL CORP',
    phone: '239-555-8822',
    buyBoxCaptured: true,
    validationStatus: 'buy-box-validated',
    maxPrice: 42000,
    exactBuyBox: { targetMarkets: ['lehigh'], lotSizeMin: 0.23, lotSizeMax: 0.29, maxPrice: 42000, requiredRoadAccess: true, avoidWetlands: true },
  };
  const sellerCandidates = [{
    ...parcels[0],
    id: 'public-lead-1',
    parcelId: '274527L4110560090',
    ownerPhone: '',
    ownerEmail: '',
    buyerId: '',
    askingPrice: 12062,
    lotSize: '0.252 ac',
    roadAccess: true,
    wetlands: 'none',
  }, {
    ...parcels[1],
    id: 'bad-wetland',
    ownerPhone: '',
    buyerId: '',
    lotSize: '0.25 ac',
    wetlands: 'likely',
  }];
  const matches = matchSellerParcelsToBuyerBox(sellerCandidates, buyer);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].buyerId, 'career');
  assert.equal(matches[0].nextAction, 'skip trace this matched seller');
  const board = buildBuyerFirstBoard({ buyers: [buyer], sellerCandidates });
  assert.equal(board.validatedBuyers.length, 1);
  assert.equal(board.sellerMatches.length, 1);
  assert.equal(board.stats.validatedBuyBoxes, 1);
  assert.equal(board.stats.matchedSellerParcels, 1);
}

function testExecutionConveyorExportsSkipTraceBatchThenPromotesReturns() {
  const buyer = {
    id: 'career',
    name: 'CAREER FINANCIAL CORP',
    phone: '239-555-8822',
    email: 'acq@career.example',
    buyBoxCaptured: true,
    validationStatus: 'buy-box-validated',
    maxPrice: 42000,
    closeSpeedDays: 14,
    packageRecipient: 'Acquisitions desk',
    exactBuyBox: { targetMarkets: ['lehigh'], lotSizeMin: 0.23, lotSizeMax: 0.29, maxPrice: 42000, requiredRoadAccess: true, avoidWetlands: true },
  };
  const publicRecord = {
    id: 'public-lead-1',
    parcelId: '274527L4110560090',
    address: '101 Buyer Fit Ave, Lehigh Acres, FL',
    market: 'lehigh',
    ownerName: 'Public Owner',
    ownerMailingAddress: 'PO Box 1, Fort Myers, FL',
    ownerPhone: '',
    ownerEmail: '',
    askingPrice: 12062,
    lotSize: '0.252 ac',
    roadAccess: true,
    wetlands: false,
    utilities: true,
    sourceId: 'county-public-record',
    sourceUrl: 'https://county.example/record/274527L4110560090',
    contractStatus: 'attorney-reviewed',
    titlePacketStatus: 'title-opened',
  };
  const initial = buildExecutionConveyor({ buyers: [buyer], sellerCandidates: [publicRecord] });
  assert.equal(initial.stats.validatedBuyers, 1);
  assert.equal(initial.stats.matchedSellerBatch, 1);
  assert.equal(initial.stats.promotedSellerCalls, 0, 'public owner records cannot enter the seller cockpit before real contact exists');
  const csv = exportMatchedSellerBatchCsv(initial.matchedSellerBatch);
  assert.match(csv, /buyerName,buyerId,market,parcelId,ownerName/);
  assert.match(csv, /needs-skip-trace/);
  const imported = applySkipTraceImport({ parcels: [] }, 'parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n274527L4110560090,Public Owner,239-555-7711,owner@example.com,94', { candidateParcels: [publicRecord], now: '2026-06-20T00:00:00.000Z' });
  const promoted = buildExecutionConveyor({ buyers: [buyer], sellerCandidates: imported.workspace.parcels });
  assert.equal(promoted.stats.promotedSellerCalls, 1);
  assert.ok(promoted.callReadySellers[0].ownerCallScript);
  assert.ok(promoted.callReadySellers[0].memo.subject.includes('Buyer Fit Ave'));
}

function testOwnerEnrichmentPositiveResultsAreTreatedAsSkipTrace() {
  const publicLead = {
    id: 'owner-enrichment-lead',
    parcelId: 'KGIS-P6-001',
    address: 'KGIS parcel P6 001, Knoxville, TN',
    market: 'knoxville-tn',
    ownerName: 'Public Owner Phase',
    ownerMailingAddress: 'PO Box 1, Knoxville, TN',
    askingPrice: 15000,
    buyerMaxPrice: 45000,
    roadAccess: true,
    utilities: true,
    wetlands: 'none',
    floodZone: 'none',
    crmStatus: 'Needs skip trace',
  };
  const csv = 'parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis,verifiedAt\nKGIS-P6-001,Public Owner Phase,865-555-0198,owner@example.com,high,manual lookup,same owner + mailing city,2026-06-20T00:00:00.000Z';
  const result = applySkipTraceImport({ parcels: [] }, csv, { candidateParcels: [publicLead], now: '2026-06-20T01:00:00.000Z' });
  assert.equal(result.summary.matched, 1);
  assert.equal(result.workspace.parcels[0].ownerPhone, '865-555-0198');
  assert.equal(result.workspace.parcels[0].realContact, true);
  assert.equal(result.workspace.parcels[0].skipTraceStatus, 'contact-enriched');
  assert.equal(result.workspace.parcels[0].contactSource, 'manual lookup');
  assert.match(result.workspace.parcels[0].notes, /Owner enrichment accepted as skip trace/);
}

function testLowConfidenceOwnerEnrichmentDoesNotPromoteToSkipTrace() {
  const publicLead = {
    id: 'owner-enrichment-low',
    parcelId: 'KGIS-P6-LOW',
    address: 'KGIS parcel P6 LOW, Knoxville, TN',
    market: 'knoxville-tn',
    ownerName: 'Public Owner Low',
    crmStatus: 'Needs skip trace',
  };
  const csv = 'parcelId,ownerName,candidatePhone,contactConfidence,matchBasis\nKGIS-P6-LOW,Public Owner Low,865-555-0000,low,name only';
  const result = applySkipTraceImport({ parcels: [] }, csv, { candidateParcels: [publicLead] });
  assert.equal(result.summary.matched, 0);
  assert.equal(result.summary.unmatched, 1);
  assert.equal(result.workspace.parcels.length, 0);
}

testDailyMoneyQueueRanksCallReadySellersWithScriptsAndBuyerBacking();
testFollowUpsDueAreSeparatedFromFreshCalls();
testCallOutcomeUpdatesCrmStatusAndNextFollowUp();
testCallScriptExplainsWhatToSayAndOffer();
testDailyCallSheetExportsMoneyFields();
testSkipTraceImportMatchesRealPublicLeadAndPromotesToToday();
testBuyerContactImportAndValidationQueue();
testBuyerFirstBoardPrioritizesValidatedBuyBoxBeforeSellerSkipTrace();
testExecutionConveyorExportsSkipTraceBatchThenPromotesReturns();
testOwnerEnrichmentPositiveResultsAreTreatedAsSkipTrace();
testLowConfidenceOwnerEnrichmentDoesNotPromoteToSkipTrace();

console.log('cashflow tests passed');
