import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { leeCountyTaxDeedBuyers } from '../src/taxDeedBuyers.mjs';

const app = readFileSync('src/app.mjs', 'utf8');
const html = readFileSync('index.html', 'utf8');
const csv = readFileSync('artifacts/buyer-lists/florida-tax-deed/lee/buyers.csv', 'utf8');

const magaly = leeCountyTaxDeedBuyers.find(buyer => buyer.buyerName === 'MAGALY CRUZ PINEIRO');
assert.ok(magaly, 'Magaly Cruz Pineiro buyer row must remain present');
assert.equal(magaly.phone, '+1 407-692-1401', 'verified Magaly public phone must flow into live data module');
assert.equal(magaly.email, 'magalycrealty@gmail.com', 'verified Magaly public email must flow into live data module');
assert.equal(magaly.website, 'https://magalycruz.sellstate5starrealty.com/', 'verified Magaly website must flow into live data module');
assert.match(magaly.contactUrl, /sellstate5starrealty\.com\/agents\/1800431\/Magaly\+Cruz/, 'Magaly contact profile must flow into live data module');
assert.match(csv, /magalycrealty@gmail\.com/, 'source CSV must include verified Magaly email');
assert.match(csv, /407-692-1401/, 'source CSV must include verified Magaly phone');
assert.match(app, /phase286-contact-osint/, 'app import must cache-bust the contact OSINT data module');
assert.match(html, /phase286-contact-osint/, 'index.html must cache-bust the live contact OSINT update');
assert.match(app, /contactLinkLabel/, 'buyer table must render a clear profile link label for enriched contact paths');
assert.match(app, /Website/, 'buyer table must render a website link when a verified website exists');

console.log('phase286 tax deed buyer contact OSINT guard passed');
