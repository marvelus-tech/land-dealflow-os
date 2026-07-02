import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

assert.match(app, /calculateLandOfferMath/, 'Land app must import and use the Offer Math engine.');
assert.match(app, /normalizeLandOfferBuyBoxes/, 'Land app must normalize data-file buy boxes before calculating offers.');
assert.match(app, /data\/real\/buy_boxes\/land_offer_buy_boxes\.json/, 'Land app must load buy boxes from the real data file, not only hardcoded code.');
assert.match(app, /calculateLandOfferMath\(parcel, \{ buyBoxes: landOfferBuyBoxes \}\)/, 'Visible Land parcel rows must calculate against loaded buy-box data.');
assert.match(app, /_landOfferMath: landOfferMath/, 'Visible Land parcel rows must carry computed offer math.');
assert.match(app, /function renderSelectedLandOfferMathPanel/, 'Selected parcel detail must render an Offer Math panel.');
assert.match(app, /renderSelectedLandOfferMathPanel\(selected\)/, 'Selected parcel sheet must mount the Offer Math panel.');
assert.match(app, /Offer Math · calculator estimate/, 'Offer Math panel needs a clear calculator estimate label.');
assert.match(app, /Builder target/, 'Offer Math panel must expose builder target.');
assert.match(app, /Suggested offer/, 'Offer Math panel must expose seller offer.');
assert.match(app, /Projected fee/, 'Offer Math panel must expose projected assignment fee.');
assert.match(app, /SMS price/, 'Offer Math panel must expose manual-copy SMS price.');
assert.match(app, /Manual copy only/, 'Offer Math panel must preserve SMS compliance boundary.');
assert.match(app, /function renderSelectedLandSmsDraft/, 'Selected parcel detail must render the copy-only SMS draft helper.');
assert.match(app, /data-copy-land-sms-draft/, 'SMS draft helper must copy to clipboard only.');
assert.match(app, /No send button\. No campaign queue\./, 'SMS draft helper must explicitly reject sending and campaign workflow.');
assert.match(app, /Draft locked/, 'SMS draft helper must lock when price/contact/owner gates are not clean.');
assert.doesNotMatch(app, /send text|send sms|campaign blast|campaign queue\s*<button/i, 'Offer Math UI must not introduce SMS sending or campaign actions.');
assert.match(app, /projected-fee/, 'Land queue must support projected-fee sorting.');
assert.match(app, /sms-ready/, 'Land queue must support SMS-ready sorting.');
assert.match(app, /land-offer-mini-chips phase240-offer-math/, 'Rows with math must show restrained SMS/fee chips.');
assert.doesNotMatch(app, /Offer math locked<\/span><\/div>/, 'Queue rows should not repeat locked offer chips for every unpriced parcel.');

assert.match(css, /--land-phase240-offer-math: selected-detail-calculator-ledger-manual-copy-only/, 'CSS must encode the Phase 240 Offer Math panel marker.');
assert.match(css, /--land-phase241-sms-draft: copy-paste-draft-only-no-sending/, 'CSS must encode the Phase 241 copy-only SMS draft marker.');
assert.match(css, /\.land-sms-draft-panel\.phase241-copy-only[\s\S]{0,220}border-top: 1px solid/, 'SMS draft panel must stay calm/open, not become a heavy messaging widget.');
assert.match(css, /\.land-offer-math-panel\.phase240-offer-math[\s\S]{0,220}border-top: 1px solid/, 'Offer Math panel must be an open ledger with a hairline, not a heavy card.');
assert.match(css, /\.offer-math-ledger[\s\S]{0,220}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Offer Math ledger must scan as a three-column money grid on desktop.');
assert.match(css, /\.offer-math-context[\s\S]{0,220}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, 'Offer Math context must include basis, formula, and compliance columns.');
assert.match(css, /@media \(max-width: 760px\)[\s\S]{0,420}\.offer-math-ledger[\s\S]{0,100}grid-template-columns: 1fr !important/, 'Offer Math panel must collapse cleanly on mobile.');
assert.match(html, /src\/styles\.css\?v=phase241/, 'Index must bust CSS cache for the Phase 241 copy-only SMS draft UI.');

console.log('land offer math UI tests passed');
