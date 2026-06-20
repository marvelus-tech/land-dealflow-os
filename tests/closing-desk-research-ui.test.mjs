import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildContractPacketDraft, exportContractPacketMarkdown } from '../src/core.mjs';

const process = JSON.parse(readFileSync(new URL('../data/title-company/title_company_process.json', import.meta.url), 'utf8'));
const markets = JSON.parse(readFileSync(new URL('../data/title-company/title_company_market_candidates.json', import.meta.url), 'utf8'));
const appSource = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const publicClosingBundle = [
  JSON.stringify(process),
  JSON.stringify(markets),
  appSource,
  css,
].join('\n');

assert.equal(process.source.name, 'Closing Desk operating model');
assert.ok(process.source.characters > 10000, 'closing desk source material should be substantive');
assert.ok(process.closingDeskInsights.some(item => /neutral escrow/i.test(item)), 'process must preserve neutral escrow insight');
assert.ok(process.operatorRules.some(item => /assignment friendly/i.test(item)), 'operator rules must force assignment friendly verification');
assert.match(process.templates.titlePacketEmail.body, /secure wire instruction process/i, 'title packet email must mention wire safety');
assert.ok(process.templates.sellerPurchaseAgreementChecklist.length >= 5, 'seller contract checklist required');
assert.ok(process.templates.buyerAssignmentAgreementChecklist.length >= 5, 'buyer assignment checklist required');

assert.ok(markets.markets.length >= 8, 'priority market title-company list must include TN/NC/TX/FL/AZ markets');
assert.ok(markets.markets[0].market.includes('Knoxville'), 'Knoxville must remain first closing priority');
assert.ok(markets.markets.some(market => market.state === 'TX' && /Austin|San Antonio/.test(market.market)), 'TX Austin/San Antonio title candidates required');
assert.ok(markets.markets.every(market => market.candidates.every(candidate => candidate.url && candidate.assignmentFriendly === 'unknown')), 'candidates must have URLs and avoid fabricated assignment friendly status');

assert.match(appSource, /renderClosingDeskResearchDeck/, 'Closing route must render the research/template deck');
assert.match(appSource, /data-copy-research-title-email/, 'Closing route must provide title packet template copy action');
assert.match(appSource, /loadTitleCompanyResearch\(\)\.then\(renderAll\)/, 'title company research data must load at boot');
assert.match(css, /closing-intelligence-deck/, 'Closing intelligence deck styles required');
const sourceOriginPattern = new RegExp(['vid' + 'eo', 'tran' + 'script', 'you' + 'tube'].join('|'), 'i');
assert.doesNotMatch(publicClosingBundle, sourceOriginPattern, 'Closing Desk should present as the information hub, not as an imported-source artifact');
for (const codePoint of [0x2013, 0x2014, 0x2212]) {
  assert.ok(!publicClosingBundle.includes(String.fromCharCode(codePoint)), 'Closing Desk bundle must not contain long dash punctuation');
}

const visibleClosingData = [JSON.stringify(process), JSON.stringify(markets)].join('\n');
for (const phrase of ['assignment-friendly', 'title-ready', 'wire-instruction', 'market-candidate', 'full-service', 'attorney-owned', 'attorney-staffed', 'double-close', 'go-no-go']) {
  assert.ok(!visibleClosingData.includes(phrase), `Closing Desk visible copy should not use hyphenated phrase: ${phrase}`);
}
assert.match(publicClosingBundle, /Closing Desk is the information hub/, 'Closing Desk must frame the page as the hub itself');
assert.match(appSource, /Phase 11 · PDF export finish/, 'Closing route should include Phase 11 PDF export finish');
assert.match(appSource, /Print clean contracts\. Keep the deal sequence simple\./, 'Closing route should present a simple PDF-first contract pipeline');
assert.match(appSource, /id="seller-agreement-experience"/, 'Seller Agreement should be its own fill experience');
assert.match(appSource, /id="assignment-agreement-experience"/, 'Assignment Agreement should be its own fill experience');
assert.match(appSource, /Assignment unlocks after seller agreement is marked signed/, 'Assignment should be visibly locked until seller agreement is signed');
assert.match(appSource, /id="title-packet-experience"/, 'Title packet should be its own final bundle experience');
assert.match(appSource, /id="print-contract-packet"/, 'Contract flow should support print/save PDF preview');
assert.match(appSource, /id="export-seller-contract"/, 'Seller Agreement should export separately');
assert.match(appSource, /id="export-assignment-contract"/, 'Assignment Agreement should export separately');
assert.match(appSource, /id="export-contract-packet"/, 'Title packet should remain exportable on demand');
assert.match(appSource, /contractStageStatus/, 'Contract stages should persist separate status values');
assert.match(appSource, /contractPackets/, 'Contract packet should be stored in workspace local storage');
assert.match(css, /v1\.41 - Phase 10 separate PDF contract pipeline/, 'Phase 10 separate contract pipeline styles required');
assert.match(css, /v1\.42 - Phase 11 Apple-grade PDF export surfaces/, 'Phase 11 Apple-grade PDF export styles required');
assert.match(css, /@page \{ size: letter; margin: \.42in; \}/, 'PDF output should define clean letter page sizing');
assert.match(appSource, /print-packet-cover/, 'PDF output should include print-only cover page');
assert.match(appSource, /print-document-meta/, 'PDF output should include property metadata on printed documents');
assert.match(appSource, /print-legal-footer/, 'PDF output should include legal guardrail footer');
assert.match(appSource, /title-review-paper/, 'PDF output should include attorney and title review page');
assert.match(css, /@media print/, 'PDF print preview stylesheet required');
const packet = buildContractPacketDraft({ propertyState: 'TN', propertyAddress: '137 Rogers Lane', sellerName: 'Seller', buyerName: 'MarvelUs Intel LLC', purchasePrice: '65000' });
assert.equal(packet.status, 'draft-needs-attorney-review', 'Packet must not claim attorney review without reviewer/date');
assert.equal(packet.sellerAgreement.title, 'Vacant Land Purchase Agreement');
assert.equal(packet.buyerAssignment.title, 'Assignment of Vacant Land Purchase Agreement');
assert.match(packet.coverLetter.body, /Please review the attached seller purchase agreement and buyer assignment packet/, 'Review letter should be generated and stored with packet');
const exportedPacket = exportContractPacketMarkdown(packet);
assert.match(exportedPacket, /Attorney And Title Review Letter/, 'Export should include review letter');
assert.match(exportedPacket, /Seller One Page Contract/, 'Export should include seller one page');
assert.match(exportedPacket, /Buyer Assignment One Page Contract/, 'Export should include buyer one page');
assert.match(exportedPacket, /Drafting aid only/, 'Export should preserve legal guardrail');

console.log('closing desk research UI tests passed');
