import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const process = JSON.parse(readFileSync(new URL('../data/title-company/title_company_process.json', import.meta.url), 'utf8'));
const markets = JSON.parse(readFileSync(new URL('../data/title-company/title_company_market_candidates.json', import.meta.url), 'utf8'));
const appSource = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

assert.equal(process.source.capturedWith, 'youtube-transcript-api free transcript fetch');
assert.ok(process.source.characters > 10000, 'fresh transcript artifact should be substantive');
assert.ok(process.transcriptDerivedInsights.some(item => /neutral escrow/i.test(item)), 'process must preserve neutral escrow insight');
assert.ok(process.operatorRules.some(item => /assignment-friendly/i.test(item)), 'operator rules must force assignment-friendly verification');
assert.match(process.templates.titlePacketEmail.body, /secure wire-instruction process/i, 'title packet email must mention wire safety');
assert.ok(process.templates.sellerPurchaseAgreementChecklist.length >= 5, 'seller contract checklist required');
assert.ok(process.templates.buyerAssignmentAgreementChecklist.length >= 5, 'buyer assignment checklist required');

assert.ok(markets.markets.length >= 8, 'priority market title-company list must include TN/NC/TX/FL/AZ markets');
assert.ok(markets.markets[0].market.includes('Knoxville'), 'Knoxville must remain first closing priority');
assert.ok(markets.markets.some(market => market.state === 'TX' && /Austin|San Antonio/.test(market.market)), 'TX Austin/San Antonio title candidates required');
assert.ok(markets.markets.every(market => market.candidates.every(candidate => candidate.url && candidate.assignmentFriendly === 'unknown')), 'candidates must have URLs and avoid fabricated assignment-friendly status');

assert.match(appSource, /renderClosingDeskResearchDeck/, 'Closing route must render the research/template deck');
assert.match(appSource, /data-copy-research-title-email/, 'Closing route must provide title packet template copy action');
assert.match(appSource, /loadTitleCompanyResearch\(\)\.then\(renderAll\)/, 'title-company research data must load at boot');
assert.match(css, /closing-intelligence-deck/, 'Closing intelligence deck styles required');

console.log('closing desk research UI tests passed');
