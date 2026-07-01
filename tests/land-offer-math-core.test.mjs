import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateLandOfferMath, normalizeLandOfferBuyBoxes } from '../src/core.mjs';

const dataBuyBoxes = JSON.parse(readFileSync('data/real/buy_boxes/land_offer_buy_boxes.json', 'utf8'));
const normalizedBuyBoxes = normalizeLandOfferBuyBoxes(dataBuyBoxes);
assert.equal(dataBuyBoxes.schema, 'landflip.landOfferBuyBoxes.v1');
assert.equal(normalizedBuyBoxes.length, 3);
assert.equal(normalizedBuyBoxes[0].key, 'raleigh-27607-infill');
assert.match(dataBuyBoxes.rules.join(' '), /copy\/paste draft support only|does not send texts/i);

const rankin = calculateLandOfferMath({ parcelId: 'rankin-123', address: '123 Rankin St, Raleigh, NC 27607', acres: 0.25 }, { buyBoxes: dataBuyBoxes });
assert.equal(rankin.zip, '27607');
assert.equal(rankin.builderTarget, 550000);
assert.equal(rankin.riskAdjustedBuilderTarget, 550000);
assert.equal(rankin.suggestedSellerOffer, 467500);
assert.equal(rankin.assignmentPrice, 550000);
assert.equal(rankin.projectedAssignmentFee, 82500);
assert.equal(rankin.smsPriceToSend, 468000);
assert.equal(rankin.sms.manualCopyOnly, true);
assert.match(rankin.sms.compliance, /No texting or campaigns/);
assert.deepEqual(rankin.blockers, []);

const mordecai = calculateLandOfferMath({ zip: '27604', acres: 0.2 }, { buyBoxes: dataBuyBoxes });
assert.equal(mordecai.builderTarget, 340000);
assert.equal(mordecai.suggestedSellerOffer, 289000);
assert.equal(mordecai.projectedAssignmentFee, 51000);
assert.equal(mordecai.smsPriceToSend, 289000);

const risk = calculateLandOfferMath({ zip: '27607', acres: 0.25, floodZone: 'yes', slope: 'steep', busyStreet: true, parkNearby: 'no' }, { buyBoxes: dataBuyBoxes });
assert.deepEqual(risk.adjustments.map(row => row.key), ['flood-zone', 'steep-slope', 'busy-street', 'no-park-nearby']);
assert.equal(Number(risk.totalAdjustmentPercent.toFixed(2)), 0.36);
assert.equal(risk.riskAdjustedBuilderTarget, 352000);
assert.equal(risk.suggestedSellerOffer, 299200);
assert.equal(risk.projectedAssignmentFee, 52800);
assert.equal(risk.smsPriceToSend, 299000);

const manualReview = calculateLandOfferMath({ zip: '99999', access: 'landlocked' });
assert.equal(manualReview.confidence, 'manual-review');
assert.equal(manualReview.nextAction, 'manual-review');
assert.ok(manualReview.blockers.includes('No matching ZIP buy box or builder target.'));
assert.ok(manualReview.blockers.includes('Acreage missing, so ZIP math cannot scale.'));
assert.ok(manualReview.blockers.includes('Access blocker requires manual review.'));
assert.equal(manualReview.smsPriceToSend, 0);

console.log('land offer math core tests passed');
