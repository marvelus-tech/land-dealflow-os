import assert from 'node:assert/strict';
import {
  buildTitleCompanyClosingDesk,
  buildTitleClosingChecklist,
  calculateAssignmentMath,
  generateTitleCompanyEmail,
} from '../src/core.mjs';

const buyer = {
  id: 'precision',
  name: 'Precision Gulf Homes',
  contactName: 'Maya Chen',
  phone: '239-555-0100',
  email: 'maya@precisiongulf.example',
  maxPrice: 40000,
  closingCostsPayer: 'buyer',
};

const parcel = {
  id: 'parcel-1',
  parcelId: 'LEH-001',
  address: '123 Grant Blvd, Lehigh Acres, FL',
  ownerName: 'Avery Santos',
  ownerPhone: '239-555-0131',
  ownerEmail: 'avery@example.com',
  askingPrice: 30000,
  buyerMaxPrice: 40000,
  sellerContractPrice: 30000,
  buyerContractPrice: 40000,
  closingCostEstimate: 700,
  closingCostsPayer: 'buyer',
  titleCompanyName: 'Gulf Coast Title & Escrow',
  titleOfficer: 'Elena Ruiz',
  titleCompanyEmail: 'closings@gulfcoasttitle.example',
  assignmentFriendlyTitleCompany: true,
  sellerContractSigned: true,
  buyerContractSigned: true,
  targetClosingDate: '2026-07-02',
  wireInstructionsStatus: 'secure-channel',
};

function testAssignmentMathProtectsSpreadAndCosts() {
  const math = calculateAssignmentMath(parcel, buyer);
  assert.equal(math.sellerPrice, 30000);
  assert.equal(math.buyerPrice, 40000);
  assert.equal(math.assignmentFee, 10000);
  assert.equal(math.closingCostsEstimate, 700);
  assert.equal(math.netAfterCosts, 9300);
  assert.equal(math.closingCostsPayer, 'buyer');
  assert.equal(math.spreadHealthy, true);
}

function testChecklistRequiresTitleCompanyAndContractsBeforeReady() {
  const missing = buildTitleClosingChecklist({ ...parcel, titleCompanyName: '', sellerContractSigned: false }, buyer);
  assert.equal(missing.status, 'missing-title-company');
  assert.ok(missing.missing.includes('Seller purchase agreement executed'));

  const ready = buildTitleClosingChecklist(parcel, buyer);
  assert.equal(ready.status, 'title-packet-ready');
  assert.equal(ready.readiness, 86);
  assert.ok(ready.review.includes('HUD/settlement numbers ready for review'));
}

function testTitleEmailIncludesAssignmentPacketAndWireSafety() {
  const email = generateTitleCompanyEmail(parcel, buyer, { name: 'Okeito', company: 'Land Dealflow OS', phone: '555-0101', email: 'deals@example.com' });
  assert.equal(email.subject, '123 Grant Blvd, Lehigh Acres, FL - Assignment');
  assert.match(email.body, /Cash to seller: \$30,000/);
  assert.match(email.body, /Assignment Fee: \$10,000/);
  assert.match(email.body, /Cash from Buyer: \$40,000/);
  assert.match(email.body, /Wire\/payee note/);
  assert.doesNotMatch(email.body, /routing/i);
}

function testClosingDeskExposesTimelineAndNextAction() {
  const desk = buildTitleCompanyClosingDesk({ ...parcel, hudReviewed: true, buyerFunded: true }, buyer);
  assert.equal(desk.status, 'buyer-funded');
  assert.equal(desk.timeline.length, 5);
  assert.match(desk.timeline[2].detail, /liens/);
  assert.match(desk.nextAction, /Send the title packet|Review|Archive/);
}

[
  testAssignmentMathProtectsSpreadAndCosts,
  testChecklistRequiresTitleCompanyAndContractsBeforeReady,
  testTitleEmailIncludesAssignmentPacketAndWireSafety,
  testClosingDeskExposesTimelineAndNextAction,
].forEach(test => test());

console.log('title company tests passed');
