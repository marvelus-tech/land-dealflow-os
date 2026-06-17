import assert from 'node:assert/strict';
import {
  CALL_OUTCOMES,
  applyCallOutcome,
  buildCallScript,
  buildDailyMoneyQueue,
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
  assert.equal(CALL_OUTCOMES.seller_interested.label, 'Seller interested');
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

testDailyMoneyQueueRanksCallReadySellersWithScriptsAndBuyerBacking();
testFollowUpsDueAreSeparatedFromFreshCalls();
testCallOutcomeUpdatesCrmStatusAndNextFollowUp();
testCallScriptExplainsWhatToSayAndOffer();
testDailyCallSheetExportsMoneyFields();

console.log('cashflow tests passed');
