import {
  scoreMarket,
  computeOffer,
  classifyParcelRisk,
  rankBuyers,
  scoreParcelDeal,
  applyCrmUpdate,
  applyCallOutcome,
  buildDailyMoneyQueue,
  buildSellerSearchControlLayer,
  buildExecutionConveyor,
  buildOperatorSessionMode,
  exportMatchedSellerBatchCsv,
  buildBuyerContactQueue,
  buildBuyerFirstBoard,
  applySkipTraceImport,
  applyBuyerContactImport,
  CALL_OUTCOMES,
  BUYER_FEEDBACK_REASONS,
  exportDailyCallSheetCsv,
  exportWorkspace,
  importWorkspace,
  CRM_STATUSES,
  getLehighImportTemplate,
  buildTopCallList,
  exportParcelsCsv,
  normalizeCsvToParcels,
  findDuplicateParcels,
  reportMissingData,
  getDataSourceChecklist,
  generateOwnerCallScript,
  buildFollowUpQueue,
  exportMailMergeCsv,
  bulkMarkContacted,
  generateOfferPacket,
  exportDealMemoMarkdown,
  generateBuyerSendMemo,
  exportBuyerSendMemoMarkdown,
  calculateBuyerScorecard,
  captureBuyBox,
  addBuyerCallNote,
  applyBuyerFeedback,
  buildDealFitMatrix,
  buildBuyerFeedbackLoop,
  recommendNextSellerCallsFromFeedback,
  calculateBuyBoxCompleteness,
  calculateSellerMotivation,
  calculateContractReadiness,
  generateSellerNetOfferScript,
  generateNeighborPrompt,
  buildOperatorChecklist,
  buildTitleCompanyClosingDesk,
  buildContractPacketDraft,
  exportContractPacketMarkdown,
  renderContractDocumentText,
  buildPermitVerifiedBuilders,
  buildBuyerValidationCommandCenter,
  BUYER_VALIDATION_STATUSES,
  generateBuilderCallScript,
  generateBuilderEmail,
  generateBuilderMarketingEmailTemplate,
  getSourceAdapterChecklist,
  getPermitPortalLandscape,
  formatMoney,
} from './core.mjs';

const STORAGE_KEY = 'land-dealflow-os-v3-zero-fabrication-workspace';

const seedMarkets = [
  { id: 'knoxville-tn', name: 'Knoxville, TN', state: 'TN', thesis: 'Tennessee public-source pivot: verify builder demand and parcel provenance before outreach.', newBuilds90d: 0, activeBuilders: 0, vacantLotSales90d: 0, offMarketVacantLots: 0, lotStandardization: 0, growthSignal: 0, complianceSimplicity: 0, buildabilityRisk: 0 },
  { id: 'chattanooga-tn', name: 'Chattanooga, TN', state: 'TN', thesis: 'Hamilton County source discovery first; no seller calls until verified public records exist.', newBuilds90d: 0, activeBuilders: 0, vacantLotSales90d: 0, offMarketVacantLots: 0, lotStandardization: 0, growthSignal: 0, complianceSimplicity: 0, buildabilityRisk: 0 },
  { id: 'nashville-edge-tn', name: 'Nashville edge, TN', state: 'TN', thesis: 'Metro Nashville perimeter watchlist; promote only source-backed parcels and buyers.', newBuilds90d: 0, activeBuilders: 0, vacantLotSales90d: 0, offMarketVacantLots: 0, lotStandardization: 0, growthSignal: 0, complianceSimplicity: 0, buildabilityRisk: 0 },
];

const seedBuyers = [];

const seedPermitRecords = [];

const seedParcels = [];

const builderMarketSources = [
  { key: 'knoxville', state: 'TN', marketName: 'Knoxville / Knox County, TN', csvUrl: 'data/real/knoxville/buyer_call_sheet.csv', signalsUrl: 'data/real/knoxville/builder_signals.json', evidenceUrl: 'data/real/knoxville/market_evidence.json' },
  { key: 'austin', state: 'TX', marketName: 'Austin, TX', csvUrl: 'data/real/austin/builder_validation_queue.csv', signalsUrl: 'data/real/austin/builder_signals.json', evidenceUrl: 'data/real/austin/market_evidence.json' },
  { key: 'san-antonio', state: 'TX', marketName: 'San Antonio, TX', csvUrl: 'data/real/san-antonio/builder_validation_queue.csv', signalsUrl: 'data/real/san-antonio/builder_signals.json', evidenceUrl: 'data/real/san-antonio/market_evidence.json' },
  { key: 'raleigh', state: 'NC', marketName: 'Raleigh / Wake County, NC', csvUrl: 'data/real/raleigh/builder_validation_queue.csv', signalsUrl: 'data/real/raleigh/builder_signals.json', evidenceUrl: 'data/real/raleigh/market_evidence.json' },
  { key: 'polk', state: 'FL', marketName: 'Polk / Lakeland, FL', csvUrl: 'data/real/polk/builder_validation_queue.csv', signalsUrl: 'data/real/polk/builder_signals.json', evidenceUrl: 'data/real/polk/market_evidence.json' },
  { key: 'maricopa', state: 'AZ', marketName: 'Phoenix / Maricopa County, AZ', csvUrl: 'data/real/maricopa/builder_validation_queue.csv', signalsUrl: 'data/real/maricopa/builder_signals.json', evidenceUrl: 'data/real/maricopa/market_evidence.json' },
];

const builderMarketSourceByKey = new Map(builderMarketSources.map(source => [source.key, source]));

const stages = [
  { id: 'market', name: 'Market Finder', desc: 'Where to hunt first.', sourceType: 'market' },
  { id: 'buyer', name: 'Buyer Finder', desc: 'Who is actively building.', sourceType: 'buyer' },
  { id: 'parcel', name: 'Land Finder', desc: 'Lots matching demand.', sourceType: 'parcel' },
  { id: 'owner', name: 'Owner Contact', desc: 'Reachable seller proof.', sourceType: 'owner' },
  { id: 'offer', name: 'Offer Engine', desc: 'Price, spread, kill line.', sourceType: 'offer' },
  { id: 'risk', name: 'Risk Filter', desc: 'Buildability blockers.', sourceType: 'risk' },
  { id: 'crm', name: 'Outreach CRM', desc: 'Calls and follow-up.', sourceType: 'crm' },
];

const sourceBlueprint = {
  market: {
    label: 'Location / market data',
    sources: ['Target-market config in data/sources.json', 'Generated source candidates: county GIS, ArcGIS/Socrata portals, Census/OSM queries', 'New-build, active-builder, vacant-lot velocity fields in the market snapshot'],
    fields: ['area name', 'state', 'buyer type', 'priority', 'market thesis', 'source candidates'],
  },
  buyer: {
    label: 'Buyer list',
    sources: ['Buyer source blocks in data/sources.json', 'Builder/buyer discovery queues for target areas with no buyer seed', 'Buyer call notes and exact buy-box validation captured in the workspace'],
    fields: ['buyer name', 'website', 'phone', 'email', 'contact', 'buy box', 'close speed', 'repeat demand'],
  },
  parcel: {
    label: 'Seller / parcel list',
    sources: ['Parcel source blocks in data/sources.json', 'County assessor/property-appraiser exports or normalized CSV imports', 'Generated seller-discovery queues for new target areas'],
    fields: ['parcel ID', 'address', 'lot size', 'owner', 'mailing address', 'asking price', 'held years', 'paid price'],
  },
  owner: {
    label: 'Owner contact data',
    sources: ['Owner fields carried on parcel records', 'CSV imports from county exports or skip-trace style enrichment', 'Missing-data quality gate flags incomplete owner contact before calling'],
    fields: ['owner name', 'owner phone', 'owner email', 'mailing address', 'skip-trace confidence'],
  },
  offer: {
    label: 'Pricing / offer math',
    sources: ['Parcel asking price and lowest active listing', 'Buyer max price and exact buy box', 'Offer engine formulas in src/core.mjs'],
    fields: ['buyer max price', 'seller ask', 'initial offer', 'max offer', 'projected spread'],
  },
  risk: {
    label: 'Buildability risk',
    sources: ['Parcel buildability fields from source records/imports', 'Risk filter in src/core.mjs', 'Quality gate for missing wetlands/flood/access/utilities/slope checks'],
    fields: ['wetlands', 'flood zone', 'road access', 'utilities', 'slope', 'wildlife flag'],
  },
  crm: {
    label: 'Outreach activity',
    sources: ['Browser-local workspace storage', 'CRM controls on each parcel card', 'Generated follow-up queue from current parcel CRM state'],
    fields: ['CRM status', 'next follow-up', 'notes', 'buyer feedback', 'call notes'],
  },
};

const titleCompanyProcessFallback = {"source":{"name":"Closing Desk operating model","basis":"internal title, escrow, contract, HUD, disbursement, and market candidate workflow","updatedAt":"2026-06-19","recordCount":420,"characters":16083},"operatorRules":["Do not mark a deal title ready until seller contract, buyer agreement and assignment agreement, party contacts, title company, closing cost payer, and settlement number review are present.","Do not mark closed merely because documents are signed; closed means buyer funded, title cleared, HUD/settlement approved, and disbursement confirmed.","Never display raw wire instructions in the app; track secure portal/verbal verification status instead.","Assignment friendly status must be verified by call/email for each title company; public title/escrow service pages are not proof they handle assignments."],"templates":{"titlePacketEmail":{"subject":"<PROPERTY ADDRESS>, Assignment closing packet","body":"Hello,\nI hope you're doing well. We are going to be doing an assignment for this property. I will input all of the seller, buyer and assignor information below, as well as the purchase contracts. Please confirm receipt of this email once you receive it. Thank you!\nPlease wire our funds at the time of closing. I've included our wiring instructions for your reference.\nClosing Date:\nJanuary 22, 2026\n\nProperty: <PROPERTY ADDRESS>\n\nSeller\nName: <SELLER NAME>\nPhone: <SELLER PHONE>\nEmail: <SELLER EMAIL>\nCash to seller: $<SELLER CONTRACT PRICE>\n\nAssignor\nName/company: <ASSIGNOR NAME / COMPANY>\nPhone: <ASSIGNOR PHONE>\nEmail: <ASSIGNOR EMAIL>\nAssignment fee: $<ASSIGNMENT FEE>\n\nBuyer / Assignee\nName/company: <BUYER NAME / COMPANY>\nPhone: <BUYER PHONE>\nEmail: <BUYER EMAIL>\nCash from buyer: $<BUYER CONTRACT PRICE>\n\nAttached purchase contracts\nSeller purchase agreement: <ATTACHMENT NAME>\nBuyer assignment agreement: <ATTACHMENT NAME>\nSupporting parcel information: <ATTACHMENT NAME>\n\nPlease also confirm: title search timing, closing cost payer, earnest money handling, remote online notarization options, and secure wire instruction process.\n\nImportant: we will only exchange wire instructions through your approved secure channel and will verbally verify instructions using a known office number.\n\nThank you,\n<YOUR NAME>"},"sellerPurchaseAgreementChecklist":["Vacant land purchase agreement for the property state","Buyer may assign clause selected / included","Due diligence or feasibility period included","Title/escrow closing language included","Seller price, parcel/APN, closing date, and seller contact complete","Attorney/title review before active use"],"buyerAssignmentAgreementChecklist":["Identifies original seller contract and parcel","Assigns buyer rights to assignee/builder","States assignment fee or buyer contract price path","Assignee assumes obligations after assignment","Earnest money/funding timing captured","Title company can show assignment fee on settlement statement or flags double close requirement"]},"closingDeskInsights":["Title company is the neutral escrow/closing party: contracts and party information go to title, buyer funds go to title, not directly to seller or assignor.","Title coordinates legal title transfer, runs title/lien/tax/deed checks, collects final signed and notarized documents, and prepares the settlement/HUD.","Assignment example: seller contract at $30,000, buyer agreement and assignment contract at $40,000, title disburses seller proceeds and the $10,000 assignment fee after closing conditions clear.","Seller trust script should explain title as neutral protection: title holds funds, verifies paperwork/title, and pays the seller at closing.","Closing packet email needs seller, buyer, assignor, contract prices, assignment fee, closing date, and attached contracts; wire instructions must be handled securely, not casually exposed.","Typical timeline is about 7 to 21 days, with 10 to 14 days as a practical planning range; a known efficient title company can be faster, but speed should not be promised.","Closing costs may be buyer paid, split, or assignor paid; operating examples use about $700 on a $20k land deal and roughly 2% on expensive properties."]};
const titleCompanyMarketsFallback = {"generatedAt":"2026-06-19","sourceMethod":"Public web search plus representative direct site checks; assignment friendly status remains unverified until operator call/email.","verificationScript":"Do you close vacant land assignments in <market>? Can the assignment fee appear on the settlement statement, or do you require double close? Can you handle remote seller/buyer notarization and secure wire instructions? What do you need to open a file?","markets":[{"state":"TN","market":"Knoxville / Knox County","priority":1,"candidates":[{"name":"Realty Title","url":"https://realtytitle.com/","publicEvidence":"Public site says Realty Title is a full service real estate title and escrow company conducting residential and commercial closings; representative scrape captured Prepare for Closing and 40+ locations copy.","serviceSignals":["title","escrow","closings","residential","commercial"],"assignmentFriendly":"unknown"},{"name":"LeConte Title","url":"https://lecontetitle.com/","publicEvidence":"Public site describes an attorney owned Knoxville title company providing residential and commercial real estate closings, title insurance, escrow services, and title searches in Knoxville/East Tennessee.","serviceSignals":["attorney owned","title insurance","escrow","title searches","closings"],"assignmentFriendly":"unknown"},{"name":"Southeast Title and Escrow","url":"https://www.setitle.net/","publicEvidence":"Search result describes a locally owned, full service Knoxville title and escrow company.","serviceSignals":["title","escrow","full service"],"assignmentFriendly":"unknown"}]},{"state":"TN","market":"Murfreesboro / Rutherford County","priority":2,"candidates":[{"name":"Magnolia Title & Escrow","url":"https://magnoliatitle.com/","publicEvidence":"Public site says Magnolia provides attorney staffed title and escrow services across Middle Tennessee with locations including Murfreesboro and Franklin.","serviceSignals":["attorney staffed","title","escrow","Middle Tennessee"],"assignmentFriendly":"unknown"},{"name":"Realty Title, Murfreesboro","url":"https://www.realtytitle.com/realty title/locations/office details.php?oid=212200212","publicEvidence":"Search result shows a Murfreesboro office for Realty Title with office phone and address.","serviceSignals":["local office","title","escrow","closing"],"assignmentFriendly":"unknown"},{"name":"Tri Star Title and Escrow","url":"https://www.tristartitleandescrow.com/services/settlement services","publicEvidence":"Search result says Tri Star provides title insurance, escrow, and closing services for residential and commercial settlements in Murfreesboro and Rutherford County.","serviceSignals":["title insurance","escrow","settlement","commercial"],"assignmentFriendly":"unknown"}]},{"state":"TN","market":"Franklin / Williamson County","priority":3,"candidates":[{"name":"Wagon Wheel Title","url":"https://wagonwheeltitle.com/","publicEvidence":"Search result says Wagon Wheel Title offers real estate title and escrow services to buyers, sellers, developers, investors, and lenders in Davidson/Williamson County areas.","serviceSignals":["title","escrow","developers","investors"],"assignmentFriendly":"unknown"},{"name":"Magnolia Title & Escrow, Franklin","url":"https://magnoliatitle.com/","publicEvidence":"Public site lists Franklin among Middle Tennessee locations for attorney staffed title and escrow services.","serviceSignals":["Franklin location","attorney staffed","title","escrow"],"assignmentFriendly":"unknown"},{"name":"Vanderpool Law, Franklin title company services","url":"https://vanderpoollaw.com/title company-franklin tn","publicEvidence":"Search result describes Franklin TN title company services with attorney review and title company closing support.","serviceSignals":["attorney review","title company services","closing"],"assignmentFriendly":"unknown"}]},{"state":"TN","market":"Clarksville / Montgomery County","priority":4,"candidates":[{"name":"Bankers Title, Clarksville","url":"https://www.banktitle.com/clarksville tn-title escrow","publicEvidence":"Search result says Bankers Title Clarksville provides complete closing and escrow service and title escrow support for buyers, sellers, and agents.","serviceSignals":["closing","escrow","title escrow"],"assignmentFriendly":"unknown"},{"name":"Stewart Title, Clarksville","url":"https://www.stewart.com/en/markets/clarksville","publicEvidence":"Search result says Stewart Title offers title insurance and escrow services in Clarksville.","serviceSignals":["title insurance","escrow","national underwriter"],"assignmentFriendly":"unknown"},{"name":"Clarksville Title & Escrow","url":"https://clarksvilletitle.com/about us/","publicEvidence":"Search result describes Clarksville Title & Escrow as having over 50 years combined law/real estate knowledge and specializing in residential title/escrow.","serviceSignals":["title","escrow","local"],"assignmentFriendly":"unknown"}]},{"state":"NC","market":"Charlotte / Mecklenburg + Cabarrus corridor","priority":5,"candidates":[{"name":"Allied Title & Escrow, Charlotte","url":"https://www.alliedtitleandescrow.com/charlotte nc","publicEvidence":"Public Charlotte page lists Allied Title & Escrow office address/phone and describes decades of underwriting/title experience.","serviceSignals":["title","escrow","Charlotte office"],"assignmentFriendly":"unknown"},{"name":"Stewart Title, Charlotte commercial services","url":"https://www.stewart.com/en/customer type/commercial title-closing services/find an-office/north carolina/charlotte","publicEvidence":"Search result shows Stewart Title Charlotte national commercial services for title/closing transactions.","serviceSignals":["commercial","title","closing","national"],"assignmentFriendly":"unknown"}]},{"state":"TX","market":"Austin / San Antonio corridor","priority":6,"candidates":[{"name":"Independence Title","url":"https://www.independencetitle.com/","publicEvidence":"Public site says Independence Title has 70+ locations across Texas metros and provides locations/services for title and escrow closings.","serviceSignals":["Texas metros","title","escrow","many offices"],"assignmentFriendly":"unknown"},{"name":"Alamo Title, San Antonio","url":"https://alamotitlesa.com/home","publicEvidence":"Public site advertises title underwriting/exam capabilities, escrow and closing services, and 1031 property exchanges.","serviceSignals":["title underwriting","escrow","closing","1031"],"assignmentFriendly":"unknown"},{"name":"N Title","url":"https://ntitle.com/","publicEvidence":"Search result describes a title company serving Houston, San Antonio, Dallas, and Austin with Texas real estate transaction expertise.","serviceSignals":["Austin","San Antonio","title","Texas"],"assignmentFriendly":"unknown"}]},{"state":"FL","market":"Ocala / Marion + inland Florida","priority":7,"candidates":[{"name":"Marion Title & Escrow Company","url":"https://www.mariontitlefl.com/","publicEvidence":"Public site says Marion Title & Escrow offers flexible real estate and escrow closing services throughout Florida, including mobile notary, online notarization, and secure wire instruction portal via Closinglock.","serviceSignals":["escrow","closing","mobile notary","online notarization","secure wire portal"],"assignmentFriendly":"unknown"},{"name":"Stewart Title, Ocala","url":"https://www.stewart.com/en/markets/ocala","publicEvidence":"Search result says Stewart Title Ocala offers title insurance, closing, and escrow services for residential and commercial transactions.","serviceSignals":["title insurance","closing","escrow","commercial"],"assignmentFriendly":"unknown"},{"name":"Ocala Land Title","url":"https://ocalalandtitle.com/","publicEvidence":"Search result describes a locally owned title insurance and real estate closing agency founded in 1995.","serviceSignals":["title insurance","real estate closing","local"],"assignmentFriendly":"unknown"}]},{"state":"AZ","market":"Phoenix / Mesa / Maricopa County","priority":8,"candidates":[{"name":"Equity Title of Arizona","url":"https://eta az.com/","publicEvidence":"Search result says Equity Title of Arizona has locations throughout Maricopa County and escrow officers focused on service.","serviceSignals":["Maricopa County","title","escrow"],"assignmentFriendly":"unknown"},{"name":"Clear Title Agency of Arizona","url":"https://cleartitleaz.com/","publicEvidence":"Search result says Clear Title Agency provides title and escrow services for residential and commercial real estate transactions.","serviceSignals":["title","escrow","residential","commercial"],"assignmentFriendly":"unknown"},{"name":"Title & Escrow Company, metro Phoenix","url":"https://www.arizonatitleandescrowcompany.com/","publicEvidence":"Search result describes a greater metro Phoenix independent title and escrow company.","serviceSignals":["Phoenix metro","title","escrow"],"assignmentFriendly":"unknown"}]}]};

let workspace = loadWorkspace();
let generatedLeads = null;
let weeklyMarketScout = null;
let knoxvilleBuyerCallSheet = null;
let builderMarketData = { markets: {}, loaded: false, error: '' };
let titleCompanyProcess = titleCompanyProcessFallback;
let titleCompanyMarkets = titleCompanyMarketsFallback;
let filter = 'all';
let selectedParcelId = '';
let selectedBuilderId = '';
let selectedValidationBuilderId = '';
let selectedSourceType = 'market';
let selectedMoneyCallId = '';
let leadEngineStateFilter = 'all';
let selectedBuilderMarketState = 'TN';
let lastBuilderSkipTraceImportStatus = '';
const validViews = new Set(['today', 'deals', 'builders', 'closing', 'sources', 'machine']);

function hashToView(hash = location.hash) {
  const view = String(hash || '#today').replace('#', '');
  return validViews.has(view) ? view : '';
}

let activeView = hashToView() || 'today';

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return importWorkspace(saved);
  } catch (error) {
    console.warn('Could not load workspace', error);
  }
  return { markets: seedMarkets, buyers: seedBuyers, parcels: seedParcels, permitRecords: seedPermitRecords, permitBuilders: [], buyerValidations: [] };
}

function persistWorkspace() {
  localStorage.setItem(STORAGE_KEY, exportWorkspace(workspace));
}

function h(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function slugify(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function safeLink(url, label, className = '') {
  return `<a ${className ? `class="${h(className)}" ` : ''}href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(label)}</a>`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value) {
  if (!value) return 'not sourced yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return h(value);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function latestTimestamp(rows = []) {
  return asArray(rows)
    .map(row => row?.collectedAt || row?.generatedAt || row?.updatedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || '';
}

function sourceIds(rows = []) {
  return [...new Set(asArray(rows).map(row => row?.sourceId || row?.sourceAdapter || row?.sourceType).filter(Boolean))];
}

function getSourceRows(type) {
  const snapshot = generatedLeads?.snapshot || {};
  if (type === 'market') return asArray(snapshot.markets);
  if (type === 'buyer') return asArray(snapshot.buyers);
  if (type === 'parcel' || type === 'owner' || type === 'risk' || type === 'offer') return asArray(snapshot.parcels);
  return [];
}

function getPhaseSourceStatus(type) {
  const rows = getSourceRows(type);
  const snapshotGeneratedAt = generatedLeads?.generatedAt || generatedLeads?.snapshot?.generatedAt || '';
  const latest = type === 'crm' ? new Date().toISOString() : latestTimestamp(rows) || snapshotGeneratedAt;
  const ids = sourceIds(rows);
  const count = type === 'offer'
    ? asArray(generatedLeads?.queues?.offerReady).length
    : type === 'crm'
      ? asArray(workspace.parcels).filter(parcel => parcel.crmStatus || parcel.nextFollowUp || parcel.notes).length
      : rows.length;
  return { latest, ids, count };
}

function sourceDisclosure(type) {
  const blueprint = sourceBlueprint[type] || sourceBlueprint.market;
  const status = getPhaseSourceStatus(type);
  const sourceText = blueprint.sources.slice(0, 2).map(item => `<li>${h(item)}</li>`).join('');
  const fieldText = blueprint.fields.slice(0, 5).join(' · ');
  const sourceIdText = status.ids.length ? status.ids.slice(0, 2).map(id => `<code>${h(id)}</code>`).join(' ') : '<span>derived/local</span>';
  const freshness = status.latest ? formatDateTime(status.latest) : 'Source pending';
  return `<details class="source-disclosure" data-source-type="${h(type)}">
    <summary aria-label="Inspect ${h(blueprint.label)} source layer">
      <span>Source layer</span>
      <b>${h(blueprint.label)}</b>
      <em><strong>${h(status.count)}</strong><small>records</small></em>
    </summary>
    <div class="source-popover" role="note">
      <div class="source-popover-head"><span>${h(status.count)} records</span><b>${freshness}</b></div>
      <div class="source-popover-section"><strong>Origin</strong><ul>${sourceText}</ul></div>
      <div class="source-popover-section"><strong>Field shape</strong><p class="source-field-strip">${h(fieldText)}</p></div>
      <div class="source-id-foot"><span>Source IDs</span>${sourceIdText}</div>
    </div>
  </details>`;
}

function scrollToPageTop() {
  requestAnimationFrame(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

function setActiveView(view, options = {}) {
  activeView = validViews.has(view) ? view : 'today';
  document.body.dataset.activeView = activeView;
  document.querySelectorAll('.app-panel').forEach(panel => {
    const isActive = panel.dataset.panel === activeView;
    panel.hidden = !isActive;
    panel.classList.toggle('active-panel', isActive);
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    const isActive = button.dataset.view === activeView;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
  if (options.scrollToTop) scrollToPageTop();
}

function navigateToView(view) {
  if (!validViews.has(view)) return;
  history.replaceState(null, '', `#${view}`);
  setActiveView(view, { scrollToTop: true });
}

function captureBuilderInteractionViewport() {
  const queue = document.querySelector('#buyer-validation-command .validation-queue');
  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    queueScrollTop: queue?.scrollTop || 0,
    selectedValidationBuilderId,
  };
}

function restoreBuilderInteractionViewport(viewport = {}) {
  const restore = () => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(viewport.scrollX || 0, viewport.scrollY || 0);
    const queue = document.querySelector('#buyer-validation-command .validation-queue');
    if (queue) queue.scrollTop = viewport.queueScrollTop || 0;
    const selectedButton = [...document.querySelectorAll('[data-select-validation-builder]')]
      .find(button => button.dataset.selectValidationBuilder === viewport.selectedValidationBuilderId);
    selectedButton?.focus?.({ preventScroll: true });
    root.style.scrollBehavior = previousScrollBehavior;
  };
  restore();
  requestAnimationFrame(restore);
}

function renderAppShell() {
  setActiveView(activeView);
}

function badge(text, tone = 'neutral') {
  return `<span class="badge ${tone}">${h(text)}</span>`;
}

function getBuyer(parcel) {
  const ranked = rankBuyers(workspace.buyers || []);
  return ranked.find(buyer => buyer.id === parcel.buyerId) || ranked.find(buyer => buyer.market === parcel.market) || {};
}

function generatedCandidateParcels() {
  return asArray(generatedLeads?.snapshot?.parcels).filter(parcel => parcel.sourceId || parcel.publicSource || parcel.crmStatus === 'Needs skip trace');
}

function generatedCandidateBuyers() {
  return asArray(generatedLeads?.snapshot?.buyers).filter(buyer => {
    const source = String(buyer.sourceId || '').toLowerCase();
    return source === 'lehigh-builder-signals-fdor-2025' || source.includes('builder') || source.includes('kgis') || buyer.evidenceType === 'permitVerified active-builder signal';
  });
}

function rowState(row = {}) {
  const explicit = String(row.state || row.propertyState || '').trim().toUpperCase();
  if (explicit) return explicit;
  const text = `${row.market || ''} ${row.areaName || ''} ${row.address || ''}`.toLowerCase();
  if (/\btn\b|tennessee|knoxville|chattanooga|nashville/.test(text)) return 'TN';
  if (/\bfl\b|florida|lehigh|cape-coral|ocala|palm bay|orlando/.test(text)) return 'FL';
  if (/\bar\b|arkansas|bentonville|bella vista/.test(text)) return 'AR';
  if (/\btx\b|texas|houston/.test(text)) return 'TX';
  return 'UNKNOWN';
}

function matchesLeadEngineState(row = {}) {
  return leadEngineStateFilter === 'all' || rowState(row) === leadEngineStateFilter;
}

function availableLeadEngineStates(snapshot = {}, queues = {}) {
  const rows = [
    ...asArray(snapshot.markets),
    ...asArray(snapshot.buyers),
    ...asArray(snapshot.parcels),
    ...asArray(snapshot.sourceCandidates),
    ...Object.values(queues).flatMap(value => asArray(value)),
  ];
  const states = [...new Set(rows.map(rowState).filter(state => state && state !== 'UNKNOWN'))].sort();
  return states.length ? states : ['TN'];
}

function filteredRows(rows = []) {
  return asArray(rows).filter(matchesLeadEngineState);
}

function provenancePill(row = {}) {
  const adapter = row.sourceAdapter || row.type || row.platform || 'source pending';
  const sourceId = row.sourceId || row.id || row.sourceType || 'unverified';
  const tone = /seed|fake|sample|demo/i.test(`${adapter} ${sourceId}`) ? 'bad' : row.sourceUrl || row.url || row.platform ? 'good' : 'warn';
  const label = tone === 'bad' ? 'blocked: fabricated' : tone === 'good' ? 'public-source' : 'source pending';
  return `${badge(label, tone)} ${badge(rowState(row), 'neutral')} <code>${h(sourceId)}</code>`;
}

function zeroFabricationNotice(snapshot = {}, queues = {}) {
  const activeLeadCount = asArray(queues.topSellerCalls).length + asArray(queues.offerReady).length + asArray(queues.skipTrace).length;
  const candidateCount = asArray(snapshot.sourceCandidates).length;
  return `<section class="fabrication-guard">
    <div><span class="eyebrow">Zero-fabrication mode</span><h3>No made-up leads are allowed in the money queue.</h3><p>Seed/demo records are blocked at generation time. Tennessee is currently a public-source watchlist: the app can show source candidates now, but seller calls stay empty until verified county/city records are ingested.</p></div>
    <div class="guard-stats"><strong>${h(activeLeadCount)}</strong><span>active source-backed lead rows</span><strong>${h(candidateCount)}</strong><span>source candidates discovered</span></div>
  </section>`;
}

function enrichedBuilderContacts() {
  return asArray(workspace.buyers).filter(buyer => buyer.contactEnrichedAt || buyer.sourceId === 'lehigh-builder-signals-fdor-2025' || buyer.market === 'knoxville-tn');
}

function parseLotSizeRange(value = '') {
  const numbers = String(value || '').match(/\d+(?:\.\d+)?/g)?.map(Number).filter(number => Number.isFinite(number)) || [];
  if (!numbers.length) return { lotSizeMin: 0, lotSizeMax: 0 };
  if (numbers.length === 1) return { lotSizeMin: numbers[0], lotSizeMax: numbers[0] };
  return { lotSizeMin: Math.min(...numbers), lotSizeMax: Math.max(...numbers) };
}

function stateFromBuilderRow(row = {}) {
  const explicit = String(row.state || row.marketState || row.stateCode || '').trim().toUpperCase();
  if (explicit) return explicit;
  const market = String(row.marketName || row.market || row.sourceMarket || '').toLowerCase();
  if (/tennessee|knoxville|nashville|chattanooga|murfreesboro|franklin/.test(market)) return 'TN';
  if (/florida|polk|lakeland|ocala|orlando|jacksonville/.test(market)) return 'FL';
  if (/arizona|phoenix|maricopa|mesa|tucson/.test(market)) return 'AZ';
  if (/north carolina|raleigh|wake|charlotte|mecklenburg|greensboro/.test(market)) return 'NC';
  if (/texas|austin|san antonio|travis|bexar|dfw|plano/.test(market)) return 'TX';
  return selectedBuilderMarketState || 'TN';
}

function buyerFromValidationRow(row = {}) {
  const buyBox = row.buyBox || {};
  const validation = row.validation || {};
  const lotRange = parseLotSizeRange(buyBox.lotSize || buyBox.lotSizeRange || '');
  const state = stateFromBuilderRow(row);
  const market = row.marketName || row.market || (buyBox.geography ? `${buyBox.geography}, ${state}` : state);
  const maxPrice = Number(buyBox.maxPrice || row.maxPrice || row.buyerMaxPrice || 0) || 0;
  const targetMarkets = [buyBox.geography, row.market, row.marketKey, market, state].filter(Boolean);
  const buyerId = `builder-buyer-${slugify(row.builderId || row.id || row.name || 'validated-builder')}`;
  return {
    id: buyerId,
    builderId: row.builderId || row.id || '',
    name: row.name || row.companyName || 'Validated builder buyer',
    phone: row.phone || '',
    email: row.email || buyBox.packageRecipient || '',
    website: row.website || row.sourceUrl || '',
    contactName: row.contactName || buyBox.packageRecipient || '',
    sourceId: row.sourceId || row.builderId || 'buyer-validation-command-center',
    sourceUrl: row.sourceUrl || row.publicSourceUrl || '',
    sourceType: row.sourceType || 'permit-backed builder validation',
    evidenceType: 'validated buyer buy-box from selected builder cockpit',
    market,
    state,
    marketState: state,
    recentBuilds: Number(row.recentBuilds || 0),
    maxPrice,
    closeSpeedDays: Number(String(buyBox.closeSpeed || '').match(/\d+/)?.[0] || 0) || undefined,
    repeatDemand: Number(String(buyBox.closeSpeed || '').match(/(\d+)\s*(?:lots?|parcels?)/i)?.[1] || 0) || 1,
    buyBoxCaptured: validation.sellerEligible || row.callStatus === 'validated_buy_box',
    validationStatus: row.callStatus === 'validated_buy_box' ? 'validated buy box' : row.callStatus || 'buyer validation',
    buyBox: `${buyBox.geography || market}; ${buyBox.lotSize || 'lot size pending'}; max ${formatMoney(maxPrice)}; close ${buyBox.closeSpeed || 'speed pending'}; package ${buyBox.packageRecipient || 'recipient pending'}; avoid ${asArray(buyBox.dealKillers).join(', ') || buyBox.dealKillers || 'deal killers pending'}`,
    exactBuyBox: {
      targetMarkets,
      lotSizeMin: lotRange.lotSizeMin,
      lotSizeMax: lotRange.lotSizeMax,
      maxPrice,
      requiredRoadAccess: true,
      requiredUtilities: /utility|utilities|sewer|water|electric/i.test(String(buyBox.utilitiesAccess || '')),
      avoidFloodZones: /flood/i.test(String(asArray(buyBox.dealKillers).join(' ') || buyBox.dealKillers || '')) ? ['AE', 'A'] : [],
      avoidWetlands: /wetland/i.test(String(asArray(buyBox.dealKillers).join(' ') || buyBox.dealKillers || '')),
      notes: row.callNotes || '',
    },
    acquisitionNotes: row.callNotes || '',
    validation: {
      buyBoxCaptured: validation.sellerEligible || row.callStatus === 'validated_buy_box',
      calls: row.outreach?.phone?.contacted ? 1 : 0,
      answered: row.callStatus === 'validated_buy_box' || row.callStatus === 'spoke_to_decision_maker' ? 1 : 0,
      proofOfFunds: false,
    },
    feedback: row.feedback || [],
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

function validatedBuilderBuyersForState(stateCode = selectedBuilderMarketState) {
  const activeRows = stateCode === selectedBuilderMarketState ? getActiveValidationRows() : getStateBuilderRows(stateCode);
  const center = buildBuyerValidationCommandCenter(activeRows, workspace.buyerValidations || []);
  return center.items.filter(item => item.validation?.sellerEligible).map(buyerFromValidationRow);
}

function upsertBuyerFromValidation(row = {}) {
  const buyer = buyerFromValidationRow(row);
  workspace = { ...workspace, buyers: [...asArray(workspace.buyers).filter(item => item.id !== buyer.id && item.builderId !== buyer.builderId), buyer] };
  return buyer;
}

function uniqueRowsById(rows = [], keyFn = item => item.id || item.buyerId || item.builderId || item.parcelId || item.name) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(keyFn(row) || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buyerPoolForState(stateCode = selectedBuilderMarketState) {
  const buyers = [
    ...validatedBuilderBuyersForState(stateCode),
    ...generatedCandidateBuyers(),
    ...enrichedBuilderContacts(),
    ...asArray(workspace.buyers),
  ];
  return uniqueRowsById(buyers).filter(row => !stateCode || String(row.state || row.marketState || row.market || '').toUpperCase().includes(stateCode));
}

function sellerPoolForState(stateCode = selectedBuilderMarketState) {
  const sellers = [...generatedCandidateParcels(), ...asArray(generatedLeads?.queues?.skipTrace), ...asArray(workspace.parcels)];
  return uniqueRowsById(sellers, item => item.id || item.parcelId || item.address).filter(row => !stateCode || String(row.state || row.marketState || row.market || row.address || '').toUpperCase().includes(stateCode));
}

function scoredParcels() {
  return (workspace.parcels || []).map(parcel => scoreParcelDeal(parcel, getBuyer(parcel))).sort((a, b) => b.score - a.score);
}

function getVisibleParcels() {
  return scoredParcels().filter(parcel => {
    if (filter === 'all') return true;
    if (filter === 'seller-calls') return parcel.action === 'Call now' || parcel.crmStatus === 'New' || parcel.crmStatus === 'Generated lead';
    if (filter === 'offer-ready') return parcel.risk.status === 'Pass' && Number(parcel.buyerMaxPrice || 0) > Number(parcel.askingPrice || 0);
    if (filter === 'research') return parcel.action === 'Research more' || parcel.risk.status === 'Review';
    if (filter === 'blocked') return parcel.action === 'Kill' || parcel.crmStatus === 'Kill' || parcel.risk.status === 'Kill';
    if (filter === 'follow-up') return ['Contacted', 'Negotiating', 'Under Contract'].includes(parcel.crmStatus);
    return true;
  });
}

function getSelectedParcel(visible = getVisibleParcels()) {
  if (!visible.length) {
    selectedParcelId = '';
    return null;
  }
  const selected = visible.find(parcel => parcel.id === selectedParcelId) || visible[0];
  selectedParcelId = selected.id;
  return selected;
}

function getNextAction(parcel) {
  if (!parcel) return 'Import seller records to begin.';
  if (parcel.action === 'Call now') return `Call ${parcel.ownerName || parcel.owner || 'the owner'} and anchor at ${formatMoney(parcel.offer.initialSellerOffer)}.`;
  if (parcel.risk.status === 'Kill') return 'Do not call. Keep as evidence for risk filter tuning.';
  if (!parcel.ownerPhone && !parcel.ownerEmail) return 'Find owner phone/email before this becomes callable.';
  if (parcel.risk.status === 'Review') return 'Clear buildability risk before making an offer.';
  return 'Keep warm: send mail first or add to follow-up queue.';
}

function downloadText(filename, text, type = 'text/csv') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderMarkets() {
  const rows = (workspace.markets || []).map((market) => {
    const score = scoreMarket(market);
    const tone = score.grade === 'A' ? 'good' : score.grade === 'B' ? 'warn' : 'bad';
    return `<article class="card market-card">
      <div class="card-top"><h3>${h(market.name)}</h3>${badge(`Grade ${score.grade} · ${score.total}`, tone)}</div>
      <p>${h(market.thesis || 'No thesis captured yet.')}</p>
      <div class="meter"><span style="width:${score.total}%"></span></div>
      <div class="mini-grid">
        <div><b>${h(market.newBuilds90d)}</b><span>new builds / 90d</span></div>
        <div><b>${h(market.activeBuilders)}</b><span>active builders</span></div>
        <div><b>${h(market.vacantLotSales90d)}</b><span>land sales / 90d</span></div>
        <div><b>${Number(market.offMarketVacantLots || 0).toLocaleString()}</b><span>off-market lots</span></div>
      </div>
      <div class="tags">${score.reasons.map(r => badge(r, 'good')).join('')}${score.flags.map(f => badge(f, 'bad')).join('')}</div>
    </article>`;
  }).join('');
  document.querySelector('#markets').innerHTML = rows;
}

function renderBuyers() {
  const ranked = rankBuyers(workspace.buyers || []);
  document.querySelector('#buyers').innerHTML = ranked.map((buyer) => `<article class="card buyer-card">
    <div class="card-top"><h3>${h(buyer.name)}</h3>${badge(`${buyer.score} buyer score`, buyer.score >= 70 ? 'good' : 'warn')}</div>
    <p>${h(buyer.type || 'Buyer')} · ${h(buyer.buyBox || 'No buy box captured yet.')}</p>
    <p><strong>${h(buyer.contactName || 'No contact')}</strong> · ${h(buyer.phone || 'phone missing')} · ${h(buyer.email || 'email missing')}</p>
    <div class="mini-grid four">
      <div><b>${h(buyer.recentBuilds || 0)}</b><span>recent builds</span></div>
      <div><b>${buyer.scatteredLots ? 'Yes' : 'No'}</b><span>scattered lots</span></div>
      <div><b>${h(buyer.closeSpeedDays || 30)}d</b><span>close speed</span></div>
      <div><b>${h(buyer.repeatDemand || 0)}/10</b><span>repeat demand</span></div>
    </div>
  </article>`).join('');
}

function crmControls(parcel) {
  return `<div class="crm-row" data-parcel-id="${h(parcel.id)}">
    <label>Status<select class="crm-status">${CRM_STATUSES.map(status => `<option value="${h(status)}" ${parcel.crmStatus === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label>Next follow-up<input class="crm-followup" type="date" value="${h(parcel.nextFollowUp || '')}"></label>
    <label>Negotiated range<input class="crm-negotiated-range" type="text" value="${h(parcel.negotiatedSellerRange || '')}" placeholder="$28k to $32k, or seller counter"></label>
    <label>Title packet<select class="crm-title-status">${['missing', 'draft', 'attorney-reviewed', 'title-opened', 'active'].map(status => `<option value="${h(status)}" ${(parcel.titlePacketStatus || 'missing') === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label>Buyer memo<select class="crm-buyer-memo-status">${['missing', 'drafted', 'sent', 'accepted'].map(status => `<option value="${h(status)}" ${(parcel.buyerMemoStatus || 'missing') === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label>Assignment<select class="crm-assignment-status">${['not-started', 'accepted', 'signed', 'deposited', 'closed'].map(status => `<option value="${h(status)}" ${(parcel.assignmentStatus || 'not-started') === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label class="crm-notes-label">Notes<textarea class="crm-notes" rows="2" placeholder="Call notes, seller ask, buyer feedback...">${h(parcel.notes || '')}</textarea></label>
    <button class="save-crm" type="button">Save CRM</button>
  </div>`;
}

function renderOperatorChecklist(checklist, { compact = false } = {}) {
  return `<section class="operator-checklist ${compact ? 'compact' : ''}" aria-label="Call-to-close checklist">
    <div class="operator-checklist-head">
      <span class="eyebrow">Call → Close Control</span>
      <h3>${h(checklist.next.label)}</h3>
      <div class="probability-meter" style="--score:${h(checklist.probability)}"><strong>${h(checklist.probability)}%</strong><span>assignment close probability</span></div>
    </div>
    <div class="operator-steps">${checklist.steps.map((step, index) => `<article class="operator-step ${step.done ? 'done' : 'todo'}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(step.label)}</b>
      <p>${h(step.detail)}</p>
    </article>`).join('')}</div>
  </section>`;
}

function statusTone(status) {
  if (['closed-funded', 'buyer-funded', 'clear-to-close', 'title-packet-ready', 'file-opened', 'hud-review'].includes(status)) return 'good';
  if (['blocked', 'assignment friendly-title-needed'].includes(status)) return 'bad';
  if (['missing-title-company', 'docs-out-for-signature', 'title-search'].includes(status)) return 'warn';
  return 'neutral';
}

function titleCompanyCandidateMarkets() {
  return asArray(titleCompanyMarkets?.markets).slice(0, 8);
}

function currentContractDraftInputs(parcel = {}) {
  const saved = workspace.contractDraft || {};
  return {
    effectiveDate: saved.effectiveDate || new Date().toISOString().slice(0, 10),
    buyerName: saved.buyerName || 'MarvelUs Intel LLC or assigns',
    sellerName: saved.sellerName || parcel.ownerName || parcel.owner || '',
    propertyAddress: saved.propertyAddress || parcel.address || '',
    city: saved.city || parcel.city || '',
    county: saved.county || parcel.county || '',
    propertyState: saved.propertyState || parcel.state || 'TN',
    zip: saved.zip || parcel.zip || '',
    parcelId: saved.parcelId || parcel.parcelId || parcel.id || '',
    legalDescription: saved.legalDescription || parcel.legalDescription || '',
    includedRights: saved.includedRights || 'all appurtenant rights stated in the state approved contract',
    purchasePrice: saved.purchasePrice || parcel.sellerAskingPrice || parcel.askingPrice || parcel.offer?.initialSellerOffer || '',
    earnestMoney: saved.earnestMoney || '10.00',
    earnestMoneyHolder: saved.earnestMoneyHolder || parcel.titleCompany?.name || '',
    closingAgent: saved.closingAgent || parcel.titleCompany?.name || '',
    feasibilityDeadline: saved.feasibilityDeadline || 'through closing unless state counsel changes this term',
    closingDate: saved.closingDate || parcel.closingDate || '',
    closingCostsPayer: saved.closingCostsPayer || 'Buyer unless title/attorney changes allocation',
    taxProration: saved.taxProration || 'prorated as of closing',
    deedType: saved.deedType || 'warranty, special warranty, or state appropriate deed approved by closing office',
    assignability: saved.assignability || 'assignable only after attorney/title approval',
    assignorName: saved.assignorName || 'MarvelUs Intel LLC',
    assigneeName: saved.assigneeName || parcel.buyerContactName || '',
    underlyingSellerName: saved.underlyingSellerName || parcel.ownerName || parcel.owner || '',
    originalPurchasePrice: saved.originalPurchasePrice || parcel.sellerAskingPrice || parcel.offer?.initialSellerOffer || '',
    assignmentFee: saved.assignmentFee || parcel.assignmentFee || parcel.offer?.targetSpread || '',
    assigneePurchasePrice: saved.assigneePurchasePrice || parcel.buyerPrice || parcel.offer?.buyerPrice || '',
    earnestMoneyDue: saved.earnestMoneyDue || '',
    earnestMoneyDeadline: saved.earnestMoneyDeadline || '',
    inspectionAcknowledgement: saved.inspectionAcknowledgement || 'assignee accepts buyer position subject to reviewed documents and title instructions',
    titleCompany: saved.titleCompany || parcel.titleCompany?.name || '',
    settlementStatementApproval: saved.settlementStatementApproval || 'assignment fee must appear on closing statement or written title instructions',
    additionalTerms: saved.additionalTerms || '',
    sellerSignature: saved.sellerSignature || '',
    buyerSignature: saved.buyerSignature || '',
    assignorSignature: saved.assignorSignature || '',
    assigneeSignature: saved.assigneeSignature || '',
    attorneyReviewer: saved.attorneyReviewer || '',
    attorneyReviewDate: saved.attorneyReviewDate || '',
  };
}

function renderContractComposer(parcel = {}) {
  const inputs = currentContractDraftInputs(parcel);
  const packet = buildContractPacketDraft(inputs);
  const contractStatus = workspace.contractStageStatus || {};
  const sellerStatus = contractStatus.sellerAgreement || inputs.sellerAgreementStatus || 'draft';
  const assignmentStatus = contractStatus.assignmentAgreement || inputs.assignmentAgreementStatus || 'locked';
  const titleStatus = contractStatus.titlePacket || inputs.titlePacketStatus || 'waiting';
  const sellerReady = ['ready','exported','seller-signed','title-opened'].includes(sellerStatus);
  const sellerSigned = ['seller-signed','title-opened'].includes(sellerStatus);
  const assignmentUnlocked = sellerSigned;
  const savedCount = asArray(workspace.contractPackets).length;
  const generatedDate = new Date().toISOString().slice(0, 10);
  const printValue = (value, fallback = '__________') => h(String(value || '').trim() || fallback);
  const preparedBy = inputs.preparedBy || inputs.buyerName || 'MarvelUs Intel LLC';
  const printMeta = (type) => `<div class="print-document-meta"><span>${h(type)}</span><b>${printValue(inputs.propertyAddress, 'Property address pending')}</b><em>Parcel ${printValue(inputs.parcelId, 'pending')} · ${printValue(inputs.county, 'county pending')}, ${printValue(inputs.propertyState, 'state')} · Prepared by ${printValue(preparedBy, 'operator pending')} · Generated ${h(generatedDate)}</em></div>`;
  const printFooter = `<footer class="print-legal-footer"><b>Drafting aid only.</b><span>Use for PDF preview and attorney/title review. Do not use for signature until reviewed by licensed counsel for the property state and accepted by the closing/title provider.</span></footer>`;
  const inline = (name, label, className = '') => `<label class="doc-fill ${className}" title="${h(label)}"><span>${h(label)}</span><input name="${h(name)}" value="${h(inputs[name] || '')}" placeholder="${h(label)}"><strong class="print-field-value" data-print-value-for="${h(name)}">${printValue(inputs[name], label)}</strong></label>`;
  const area = (name, label, className = '') => `<label class="doc-fill doc-fill-area ${className}" title="${h(label)}"><span>${h(label)}</span><textarea name="${h(name)}" rows="2" placeholder="${h(label)}">${h(inputs[name] || '')}</textarea><strong class="print-field-value" data-print-value-for="${h(name)}">${printValue(inputs[name], label)}</strong></label>`;
  const carryNames = ['city','county','zip','legalDescription','includedRights','earnestMoneyHolder','taxProration','deedType','underlyingSellerName','earnestMoneyDue','earnestMoneyDeadline','inspectionAcknowledgement','sellerSignature','buyerSignature','assignorSignature','assigneeSignature','feasibilityDeadline','preparedBy'];
  const hiddenCarry = carryNames.map(name => `<input type="hidden" name="${h(name)}" value="${h(inputs[name] || '')}">`).join('') + `<input type="hidden" name="sellerAgreementStatus" value="${h(sellerStatus)}"><input type="hidden" name="assignmentAgreementStatus" value="${h(assignmentStatus)}"><input type="hidden" name="titlePacketStatus" value="${h(titleStatus)}">`;
  const docStepper = (active) => ['Details','Prepare','Preview PDF'].map((label, index) => `<span class="contract-step ${label === active ? 'active' : index < ['Details','Prepare','Preview PDF'].indexOf(active) ? 'complete' : 'locked'}">${index + 1}<b>${h(label)}</b></span>`).join('<i></i>');
  const stageCards = [
    { id: 'seller', step: '01', title: 'Seller Agreement', subtitle: 'Control the property', status: sellerStatus, active: true, detail: 'Land Sale Agreement. Used after the seller call accepts terms. Locks price, title review, feasibility, closing office, and assignability.' },
    { id: 'assignment', step: '02', title: 'Assignment Agreement', subtitle: 'Assign to builder buyer', status: assignmentUnlocked ? assignmentStatus : 'locked until seller signed', active: assignmentUnlocked, detail: 'Used later, after seller control exists. Transfers our buyer position to the builder and states the assignment fee/title settlement treatment.' },
    { id: 'title', step: '03', title: 'Title Packet', subtitle: 'Close cleanly', status: titleStatus, active: sellerReady, detail: 'Bundle the signed seller agreement, assignment, and title email framework for escrow/title review.' },
  ];
  const pipeline = stageCards.map(card => `<article class="closing-flow-card ${card.active ? 'active' : 'locked'}"><span>${h(card.step)}</span><div><b>${h(card.title)}</b><em>${h(card.subtitle)}</em><p>${h(card.detail)}</p></div>${badge(card.status, card.active ? 'good' : 'warn')}</article>`).join('');
  const requiredSellerMissing = ['propertyAddress','sellerName','buyerName','purchasePrice','propertyState'].filter(name => !String(inputs[name] || '').trim());
  const requiredAssignmentMissing = ['assigneeName','assignmentFee','assigneePurchasePrice','titleCompany'].filter(name => !String(inputs[name] || '').trim());
  return `<section id="contract-composer" class="contract-composer-panel contract-flow-workspace" aria-label="Closing contract pipeline">
    <div class="contract-flow-hero">
      <span class="eyebrow">Phase 12 · Print detail finish</span>
      <h2>Print the exact packet you need.</h2>
      <p>Seller only, assignment only, or the full title packet - still no backend, no DocuSign, no ceremony. Print fields now resolve as quiet document text with prepared-by metadata and tighter page breaks.</p>
      <div class="contract-flow-actions"><button type="button" id="load-selected-contract-deal">Load selected deal</button><button type="button" class="secondary" id="save-contract-packet">Save draft</button><button type="button" class="secondary" id="print-contract-packet" data-print-contract-packet="packet">Preview full packet</button></div>
    </div>
    <div class="closing-flow-pipeline" aria-label="Contract stage pipeline">${pipeline}</div>
    <form id="contract-packet-form" class="contract-send-form contract-separated-form">
      ${hiddenCarry}
      <div class="print-packet-cover print-only" aria-hidden="true">
        <span>Land Dealflow OS</span>
        <h1>Closing Contract Packet</h1>
        <p>Seller agreement, assignment agreement, and title review cover prepared for attorney/title validation before signature.</p>
        <dl><div><dt>Property</dt><dd>${printValue(inputs.propertyAddress, 'Property address pending')}</dd></div><div><dt>Parcel</dt><dd>${printValue(inputs.parcelId, 'pending')}</dd></div><div><dt>State</dt><dd>${printValue(inputs.propertyState, 'pending')}</dd></div><div><dt>Generated</dt><dd>${h(generatedDate)}</dd></div><div><dt>Prepared by</dt><dd>${printValue(preparedBy, 'operator pending')}</dd></div></dl>
      </div>
      <section id="seller-agreement-experience" class="contract-document-experience seller-experience" aria-label="Seller Agreement fill experience">
        <div class="contract-send-topbar"><div class="contract-backline"><span aria-hidden="true">01</span><b>Seller Agreement</b><em>Step 1 - Control the property</em></div>${badge(sellerStatus, 'good')}</div>
        <div class="contract-stepper" aria-label="Seller agreement progress">${docStepper('Prepare')}</div>
        <div class="contract-review-strip"><span>Review & Fill Seller Agreement Fields</span><a href="#seller-agreement-experience">Land Sale Agreement</a></div>
        <div class="contract-document-shell">
          <div class="contract-document-head"><div><span>‹</span><b>${h(inputs.propertyAddress || 'Selected land deal')} - Land Sale Agreement</b><em>${requiredSellerMissing.length ? `${requiredSellerMissing.length} required seller field(s) left` : 'ready for seller PDF'}</em></div><button type="button" class="secondary" data-contract-status="seller-ready">Mark ready</button></div>
          <label class="recipient-select"><span class="recipient-dot"></span><select name="sellerRecipient"><option>${h(inputs.sellerName || 'Seller')}</option><option>${h(inputs.buyerName || 'Buyer / Assignor')}</option><option>Title / attorney review</option></select></label>
          <div class="contract-stage">
            <aside class="contract-page-rail" aria-label="Seller agreement pages"><button type="button" class="active">Seller<br>01</button><button type="button">Terms<br>02</button><button type="button">Sign<br>03</button></aside>
            <div class="contract-doc-scroll">
              <article class="contract-paper printable-paper seller-paper" data-print-doc="seller" aria-label="Fillable seller Land Sale Agreement">
                ${printMeta('Seller agreement')}
                <h3>Land Sale Agreement</h3>
                <p class="doc-line">This Contract dated ${inline('effectiveDate', 'MM/dd/yyyy', 'date-field')} in which Buyer: ${inline('buyerName', 'Buyer name', 'long-field')} and/or assigns, offers to purchase from Seller(s): ${inline('sellerName', 'Seller name', 'medium-field')} the following described vacant land, together with all appurtenant rights, located at:</p>
                ${inline('propertyAddress', 'Property address', 'address-field')}
                <p class="doc-line">County/state: ${inline('county', 'County', 'medium-field')} ${inline('propertyState', 'State', 'state-field')} · Parcel/PIN: ${inline('parcelId', 'Parcel ID', 'medium-field')}.</p>
                <p class="doc-kicker">Seller agrees:</p>
                <ol class="contract-clauses">
                  <li>The purchase price is $ ${inline('purchasePrice', 'Purchase price', 'money-field')} paid to seller at closing.</li>
                  <li>Property is sold in <b>AS IS</b> condition subject to buyer feasibility, title, survey, access, utilities and buildability review.</li>
                  <li>Buyer will open closing with ${inline('closingAgent', 'Closing agent', 'medium-field')} and deposit earnest money of $ ${inline('earnestMoney', 'Earnest money', 'money-field')} as approved by title/attorney.</li>
                  <li>Closing will occur on or before ${inline('closingDate', 'Closing date', 'date-field')} and closing costs will be paid by ${inline('closingCostsPayer', 'Closing costs payer', 'medium-field')}.</li>
                  <li>Assignability: ${inline('assignability', 'Assignability language', 'wide-inline')}.</li>
                </ol>
                ${area('additionalTerms', 'Additional seller terms / attorney edits', 'full-line')}
                <div class="signature-grid apple-signature-grid"><span><b>Seller signature</b><em>Date</em></span><span><b>Buyer / Assignor signature</b><em>Date</em></span></div>
                ${printFooter}
              </article>
            </div>
            <aside class="thumbnail-tab"><span>▣</span><b>Seller PDF</b></aside>
          </div>
          <div class="contract-fill-toolbar" aria-label="Seller field tools"><button type="button">Text</button><button type="button">Initial</button><button type="button">Signature</button><button type="button">Date</button><button type="button">Checkbox</button></div>
        </div>
        <div class="contract-send-footer"><span>Seller flow · ${requiredSellerMissing.length ? `${requiredSellerMissing.length} required gate(s) left` : 'ready to export as PDF'}</span><div><button type="button" data-contract-status="seller-signed">Mark seller signed</button><button type="button" data-print-contract-packet="seller" class="secondary">Print seller only</button><button type="button" id="export-seller-contract" class="secondary">Export seller packet</button></div><strong id="contract-packet-status">${h(savedCount)} saved packet(s) · ${h(packet.status)}</strong></div>
      </section>

      <section id="assignment-agreement-experience" class="contract-document-experience assignment-experience ${assignmentUnlocked ? '' : 'locked-experience'}" aria-label="Assignment Agreement fill experience">
        <div class="contract-send-topbar"><div class="contract-backline"><span aria-hidden="true">02</span><b>Assignment Agreement</b><em>Step 2 - Assign to builder buyer</em></div>${badge(assignmentUnlocked ? assignmentStatus : 'locked', assignmentUnlocked ? 'good' : 'warn')}</div>
        ${assignmentUnlocked ? `<div class="contract-stepper" aria-label="Assignment agreement progress">${docStepper('Prepare')}</div>` : '<div class="assignment-lock-banner"><b>Assignment unlocks after seller agreement is marked signed.</b><p>Do not prepare buyer assignment paperwork before the deal is under seller control and title/closing can review assignment handling.</p></div>'}
        <div class="contract-review-strip"><span>Review & Fill Assignment Fields</span><a href="#assignment-agreement-experience">Assignment of Vacant Land Purchase Agreement</a></div>
        <div class="contract-document-shell">
          <div class="contract-document-head"><div><span>‹</span><b>${h(inputs.propertyAddress || 'Selected land deal')} - Assignment Agreement</b><em>${assignmentUnlocked ? (requiredAssignmentMissing.length ? `${requiredAssignmentMissing.length} buyer field(s) left` : 'ready for buyer PDF') : 'locked until seller signed'}</em></div><button type="button" class="secondary" data-contract-status="assignment-ready" ${assignmentUnlocked ? '' : 'disabled'}>Mark ready</button></div>
          <label class="recipient-select"><span class="recipient-dot"></span><select name="assignmentRecipient" ${assignmentUnlocked ? '' : 'disabled'}><option>${h(inputs.assigneeName || 'Builder / Assignee')}</option><option>${h(inputs.assignorName || 'Assignor')}</option><option>Title / settlement desk</option></select></label>
          <div class="contract-stage">
            <aside class="contract-page-rail" aria-label="Assignment agreement pages"><button type="button" class="active">Assign<br>01</button><button type="button">Fee<br>02</button><button type="button">Sign<br>03</button></aside>
            <div class="contract-doc-scroll">
              <article class="contract-paper printable-paper buyer-paper" data-print-doc="assignment" aria-label="Fillable Assignment of Vacant Land Purchase Agreement">
                ${printMeta('Assignment agreement')}
                <h3>Assignment of Vacant Land Purchase Agreement</h3>
                <p class="doc-line">Assignor ${inline('assignorName', 'Assignor', 'medium-field')} assigns the buyer position under the seller agreement to Assignee ${inline('assigneeName', 'Builder / assignee', 'medium-field')} for parcel ${inline('parcelId', 'Parcel ID', 'medium-field')} in ${inline('propertyState', 'State', 'state-field')}.</p>
                <ol class="contract-clauses">
                  <li>Underlying seller: ${inline('underlyingSellerName', 'Underlying seller', 'medium-field')}.</li>
                  <li>Original seller contract price: $ ${inline('originalPurchasePrice', 'Original price', 'money-field')}.</li>
                  <li>Assignment fee: $ ${inline('assignmentFee', 'Assignment fee', 'money-field')} payable only through the closing statement unless counsel/title approves otherwise.</li>
                  <li>Assignee total purchase price: $ ${inline('assigneePurchasePrice', 'Assignee price', 'money-field')}.</li>
                  <li>Title company: ${inline('titleCompany', 'Title company', 'long-field')}.</li>
                  <li>Settlement statement rule: ${inline('settlementStatementApproval', 'Settlement rule', 'wide-inline')}.</li>
                </ol>
                <div class="attorney-gate-inline">${inline('attorneyReviewer', 'Attorney reviewer', 'medium-field')}${inline('attorneyReviewDate', 'Review date', 'date-field')}</div>
                <div class="signature-grid apple-signature-grid"><span><b>Assignor signature</b><em>Date</em></span><span><b>Assignee signature</b><em>Date</em></span></div>
                ${printFooter}
              </article>
            </div>
            <aside class="thumbnail-tab"><span>▣</span><b>Buyer PDF</b></aside>
          </div>
          <div class="contract-fill-toolbar" aria-label="Assignment field tools"><button type="button">Text</button><button type="button">Initial</button><button type="button">Signature</button><button type="button">Date</button><button type="button">Attach</button></div>
        </div>
        <div class="contract-send-footer"><span>Assignment flow · ${assignmentUnlocked ? (requiredAssignmentMissing.length ? `${requiredAssignmentMissing.length} buyer gate(s) left` : 'ready to export as PDF') : 'locked until seller signed'}</span><div><button type="button" data-contract-status="buyer-signed" ${assignmentUnlocked ? '' : 'disabled'}>Mark buyer signed</button><button type="button" data-print-contract-packet="assignment" class="secondary" ${assignmentUnlocked ? '' : 'disabled'}>Print assignment only</button><button type="button" id="export-assignment-contract" class="secondary" ${assignmentUnlocked ? '' : 'disabled'}>Export assignment packet</button></div><strong>${h(assignmentUnlocked ? assignmentStatus : 'locked')}</strong></div>
      </section>

      <section id="title-packet-experience" class="title-packet-experience" aria-label="Title packet export experience">
        <div><span class="eyebrow">Step 3 - Close cleanly</span><h3>Title packet bundle</h3><p>Once the seller agreement is controlled and the assignment is ready, export the combined packet for title: seller agreement, assignment agreement, and attorney/title review letter.</p></div>
        <div class="title-packet-actions"><button type="button" id="export-contract-packet">Export title packet Markdown</button><button type="button" data-print-contract-packet="title" class="secondary">Print title packet</button><button type="button" data-contract-status="title-opened" class="secondary">Mark title opened</button></div>
      </section>
      <article class="contract-paper printable-paper title-review-paper print-only" data-print-doc="title-review" aria-hidden="true">
        ${printMeta('Attorney and title review')}
        <h3>Attorney And Title Review Letter</h3>
        <p>Please review the attached seller agreement and assignment agreement before any signature. Confirm state-specific wording, assignability, feasibility/title contingencies, earnest money timing, required addenda, closing/title instructions, and settlement statement treatment of the assignment fee.</p>
        <p><b>Title company:</b> ${printValue(inputs.titleCompany, 'title company pending')}</p>
        <p><b>Attorney reviewer:</b> ${printValue(inputs.attorneyReviewer, 'reviewer pending')} · <b>Review date:</b> ${printValue(inputs.attorneyReviewDate, 'date pending')}</p>
        <p><b>Prepared by:</b> ${printValue(preparedBy, 'operator pending')}</p>
        ${printFooter}
      </article>
    </form>
  </section>`;
}

function renderClosingDeskResearchDeck() {
  const process = titleCompanyProcess || {};
  const insights = asArray(process.closingDeskInsights || process.closingDeskInsights).slice(0, 5);
  const rules = asArray(process.operatorRules).slice(0, 4);
  const template = process.templates?.titlePacketEmail || {};
  const sellerChecklist = asArray(process.templates?.sellerPurchaseAgreementChecklist).slice(0, 6);
  const assignmentChecklist = asArray(process.templates?.buyerAssignmentAgreementChecklist).slice(0, 6);
  const markets = titleCompanyCandidateMarkets();
  const marketRows = markets.map(market => {
    const candidates = asArray(market.candidates).slice(0, 3);
    return `<article class="title-market-card">
      <div><span>${h(market.state)} · Priority ${h(market.priority)}</span><strong>${h(market.market)}</strong></div>
      <div class="candidate-stack">${candidates.map(candidate => `<a href="${h(candidate.url)}" target="_blank" rel="noopener noreferrer"><b>${h(candidate.name)}</b><small>${h(candidate.assignmentFriendly || 'unknown')} assignment status · ${h(asArray(candidate.serviceSignals).slice(0, 3).join(' / '))}</small></a>`).join('')}</div>
    </article>`;
  }).join('');
  return `<section class="closing-intelligence-deck" aria-label="Closing desk operating system">
    <div class="closing-intel-hero">
      <span class="eyebrow">Closing desk operating system</span>
      <h2>Contracts, title, escrow, HUD. Paid cleanly.</h2>
      <p>Closing Desk is the information hub for title, escrow, contracts, HUD review, disbursement, and public title-company candidates in our priority markets. The app does not pretend assignment friendly status is verified; it forces the call.</p>
      <div class="badge-stack">${badge('closing model ready', 'good')}${badge('public title candidates', 'neutral')}${badge('assignment status must be verified', 'warn')}</div>
    </div>
    <div class="closing-intel-grid">
      <article class="title-glass-card operating-insight-card">
        <div class="card-kicker"><span>Operating insight</span><b>${h(process.source?.name || 'Closing Desk model')}</b></div>
        <ul>${insights.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
      <article class="title-glass-card closing-rule-card">
        <div class="card-kicker"><span>Non-negotiables</span><b>operator rules</b></div>
        <ul>${rules.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
    </div>
    <div class="contract-template-grid">
      <article class="title-glass-card contract-template-card">
        <div class="card-kicker"><span>Seller contract template</span><b>checklist</b></div>
        <h3>Vacant-land purchase agreement</h3>
        <p>Use a state-specific attorney/title-reviewed form. The app should track readiness, not generate fake legal documents.</p>
        <ul>${sellerChecklist.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
      <article class="title-glass-card contract-template-card">
        <div class="card-kicker"><span>Buyer contract template</span><b>assignment</b></div>
        <h3>Assignment / assignee agreement</h3>
        <p>Use when the builder takes over the buyer position. If title rejects assignment mechanics, escalate to double close/legal review.</p>
        <ul>${assignmentChecklist.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
      <article class="title-glass-card title-email-template-card">
        <div class="card-kicker"><span>Title packet email</span><b>copy framework</b></div>
        <h3>${h(template.subject || 'Assignment closing packet')}</h3>
        <pre>${h(template.body || 'Loading title packet email template…')}</pre>
        <button type="button" class="secondary copy-research-title-email" data-copy-research-title-email>Copy template framework</button><span class="research-title-email-status"></span>
      </article>
    </div>
    <article class="title-glass-card title-company-candidate-board">
      <div class="card-kicker"><span>Real title-company candidates</span><b>${h(markets.length)} markets</b></div>
      <h3>Start here, then verify assignments by call.</h3>
      <p>These are public web candidates in the priority geography. Public title/escrow service pages prove relevance, not assignment-friendliness.</p>
      <div class="title-market-grid">${marketRows || '<p>Title-company market candidates loading…</p>'}</div>
    </article>
  </section>`;
}

function renderTitleClosingDesk(parcel, buyer, options = {}) {
  const desk = buildTitleCompanyClosingDesk(parcel, buyer);
  const tone = statusTone(desk.status);
  const done = desk.items.filter(item => item.status === 'clear').length;
  const hudItems = [
    ['Seller cash', desk.math.sellerPrice, 'Promised net to owner'],
    ['Buyer cash', desk.math.buyerPrice, 'Builder/end-buyer wire amount'],
    ['Assignment fee', desk.math.assignmentFee, 'Operator spread line on HUD'],
    ['Closing costs est.', desk.math.closingCostsEstimate, `${desk.math.closingCostsPayer} pays`],
  ];
  const emailPreview = `${desk.email.subject}\n\n${desk.email.body}`;
  return `<section class="title-closing-desk ${options.compact ? 'compact-title-desk' : ''}" aria-label="Title company closing desk">
    <div class="title-orbital-hero">
      <div class="title-hero-copy">
        <span class="eyebrow">Title company closing desk</span>
        <h2>Neutral escrow. Clean title. Assignment fee protected.</h2>
        <p>The seller and buyer do not freestyle money movement. The title company holds escrow, clears title/taxes/liens, verifies notarized docs, and pays seller + assignor from the settlement statement.</p>
        <div class="badge-stack">${badge(desk.label, tone)}${badge(`${desk.readiness}% ready`, tone)}${badge(`${done}/${desk.items.length} gates clear`, tone)}</div>
      </div>
      <aside class="title-command-card">
        <span>Next title action</span>
        <strong>${h(desk.nextAction)}</strong>
        <p>${h(desk.titleCompany.name || 'No title company selected yet. Search assignment friendly title companies near the property.')}</p>
      </aside>
    </div>

    <div class="title-metric-strip">
      ${hudItems.map(([label, value, detail]) => `<article><span>${h(label)}</span><b>${formatMoney(value)}</b><em>${h(detail)}</em></article>`).join('')}
    </div>

    <div class="title-desk-grid">
      <article class="title-glass-card checklist-card">
        <div class="card-kicker"><span>Packet gate</span><b>${h(desk.status)}</b></div>
        <div class="title-checklist">
          ${desk.items.map(item => `<div class="title-check ${h(item.status)}"><span>${item.status === 'clear' ? '✓' : item.status === 'review' ? '!' : '-'}</span><div><b>${h(item.label)}</b><p>${h(item.detail)}</p></div></div>`).join('')}
        </div>
      </article>
      <article class="title-glass-card timeline-card">
        <div class="card-kicker"><span>14-day close path</span><b>virtual-ready</b></div>
        <div class="closing-timeline">
          ${desk.timeline.map(step => `<div class="timeline-node"><span>${h(step.day)}</span><b>${h(step.label)}</b><p>${h(step.detail)}</p></div>`).join('')}
        </div>
      </article>
    </div>

    <div class="title-desk-grid lower">
      <article class="title-glass-card email-card">
        <div class="card-kicker"><span>Title packet email</span><b>copy-ready</b></div>
        <div class="email-subject"><span>Subject</span><strong>${h(desk.email.subject)}</strong></div>
        <pre>${h(emailPreview)}</pre>
        <div class="button-row"><button type="button" class="secondary copy-title-email" data-copy-title-email>Copy title email</button><span class="title-email-status"></span></div>
      </article>
      <article class="title-glass-card title-principles-card">
        <div class="card-kicker"><span>Seller explanation</span><b>trust script</b></div>
        <blockquote>“The title company is the neutral closing company. They hold the buyer’s money in escrow, verify the paperwork, make sure title transfers legally, and then pay you at closing.”</blockquote>
        <ul>
          <li>Buyer wires title, not seller or assignor directly.</li>
          <li>HUD must show seller cash, buyer cash, closing costs, and assignment fee correctly.</li>
          <li>Wire instructions stay sensitive: secure channel + verbal verification.</li>
          <li>Closed means funded. Funds are disbursed. Signatures alone are not enough.</li>
        </ul>
      </article>
    </div>
  </section>`;
}


function getPermitBuilders() {
  const generated = buildPermitVerifiedBuilders(workspace.permitRecords?.length ? workspace.permitRecords : seedPermitRecords, { minimumPermits: 3 });
  const saved = new Map(asArray(workspace.permitBuilders).map(builder => [builder.builderId, builder]));
  return generated.map(builder => ({ ...builder, ...(saved.get(builder.builderId) || {}) }));
}

function sourceJurisdictionForPermit(permit = {}, source = {}) {
  return permit.city || permit.jurisdiction || permit.sourceReport || source.marketName || source.state || 'official permit source';
}

function normalizePermitEvidence(permit = {}, source = {}) {
  return {
    ...permit,
    permitNumber: permit.permitNumber || permit.recordId || permit.id || 'permit pending',
    permitStatus: permit.permitStatus || permit.status || 'issued',
    permitType: permit.permitType || permit.recordType || permit.workClass || 'Residential permit',
    siteAddress: permit.siteAddress || permit.address || permit.parcelNumber || 'address pending',
    issueDate: permit.issueDate || permit.issuedAt || permit.date || '',
    jurisdiction: sourceJurisdictionForPermit(permit, source),
    licenseNumber: permit.licenseNumber || permit.contractorLicense || permit.contractorName || '',
    sourceUrl: permit.sourceUrl || source.evidenceUrl || source.signalsUrl || '',
  };
}

function permitVerificationUrl(permit = {}) {
  const sourceUrl = permit.sourceUrl || '';
  const permitNumber = permit.permitNumber || permit.topPermit || permit.id || '';
  if (!sourceUrl || !permitNumber) return sourceUrl;
  if (/arcgis\/rest\/services\/.+\/FeatureServer\/\d+/i.test(sourceUrl)) {
    const [layerUrl] = sourceUrl.split('?');
    const params = new URLSearchParams({
      f: 'json',
      where: `PERMITNUMBER = '${String(permitNumber).replace(/'/g, "''")}'`,
      outFields: 'PERMITNUMBER,ADDRESS,DATEISSUED,CONTRACTOR,PARCELID,PERMITVALUE,PERMITTYPE',
      returnGeometry: 'false',
    });
    return `${layerUrl.replace(/\/$/, '')}/query?${params.toString()}`;
  }
  return sourceUrl;
}

function permitVerificationLink(permit = {}) {
  const url = permitVerificationUrl(permit);
  return url ? safeLink(url, 'Verify permit', 'proof-inline-link verify-permit-link') : '';
}

function normalizeBuilderSignal(row = {}, source = {}) {
  const permits = asArray(row.recentPermits).map(permit => normalizePermitEvidence(permit, source));
  const sourceJurisdictions = [...new Set(permits.map(permit => permit.jurisdiction).filter(Boolean))].slice(0, 3);
  const recentBuilds = Number(row.recentBuilds || permits.length || 0);
  const phone = row.phone || permits.find(permit => permit.contractorPhone)?.contractorPhone || '';
  const email = row.email || permits.find(permit => permit.contractorEmail)?.contractorEmail || '';
  const sourceUrl = row.sourceUrl || permits.find(permit => permit.sourceUrl)?.sourceUrl || source.evidenceUrl || source.signalsUrl || '';
  const marketLabel = source.marketName || row.market || source.state || 'Permit market';
  const normalized = {
    ...row,
    builderId: row.builderId || row.id || `${source.key || 'builder'}-${slugify(row.name || row.companyName || 'unknown')}`,
    companyName: row.companyName || row.name || 'Unnamed builder',
    name: row.name || row.companyName || 'Unnamed builder',
    marketName: marketLabel,
    state: row.state || source.state || '',
    phone,
    email,
    recentBuilds,
    qualifyingPermitCount: Number(row.qualifyingPermitCount || recentBuilds || permits.length || 0),
    recentPermits: permits,
    sourceJurisdictions,
    sourceUrl,
    sourceType: row.sourceType || source.marketName || 'Official permit source',
    topPermit: row.topPermit || permits[0]?.permitNumber || '',
    confidence: row.confidence ?? (permits.length ? 100 : 80),
    activityTier: row.activityTier || (recentBuilds >= 10 ? 'high velocity' : recentBuilds >= 3 ? 'active' : 'verified'),
    buyBoxStatus: row.buyBoxStatus || 'needs call',
    callable: row.callable ?? Boolean(phone || email),
    route: row.route || (phone || email ? 'buyerValidation' : 'humanReview'),
    contactStatus: row.contactStatus || (phone || email ? 'public contact loaded' : 'public contact unresolved'),
    sourceEvidence: row.sourceEvidence || row.publicSource || `${marketLabel} official permit-backed builder signal.`,
    demandSignal: row.demandSignal || `${recentBuilds} recent permit-backed build signals in ${marketLabel}.`,
    buyBoxCapture: row.buyBoxCapture || {
      geography: `Which ${marketLabel} submarkets, zip codes, subdivisions, or jurisdictions are you actively buying lots in?`,
      lotSize: 'What lot-size band, frontage, slope, utilities, road access, and finished-product constraints matter?',
      maxPrice: 'What is the maximum lot acquisition price before the deal no longer works?',
      closeSpeed: 'How fast can you close and how many lots can you absorb per month?',
      packageRecipient: 'Who should receive parcel packages and what exact fields must be included?',
      dealKillers: 'What instantly kills a lot for you: flood, slope, wetlands, no sewer, title, access, HOA, impact fees?',
    },
    buyBox: typeof row.buyBox === 'object' ? row.buyBox : {
      geography: '',
      lotSize: '',
      maxPrice: row.maxPrice || '',
      closeSpeed: row.closeSpeedDays || '',
      packageRecipient: '',
      utilitiesAccess: '',
      productType: '',
      dealKillers: [],
      zipCodes: [],
      lotSizeRange: '',
      closeSpeedDays: row.closeSpeedDays || '',
      submissionMethod: '',
    },
  };
  return {
    ...normalized,
    emailDraft: generateBuilderEmail(normalized),
  };
}

function getLoadedBuilderMarkets() {
  const markets = Object.fromEntries(Object.entries(builderMarketData.markets || {}).map(([key, data]) => {
    const source = builderMarketSourceByKey.get(key) || {};
    return [key, {
      ...source,
      ...data,
      rows: asArray(data.rows).map(row => normalizeBuilderSignal(row, source)),
    }];
  }));
  if (knoxvilleBuyerCallSheet?.rows?.length) {
    delete markets.knoxville;
    const source = builderMarketSourceByKey.get('knoxville') || {};
    markets.knoxvilleCallSheet = {
      ...source,
      key: 'knoxvilleCallSheet',
      state: 'TN',
      marketName: 'Knoxville / Knox County, TN',
      csvUrl: 'data/real/knoxville/buyer_call_sheet.csv',
      evidence: knoxvilleBuyerCallSheet,
      rows: asArray(knoxvilleBuyerCallSheet.rows).map(row => normalizeBuilderSignal({ ...row, id: row.builderId || row.id, name: row.name || row.companyName }, source)),
    };
  }
  return markets;
}

function getBuilderMarketEntriesForState(stateCode) {
  const markets = getLoadedBuilderMarkets();
  return Object.values(markets).filter(market => market.state === stateCode && asArray(market.rows).length);
}

function getStateBuilderRows(stateCode) {
  return getBuilderMarketEntriesForState(stateCode)
    .flatMap(market => asArray(market.rows).map(row => ({ ...row, marketKey: market.key, marketName: market.marketName, csvUrl: market.csvUrl })))
    .sort((a, b) => Number(b.recentBuilds || 0) - Number(a.recentBuilds || 0));
}

function getActiveValidationRows() {
  return getStateBuilderRows(selectedBuilderMarketState);
}

function findLoadedBuilderRow(builderId) {
  return Object.values(getLoadedBuilderMarkets())
    .flatMap(market => asArray(market.rows).map(row => ({ ...row, marketKey: market.key, marketName: market.marketName, csvUrl: market.csvUrl })))
    .find(row => row.builderId === builderId) || {};
}

function getStateBuilderSummary(stateCode) {
  const entries = getBuilderMarketEntriesForState(stateCode);
  const rows = getStateBuilderRows(stateCode);
  const totalRecentBuildSignals = rows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0);
  const callable = rows.filter(row => row.phone || row.email).length;
  const minimums = entries.map(entry => Number(entry.evidence?.summary?.minimumUniqueBuilders || entry.evidence?.minimumUniqueBuilders || 20)).filter(Boolean);
  return {
    entries,
    rows,
    uniqueBuilders: rows.length,
    totalRecentBuildSignals,
    callable,
    minimumUniqueBuilders: minimums.length ? Math.min(...minimums) : 20,
  };
}

function getSelectedBuilder(builders = getPermitBuilders()) {
  if (selectedBuilderId) {
    const found = builders.find(builder => builder.builderId === selectedBuilderId);
    if (found) return found;
  }
  const fallback = builders[0];
  selectedBuilderId = fallback?.builderId || '';
  return fallback;
}


function callStatusLabel(status) {
  return String(status || 'not_called').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function parseListInput(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function validationOutreach(row = {}) {
  const outreach = row.outreach || {};
  return {
    phone: Boolean(outreach.phone?.contacted || row.contactedByPhone),
    email: Boolean(outreach.email?.contacted || row.contactedByEmail),
    phoneAt: outreach.phone?.at || '',
    emailAt: outreach.email?.at || '',
  };
}

function validationOutreachLabel(row = {}) {
  const state = validationOutreach(row);
  if (state.phone && state.email) return 'Contacted';
  if (state.phone) return 'Called';
  if (state.email) return 'Emailed';
  return 'Not contacted';
}

function outreachToggleLabel(channel, active, at = '') {
  if (channel === 'phone') return active ? `Called${at ? ` ${at}` : ''}` : 'Not logged';
  return active ? `Email sent${at ? ` ${at}` : ''}` : 'Not logged';
}

function outreachIcon(channel) {
  if (channel === 'phone') {
    return `<svg class="outreach-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.5 4.5A3 3 0 0 1 4.5 1.5h1.37c.86 0 1.61.58 1.82 1.41l.72 2.88a3 3 0 0 1-.8 2.82l-.74.74a14.25 14.25 0 0 0 7.78 7.78l.74-.74a3 3 0 0 1 2.82-.8l2.88.72a1.88 1.88 0 0 1 1.41 1.82v1.37a3 3 0 0 1-3 3h-1.13C9.05 22.5 1.5 14.95 1.5 5.63V4.5Z"/></svg>`;
  }
  return `<svg class="outreach-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.93 5.5a3 3 0 0 1-3.14 0L1.5 8.67Z"/><path fill="currentColor" d="M22.5 6.91V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.16l9.71 5.98a1.5 1.5 0 0 0 1.58 0l9.71-5.98Z"/></svg>`;
}

function productIcon(kind) {
  const paths = {
    target: '<circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="2"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>',
    phone: '<path d="M6.6 3.8 9 3.2l1.7 4.2-1.5 1.1c.9 2 2.4 3.5 4.3 4.3l1.1-1.5 4.2 1.7-.6 2.4c-.2.9-1 1.6-2 1.6C10 17 7 14 7 8c0-1 .7-1.8 1.6-2.2Z"></path>',
    source: '<path d="M5 5h14M5 12h14M5 19h14"></path><path d="M7 3v4M17 10v4M11 17v4"></path>',
    close: '<path d="M7 4h7l3 3v13H7z"></path><path d="M14 4v4h4M9 13h6M9 17h4"></path>',
    arrow: '<path d="M5 12h13"></path><path d="m14 7 5 5-5 5"></path>',
  };
  return `<svg class="product-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[kind] || paths.arrow}</svg>`;
}

function actionIcon(kind) {
  if (kind === 'copy') {
    return `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8.25 3A3.25 3.25 0 0 1 11.5-.25h6A3.25 3.25 0 0 1 20.75 3v9A3.25 3.25 0 0 1 17.5 15.25h-6A3.25 3.25 0 0 1 8.25 12V3Zm3.25-.75a.75.75 0 0 0-.75.75v9c0 .41.34.75.75.75h6c.41 0 .75-.34.75-.75V3a.75.75 0 0 0-.75-.75h-6Z" transform="translate(0 1)"/><path fill="currentColor" d="M3.25 8A3.25 3.25 0 0 1 6.5 4.75h.75v2.5H6.5a.75.75 0 0 0-.75.75v9c0 .41.34.75.75.75h6c.41 0 .75-.34.75-.75v-.75h2.5V17A3.25 3.25 0 0 1 12.5 20.25h-6A3.25 3.25 0 0 1 3.25 17V8Z" transform="translate(0 1)"/></svg>`;
  }
  if (kind === 'website') {
    return `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm6.93 8.5h-3.06a15.1 15.1 0 0 0-1.18-5.04 7.28 7.28 0 0 1 4.24 5.04Zm-6.93-6c.52.74 1.16 2.55 1.37 6h-2.74c.21-3.45.85-5.26 1.37-6Zm-2.69.96a15.1 15.1 0 0 0-1.18 5.04H5.07a7.28 7.28 0 0 1 4.24-5.04Zm-4.24 7.54h3.06c.16 2.12.58 3.84 1.18 5.04a7.28 7.28 0 0 1-4.24-5.04Zm6.93 6c-.52-.74-1.16-2.55-1.37-6h2.74c-.21 3.45-.85 5.26-1.37 6Zm2.69-.96c.6-1.2 1.02-2.92 1.18-5.04h3.06a7.28 7.28 0 0 1-4.24 5.04Z"/></svg>`;
  }
  return outreachIcon(kind);
}

function scoreBreakdownText(row = {}) {
  return asArray(row.validation?.breakdown)
    .map(item => `${item.label}: ${item.value >= 0 ? '+' : ''}${item.value} - ${item.detail}`)
    .join('\n');
}

function scoreBreakdownRows(row = {}) {
  return asArray(row.validation?.breakdown)
    .map(item => `<div><span>${h(item.label)}</span><b>${item.value >= 0 ? '+' : ''}${h(item.value)}</b><em>${h(item.detail)}</em></div>`)
    .join('');
}


const BUYBOX_UNLOCK_FIELDS = [
  { key: 'geography', label: 'Geography', selector: '.validation-geography', question: 'Which submarkets are you actively buying in?' },
  { key: 'lotSize', label: 'Lot size', selector: '.validation-lot', question: 'What lot-size band is worth reviewing?' },
  { key: 'maxPrice', label: 'Max price', selector: '.validation-price', question: 'What is your maximum acquisition price before feasibility?' },
  { key: 'closeSpeed', label: 'Close speed', selector: '.validation-speed', question: 'How quickly can you close, and how many lots per month can you absorb?' },
  { key: 'packageRecipient', label: 'Recipient', selector: '.validation-recipient', question: 'Who should receive parcel packages and at what direct email?' },
  { key: 'dealKillers', label: 'Deal killers', selector: '.validation-killers', question: 'What kills a parcel immediately: slope, flood, wetlands, frontage, utilities, title?' },
];

function buyBoxFieldValue(buyBox = {}, key = '') {
  const value = buyBox?.[key];
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return value ?? '';
}

function isBuyBoxFieldComplete(buyBox = {}, key = '') {
  const value = buyBoxFieldValue(buyBox, key);
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return String(value || '').trim().length > 0;
}

function buyBoxCompletion(row = {}) {
  const buyBox = row.buyBox || {};
  const fields = BUYBOX_UNLOCK_FIELDS.map(field => ({ ...field, complete: isBuyBoxFieldComplete(buyBox, field.key) }));
  const complete = fields.filter(field => field.complete).length;
  const missing = fields.filter(field => !field.complete);
  return { fields, complete, total: fields.length, percent: fields.length ? Math.round((complete / fields.length) * 100) : 0, missing, next: missing[0] || fields[0] };
}

function renderBuyBoxCompletion(row = {}) {
  const state = buyBoxCompletion(row);
  const chips = state.fields.map(field => `<span class="completion-chip ${field.complete ? 'done' : 'missing'}"><span aria-hidden="true">${field.complete ? '✓' : '○'}</span>${h(field.label)}</span>`).join('');
  return `<section class="buybox-completion" aria-label="Buy box completion">
    <div class="completion-head"><span>Buy box completion</span><strong>${h(state.complete)}/${h(state.total)}</strong></div>
    <div class="completion-rail" aria-hidden="true"><span style="width:${h(state.percent)}%"></span></div>
    <div class="completion-chips">${chips}</div>
  </section>`;
}

function fieldStateClass(row = {}, key = '') {
  return isBuyBoxFieldComplete(row.buyBox || {}, key) ? 'is-complete' : 'is-required';
}

function fieldLabel(label, row = {}, key = '') {
  const complete = isBuyBoxFieldComplete(row.buyBox || {}, key);
  return `<span class="field-label-text"><span>${h(label)}</span><em aria-hidden="true">${complete ? '✓' : 'required'}</em></span>`;
}

function renderAskNext(row = {}) {
  const state = buyBoxCompletion(row);
  const next = state.next || BUYBOX_UNLOCK_FIELDS[0];
  return `<aside class="ask-next-card" aria-label="Next buy-box question">
    <span>Ask this next</span>
    <strong>${h(next.question)}</strong>
    <small>${state.complete}/${state.total} captured · seller search unlocks when the buying rules are specific enough to protect outreach.</small>
  </aside>`;
}

function renderEvidenceStack(row = {}) {
  const permits = asArray(row.permitEvidence || row.recentPermits).slice(0, 3);
  const proofRows = permits.map((permit, index) => `<li>
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(permit.permitNumber || 'permit')}</b><small>${h(permit.address || permit.siteAddress || 'address pending')} · ${h(permit.issuedAt || permit.issueDate || 'date pending')} · ${formatMoney(permit.permitValue || permit.valuation || 0)}</small></div>
    ${permitVerificationLink(permit)}
  </li>`).join('');
  return `<section class="evidence-stack" aria-label="Top permit evidence">
    <div class="evidence-stack-head"><span>Top permit evidence</span><b>${h(permits.length || row.recentBuilds || 0)} proofs</b></div>
    <ul>${proofRows || '<li><div><b>No permit proof rows loaded.</b><small>Open the source drawer for public evidence context.</small></div></li>'}</ul>
  </section>`;
}

function renderSelectedBuilderDock(row = {}) {
  if (!row.builderId) return '';
  const completion = buyBoxCompletion(row);
  return `<button type="button" class="selected-builder-dock" data-scroll-selected-builder aria-label="View selected builder ${h(row.name || '')}">
    <span><small>Selected</small><strong>${h(row.name || 'Builder')}</strong></span>
    <em>${h(completion.complete)}/${h(completion.total)} buy box</em>
  </button>`;
}

function mergeBuyerValidationPatch(builderId, patch = {}) {
  const sourceRow = findLoadedBuilderRow(builderId);
  const existing = asArray(workspace.buyerValidations).find(item => item.builderId === builderId) || {};
  return {
    ...existing,
    builderId,
    name: sourceRow.name || existing.name || '',
    phone: sourceRow.phone || existing.phone || '',
    email: sourceRow.email || existing.email || '',
    callable: sourceRow.callable ?? existing.callable ?? false,
    route: sourceRow.route || existing.route || 'buyerValidation',
    recentBuilds: sourceRow.recentBuilds || existing.recentBuilds || 0,
    callStatus: existing.callStatus || sourceRow.callStatus || 'not_called',
    lastContacted: existing.lastContacted || sourceRow.lastContacted || '',
    callbackDate: existing.callbackDate || sourceRow.callbackDate || '',
    callNotes: existing.callNotes || sourceRow.callNotes || '',
    buyBox: { ...(sourceRow.buyBox || {}), ...(existing.buyBox || {}) },
    outreach: { ...(sourceRow.outreach || {}), ...(existing.outreach || {}) },
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

function upsertBuyerValidation(row) {
  workspace = { ...workspace, buyerValidations: [...asArray(workspace.buyerValidations).filter(item => item.builderId !== row.builderId), row] };
}

function renderBuyerValidationCommandCenter(activeState = { stateCode: 'TN', label: 'Tennessee', isLive: true, markets: [], stateMeta: {} }, rows = [], summary = {}) {
  if (!rows.length) {
    const portals = asArray(activeState.stateMeta?.portals).slice(0, 3).map(portal => `<li><b>${h(portal.market)}</b><span>${h(portal.system)} · ${h(portal.jurisdiction)}</span></li>`).join('');
    return `<section id="buyer-validation-command" class="validation-command builder-empty-command" aria-label="Builder queue empty for ${h(activeState.label)}">
      <div class="builder-empty-state">
        <span class="eyebrow">${h(activeState.label)} builder queue</span>
        <h3>No permit-active builders loaded yet.</h3>
        <p>This state lane stays intentionally blank until public permit activity is collected, companies are deduped, and public business contact provenance is verified.</p>
        <div class="empty-state-actions">
          <a href="#market-state-${h(activeState.stateCode.toLowerCase())}">Open ${h(activeState.stateCode)} pipeline</a>
          <span>${h(asArray(activeState.stateMeta?.pipeline).length)} source steps ready</span>
        </div>
        <ul class="empty-source-list">${portals || '<li><b>Portal list pending</b><span>Add direct county/city sources before loading builders.</span></li>'}</ul>
      </div>
    </section>`;
  }
  const center = buildBuyerValidationCommandCenter(rows, workspace.buyerValidations || []);
  const selected = center.items.find(item => item.builderId === selectedValidationBuilderId) || center.next || center.items[0] || {};
  selectedValidationBuilderId = selected.builderId || selectedValidationBuilderId;
  const completion = buyBoxCompletion(selected);
  const missingList = completion.missing.map(field => `<li><span aria-hidden="true">○</span>${h(field.label)}</li>`).join('');
  const unlockedList = BUYBOX_UNLOCK_FIELDS.map(field => `<li><span aria-hidden="true">✓</span>${h(field.label)}</li>`).join('');
  const sellerCriteria = selected.sellerSearch?.eligible
    ? (selected.sellerSearch.criteria.map(item => `<li><span aria-hidden="true">✓</span>${h(item)}</li>`).join('') || unlockedList)
    : (missingList || '<li><span aria-hidden="true">○</span>Complete buy-box fields to unlock seller search.</li>');
  const statusOptions = BUYER_VALIDATION_STATUSES.map(status => `<option value="${h(status)}" ${selected.callStatus === status ? 'selected' : ''}>${h(callStatusLabel(status))}</option>`).join('');
  const queue = center.items.map((item) => {
    const active = item.builderId === selected.builderId;
    const itemCompletion = buyBoxCompletion(item);
    const tone = item.validation.sellerEligible ? 'good' : item.route === 'humanReview' ? 'warn' : itemCompletion.percent >= 67 ? 'warn' : 'neutral';
    const outreach = validationOutreach(item);
    const scoreTitle = scoreBreakdownText(item);
    const evidenceCount = asArray(item.permitEvidence).length;
    const proofBits = [
      item.sourceUrl ? safeLink(item.sourceUrl, 'source', 'queue-source-link') : 'source pending',
      `${h(evidenceCount || item.recentBuilds || 0)} permit proofs`,
      `${h(item.confidence || '-')} confidence`,
    ].join(' · ');
    return `<article class="validation-queue-item ${active ? 'active' : ''}" data-validation-row="${h(item.builderId)}">
      <button type="button" class="validation-row-main" data-select-validation-builder="${h(item.builderId)}" aria-label="Select ${h(item.name)}">
        <span class="queue-copy"><b>${h(item.name)}</b><small>${h(validationOutreachLabel(item))} · ${h(item.recentBuilds)} permits · ${h(itemCompletion.complete)}/${h(itemCompletion.total)} buy box</small></span>
        <span class="queue-score" title="${h(scoreTitle)}">${h(item.validation.score)}</span>
      </button>
      <div class="queue-proof-line">${proofBits}</div>
      <div class="queue-state-row" aria-label="Outreach state for ${h(item.name)}">
        <button type="button" class="contact-icon-toggle ${outreach.phone ? 'is-on' : ''}" data-toggle-validation-contact="phone" data-builder-id="${h(item.builderId)}" aria-pressed="${outreach.phone ? 'true' : 'false'}" aria-label="${outreach.phone ? 'Called' : 'Call not logged'}: ${h(item.name)}" title="${outreach.phone ? `Called ${h(outreach.phoneAt || '')}` : 'Tap to mark called'}"><span aria-hidden="true">${outreachIcon('phone')}</span></button>
        <button type="button" class="contact-icon-toggle ${outreach.email ? 'is-on' : ''}" data-toggle-validation-contact="email" data-builder-id="${h(item.builderId)}" aria-pressed="${outreach.email ? 'true' : 'false'}" aria-label="${outreach.email ? 'Email sent' : 'Message not logged'}: ${h(item.name)}" title="${outreach.email ? `Email sent ${h(outreach.emailAt || '')}` : 'Tap to mark emailed'}"><span aria-hidden="true">${outreachIcon('email')}</span></button>
        ${badge(item.validation.sellerEligible ? 'seller search unlocked' : 'needs buy box', tone)}
      </div>
    </article>`;
  }).join('');
  const contactParts = [
    selected.phone ? h(selected.phone) : '',
    selected.email ? `<a href="#" class="copy-builder-email-address" data-copy-builder-email-address="${h(selected.email)}" title="Copy ${h(selected.email)}">${h(selected.email)}</a>` : '',
  ].filter(Boolean);
  const contact = contactParts.join(' · ') || 'Public business contact unresolved';
  const selectedOutreach = validationOutreach(selected);
  const selectedScoreTitle = scoreBreakdownText(selected);
  const selectedScoreRows = scoreBreakdownRows(selected);
  const scriptQuestions = Object.values(selected.buyBoxCapture || {}).map(item => `<li>${h(item)}</li>`).join('');
  const selectedPermitProof = asArray(selected.permitEvidence || selected.recentPermits).slice(0, 3).map(permit => `<li><b>${h(permit.permitNumber || 'permit')}</b><span>${h(permit.address || permit.siteAddress || 'address pending')} · ${h(permit.issuedAt || permit.issueDate || 'date pending')} · ${formatMoney(permit.permitValue || permit.valuation || 0)}</span>${permitVerificationLink(permit)}</li>`).join('');
  const sourceProof = `<div class="validation-source-proof" aria-label="Selected builder source proof">
    <div><span>Source</span><strong>${selected.sourceUrl ? safeLink(selected.sourceUrl, selected.sourceType || 'Official source') : h(selected.sourceType || 'source pending')}</strong></div>
    <div><span>Contact status</span><strong>${h(selected.contactStatus || 'contact pending')}</strong></div>
    <div><span>Confidence</span><strong>${h(selected.confidence || '-')}</strong></div>
    <div><span>Top permit</span><strong>${h(selected.topPermit || '-')}</strong></div>
  </div>`;
  const phoneHref = selected.phone ? `tel:${h(String(selected.phone).replace(/[^0-9+]/g, ''))}` : '#';
  const marketLabel = selected.marketName || activeState.marketLabel || activeState.label || 'your market';
  const marketingEmail = generateBuilderMarketingEmailTemplate(selected);
  const validationEmail = selected.emailDraft || {};
  const fallbackEmail = generateBuilderEmail(selected);
  const validationEmailSubject = validationEmail.subject || fallbackEmail.subject;
  const validationEmailBody = fallbackEmail.body;
  const mailHref = selected.email ? `mailto:${h(selected.email)}?subject=${encodeURIComponent(validationEmailSubject)}&body=${encodeURIComponent(validationEmailBody)}` : '#';
  const nextActionCopy = selected.sellerSearch?.eligible
    ? 'Buy box captured. Find parcels matching this builder before seller outreach starts.'
    : `Call once. Capture the exact buy box. Next missing field: ${completion.next ? completion.next.label : 'buy box proof'}.`;
  return `<section id="buyer-validation-command" class="validation-command" aria-label="Buyer Validation Command Center">
    <div class="operator-flow-pulse" aria-label="Builder validation flow"><span class="done">Market</span><span class="done">Builder</span><span class="${completion.complete ? 'active' : ''}">Buy box</span><span class="${selected.sellerSearch?.eligible ? 'done' : ''}">Seller search</span><span>Offer</span></div>
    <div class="validation-grid-main">
      <aside class="validation-queue"><div class="panel-kicker"><span>Call queue <button type="button" class="info-dot" aria-label="Why this queue order?" title="Ranked by validation leverage: permit activity, callable public contact proof, buy-box completeness, decision-maker progress, outreach logged, and human-review penalties.">?</button></span><b>Proof attached</b>${activeState.summary?.entries?.[0]?.csvUrl ? `<a class="queue-csv-link" href="${h(activeState.summary.entries[0].csvUrl)}">CSV</a>` : ''}</div><div class="queue-filter-row" aria-label="Queue filters"><button type="button" disabled>Callable</button><button type="button" disabled>Needs buy box</button><button type="button" disabled>Highest permits</button></div>${queue}</aside>
      <article class="validation-focus-card" id="selected-builder-card">
        <div class="validation-focus-head">
          <div><span class="eyebrow">Selected builder</span><h3>${h(selected.name || 'Select builder')}</h3><p><b>Permit market: ${h(marketLabel)}.</b> ${h(selected.recentBuilds || 0)} verified permit signals. Contact/HQ may be regional: ${contact}</p></div>
          <details class="validation-score" title="${h(selectedScoreTitle)}">
            <summary><strong>${h(selected.validation?.score || 0)}</strong><span>validation score</span></summary>
            <div class="score-breakdown">${selectedScoreRows}</div>
          </details>
        </div>
        <div class="next-best-action"><span>Next best action</span><strong>${h(nextActionCopy)}</strong></div>
        ${sourceProof}
        ${renderEvidenceStack(selected)}
        <div class="selected-outreach-state" aria-label="Selected builder outreach state">
          <button type="button" class="contact-state-toggle ${selectedOutreach.phone ? 'is-on' : ''}" data-toggle-validation-contact="phone" data-builder-id="${h(selected.builderId || '')}" aria-pressed="${selectedOutreach.phone ? 'true' : 'false'}"><span aria-hidden="true">${outreachIcon('phone')}</span>${h(outreachToggleLabel('phone', selectedOutreach.phone, selectedOutreach.phoneAt))}</button>
          <button type="button" class="contact-state-toggle ${selectedOutreach.email ? 'is-on' : ''}" data-toggle-validation-contact="email" data-builder-id="${h(selected.builderId || '')}" aria-pressed="${selectedOutreach.email ? 'true' : 'false'}"><span aria-hidden="true">${outreachIcon('email')}</span>${h(outreachToggleLabel('email', selectedOutreach.email, selectedOutreach.emailAt))}</button>
        </div>
        <div class="validation-actions">
          <a class="validation-call-button ${selected.phone ? '' : 'disabled'}" href="${phoneHref}">${actionIcon('phone')}<span>Call</span></a>
          <a class="validation-call-button icon-only ${selected.email ? '' : 'disabled'}" href="${mailHref}" aria-label="Draft email" title="Draft email">${actionIcon('email')}</a>
          <button type="button" class="validation-call-button secondary copy-email-button" data-copy-validation-email>${actionIcon('copy')}<span>Draft</span></button>
          ${selected.sourceUrl ? `<a class="validation-call-button secondary website-link" href="${h(selected.sourceUrl)}" target="_blank" rel="noopener noreferrer">${actionIcon('website')}<span>Website</span></a>` : ''}
          <span class="validation-email-status" aria-live="polite"></span>
        </div>
        ${renderBuyBoxCompletion(selected)}
        ${renderAskNext(selected)}
        <div class="validation-form validation-buybox-grid" data-validation-form="${h(selected.builderId || '')}">
          <label class="form-field field-status">Call status <select class="validation-status">${statusOptions}</select></label>
          <label class="form-field field-last">Last contacted <input type="date" class="validation-last" value="${h(selected.lastContacted || '')}" /></label>
          <label class="form-field field-callback">Callback date <input type="date" class="validation-callback" value="${h(selected.callbackDate || '')}" /></label>
          <label class="form-field field-geography ${fieldStateClass(selected, 'geography')}">${fieldLabel('Target geography', selected, 'geography')}<input class="validation-geography" value="${h(selected.buyBox?.geography || '')}" placeholder="West Knoxville, Karns, Hardin Valley..." /><small class="field-helper">Required to unlock seller search.</small></label>
          <label class="form-field field-lot ${fieldStateClass(selected, 'lotSize')}">${fieldLabel('Lot-size band', selected, 'lotSize')}<input class="validation-lot" value="${h(selected.buyBox?.lotSize || '')}" placeholder="0.25-1.0 ac, infill/subdivision lots" /></label>
          <label class="form-field field-price ${fieldStateClass(selected, 'maxPrice')}">${fieldLabel('Max acquisition price', selected, 'maxPrice')}<input class="validation-price" inputmode="numeric" value="${h(selected.buyBox?.maxPrice || '')}" placeholder="65000" /></label>
          <label class="form-field field-speed ${fieldStateClass(selected, 'closeSpeed')}">${fieldLabel('Close speed / monthly appetite', selected, 'closeSpeed')}<input class="validation-speed" value="${h(selected.buyBox?.closeSpeed || '')}" placeholder="14-30 days / 2 lots per month" /></label>
          <label class="form-field field-recipient ${fieldStateClass(selected, 'packageRecipient')}">${fieldLabel('Package recipient', selected, 'packageRecipient')}<input class="validation-recipient" value="${h(selected.buyBox?.packageRecipient || '')}" placeholder="Name + direct email for parcel packages" /></label>
          <label class="form-field field-utilities">Utilities / access rules <input class="validation-utilities" value="${h(selected.buyBox?.utilitiesAccess || '')}" placeholder="paved road, sewer nearby, water/electric at street" /></label>
          <label class="form-field field-product">Finished product <input class="validation-product" value="${h(selected.buyBox?.productType || '')}" placeholder="entry-level SFR, infill spec, move-up homes" /></label>
          <label class="form-field field-killers ${fieldStateClass(selected, 'dealKillers')}">${fieldLabel('Deal killers', selected, 'dealKillers')}<input class="validation-killers" value="${h(asArray(selected.buyBox?.dealKillers).join(', ') || selected.buyBox?.dealKillers || '')}" placeholder="steep slope, flood, wetlands, no frontage, title issue" /></label>
          <label class="form-field field-notes wide">Exact buyer language <textarea class="validation-notes" placeholder="Paste what they actually said. No interpretation, no fabrication.">${h(selected.callNotes || '')}</textarea></label>
          <div class="validation-save-row"><button type="button" data-save-buyer-validation>Save validation</button><span class="validation-save-status" aria-live="polite"></span></div>
        </div>
      </article>
      <aside class="seller-unlock-card ${selected.sellerSearch?.eligible ? 'unlocked' : ''}">
        <div class="panel-kicker"><span>Seller search gate</span><b>${selected.sellerSearch?.eligible ? 'unlocked' : `${completion.complete}/${completion.total}`}</b></div>
        <h4>${selected.sellerSearch?.eligible ? h(selected.sellerSearch?.headline || 'Seller search unlocked.') : 'Seller search is locked until the builder’s buying rules are specific enough to protect outreach.'}</h4>
        <ul>${sellerCriteria}</ul>
        ${selected.sellerSearch?.eligible ? `<div class="unlock-price"><span>Suggested seller offer ceiling</span><strong>${formatMoney(selected.sellerSearch.offerCeiling)}</strong></div><p>${h(selected.sellerSearch.sellerAngle)}</p><a class="seller-unlock-cta" href="#top-calls">Find seller parcels</a>` : '<p>Permit volume is only a demand signal. Capture the buy box first; then seller calls can match real demand instead of guessing.</p>'}
      </aside>
    </div>
    ${renderSelectedBuilderDock(selected)}
    <details class="validation-script-drawer">
      <summary>Open exact buy-box questions + call script</summary>
      <div class="script-grid"><div><h5>Public proof</h5><p>${h(selected.sourceEvidence || '')}</p><p>${h(selected.demandSignal || '')}</p><ul class="selected-permit-proof">${selectedPermitProof || '<li><span>No permit proof rows loaded.</span></li>'}</ul></div><div><h5>Buy-box questions</h5><ul>${scriptQuestions}</ul></div></div>
      <pre>${h(selected.callScript || '')}</pre>
    </details>
    <details class="validation-script-drawer marketing-drawer">
      <summary>Optional marketing intro email template</summary>
      <div class="email-subject"><span>Subject</span><strong>${h(marketingEmail.subject)}</strong></div>
      <pre>${h(marketingEmail.body)}</pre>
      <div class="button-row"><button type="button" class="secondary" data-copy-builder-marketing-email>Copy marketing template</button><span class="builder-marketing-email-status"></span></div>
    </details>
  </section>`;
}

function renderBuilderListEnginePanel(options = {}) {
  const target = document.querySelector('#builder-list-panel');
  if (!target) return;
  const preservedViewport = options.preserveViewport ? captureBuilderInteractionViewport() : null;
  const fallbackTnBuilders = getPermitBuilders();
  const callSheetRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const callSheetSummary = knoxvilleBuyerCallSheet?.summary || {};
  const permitLandscape = getPermitPortalLandscape();
  const publicSkipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const stateOrder = ['TN', 'FL', 'AZ', 'NC', 'TX'];
  const stateLabels = { TN: 'Tennessee', TX: 'Texas', NC: 'North Carolina', FL: 'Florida', AZ: 'Arizona' };
  const stateSummaries = stateOrder.map((stateCode) => {
    const marketSummary = getStateBuilderSummary(stateCode);
    const fallbackRows = stateCode === 'TN' && !marketSummary.rows.length ? fallbackTnBuilders : [];
    const rows = marketSummary.rows.length ? marketSummary.rows : fallbackRows;
    const markets = asArray(permitLandscape.leadingMarkets).filter(item => item.state === stateCode);
    const stateMeta = asArray(permitLandscape.states).find(item => item.id === stateCode.toLowerCase()) || {};
    const sequence = stateMeta.sequence || {};
    const isLive = rows.length > 0;
    const isActive = stateCode === selectedBuilderMarketState;
    const builderCount = rows.length;
    const status = isLive ? `${builderCount} live builders` : (sequence.label || 'resource well');
    const marketLabel = marketSummary.entries.map(item => item.marketName).join(' · ') || markets.map(item => item.market).join(' · ') || stateMeta.state || stateLabels[stateCode];
    return { stateCode, label: stateLabels[stateCode], markets, stateMeta, sequence, isLive, isActive, builderCount, status, marketLabel, rows, summary: marketSummary };
  });
  const stateSwitcher = stateSummaries.map((state) => `<button type="button" class="market-toggle ${state.isActive ? 'active' : ''}" data-builder-market-state="${h(state.stateCode)}" aria-pressed="${state.isActive ? 'true' : 'false'}">
    <span>${h(state.stateCode)}</span>
    <strong>${h(state.label)}</strong>
    <em>${h(state.isLive ? `${state.builderCount} live` : 'Ready')}</em>
  </button>`).join('');
  const activeState = stateSummaries.find(state => state.isActive) || stateSummaries[0];
  const activeBuilders = asArray(activeState.rows);
  const activeSummary = activeState.summary || getStateBuilderSummary(activeState.stateCode);
  const selected = getSelectedBuilder(activeBuilders) || {};
  const buyerPool = buyerPoolForState(activeState.stateCode);
  const sellerPool = sellerPoolForState(activeState.stateCode);
  const titlePool = titleCompanyCandidateMarkets();
  const sellerControl = buildSellerSearchControlLayer({
    buyers: buyerPool,
    sellerCandidates: sellerPool,
    titleCandidates: titlePool,
    state: activeState.stateCode,
    limit: 6,
  });
  const executionConveyor = buildExecutionConveyor({
    buyers: buyerPool,
    sellerCandidates: sellerPool,
    titleCandidates: titlePool,
    limit: 8,
  });
  const marketSummary = `<div class="active-market-summary">
    <span>${activeState.isLive ? 'Live permit-backed market' : 'Selected resource well'}</span>
    <strong>${h(activeState.isLive ? (activeState.marketLabel || activeState.label) : `${activeState.label} resource well`)}</strong>
    <p>${h(activeState.isLive ? `${activeBuilders.length} permit-backed builders. Capture buy box before seller work.` : `${activeState.marketLabel || activeState.label}. Source lane ready; builder queue waits for permit-active companies.`)}</p>
    <ul>
      ${activeState.isLive ? `<li>${h(activeBuilders.length)} builders</li>
      <li>${h(activeSummary.minimumUniqueBuilders || 20)} minimum per pull</li>
      <li>${h(activeSummary.callable ?? 0)} callable now</li>
      <li>${h(activeSummary.totalRecentBuildSignals ?? 0)} permit signals</li>` : `<li>${h(activeState.markets.length)} priority markets</li>
      <li>${h(asArray(activeState.stateMeta.portals).length)} portal targets</li>
      <li>${h(asArray(activeState.stateMeta.pipeline).length)} pipeline steps</li>
      <li>buyer-first gate</li>`}
    </ul>
  </div>`;
  const adapterRows = getSourceAdapterChecklist().map(adapter => `<article class="adapter-card">
    <span>${h(adapter.name)}</span>
    <p>${h(adapter.use)}</p>
    <small>${adapter.fields.map(field => h(field)).join(' · ')}</small>
  </article>`).join('');
  const statePortalRows = [activeState].map(state => {
    const stateMeta = state.stateMeta || {};
    const markets = asArray(state.markets).map(item => `<li><b>#${h(item.rank)} · ${h(item.market)}</b><span>${h(item.reason)}</span>${item.zillowUrl ? `<a class="zillow-market-link" href="${h(item.zillowUrl)}" target="_blank" rel="noopener noreferrer">Zillow market view</a>` : ''}</li>`).join('');
    const portals = asArray(stateMeta.portals).map(portal => `<a href="${h(portal.url)}" target="_blank" rel="noopener noreferrer">
        <b>${h(portal.market)}</b>
        <span>${h(portal.jurisdiction)}</span>
        <small>${h(portal.system)}</small>
      </a>`).join('');
    const pipeline = asArray(stateMeta.pipeline).map(step => `<li>
      <span>${h(step.step)}</span>
      <div>
        <b>${h(step.title)}</b>
        <small>${h(step.source)}</small>
        <p>${h(step.action)}</p>
        <em>${h(step.output)}</em>
      </div>
    </li>`).join('');
    return `<article id="market-state-${h(state.stateCode.toLowerCase())}" class="permit-state-card target-market-lane ${state.isActive ? 'active' : ''} ${h(state.sequence.status || 'staged')}">
      <div class="permit-state-head">
        <div><span>${h(state.label)}</span><p>${h(stateMeta.reality || 'Source lane pending.')}</p></div>
        <strong>${state.isLive ? `${h(state.builderCount)} builders` : h(state.status)}</strong>
      </div>
      <div class="pipeline-unlock"><b>${h(state.sequence.label || 'Pipeline')}</b><span>${h(state.sequence.unlock || 'Collect permit-source priority before pulling builders.')}</span></div>
      <ul class="state-market-list">${markets || '<li><b>Market list pending</b><span>Collect permit-source priority before pulling builders.</span></li>'}</ul>
      <div class="permit-platform-tags">${asArray(stateMeta.platforms).map(platform => `<em>${h(platform)}</em>`).join('')}</div>
      <h5>Permit-builder pipeline</h5>
      <ol class="state-pipeline-list">${pipeline}</ol>
      <div class="portal-link-list">${portals}</div>
      <p class="permit-strategy">${h(stateMeta.strategy || '')}</p>
    </article>`;
  }).join('');
  const tierRows = permitLandscape.tiers.map(tier => `<article class="normalization-tier">
    <h4>${h(tier.name)}</h4>
    ${tier.items.map(item => `<p>${safeLink(item.url, item.label)} <span>${h(item.note)}</span></p>`).join('')}
  </article>`).join('');
  target.innerHTML = `<div class="builder-engine-shell">
    <section class="builder-ops-header" aria-label="Builder operations summary">
      <div class="builder-ops-title">
        <span class="eyebrow">Builders · market workbench</span>
        <h3>Choose market. Validate builder.</h3>
        <p><b>Priority is TN → inland FL → AZ → NC → TX.</b> State tabs swap the queue, validation form, source map, and permit proof.</p>
        <div class="primary-action-strip builders-primary-action"><span>${productIcon('target')} Primary action</span><b>Call the top permit-active builder and capture the missing buy-box fields.</b><a href="#buyer-validation-command">Open queue ${productIcon('arrow')}</a></div>
      </div>
      <div class="builder-market-workbench" aria-label="Prioritized target markets">
        <div class="market-toggle-grid">${stateSwitcher}</div>
        ${marketSummary}
      </div>
      <nav class="builder-ops-jump" aria-label="Builder page sections">
        <a href="#buyer-validation-command">Builder queue</a>
        <a href="#permit-landscape">Permit sources</a>
      </nav>
    </section>

    ${renderBuyerValidationCommandCenter(activeState, activeBuilders, activeSummary)}
    ${renderSellerSearchControlLayer(sellerControl)}
    ${renderExecutionConveyor(executionConveyor)}

    <section class="builder-two-col">
      <article id="permit-landscape" class="builder-adapter-panel wide-permit-panel">
        <div class="panel-kicker"><span>Permit portal landscape</span><b>five-state normalization map</b></div>
        <p class="permit-landscape-summary">${h(permitLandscape.summary)}</p>
        <h4>Target-state lanes</h4>
        <div class="permit-state-grid market-lane-grid">${statePortalRows}</div>
        <h4>Source adapter checklist</h4>
        <div class="adapter-grid">${adapterRows}</div>
        <h4>Normalization playbook</h4>
        <div class="normalization-grid">${tierRows}</div>
      </article>
    </section>
  </div>`;
  if (preservedViewport) restoreBuilderInteractionViewport(preservedViewport);
}

function renderSellerSearchControlLayer(control = {}) {
  const stageRows = asArray(control.stageRows).map(stage => `<article class="seller-control-stage ${h(stage.status)}"><span>${h(stage.label)}</span><b>${h(stage.status)}</b><p>${h(stage.detail)}</p></article>`).join('');
  const buyerRows = asArray(control.buyerRows).map((buyer, index) => `<div class="seller-control-row buyer-gate-row">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(buyer.name)}</b><small>${h(buyer.market || 'market pending')} · ${h(buyer.recentBuilds)} permit signals · ${h(buyer.contact || 'contact to find')}</small></div>
    <em>${buyer.gate?.unlocked ? 'unlocked' : `missing ${h(asArray(buyer.gate?.missing).slice(0, 2).join(' + ') || 'buy-box field')}`}</em>
  </div>`).join('');
  const sellerRows = asArray(control.sellerRows).map((seller, index) => `<div class="seller-control-row seller-gate-row ${seller.locked ? 'locked' : 'ready'}">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(seller.address)}</b><small>${h(seller.ownerName)} · ${h(seller.market || control.state)} · ${h(seller.motivation?.temperature || 'Watch')} seller motivation</small></div>
    <em>${h(seller.nextAction)}</em>
  </div>`).join('');
  return `<section id="seller-search-control" class="seller-control-panel" aria-label="Buyer-first seller search control layer">
    <div class="seller-control-hero">
      <span class="eyebrow">Seller search control layer · ${h(control.state || 'TN')}</span>
      <h3>Six buyer gates before seller work.</h3>
      <p>${h(control.nextAction || 'Validate buyer demand first, then unlock skip trace, seller calls, contract/title, buyer memo and feedback loop in order.')}</p>
      <div class="seller-control-metrics">
        <div><b>${h(control.stats?.buyers || 0)}</b><span>buyer candidates</span></div>
        <div><b>${h(control.stats?.unlockedBuyers || 0)}</b><span>buy boxes unlocked</span></div>
        <div><b>${h(control.stats?.sellerCandidates || 0)}</b><span>public seller records</span></div>
        <div><b>${h(control.stats?.callReady || 0)}</b><span>seller-call ready</span></div>
      </div>
    </div>
    <div class="seller-control-stages">${stageRows}</div>
    <div class="seller-control-grid">
      <article><div class="panel-kicker"><span>Buyer gates</span><b>capture before seller search</b></div>${buyerRows || '<p>No buyer candidates for this state yet. Pull permit-active builders first.</p>'}</article>
      <article><div class="panel-kicker"><span>Seller gates</span><b>public records stay held back until enriched</b></div>${sellerRows || '<p>No seller candidates for this state yet. Pull owner parcels only after buyer proof.</p>'}</article>
    </div>
  </section>`;
}

function renderExecutionConveyor(conveyor = {}) {
  const stages = asArray(conveyor.stageRows).map(stage => `<article class="execution-stage ${h(stage.status)}"><span>${h(stage.label)}</span><b>${h(stage.status)}</b><p>${h(stage.detail)}</p></article>`).join('');
  const batchRows = asArray(conveyor.matchedSellerBatch).slice(0, 5).map((row, index) => `<div class="execution-row">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(row.address || row.parcelId)}</b><small>${h(row.buyerName)} · ${h(row.ownerName || 'public owner')} · ${h(row.lotSize || 'lot size pending')}</small></div>
    <em>${h(row.nextAction || 'skip trace')}</em>
  </div>`).join('');
  const callRows = asArray(conveyor.callReadySellers).slice(0, 4).map((row, index) => {
    const parcelKey = h(row.id || row.parcelId || '');
    const outcomeOptions = [
      ['seller_interested', 'Interested'], ['seller_maybe', 'Maybe'], ['seller_rejected', 'No'], ['bad_number', 'Bad number'],
      ['wrong_owner', 'Wrong owner'], ['price_too_high', 'Price too high'], ['title_issue', 'Title issue'], ['needs_callback', 'Needs callback'],
    ];
    const outcomeButtons = outcomeOptions.map(([key, label]) => `<button type="button" class="execution-outcome ${row.callOutcome === key ? 'active' : ''}" data-execution-call-outcome="${key}" data-parcel-id="${parcelKey}">${label}</button>`).join('');
    return `<article class="execution-call-card ${row.readyForSellerCall ? 'ready' : 'blocked'}" data-phase7-seller-card="${parcelKey}">
      <div class="execution-card-top"><span>${String(index + 1).padStart(2, '0')} seller cockpit</span><b>${h(row.ownerName || 'owner')} · ${h(row.address || row.parcelId)}</b><p>${h(row.nextAction)}</p></div>
      <div class="execution-outcomes" aria-label="Seller call outcomes">${outcomeButtons}</div>
      <div class="phase7-capture-grid" data-execution-capture="${parcelKey}">
        <label>Seller ask<input class="phase7-ask" value="${h(row.sellerAskingPrice || row.askingPrice || '')}" placeholder="$42,000 or counter"></label>
        <label>Timeline<input class="phase7-timeline" value="${h(row.sellerTimeline || '')}" placeholder="now / 30 days / after probate"></label>
        <label>Callback date<input class="phase7-callback" type="date" value="${h(row.nextFollowUp || '')}"></label>
        <label>Motivation<textarea class="phase7-motivation" rows="2" placeholder="tax fatigue, unused lot, inherited, moving...">${h(row.sellerMotivation || row.sellerCallCapture?.motivation || '')}</textarea></label>
        <label>Access + buildability<textarea class="phase7-access" rows="2" placeholder="road, utilities, slope, wetland language from seller">${h(row.accessBuildabilityNotes || row.sellerCallCapture?.accessBuildability || '')}</textarea></label>
        <label>Exact seller language<textarea class="phase7-language" rows="2" placeholder="quote the owner; do not invent">${h(row.exactSellerLanguage || row.sellerCallCapture?.exactLanguage || '')}</textarea></label>
      </div>
      <div class="phase7-gate-rail">
        <div><span>Contract/title gate</span><b>${h(row.contract?.label || 'not ready')}</b><small>${h(row.contract?.blockers?.join(' · ') || 'owner/contact/source/buyer fit/title path clear enough to prepare packet')}</small></div>
        <div><span>Buyer memo</span><b>${h(row.memo?.subject || 'memo waits')}</b><small>${h(row.memo?.ask || 'Capture seller outcome and price before sending buyer packet.')}</small></div>
        <div><span>Close probability</span><b>${h(row.checklist?.probability || 0)}%</b><small>${h(row.checklist?.next?.label || 'clear next gate')}</small></div>
      </div>
      <div class="phase7-actions"><button type="button" class="secondary compact-action" data-download-execution-memo="${parcelKey}">Download buyer memo</button><span class="phase7-save-status">${h(row.callOutcome ? `Saved: ${row.sellerCallOutcome || row.callOutcome}` : 'Outcome not captured yet')}</span></div>
      <ul>
        <li><b>Opener</b><span>${h(row.ownerCallScript?.opener || row.ownerCallScript?.summary || 'Confirm interest and seller timeline.')}</span></li>
        <li><b>Net offer</b><span>${h(row.sellerNetOfferScript?.headline || row.sellerNetOfferScript?.summary || 'Calculate seller net before promise.')}</span></li>
        <li><b>Title</b><span>${h(row.contract?.label || 'contract/title gate pending')}</span></li>
      </ul>
    </article>`;
  }).join('');
  const feedbackRows = asArray(conveyor.feedbackRecommendations).slice(0, 3).map(row => `<div class="execution-row quiet">
    <span>↻</span><div><b>${h(row.address || row.parcelId)}</b><small>${h(row.nextCallReason || 'No feedback penalty yet.')}</small></div><em>${h(row.adjustedScore || row.score || 0)}/100</em>
  </div>`).join('');
  const firstSkipTraceRow = asArray(conveyor.matchedSellerBatch)[0] || asArray(conveyor.board?.sellerMatches).find(row => !(row.ownerPhone || row.ownerEmail || row.realContact)) || {};
  const enrichedCount = asArray(conveyor.callReadySellers).length;
  const skipTraceGateCopy = enrichedCount
    ? `${enrichedCount} imported owner contacts are now flowing into seller cockpit review. Keep title/contract gates honest before promising terms.`
    : 'Paste the provider return here after exporting the matched seller CSV. Phone/email promotes the row; missing contact stays in needs-skip-trace.';
  const importStatus = lastBuilderSkipTraceImportStatus || (firstSkipTraceRow.parcelId ? 'Waiting for skip-trace return CSV from the matched seller batch.' : 'No matched seller rows available to enrich yet.');
  return `<section id="execution-conveyor" class="execution-conveyor-panel" aria-label="Buyer to seller execution conveyor">
    <div class="execution-conveyor-head">
      <span class="eyebrow">Phase 7 · call-to-close control loop</span>
      <h3>Turn imported seller contact into outcome, title gate, buyer memo, and feedback in one luminous cockpit.</h3>
      <p>${h(conveyor.nextAction || 'Capture a complete buyer call before creating seller motion.')} The chain is now one surface: saved builder buy box → matched seller CSV → inline skip-trace return → seller-call outcome → contract/title gate → buyer-send memo → buyer feedback rewrite.</p>
      <div class="execution-metrics">
        <div><b>${h(conveyor.stats?.validatedBuyers || 0)}</b><span>validated buyers</span></div>
        <div><b>${h(conveyor.stats?.matchedSellerBatch || 0)}</b><span>matched seller export</span></div>
        <div><b>${h(conveyor.stats?.promotedSellerCalls || 0)}</b><span>seller call cockpit</span></div>
        <div><b>${h(conveyor.stats?.memoReady || 0)}</b><span>memo/title ready</span></div>
      </div>
    </div>
    <div class="execution-stages">${stages}</div>
    <div class="execution-grid">
      <article><div class="panel-kicker"><span>Matched seller batch</span><b>export before skip trace</b></div>${batchRows || '<p>No buyer-box-matched seller batch yet. Buyer proof still leads.</p>'}<button id="export-matched-seller-batch" class="secondary compact-action" type="button">Download matched seller CSV</button><span id="matched-seller-export-status"></span></article>
      <article class="skiptrace-return-card"><div class="panel-kicker"><span>Skip-trace return gate</span><b>phone/email promotes, never fabricates</b></div><p>${h(skipTraceGateCopy)}</p><pre class="skiptrace-format">parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n${h(firstSkipTraceRow.parcelId || 'parcel-id')},${h(firstSkipTraceRow.ownerName || 'Public Owner')},865-555-0198,owner@example.com,91</pre><textarea id="builder-skip-trace-csv" rows="5" placeholder="parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence"></textarea><div class="skiptrace-actions"><button id="builder-load-skiptrace-template" class="secondary compact-action" type="button">Use first matched row</button><button id="builder-import-skiptrace" class="compact-action" type="button">Import return + recompute cockpit</button></div><span id="builder-skiptrace-status">${h(importStatus)}</span></article>
    </div>
    <div class="execution-call-grid">${callRows || '<article class="execution-call-card blocked"><b>No seller call cockpit is armed.</b><p>Public records stay held for skip trace until real phone/email and title/contract readiness exist.</p></article>'}</div>
    <article class="execution-feedback-card"><div class="panel-kicker"><span>Feedback rewrite</span><b>${h(conveyor.feedbackLoop?.totalFeedback || 0)} buyer answers captured</b></div><p>${h(conveyor.feedbackLoop?.tightening || 'Buyer yes/no/maybe will rewrite tomorrow’s seller-call order.')}</p>${feedbackRows}</article>
  </section>`;
}

function renderClosingDeskPanel() {
  const target = document.querySelector('#title-closing-panel');
  if (!target) return;
  const visible = getVisibleParcels();
  const selected = getSelectedParcel(visible);
  if (!selected) {
    target.innerHTML = `<div class="closing-page-stack"><div class="primary-action-strip closing-primary-action"><span>${productIcon('close')} Primary action</span><b>Select one buyer-backed deal before opening escrow or title work.</b><a href="#deals" data-view="deals">Open deal queue ${productIcon('arrow')}</a></div>${renderContractComposer()}${renderClosingDeskResearchDeck()}<article class="card empty-state"><h3>No deal selected.</h3><p>Add a buyer-backed seller record before opening title. The closing desk stays ready with templates, title-company candidates, and verification rules.</p></article></div>`;
    return;
  }
  const buyer = getBuyer(selected);
  const alternatives = scoredParcels().slice(0, 5).map((parcel, index) => {
    const desk = buildTitleCompanyClosingDesk(parcel, getBuyer(parcel));
    return `<button type="button" class="queue-item ${parcel.id === selected.id ? 'active' : ''}" data-select-parcel="${h(parcel.id)}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(parcel.address || parcel.parcelId || 'Untitled parcel')}</b>
      <small>${h(desk.titleCompany.name || 'title company missing')} · ${h(desk.status)}</small>
      <em>${formatMoney(desk.math.assignmentFee)} assignment fee · ${desk.readiness}% ready</em>
      ${badge(desk.label, statusTone(desk.status))}
    </button>`;
  }).join('');
  target.innerHTML = `<div class="closing-page-stack">
    <div class="primary-action-strip closing-primary-action"><span>${productIcon('close')} Primary action</span><b>Clear the title packet for ${h(selected.address || selected.parcelId || 'the selected deal')}.</b><a href="#contract-document-live">Review packet ${productIcon('arrow')}</a></div>
    ${renderContractComposer(selected)}
    ${renderClosingDeskResearchDeck()}
    <div class="closing-layout">
      <aside class="deal-queue title-queue" aria-label="Closing file queue">
        <div class="queue-header"><span class="eyebrow">Closing files</span><strong>${h(scoredParcels().length)} deals</strong></div>
        <div class="queue-list">${alternatives}</div>
      </aside>
      <div>${renderTitleClosingDesk(selected, buyer)}</div>
    </div>
  </div>`;
}

function renderParcels() {
  const visible = getVisibleParcels();
  const selected = getSelectedParcel(visible);
  const target = document.querySelector('#parcels');
  if (!target) return;

  if (!selected) {
    target.innerHTML = `<article class="card empty-state"><h3>No parcels match this filter.</h3><p>Import records or change the filter.</p></article>`;
    return;
  }

  const buyer = getBuyer(selected);
  const buyBox = calculateBuyBoxCompleteness(buyer);
  const motivation = calculateSellerMotivation(selected);
  const contractGate = calculateContractReadiness(selected, buyer);
  const sellerNet = generateSellerNetOfferScript(selected, buyer);
  const neighborPrompt = generateNeighborPrompt(selected);
  const operatorChecklist = buildOperatorChecklist(selected, buyer);
  const buyerMemo = generateBuyerSendMemo(selected, buyer, generateOfferPacket(selected, buyer));
  const riskTone = selected.risk.status === 'Pass' ? 'good' : selected.risk.status === 'Review' ? 'warn' : 'bad';
  const actionTone = selected.action === 'Call now' ? 'good' : selected.action === 'Mail first' ? 'warn' : selected.action === 'Kill' ? 'bad' : 'neutral';
  const fitRows = [
    ['Buyer fit', buyer.name || 'No matched buyer', `${buyer.score || 0}/100 · ${buyer.buyBox || 'buy box missing'}`],
    ['Seller contact', selected.ownerName || selected.owner || 'Owner unknown', selected.ownerPhone || selected.ownerEmail || 'Needs skip trace'],
    ['Buildability', selected.risk.status, selected.flags.length ? selected.flags.join(', ') : 'clean first pass'],
    ['Next action', selected.action, getNextAction(selected)],
  ];

  target.innerHTML = `<div class="deal-workbench">
    <div class="primary-action-strip deals-primary-action"><span>${productIcon('phone')} Primary action</span><b>${h(getNextAction(selected))}</b><a href="${selected.ownerPhone ? `tel:${h(selected.ownerPhone)}` : '#'}">Call owner ${productIcon('arrow')}</a></div>
    <aside class="deal-queue" aria-label="Seller call queue">
      <div class="queue-header"><span class="eyebrow">Seller queue</span><strong>${visible.length} records</strong></div>
      <div class="queue-list">${visible.map((parcel, index) => {
        const isActive = parcel.id === selected.id;
        const tone = parcel.action === 'Call now' ? 'good' : parcel.action === 'Kill' ? 'bad' : parcel.risk.status === 'Review' ? 'warn' : 'neutral';
        return `<button type="button" class="queue-item ${isActive ? 'active' : ''}" data-select-parcel="${h(parcel.id)}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <b>${h(parcel.address || parcel.parcelId || 'Untitled parcel')}</b>
          <small>${h(parcel.ownerName || parcel.owner || 'owner unknown')} · ${h(parcel.ownerPhone || parcel.ownerEmail || 'contact missing')}</small>
          <em>${h(parcel.score)} score · ${formatMoney(parcel.metrics.spread)} spread · ${h(parcel.action)}</em>
          ${badge(parcel.risk.status, tone)}
        </button>`;
      }).join('')}</div>
    </aside>

    <article class="deal-detail" aria-label="Selected parcel detail">
      <div class="detail-hero">
        <span class="eyebrow">Selected parcel</span>
        <h2>${h(selected.address || selected.parcelId || 'Untitled parcel')}</h2>
        <p>${h(selected.lotSize || 'lot size unknown')} · held ${h(selected.heldYears || 0)} yrs · paid ${formatMoney(Number(selected.paid || 0))}</p>
        <div class="badge-stack">${badge(`${selected.score} deal score`, actionTone)}${badge(selected.action, actionTone)}${badge(selected.risk.status, riskTone)}</div>
      </div>
      <div class="deal-strip five">
        <div><span>Buyer price</span><b>${formatMoney(selected.offer.buyerPrice)}</b></div>
        <div><span>Seller ask</span><b>${formatMoney(selected.metrics.askingPrice)}</b></div>
        <div><span>Initial offer</span><b>${formatMoney(selected.offer.initialSellerOffer)}</b></div>
        <div><span>Max offer</span><b>${formatMoney(selected.offer.maxSellerOffer)}</b></div>
        <div><span>Spread</span><b>${formatMoney(selected.metrics.spread)}</b></div>
      </div>
      <div class="phase-one-detail-grid">
        <article class="phase-detail-card"><span>Buy box completeness</span><b>${h(buyBox.percent)}%</b><p>${h(buyBox.missing.slice(0, 2).join(' · ') || 'Buyer criteria complete enough for seller matching.')}</p></article>
        <article class="phase-detail-card"><span>Seller motivation</span><b>${h(motivation.score)} · ${h(motivation.temperature)}</b><p>${h(motivation.signals.slice(0, 3).join(' · ') || 'No strong motivation signal yet.')}</p></article>
        <article class="phase-detail-card"><span>Contract gate</span><b>${h(contractGate.score)}%</b><p>${h(contractGate.blockers.slice(0, 2).join(' · ') || contractGate.label)}</p></article>
      </div>
      <div class="seller-net-script-card">
        <span class="eyebrow">Seller net offer script</span>
        <h3>${h(sellerNet.headline)}</h3>
        <p>${h(sellerNet.netLine)}</p>
        <p><strong>Ask:</strong> ${h(sellerNet.ask)}</p>
        <p><strong>Neighbor alpha:</strong> ${h(neighborPrompt)}</p>
      </div>
      ${renderOperatorChecklist(operatorChecklist)}
      ${renderBuyerSendMemoCard(buyerMemo)}
      ${renderBuyerFeedbackCapture(selected, buyer)}
      <div class="detail-grid">
        <div><span>Owner</span><b>${h(selected.ownerName || selected.owner || 'unknown')}</b><p>${h(selected.ownerPhone || selected.ownerEmail || 'contact missing')}</p></div>
        <div><span>Buyer</span><b>${h(selected.buyerContactName || buyer.contactName || buyer.name || 'missing')}</b><p>${h(selected.buyerPhone || buyer.phone || '')} ${h(selected.buyerEmail || buyer.email || '')}</p></div>
        <div><span>Risk notes</span><b>${h(selected.risk.status)}</b><p>${h(selected.flags.join(', ') || 'No first-pass risk flags.')}</p></div>
        <div><span>Source notes</span><b>${h(selected.parcelId || selected.id)}</b><p>${h(selected.acquisitionNotes || selected.notes || 'No notes yet.')}</p></div>
      </div>
      <details class="detail-disclosure"><summary>Show CRM fields</summary>${crmControls(selected)}</details>
    </article>

    <aside class="deal-action" aria-label="Buyer fit and next action">
      <div class="next-action-card">
        <span class="eyebrow">Next best action</span>
        <h3>${h(getNextAction(selected))}</h3>
        <div class="button-row"><a class="button-link" href="${selected.ownerPhone ? `tel:${h(selected.ownerPhone)}` : '#'}">Call owner</a><button type="button" class="secondary" data-view="machine">Open offer packet</button></div>
      </div>
      <div class="fit-stack">${fitRows.map(([label, title, detail]) => `<div class="fit-card"><span>${h(label)}</span><b>${h(title)}</b><p>${h(detail)}</p></div>`).join('')}</div>
      <div class="tags">${selected.reasons.map(r => badge(r, 'good')).join('')}${selected.flags.length ? selected.flags.map(f => badge(f, riskTone)).join('') : badge('clean first pass', 'good')}</div>
    </aside>
  </div>`;
}

function renderSourcePriorityBoard() {
  const target = document.querySelector('#source-priority-board');
  if (!target) return;
  const landscape = getPermitPortalLandscape();
  const leading = asArray(landscape.leadingMarkets).slice(0, 8);
  const tnMarkets = leading.filter(item => item.state === 'TN');
  const nextMarkets = leading.filter(item => item.state !== 'TN');
  const tierRows = asArray(landscape.tiers).slice(0, 2).map(tier => `<article><span>${h(tier.name.replace(/^Tier \d+ - /, ''))}</span>${asArray(tier.items).slice(0, 3).map(item => safeLink(item.url, item.label, 'priority-source-link')).join('')}</article>`).join('');
  const stackOrder = [
    { code: 'TN', label: 'Tennessee', stance: 'live first', platform: 'Buildchek + direct portals' },
    { code: 'FL', label: 'Inland Florida', stance: 'first resource well', platform: 'Accela / EnerGov / Civic Access' },
    { code: 'AZ', label: 'Arizona', stance: 'velocity well', platform: 'Maricopa weekly + Accela cities' },
    { code: 'NC', label: 'North Carolina', stance: 'Piedmont well', platform: 'Buildchek + Mecklenburg/Wake direct data' },
    { code: 'TX', label: 'Texas', stance: 'fragmented high-volume well', platform: 'PermitVector + Austin/San Antonio open data' },
  ];
  const stackRows = stackOrder.map((item, index) => `<article class="priority-stack-step ${index === 0 ? 'active' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><b>${h(item.code)} · ${h(item.label)}</b><small>${h(item.stance)} · ${h(item.platform)}</small></article>`).join('');
  const marketCard = item => `<article class="priority-market ${item.state === 'TN' ? 'is-primary' : ''}">
    <span>${String(item.rank).padStart(2, '0')} · ${h(item.state)}</span>
    <b>${h(item.market)}</b>
    <p>${h(item.reason)}</p>
  </article>`;
  target.innerHTML = `<section class="source-market-priority" aria-label="Priority permit portal markets">
    <div class="source-priority-head">
      <span class="eyebrow">Permit-source priority</span>
      <h3>TN first. Then inland FL, AZ, NC, TX.</h3>
      <p>Priority order stays simple: Tennessee now; inland Florida, Arizona, North Carolina, and Texas as independent wells.</p>
      <div class="primary-action-strip sources-primary-action"><span>${productIcon('source')} Primary action</span><b>Verify the Tennessee source lane before promoting any seller lead.</b><a href="#permit-landscape" data-view="builders">Open source lane ${productIcon('arrow')}</a></div>
    </div>
    <div class="source-stack-rail" aria-label="Target-state priority order">${stackRows}</div>
    <div class="source-guardrail"><b>Kentucky guardrail</b><span>If Kentucky records appear, treat them as target-state/HQ leakage unless they carry verified Tennessee permit evidence.</span></div>
    <div class="source-priority-grid">
      <div class="priority-lane primary"><span>Now</span>${tnMarkets.map(marketCard).join('')}</div>
      <div class="priority-lane"><span>Resource wells</span>${nextMarkets.map(marketCard).join('')}</div>
      <div class="priority-stack"><span>Normalize with</span>${tierRows}</div>
    </div>
  </section>`;
}

function renderPipeline() {
  const target = document.querySelector('#pipeline');
  if (!target) return;
  target.innerHTML = stages.map((stage, i) => `<article class="stage">
    <span>${String(i + 1).padStart(2, '0')}</span>
    <strong>${h(stage.name)}</strong>
    <p>${h(stage.desc)}</p>
    ${sourceDisclosure(stage.sourceType)}
  </article>`).join('');
}


function renderOperatorVisionHero({ leadBuyer, boxMeter, moneyQueue, publicSkipTrace, buyerContactQueue, heroMotivation, netScript }) {
  const permitLandscape = getPermitPortalLandscape();
  const leading = asArray(permitLandscape.leadingMarkets).slice(0, 5);
  const builderRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const totalBuilderSignals = knoxvilleBuyerCallSheet?.summary?.totalRecentBuildSignals || builderRows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0);
  const callableBuilders = knoxvilleBuyerCallSheet?.summary?.callablePublicBusinessContacts || builderRows.filter(row => row.phone || row.email).length;
  const missionRows = leading.map((market, index) => `<button type="button" class="mission-market ${index === 0 ? 'active' : ''}" data-view="builders">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(market.market)}</b>
      <small>${h(market.state)} · ${h(market.reason)}</small>
    </button>`).join('');
  const nextActions = [
    { label: 'Call buyer', value: leadBuyer?.name || 'Select permit-active builder', detail: leadBuyer?.phone || leadBuyer?.email || 'Capture max price, geography, close speed, deal killers.' },
    { label: 'Protect seller queue', value: `${publicSkipTrace.length} skip-trace records`, detail: 'Public records stay out of call-ready until a real phone/email is enriched.' },
    { label: 'Open title gate', value: netScript?.headline || 'Contract/title after buyer proof', detail: 'Seller call → net range → title packet → buyer-send memo.' },
  ].map(item => `<article><span>${h(item.label)}</span><b>${h(item.value)}</b><p>${h(item.detail)}</p></article>`).join('');

  return `<section class="vision-hero" aria-label="Land Dealflow operating vision">
    <div class="vision-copy">
      <span class="eyebrow">Land Dealflow OS · clear path to more deals</span>
      <h1>Turn land deals into a simple daily flow.</h1>
      <p>A light operating system for an old industry: permit evidence finds active builders, builder buy boxes focus the seller search, and every screen points to the next deal-making action.</p>
      <div class="vision-actions">
        <a class="button-link" href="#builders" data-view="builders">Find active buyers</a>
        <a class="button-link secondary" href="#daily-calls">See today’s money flow</a>
      </div>
      <div class="vision-proof-strip">
        <div><span>Permit market</span><strong>Knoxville, TN</strong><em>HQ/contact may be regional</em></div>
        <div><span>Builder signals</span><strong>${h(totalBuilderSignals)}</strong><em>${h(callableBuilders)} callable contacts</em></div>
        <div><span>Buy box</span><strong>${h(boxMeter.percent)}%</strong><em>${h(boxMeter.grade)} confidence</em></div>
        <div><span>Call-ready</span><strong>${h(moneyQueue.stats.callReady)}</strong><em>${h(buyerContactQueue.length)} buyer contacts</em></div>
      </div>
    </div>
    <aside class="mission-console" aria-label="Market mission console">
      <div class="mission-topbar"><span></span><span></span><span></span><b>DEAL FLOW</b></div>
      <div class="mission-map">
        <div class="map-glow"></div>
        <div class="map-route r1"></div><div class="map-route r2"></div><div class="map-route r3"></div>
        <button class="map-pin hot" data-view="builders" style="--x:63%;--y:37%"><b>TN</b><em>Knoxville</em></button>
        <button class="map-pin" data-view="builders" style="--x:52%;--y:51%"><b>TN</b><em>Rutherford</em></button>
        <button class="map-pin" data-view="builders" style="--x:45%;--y:30%"><b>NC</b><em>Piedmont</em></button>
        <button class="map-pin" data-view="builders" style="--x:25%;--y:66%"><b>TX</b><em>Open data</em></button>
      </div>
      <div class="mission-grid">
        <div class="mission-column"><span class="eyebrow">Priority markets</span>${missionRows}</div>
        <div class="mission-next"><span class="eyebrow">Next money actions</span>${nextActions}</div>
      </div>
    </aside>
  </section>`;
}

function renderOperatorSessionMode(session = {}) {
  const metricRows = [
    ['Validated buyers', session.metrics?.buyers || 0, 'demand proof'],
    ['Matched sellers', session.metrics?.sellers || 0, 'buyer-box export'],
    ['Enriched contacts', session.metrics?.contacts || 0, 'call unlocked'],
    ['Packet ready', session.metrics?.packetReady || 0, 'sendable now'],
  ].map(([label, value, detail]) => `<article class="os8-metric"><span>${h(label)}</span><b>${h(value)}</b><em>${h(detail)}</em></article>`).join('');
  const stepRows = asArray(session.sprintSteps).map((step) => `<a class="os8-step ${h(step.status)}" href="${h(step.href || '#builders')}" data-view="builders">
    <span>${h(step.label)}</span>
    <div><b>${h(step.title)}</b><strong>${h(step.action)}</strong><p>${h(step.detail)}</p></div>
    <em>${h(step.status)}</em>
  </a>`).join('');
  const gateRows = asArray(session.packetGate).map(gate => `<div class="os8-gate ${h(gate.status)}"><span></span><div><b>${h(gate.label)}</b><p>${h(gate.detail)}</p></div><em>${h(gate.status)}</em></div>`).join('');
  return `<section id="operator-session-mode" class="os8-session wk-reveal" aria-label="Phase 8 operator session mode">
    <div class="os8-ambient" aria-hidden="true"></div>
    <div class="os8-hero">
      <span class="wk-kicker">Phase 8 · real operator session mode</span>
      <h2>${h(session.title || 'Today’s Call Sprint')}</h2>
      <p>${h(session.subtitle || 'One complete operator session from buyer proof to feedback rewrite.')}</p>
      <div class="os8-next-card">
        <small>Next defensible action</small>
        <b>${h(session.activeStep?.action || 'Open the builder queue')}</b>
        <span>${h(session.activeStep?.detail || 'Do not advance sellers until the next gate is true.')}</span>
      </div>
    </div>
    <div class="os8-metrics">${metricRows}</div>
    <div class="os8-flow">
      <article class="os8-sprint-card"><div class="os8-card-head"><span>Guided sprint</span><b>not browsing, executing</b></div>${stepRows}</article>
      <article class="os8-packet-card"><div class="os8-card-head"><span>Deal packet assembly gate</span><b>${session.dealPacketReady ? 'sendable' : 'guarded'}</b></div>${gateRows}<div class="os8-packet-note"><b>Packet promise</b><p>Every buyer-send package must carry parcel facts, buyer fit, seller range, assignment math, risk notes, title gate, deadline, and exact language. No missing context, no fabricated certainty.</p></div></article>
    </div>
  </section>`;
}

function renderCommandCenter() {
  const bestMarket = (workspace.markets || []).map(m => ({ ...m, score: scoreMarket(m) })).sort((a, b) => b.score.total - a.score.total)[0] || { name: 'Knoxville, TN', score: { total: 0 } };
  const topBuyer = rankBuyers(workspace.buyers || [])[0] || { name: 'Permit-active builder', score: 0 };
  const publicSkipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const buyerContactQueue = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()]);
  const buyerFirst = buildBuyerFirstBoard({ buyers: [...generatedCandidateBuyers(), ...enrichedBuilderContacts(), ...(workspace.buyers || [])], sellerCandidates: [...publicSkipTrace, ...(workspace.parcels || [])], limit: 25 });
  const leadBuyer = buyerFirst.validatedBuyers[0] || buyerContactQueue[0] || topBuyer;
  const moneyQueue = buildDailyMoneyQueue({ parcels: workspace.parcels || [], buyers: workspace.buyers || [], limit: 5, requireRealContact: true });
  const operatorExecutionConveyor = buildExecutionConveyor({ buyers: buyerPoolForState('TN'), sellerCandidates: sellerPoolForState('TN'), limit: 8 });
  const operatorSession = buildOperatorSessionMode({ buyerContactQueue, executionConveyor: operatorExecutionConveyor, moneyQueue });
  const moneyCalls = [...moneyQueue.followUps, ...moneyQueue.today];
  const heroCall = moneyCalls.find(call => call.id === selectedMoneyCallId) || moneyCalls[0] || {};
  selectedMoneyCallId = heroCall.id || '';
  const boxMeter = calculateBuyBoxCompleteness(leadBuyer || {});
  const heroMotivation = heroCall.id ? calculateSellerMotivation(heroCall) : { score: 0, temperature: 'Cold', signals: [] };
  const netScript = heroCall.id ? generateSellerNetOfferScript(heroCall, getBuyer(heroCall)) : null;
  const permitLandscape = getPermitPortalLandscape();
  const leadingMarkets = asArray(permitLandscape.leadingMarkets).slice(0, 5);
  const tnMarket = leadingMarkets.find(market => market.state === 'TN') || leadingMarkets[0] || { market: 'Knoxville / Knox County', state: 'TN', reason: 'Live-first permit source.' };
  const builderRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const totalBuilderSignals = knoxvilleBuyerCallSheet?.summary?.totalRecentBuildSignals || builderRows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0) || 0;
  const callableBuilders = knoxvilleBuyerCallSheet?.summary?.callablePublicBusinessContacts || builderRows.filter(row => row.phone || row.email).length || buyerContactQueue.length || 'pending';
  const callRows = moneyCalls.length ? moneyCalls.map((call, index) => `<button type="button" class="wk-call-row ${call.id === selectedMoneyCallId ? 'active' : ''}" data-select-money-call="${h(call.id)}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(call.ownerName || call.owner || 'owner unknown')}</b>
      <small>${h(call.address || 'No address')} · ${h(call.moneyStage)} · ${formatMoney(call.projectedSpread)} spread</small>
    </button>`).join('') : '<article class="wk-empty"><b>No seller call earns the room yet.</b><span>Buyer proof comes first. Public owner records stay in skip-trace until real phone/email enrichment.</span></article>';
  const marketRows = leadingMarkets.map((market, index) => `<a class="wk-market-node ${market.state === 'TN' ? 'hot' : ''}" href="#builders" data-view="builders" style="--i:${index}">
      <span>${String(index + 1).padStart(2, '0')} / ${h(market.state)}</span>
      <b>${h(market.market)}</b>
      <em>${h(market.reason)}</em>
    </a>`).join('');
  const proofRows = [
    ['Permit market', tnMarket.market, 'Where the build evidence lives - not where HQ is registered.'],
    ['Builder signals', `${totalBuilderSignals}`, `${callableBuilders} callable public business contacts.`],
    ['Buy-box certainty', `${boxMeter.percent}%`, `${boxMeter.grade} confidence until acquisition criteria are captured.`],
    ['Call-ready sellers', `${moneyQueue.stats.callReady}`, `${publicSkipTrace.length} public records held back for enrichment.`],
  ].map(([label, value, detail]) => `<article class="wk-proof-card"><span>${h(label)}</span><strong>${h(value)}</strong><p>${h(detail)}</p></article>`).join('');
  const protocolRows = [
    ['01', 'Prove demand', 'Find permit-active builders, then ask price, geography, close speed and kill criteria.'],
    ['02', 'Constrain the land', 'Only seller parcels matching verified buy boxes enter the money queue.'],
    ['03', 'Protect the close', 'Contract/title gates surface before the buyer-send memo, not after optimism.'],
  ].map(([num, title, detail]) => `<article class="wk-protocol-card"><span>${h(num)}</span><h3>${h(title)}</h3><p>${h(detail)}</p></article>`).join('');
  const operatingRows = [
    ['Buyer proof', 'Permit-backed builder demand', 'Start with builders already pulling permits in the target market.'],
    ['Geography gate', 'Permit market beats HQ location', 'Tennessee evidence stays Tennessee even when a regional office sits elsewhere.'],
    ['Truth gate', 'No fabricated money rows', 'Public owner records remain skip-trace until phone or email is actually enriched.'],
    ['Action gate', 'One defensible next move', 'Every path resolves to builder validation, seller call, source proof, or closing control.'],
  ].map(([verb, title, detail]) => `<li><span>${h(verb)}</span><b>${h(title)}</b><em>${h(detail)}</em></li>`).join('');

  document.querySelector('#command').innerHTML = `
    <div class="wk-progress" aria-hidden="true"><span></span></div>
    <nav class="wk-rail" aria-label="Today page map">
      <a href="#wk-brief">Brief</a><a href="#wk-map">Markets</a><a href="#wk-work">Work</a><a href="#wk-gates">Gates</a>
    </nav>
    <section id="wk-brief" class="wk-hero wk-reveal" aria-label="Land Dealflow OS terrain intelligence command">
      <div class="wk-hero-copy">
        <span class="wk-kicker">Terrain intelligence / Tennessee live-first</span>
        <h1>Call the buyer. Then move the deal.</h1>
        <p>Today has one job: prove demand, protect the seller queue, and advance the next defensible action.</p>
        <div class="wk-actions">
          <a class="primary-command" href="#builders" data-view="builders">${productIcon('phone')} Call builder queue</a>
          <a href="#wk-work">Trace signal path</a>
        </div>
      </div>
      <aside class="wk-artifact" aria-label="Permit and landscape intelligence model">
        <div class="wk-scanline" aria-hidden="true"></div>
        <div class="wk-horizon" aria-hidden="true"></div>
        <div class="wk-core-sample"><span>TN terrain</span><b>${h(totalBuilderSignals)}</b><em>permit signals</em></div>
        <div class="wk-contour c1"></div><div class="wk-contour c2"></div><div class="wk-contour c3"></div>
        <p>Permit velocity, builder demand, parcel constraint, next action.</p>
      </aside>
    </section>
    ${renderOperatorSessionMode(operatorSession)}
    <section class="wk-audit wk-reveal" aria-label="Operating principles">
      <div><span class="wk-kicker">Signal system</span><h2>Demand, seller fit, and risk collapse into one map.</h2></div>
      <ul>${operatingRows}</ul>
    </section>
    <section id="wk-map" class="wk-market-map wk-reveal" aria-label="Priority permit market map">
      <div class="wk-section-head"><span class="wk-kicker">Market terrain</span><h2>TN is live. FL, AZ, NC and TX wait as wells.</h2><p>Show where evidence lives, which portal matters, and what unlocks buyer validation.</p></div>
      <div class="wk-node-grid">${marketRows}</div>
    </section>
    <section id="wk-work" class="wk-workbench wk-reveal" aria-label="Daily money workbench">
      <div class="wk-section-head"><span class="wk-kicker">One page / one job</span><h2>Choose the next defensible action.</h2><div class="primary-action-strip today-primary-action"><span>${productIcon('target')} Primary action</span><b>Validate the current buyer before touching a seller record.</b><a href="#builders" data-view="builders">Validate buyer ${productIcon('arrow')}</a></div></div>
      <div class="wk-proof-grid">${proofRows}</div>
      <div class="wk-work-grid">
        <article class="wk-focus-card"><span class="wk-kicker">Current buyer target</span><h3>${h(leadBuyer?.name || 'Permit-active builder')}</h3><p>${h(leadBuyer?.buyBox || leadBuyer?.acquisitionNotes || leadBuyer?.task || 'Capture price, area, lot size, utilities, roads, wetlands/flood kills and close speed.')}</p><a href="#builders" data-view="builders">Validate buy box</a></article>
        <div class="wk-call-stack"><span class="wk-kicker">Seller queue</span>${callRows}</div>
        <article class="wk-script-card"><span class="wk-kicker">If a seller earns the call</span><h3>${h(netScript?.opening || 'Lead with net cash, not a pitch.')}</h3><p>${h(netScript?.netLine || heroMotivation.signals.slice(0, 2).join(' · ') || 'No seller call is promoted until buyer proof and reachable contact data exist.')}</p></article>
      </div>
    </section>
    <section id="wk-gates" class="wk-protocol wk-reveal" aria-label="Conversion protocol">
      <div class="wk-section-head"><span class="wk-kicker">Conversion architecture</span><h2>Gate the deal. Do not decorate the dashboard.</h2></div>
      <div class="wk-protocol-grid">${protocolRows}</div>
    </section>`;
  initializeEditorialMotion();
}

function initializeEditorialMotion() {
  const root = document.querySelector('#command');
  if (!root) return;
  const progress = root.querySelector('.wk-progress span');
  const revealables = [...root.querySelectorAll('.wk-reveal')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.18 });
    revealables.forEach(node => observer.observe(node));
  } else {
    revealables.forEach(node => node.classList.add('is-visible'));
  }
  const update = () => {
    if (!progress) return;
    const rect = root.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight);
    const amount = Math.min(1, Math.max(0, -rect.top / distance));
    progress.style.transform = `scaleX(${amount})`;
  };
  window.removeEventListener('scroll', window.__landDealflowProgress || (() => {}));
  window.__landDealflowProgress = update;
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function renderWorkspaceTools() {
  const existing = document.querySelector('#workspace');
  if (!existing) return;
  existing.innerHTML = `<div class="section-heading compact-heading">
      <span class="eyebrow">Machine room</span>
      <h2>Controls stay tucked away until needed.</h2>
      <p>Imports, exports, quality gates, validation, outreach scripts, and offer packets are now progressive panels instead of one long wall.</p>
    </div>
    <div class="machine-stack">
      <details class="machine-panel">
        <summary><span>01</span><strong>Generated lead output</strong><em>Review conveyor belt health</em></summary>
        <div id="lead-engine-panel"></div>
      </details>
      <details class="machine-panel" open>
        <summary><span>02</span><strong>Buyer-first buy box validation</strong><em>Call buyers before sellers</em></summary>
        <div id="buyer-contact-intake-panel"></div>
      </details>
      <details class="machine-panel" open>
        <summary><span>03</span><strong>Skip trace intake</strong><em>Only after buyer fit</em></summary>
        <div id="skip-trace-intake-panel"></div>
      </details>
      <details class="machine-panel">
        <summary><span>04</span><strong>Import parcel data</strong><em>CSV, county exports, PropStream, LandGlide</em></summary>
        <p class="helper-copy">Paste only when you need to refresh the local workspace. The app normalizes source-specific headers into one parcel model.</p>
        <details class="mini-disclosure"><summary>Supported CSV fields</summary><p>address, market, buyerId, parcelId, lotSize, ownerName, ownerPhone, ownerEmail, ownerMailingAddress, skipTraceConfidence, buyerContactName, buyerPhone, buyerEmail, buyerWebsite, acquisitionNotes, buyerMaxPrice, lowestActiveListing, askingPrice, heldYears, paid, wetlands, floodZone, roadAccess, utilities, slope, wildlifeFlag, crmStatus, nextFollowUp, notes.</p></details>
        <textarea id="csv-input" rows="7" placeholder="address,market,buyerMaxPrice,roadAccess\n123 Grant Blvd,lehigh,42000,true"></textarea>
        <label class="preset-row">Source preset<select id="source-preset"><option value="land-dealflow">Land Dealflow template</option><option value="lee-county">Lee County property export</option><option value="propstream">PropStream export</option><option value="landglide">LandGlide export</option></select></label>
        <div class="button-row"><button id="load-lehigh-template" class="secondary" type="button">Use sample Lehigh CSV</button><button id="import-csv" type="button">Import parcel rows</button><span id="import-status"></span></div>
      </details>
      <details class="machine-panel">
        <summary><span>05</span><strong>Workspace backup</strong><em>Move or restore local state</em></summary>
        <textarea id="json-input" rows="7" placeholder="Paste exported workspace JSON here"></textarea>
        <div class="button-row"><button id="import-json" type="button">Restore JSON backup</button><button id="export-json" class="secondary" type="button">Download JSON backup</button><button id="reset-workspace" class="danger" type="button">Reset to seed data</button></div>
      </details>
      <details class="machine-panel">
        <summary><span>06</span><strong>Exports for action</strong><em>Call list, filtered CSV, mail merge</em></summary>
        <p class="helper-copy">Exports respect the active deal filter. Use the call-list export when you are ready to execute.</p>
        <div class="button-row"><button id="export-top20-csv" type="button">Download Top 20 seller call list</button><button id="export-filtered-csv" class="secondary" type="button">Download current deal view</button><button id="export-mailmerge-csv" class="secondary" type="button">Download mail merge file</button></div>
        <div id="top-call-list" class="call-list"></div>
      </details>
      <details class="machine-panel">
        <summary><span>07</span><strong>Data quality gate</strong><em>Find blockers before calling</em></summary>
        <div id="quality-gate"></div>
      </details>
      <details class="machine-panel">
        <summary><span>08</span><strong>Buyer validation</strong><em>Buy boxes, proof, rejection lessons</em></summary>
        <div class="button-row"><button id="capture-sample-buybox" type="button">Capture sample buy box</button><button id="add-sample-buyer-note" class="secondary" type="button">Add sample buyer note</button><span id="buyer-validation-status"></span></div>
        <div id="buyer-validation-panel"></div>
      </details>
      <details class="machine-panel">
        <summary><span>09</span><strong>Outreach execution</strong><em>Follow-ups and seller script</em></summary>
        <div class="button-row"><button id="bulk-contact-callnow" type="button">Mark all “Call now” as contacted</button><span id="outreach-status"></span></div>
        <div id="outreach-panel"></div>
      </details>
      <details class="machine-panel">
        <summary><span>10</span><strong>Offer packet + buyer memo</strong><em>Seller letter, assignment packet, builder-facing send memo</em></summary>
        <div class="button-row"><button id="export-deal-memo" type="button">Download current deal memo</button><button id="download-buyer-send-memo" class="secondary" type="button">Download buyer send memo</button><button id="copy-buyer-send-memo" class="secondary" type="button">Copy buyer memo</button><span id="deal-memo-status"></span><span id="buyer-send-memo-status"></span></div>
        <div id="offer-packet-panel"></div>
      </details>
    </div>`;
}

function renderTopCallList() {
  const target = document.querySelector('#top-call-list');
  if (!target) return;
  const calls = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 20 });
  target.innerHTML = calls.length ? calls.slice(0, 5).map(call => `<div class="call-row">
    <b>#${call.callPriority} · ${h(call.address)}</b>
    <span>${h(call.ownerName || call.owner || 'Owner unknown')} · ${h(call.ownerPhone || call.ownerEmail)} · score ${call.score}</span>
    <em>Buyer: ${h(call.buyerContactName || 'contact missing')} ${h(call.buyerPhone || call.buyerEmail || '')}</em>
  </div>`).join('') : '<p>No callable parcels yet. Import contacts or improve scoring.</p>';
}

function renderSkipTraceIntakePanel() {
  const target = document.querySelector('#skip-trace-intake-panel');
  if (!target) return;
  const skipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const sample = skipTrace[0];
  const matchedCount = asArray(workspace.parcels).filter(parcel => parcel.skipTraceImportedAt || parcel.realContact).length;
  target.innerHTML = `<div class="intake-grid">
    <section class="intake-card hero-intake"><span class="eyebrow">Seller enrichment</span><h3>Paste skip-traced phones only after buyer fit.</h3><p>Match by parcelId first, then owner name, then address. Buyer-first rule: validate demand, export a matched seller batch, then enrich owner contact.</p><details class="provider-tip"><summary>Where to get skip-traced phone numbers</summary><p>Use CSV-in / CSV-out providers: BatchSkipTracing, PropStream, REISkip, Launch Control skip trace, DealMachine skip trace, Skip Genie, DataZapp, or IDI / TLO / Accurint-style providers if you have compliant access.</p></details><div class="deal-strip three"><div><span>Public leads waiting</span><strong>${h(skipTrace.length)}</strong></div><div><span>Matched in workspace</span><strong>${h(matchedCount)}</strong></div><div><span>Example lead</span><strong>${h(sample ? 'ready' : 'none')}</strong></div></div></section>
    <section class="intake-card"><h4>CSV format</h4><pre>parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n${h(sample?.parcelId || '274527L4110560090')},${h(sample?.ownerName || 'MONTEAN PETER & WENDY')},239-555-7722,owner@example.com,91</pre><textarea id="skip-trace-csv" rows="7" placeholder="parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence"></textarea><div class="button-row"><button id="load-skiptrace-template" class="secondary" type="button">Use first real lead</button><button id="import-skiptrace" type="button">Import skip trace</button><span id="skiptrace-status"></span></div></section>
    <section class="intake-card queue-card"><h4>Next owners to enrich</h4>${skipTrace.slice(0, 6).map((item, index) => `<div class="engine-row"><b>${index + 1}. ${h(item.ownerName)}</b><span>${h(item.address)} · ${h(item.ownerMailingAddress)} · confidence ${h(item.confidence)}</span></div>`).join('') || '<p>No generated skip-trace queue found yet.</p>'}</section>
  </div>`;
}

function renderBuyerContactIntakePanel() {
  const target = document.querySelector('#buyer-contact-intake-panel');
  if (!target) return;
  const buyerQueue = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()]);
  const sample = buyerQueue[0];
  const marketLabel = sample?.market ? sample.market.split('-').map(part => part.length === 2 ? part.toUpperCase() : `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ') : 'Lehigh';
  target.innerHTML = `<div class="intake-grid">
    <section class="intake-card hero-intake"><span class="eyebrow">Buyer-first validation</span><h3>Call builders. Capture the buy box. Then touch sellers.</h3><p>Find a real acquisition contact, ask max price and kill criteria, and only send parcels that match confirmed demand.</p><div class="deal-strip three"><div><span>Buyer contacts needed</span><strong>${h(buyerQueue.length)}</strong></div><div><span>Top signal</span><strong>${h(sample?.recentBuilds || 0)}</strong></div><div><span>Market</span><strong>${h(marketLabel)}</strong></div></div></section>
    <section class="intake-card"><h4>CSV format</h4><pre>buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice\n${h(sample?.buyerId || 'lehigh-builder-career-financial-corp')},${h(sample?.name || 'CAREER FINANCIAL CORP')},Acquisitions,239-555-8822,deals@example.com,https://example.com,"Lehigh quarter-acre lots under $42k",42000</pre><textarea id="buyer-contact-csv" rows="7" placeholder="buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice"></textarea><div class="button-row"><button id="load-buyer-contact-template" class="secondary" type="button">Use top builder signal</button><button id="import-buyer-contact" type="button">Import buyer contact</button><span id="buyer-contact-status"></span></div></section>
    <section class="intake-card queue-card"><h4>Top builder signals</h4>${buyerQueue.slice(0, 8).map((item, index) => `<div class="engine-row"><b>${index + 1}. ${h(item.name)}</b><span>${h(item.task)} · ${h(item.recentBuilds)} builds/signals · ${h(item.phone || item.website || 'find contact')}</span></div>`).join('') || '<p>All buyer contacts enriched.</p>'}</section>
  </div>`;
}

function skipTraceTemplateRow() {
  const item = asArray(generatedLeads?.queues?.skipTrace)[0] || {};
  return `parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n${item.parcelId || '274527L4110560090'},${item.ownerName || 'MONTEAN PETER & WENDY'},239-555-7722,owner@example.com,91`;
}

function builderSkipTraceTemplateRow(stateCode = selectedBuilderMarketState) {
  const conveyor = buildExecutionConveyor({ buyers: buyerPoolForState(stateCode || 'TN'), sellerCandidates: sellerPoolForState(stateCode || 'TN'), limit: 50 });
  const item = asArray(conveyor.matchedSellerBatch)[0] || asArray(conveyor.board?.sellerMatches).find(row => !(row.ownerPhone || row.ownerEmail || row.realContact)) || {};
  return `parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n${item.parcelId || item.id || 'parcel-id'},${item.ownerName || item.owner || 'Public Owner'},865-555-0198,owner@example.com,91`;
}

function buyerContactTemplateRow() {
  const item = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()])[0] || {};
  return `buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice\n${item.buyerId || 'lehigh-builder-career-financial-corp'},${item.name || 'CAREER FINANCIAL CORP'},Acquisitions,239-555-8822,deals@example.com,https://example.com,"Lehigh quarter-acre lots under $42k",42000`;
}

async function loadGeneratedLeads() {
  try {
    const response = await fetch('data/generated/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`lead engine ${response.status}`);
    generatedLeads = await response.json();
  } catch (error) {
    generatedLeads = { error: error.message };
  }
}

async function loadKnoxvilleBuyerCallSheet() {
  try {
    const response = await fetch('data/real/knoxville/buyer_call_sheet.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`knoxville call sheet ${response.status}`);
    knoxvilleBuyerCallSheet = await response.json();
  } catch (error) {
    knoxvilleBuyerCallSheet = { error: error.message, rows: [] };
  }
}

async function loadBuilderMarketData() {
  const entries = await Promise.all(builderMarketSources.map(async (source) => {
    try {
      const [signalsResponse, evidenceResponse] = await Promise.all([
        fetch(source.signalsUrl, { cache: 'no-store' }),
        fetch(source.evidenceUrl, { cache: 'no-store' }),
      ]);
      if (!signalsResponse.ok) throw new Error(`${source.key} builders ${signalsResponse.status}`);
      const rows = await signalsResponse.json();
      const evidence = evidenceResponse.ok ? await evidenceResponse.json() : { error: `${source.key} evidence ${evidenceResponse.status}` };
      return [source.key, { ...source, rows, evidence }];
    } catch (error) {
      return [source.key, { ...source, rows: [], evidence: { error: error.message }, error: error.message }];
    }
  }));
  builderMarketData = { loaded: true, error: '', markets: Object.fromEntries(entries) };
}

async function loadWeeklyMarketScout() {
  try {
    const response = await fetch('data/generated/weekly-market/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`weekly market ${response.status}`);
    weeklyMarketScout = await response.json();
  } catch (error) {
    weeklyMarketScout = { error: error.message };
  }
}

async function loadTitleCompanyResearch() {
  try {
    const [processResponse, marketsResponse] = await Promise.all([
      fetch('data/title-company/title_company_process.json', { cache: 'no-store' }),
      fetch('data/title-company/title_company_market_candidates.json', { cache: 'no-store' }),
    ]);
    if (!processResponse.ok) throw new Error(`title process ${processResponse.status}`);
    if (!marketsResponse.ok) throw new Error(`title markets ${marketsResponse.status}`);
    titleCompanyProcess = await processResponse.json();
    titleCompanyMarkets = await marketsResponse.json();
  } catch (error) {
    titleCompanyProcess = { error: error.message, closingDeskInsights: [], templates: {} };
    titleCompanyMarkets = { error: error.message, markets: [] };
  }
}

function renderWeeklyMarketScout() {
  const target = document.querySelector('#weekly-market-scout');
  if (!target) return;
  if (!weeklyMarketScout) {
    target.innerHTML = '<p>Loading weekly market scout…</p>';
    return;
  }
  if (weeklyMarketScout.error) {
    target.innerHTML = `<section class="weekly-market-card"><span class="eyebrow">Market Expansion Engine</span><h3>Weekly scout not generated yet.</h3><p>Run <code>node scripts/weekly-market-scout.mjs</code> to publish this week’s market candidate.</p></section>`;
    return;
  }
  const market = weeklyMarketScout.recommendedMarket || {};
  const criteria = asArray(market.criteria);
  const actions = asArray(market.firstActions);
  const caveats = asArray(market.caveats);
  const statusLabel = String(market.nextStatus || market.status || 'research')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  target.innerHTML = `<section class="weekly-market-card">
    <div class="weekly-market-head">
      <div><span class="eyebrow">Market Expansion Engine · week ${h(weeklyMarketScout.week || '')}</span><h3>${h(market.name || 'No market selected')}</h3><p>${h(market.thesis || 'No thesis generated yet.')}</p></div>
      <div class="market-grade"><span>Score</span><strong>${h(market.score ?? 0)}</strong><em>Grade ${h(market.grade || '-')}</em></div>
    </div>
    <div class="deal-strip four"><div><span>State</span><strong>${h(market.state || '-')}</strong></div><div><span>Status</span><strong>${h(statusLabel)}</strong></div><div><span>Mentioned as</span><strong>${h(market.mentionedAs || 'source market')}</strong></div><div><span>Generated</span><strong>${formatDateTime(weeklyMarketScout.generatedAt)}</strong></div></div>
    <div class="weekly-market-grid">
      <div><h4>Operating criteria</h4>${criteria.map(item => `<div class="criterion-row"><b>${h(item.label)}</b><span>${h(item.score)}/10 · ${h(item.points)} pts · ${h(item.threshold)}</span></div>`).join('')}</div>
      <div><h4>First execution moves</h4>${actions.map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item)}</b><span>${index === 0 ? 'recent-build visual evidence' : index === 1 ? 'source provenance ledger' : index === 2 ? 'buyer-first validation' : 'seller work waits for buyer proof'}</span></div>`).join('')}</div>
      <div><h4>Risks / caveats</h4>${caveats.map(item => badge(item, 'warn')).join('') || '<p>No caveats captured.</p>'}<p>${asArray(market.flags).length ? `Flags: ${h(market.flags.join(', '))}` : 'No hard filter flags on this candidate.'}</p></div>
    </div>
  </section>`;
}

function renderLeadEnginePanel() {
  const target = document.querySelector('#lead-engine-panel');
  if (!target) return;
  if (!generatedLeads) {
    target.innerHTML = '<p>Loading generated lead-engine output…</p>';
    return;
  }
  if (generatedLeads.error) {
    target.innerHTML = `<p>Lead engine output not found yet: ${h(generatedLeads.error)}. Run <code>node scripts/lead-engine.mjs</code>.</p>`;
    return;
  }
  const snapshot = generatedLeads.snapshot || {};
  const queues = generatedLeads.queues || {};
  const states = availableLeadEngineStates(snapshot, queues);
  if (leadEngineStateFilter !== 'all' && !states.includes(leadEngineStateFilter)) leadEngineStateFilter = 'all';
  const topCalls = filteredRows(queues.topSellerCalls || []);
  const skipTrace = filteredRows(queues.skipTrace || []);
  const buyerTasks = filteredRows(queues.buyerValidation || []);
  const offerReady = filteredRows(queues.offerReady || []);
  const buyerDiscovery = filteredRows(queues.buyerDiscovery || []);
  const sellerDiscovery = filteredRows(queues.sellerDiscovery || []);
  const sourceCandidates = filteredRows(snapshot.sourceCandidates || []);
  const parcels = filteredRows(snapshot.parcels || []);
  const buyers = filteredRows(snapshot.buyers || []);
  const blockers = filteredRows(queues.missingData || []).filter(item => item.severity > 0);
  const sourceSummary = ['market', 'buyer', 'parcel', 'owner', 'offer', 'risk', 'crm'];
  const stateButtons = ['all', ...states].map(state => `<button type="button" class="state-filter ${state === leadEngineStateFilter ? 'active' : ''}" data-lead-state="${h(state)}">${state === 'all' ? 'All states' : h(state)}</button>`).join('');
  target.innerHTML = `<div class="lead-engine-grid">
    ${zeroFabricationNotice(snapshot, queues)}
    <div class="lead-state-toolbar"><div><span class="eyebrow">State filter</span><h4>Show only the markets you can actually execute.</h4></div><div class="state-filter-group">${stateButtons}</div></div>
    <div class="deal-strip five hero-metrics"><div><span>Parcel leads</span><strong>${parcels.length}</strong></div><div><span>Buyer leads</span><strong>${buyers.length}</strong></div><div><span>Seller calls</span><strong>${topCalls.length}</strong></div><div><span>Skip trace</span><strong>${skipTrace.length}</strong></div><div><span>Source candidates</span><strong>${sourceCandidates.length}</strong></div></div>
    <details class="engine-column primary-column source-ledger" open><summary><h4>Source ledger</h4><span>Last-sourced provenance by phase</span></summary><p>Every row must name its public source. Seed/demo rows are not eligible for seller calls.</p>${sourceSummary.map(type => {
      const blueprint = sourceBlueprint[type];
      const status = getPhaseSourceStatus(type);
      return `<div class="engine-row"><b>${h(blueprint.label)}</b><span>${formatDateTime(status.latest)} · ${h(status.count)} records · ${status.ids.length ? status.ids.map(id => h(id)).join(', ') : 'derived/local'}</span></div>`;
    }).join('')}</details>
    <div class="engine-column primary-column"><h4>Call these sellers first</h4>${topCalls.slice(0, 3).map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item.address)}</b><span>${provenancePill(item)}</span><span>${h(item.ownerName || 'owner')} · ${h(item.ownerPhone || item.ownerEmail || 'needs verified contact')} · score ${h(item.score ?? '')}</span></div>`).join('') || '<p>No verified seller calls for this state yet. Correct state: wait for public owner + buyer-demand evidence before calling.</p>'}</div>
    <div class="engine-column primary-column"><h4>Public-owner leads to skip trace</h4>${skipTrace.slice(0, 5).map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item.address)}</b><span>${provenancePill(item)}</span><span>${h(item.ownerName || 'owner')} · ${h(item.ownerMailingAddress || 'mailing missing')} · confidence ${h(item.confidence ?? '')}</span></div>`).join('') || '<p>No verified public-owner skip trace queue for this state yet.</p>'}</div>
    <div class="engine-column"><h4>Source candidates</h4>${sourceCandidates.slice(0, 8).map(source => `<div class="engine-row"><b>${h(source.areaName || source.market)} · ${h(source.platform)} · ${h(source.sourceType)}</b><span>${provenancePill(source)}</span><span>${source.url ? safeLink(source.url, source.title || 'Open source') : h(source.title)} · confidence ${h(source.confidence ?? '')}</span></div>`).join('') || '<p>No external source candidates discovered for this state yet.</p>'}</div>
    <div class="engine-column"><h4>New-area discovery</h4>${[...buyerDiscovery, ...sellerDiscovery].slice(0, 6).map(task => `<div class="engine-row"><b>${h(task.areaName || task.market)}</b><span>${provenancePill(task)}</span><span>${h(task.reason)} · ${h(task.task)}</span></div>`).join('') || '<p>All selected-state areas have source records or no discovery tasks.</p>'}</div>
    <div class="engine-column"><h4>Buyer validation</h4>${buyerTasks.slice(0, 4).map(task => `<div class="engine-row"><b>${h(task.name)}</b><span>${provenancePill(task)}</span><span>${h(task.task)} · ${h(task.phone || task.website || 'find contact')}</span></div>`).join('') || '<p>No verified buyer-validation tasks for this state yet.</p>'}</div>
    <div class="engine-column"><h4>Offer-ready</h4>${offerReady.slice(0, 4).map(item => `<div class="engine-row"><b>${h(item.address)}</b><span>${provenancePill(item)}</span><span>${h(item.ownerName)} · ask ${h(item.askingPrice)} · max ${h(item.buyerMaxPrice)}</span></div>`).join('') || '<p>No offer-ready deals for this state yet.</p>'}</div>
    <div class="engine-column"><h4>Blockers</h4>${blockers.slice(0, 4).map(item => `<div class="engine-row"><b>${h(item.address || item.parcelId || item.market)}</b><span>${provenancePill(item)}</span><span>Missing: ${h(item.missing || 'unknown')}</span></div>`).join('') || '<p>No critical blockers in generated leads for this state.</p>'}</div>
  </div>`;
}

function renderQualityControl() {
  const target = document.querySelector('#quality-gate');
  if (!target) return;
  const duplicates = findDuplicateParcels(workspace.parcels || []);
  const report = reportMissingData(workspace.parcels || []);
  const checklist = getDataSourceChecklist('lehigh');
  const worstRows = report.rows.filter(row => row.severity > 0).slice(0, 6);
  target.innerHTML = `<div class="quality-grid">
    <div><b>${duplicates.length}</b><span>duplicate groups</span></div>
    <div><b>${report.summary.ownerContactMissing}</b><span>missing owner contact</span></div>
    <div><b>${report.summary.buildabilityMissing}</b><span>missing buildability</span></div>
    <div><b>${report.summary.pricingMissing}</b><span>missing pricing</span></div>
  </div>
  <div class="checklist">${checklist.map(item => `<div class="check-item ${item.blocksCallList ? 'blocks' : ''}"><strong>${h(item.label)}</strong><span>${h(item.detail)}</span></div>`).join('')}</div>
  <div class="missing-list">${worstRows.length ? worstRows.map(row => `<div><b>${h(row.address || row.id)}</b><span>${row.missing.map(item => badge(item, item === 'ownerContact' || item === 'buildability' ? 'bad' : 'warn')).join('')}</span></div>`).join('') : '<p>Quality gate clear for current records.</p>'}</div>
  ${duplicates.length ? `<div class="duplicate-list"><strong>Duplicate review:</strong>${duplicates.map(group => `<span>${h(group.reason)}: ${h(group.ids.join(', '))}</span>`).join('')}</div>` : ''}`;
}

function renderBuyerValidationPanel() {
  const target = document.querySelector('#buyer-validation-panel');
  if (!target) return;
  const scorecards = (workspace.buyers || []).map(calculateBuyerScorecard).sort((a, b) => b.score - a.score);
  const matrix = buildDealFitMatrix(workspace.parcels || [], workspace.buyers || []).slice(0, 6);
  const loop = buildBuyerFeedbackLoop(workspace.buyers || []);
  target.innerHTML = `<div class="buyer-validation-grid">
    <div class="scorecard-list"><h4>Buyer scorecards</h4>${scorecards.map(card => `<div class="buyer-score-row grade-${h(card.grade)}"><b>${h(card.grade)} · ${h(card.name || 'buyer')} · ${card.score}</b><span>${h(card.signals.join(', ') || 'needs validation')}</span></div>`).join('')}</div>
    <div class="fit-matrix"><h4>Deal-fit matrix</h4>${matrix.map(row => `<div class="fit-row ${h(row.fit)}"><b>${h(row.fit)} · ${h(row.address || row.parcelId)} → ${h(row.buyerName)}</b><span>${row.score}/100${row.misses.length ? ` · misses: ${h(row.misses.join(', '))}` : ''}</span></div>`).join('') || '<p>No exact buy boxes captured yet.</p>'}</div>
    <div class="feedback-loop"><h4>Feedback loop</h4><div class="deal-strip"><div><span>Total feedback</span><strong>${loop.totalFeedback}</strong></div><div><span>Accepted</span><strong>${loop.accepted}</strong></div><div><span>Rejected</span><strong>${loop.rejected}</strong></div><div><span>Maybe</span><strong>${loop.maybe}</strong></div></div><p>${h(loop.lessons || 'No rejection lessons captured yet.')}</p><strong>${h(loop.tightening)}</strong></div>
    <div class="call-notes"><h4>Latest call notes</h4>${(workspace.buyers || []).flatMap(b => (b.callNotes || []).map(n => ({ buyer: b.name, ...n }))).slice(0, 5).map(note => `<div class="note-row"><b>${h(note.date || '')} · ${h(note.buyer)}</b><span>${h(note.outcome || '')}: ${h(note.note || '')}</span></div>`).join('') || '<p>No buyer call notes captured yet.</p>'}</div>
  </div>`;
}

function renderOutreachPanel() {
  const target = document.querySelector('#outreach-panel');
  if (!target) return;
  const queue = buildFollowUpQueue(workspace.parcels || []);
  const top = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 1 })[0] || scoredParcels()[0];
  const buyer = top ? getBuyer(top) : {};
  const script = top ? generateOwnerCallScript(top, buyer) : null;
  target.innerHTML = `<div class="outreach-grid">
    <div class="followup-list"><h4>Follow-up queue</h4>${queue.length ? queue.slice(0, 6).map(item => `<div class="followup-row ${h(item.urgency)}"><b>${h(item.nextFollowUp)} · ${h(item.address)}</b><span>${h(item.ownerName || item.owner || 'owner unknown')} · ${h(item.crmStatus)} · ${h(item.urgency)}</span></div>`).join('') : '<p>No due follow-ups in the next 7 days.</p>'}</div>
    <div class="script-box"><h4>Suggested seller script</h4>${script ? `<p><strong>Opener:</strong> ${h(script.opener)}</p><p><strong>Positioning:</strong> ${h(script.positioning)}</p><p><strong>Price:</strong> ${h(script.priceAnchor)}</p><ul>${script.questions.slice(0, 4).map(q => `<li>${h(q)}</li>`).join('')}</ul><p><strong>Close:</strong> ${h(script.close)}</p>` : '<p>No parcel available for scripting.</p>'}</div>
  </div>`;
}

function currentMemoTarget() {
  const selected = (workspace.parcels || []).find(parcel => parcel.id === selectedParcelId);
  return selected || buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 1 })[0] || scoredParcels()[0] || null;
}

function currentOfferPacket() {
  const candidate = currentMemoTarget();
  if (!candidate) return null;
  return generateOfferPacket(candidate, getBuyer(candidate));
}

function currentBuyerSendMemo() {
  const candidate = currentMemoTarget();
  if (!candidate) return null;
  const buyer = getBuyer(candidate);
  return generateBuyerSendMemo(candidate, buyer, generateOfferPacket(candidate, buyer));
}

function currentTitleCompanyEmail() {
  const candidate = currentMemoTarget();
  if (!candidate) return null;
  const desk = buildTitleCompanyClosingDesk(candidate, getBuyer(candidate));
  return `${desk.email.subject}\n\n${desk.email.body}`;
}

function renderBuyerSendMemoCard(memo, { compact = false } = {}) {
  if (!memo) return '';
  return `<section class="buyer-send-memo ${compact ? 'compact' : ''}" aria-label="Buyer send memo">
    <div class="buyer-memo-head"><span class="eyebrow">Buyer send memo</span><h3>${h(memo.subject)}</h3><p>${h(memo.ask)}</p></div>
    <div class="deal-strip four"><div><span>Assignment fee path</span><strong>${formatMoney(memo.assignmentFee)}</strong></div><div><span>Fit score</span><strong>${h(memo.fit?.score || 0)}/100</strong></div><div><span>Contract gate</span><strong>${h(memo.contract?.label || 'unknown')}</strong></div><div><span>Close probability</span><strong>${h(memo.checklist?.probability || 0)}%</strong></div></div>
    <pre class="buyer-memo-preview">${h(memo.message.slice(0, compact ? 720 : 1400))}</pre>
    <div class="button-row"><button type="button" class="copy-buyer-send-memo">Copy memo</button><button type="button" class="secondary download-buyer-send-memo">Download memo</button><span class="buyer-send-memo-status"></span></div>
  </section>`;
}

function renderBuyerFeedbackCapture(parcel, buyer) {
  const loop = buildBuyerFeedbackLoop(workspace.buyers || []);
  const recommendations = recommendNextSellerCallsFromFeedback(workspace.parcels || [], workspace.buyers || []).slice(0, 3);
  return `<section class="buyer-feedback-capture" data-feedback-parcel-id="${h(parcel.id)}" aria-label="Buyer feedback capture">
    <div class="feedback-head"><span class="eyebrow">Buyer feedback loop</span><h3>Capture the buyer answer. Let rejection rewrite tomorrow’s calls.</h3><p>${h(loop.tightening)}</p></div>
    <div class="feedback-form-grid">
      <label>Buyer response<select class="buyer-feedback-decision"><option value="accept">yes / wants it</option><option value="maybe">maybe / needs review</option><option value="reject">no / reject</option></select></label>
      <label>Reason<select class="buyer-feedback-reason">${BUYER_FEEDBACK_REASONS.map(reason => `<option value="${h(reason)}">${h(reason)}</option>`).join('')}</select></label>
      <label>Buyer max price<input class="buyer-feedback-max" type="number" min="0" step="500" placeholder="${h(buyer.maxPrice || parcel.buyerMaxPrice || '')}"></label>
      <label class="feedback-note-label">Exact words / next constraint<textarea class="buyer-feedback-note" rows="2" placeholder="Too much wetland risk; only send paved-road lots under $38k..."></textarea></label>
      <button class="save-buyer-feedback" type="button">Save buyer feedback</button><span class="buyer-feedback-status"></span>
    </div>
    <div class="feedback-summary"><div><span>Total feedback</span><b>${loop.totalFeedback}</b></div><div><span>Accepted</span><b>${loop.accepted}</b></div><div><span>Rejected</span><b>${loop.rejected}</b></div><div><span>Maybe</span><b>${loop.maybe}</b></div></div>
    <div class="next-call-guidance"><h4>What to call next</h4>${recommendations.map(item => `<div><b>${h(item.address)} · ${h(item.adjustedScore)}/100</b><span>${h(item.nextCallReason)}</span></div>`).join('') || '<p>No recommendations yet.</p>'}</div>
  </section>`;
}

function renderOfferPacketPanel() {
  const target = document.querySelector('#offer-packet-panel');
  if (!target) return;
  const packet = currentOfferPacket();
  if (!packet) {
    target.innerHTML = '<p>No parcel available for offer packet generation.</p>';
    return;
  }
  const buyerMemo = currentBuyerSendMemo();
  target.innerHTML = `<div class="packet-grid">
    <div class="packet-economics"><h4>${h(packet.address)}</h4><div class="deal-strip five"><div><span>Seller offer</span><strong>${formatMoney(packet.sellerOffer)}</strong></div><div><span>Assignment price</span><strong>${formatMoney(packet.assignmentPrice)}</strong></div><div><span>Projected spread</span><strong>${formatMoney(packet.projectedSpread)}</strong></div><div><span>Closing costs</span><strong>${formatMoney(packet.closingCosts)}</strong></div><div><span>Buyer</span><strong>${h(packet.buyerName || 'unknown')}</strong></div></div><p>${h(packet.summary)}</p></div>
    ${renderBuyerSendMemoCard(buyerMemo)}
    <div class="risk-checklist"><h4>Risk checklist</h4>${packet.riskChecklist.map(item => `<div class="risk-item ${h(item.status)}"><b>${h(item.label)} · ${h(item.status)}</b><span>${h(item.detail)}</span></div>`).join('')}</div>
    <div class="memo-preview"><h4>Seller offer letter preview</h4><pre>${h(packet.sellerOfferLetter.slice(0, 900))}</pre></div>
    <div class="memo-preview"><h4>Buyer assignment summary preview</h4><pre>${h(packet.buyerAssignmentSummary.slice(0, 900))}</pre></div>
  </div>`;
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      const view = viewButton.dataset.view;
      if (validViews.has(view)) {
        event.preventDefault();
        navigateToView(view);
      }
      return;
    }

    const builderMarketButton = event.target.closest('[data-builder-market-state]');
    if (builderMarketButton) {
      event.preventDefault();
      const stateCode = builderMarketButton.dataset.builderMarketState;
      if (stateCode) {
        selectedBuilderMarketState = stateCode;
        selectedBuilderId = '';
        selectedValidationBuilderId = '';
        renderBuilderListEnginePanel({ preserveViewport: true });
      }
      return;
    }

    const stateButton = event.target.closest('[data-lead-state]');
    if (stateButton) {
      leadEngineStateFilter = stateButton.dataset.leadState || 'all';
      renderLeadEnginePanel();
      return;
    }

    const parcelButton = event.target.closest('[data-select-parcel]');
    if (parcelButton) {
      selectedParcelId = parcelButton.dataset.selectParcel;
      renderParcels();
      renderClosingDeskPanel();
      renderBuilderListEnginePanel();
      return;
    }

    const builderButton = event.target.closest('[data-select-builder]');
    if (builderButton) {
      event.preventDefault();
      selectedBuilderId = builderButton.dataset.selectBuilder;
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    const validationContactButton = event.target.closest('[data-toggle-validation-contact]');
    if (validationContactButton) {
      event.preventDefault();
      const builderId = validationContactButton.dataset.builderId || selectedValidationBuilderId;
      const channel = validationContactButton.dataset.toggleValidationContact;
      if (!builderId || !['phone', 'email'].includes(channel)) return;
      const current = asArray(workspace.buyerValidations).find(item => item.builderId === builderId) || {};
      const currentOutreach = current.outreach || {};
      const currentChannel = currentOutreach[channel] || {};
      const nextContacted = !currentChannel.contacted;
      const today = todayIsoDate();
      const nextOutreach = {
        ...currentOutreach,
        [channel]: {
          contacted: nextContacted,
          at: nextContacted ? today : '',
        },
      };
      const updated = mergeBuyerValidationPatch(builderId, {
        outreach: nextOutreach,
        lastContacted: nextContacted ? today : (current.lastContacted || ''),
      });
      upsertBuyerValidation(updated);
      selectedValidationBuilderId = builderId;
      persistWorkspace();
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    const selectedBuilderDock = event.target.closest('[data-scroll-selected-builder]');
    if (selectedBuilderDock) {
      event.preventDefault();
      document.querySelector('#selected-builder-card')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return;
    }

    const validationBuilderButton = event.target.closest('[data-select-validation-builder]');
    if (validationBuilderButton) {
      event.preventDefault();
      selectedValidationBuilderId = validationBuilderButton.dataset.selectValidationBuilder;
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    const moneyCallButton = event.target.closest('[data-select-money-call]');
    if (moneyCallButton) {
      selectedMoneyCallId = moneyCallButton.dataset.selectMoneyCall;
      renderCommandCenter();
      return;
    }

    const outcomeButton = event.target.closest('[data-call-outcome]');
    if (outcomeButton && selectedMoneyCallId) {
      workspace = applyCallOutcome(workspace, selectedMoneyCallId, outcomeButton.dataset.callOutcome);
      persistWorkspace();
      renderAll();
      return;
    }

    if (event.target.matches('#load-lehigh-template')) {
      document.querySelector('#csv-input').value = getLehighImportTemplate();
      const status = document.querySelector('#import-status');
      if (status) status.textContent = 'Loaded Lehigh Acres template.';
    }

    if (event.target.matches('#import-csv')) {
      const input = document.querySelector('#csv-input');
      const status = document.querySelector('#import-status');
      const preset = document.querySelector('#source-preset')?.value || 'land-dealflow';
      const records = normalizeCsvToParcels(input.value, preset).map((record, index) => ({
        ...record,
        id: record.id || record.parcelId || `csv-${Date.now()}-${index + 1}`,
        crmStatus: record.crmStatus || 'New',
        notes: record.notes || '',
        nextFollowUp: record.nextFollowUp || '',
      }));
      workspace = { ...workspace, parcels: [...(workspace.parcels || []), ...records] };
      persistWorkspace();
      status.textContent = `Imported ${records.length} parcels.`;
      renderAll();
    }

    if (event.target.matches('#load-skiptrace-template')) {
      const input = document.querySelector('#skip-trace-csv');
      if (input) input.value = skipTraceTemplateRow();
      const status = document.querySelector('#skiptrace-status');
      if (status) status.textContent = 'Loaded first real skip-trace lead.';
    }

    if (event.target.matches('#import-skiptrace')) {
      const input = document.querySelector('#skip-trace-csv');
      const status = document.querySelector('#skiptrace-status');
      const result = applySkipTraceImport(workspace, input?.value || '', { candidateParcels: generatedCandidateParcels() });
      workspace = result.workspace;
      persistWorkspace();
      if (status) status.textContent = `Matched ${result.summary.matched}/${result.summary.imported}; Today can now promote real callable records.`;
      renderAll();
    }

    if (event.target.matches('#builder-load-skiptrace-template')) {
      const input = document.querySelector('#builder-skip-trace-csv');
      if (input) input.value = builderSkipTraceTemplateRow(selectedBuilderMarketState || 'TN');
      lastBuilderSkipTraceImportStatus = 'Loaded first buyer-box-matched seller row for the active state.';
      const status = document.querySelector('#builder-skiptrace-status');
      if (status) status.textContent = lastBuilderSkipTraceImportStatus;
    }

    if (event.target.matches('#builder-import-skiptrace')) {
      const input = document.querySelector('#builder-skip-trace-csv');
      const stateCode = selectedBuilderMarketState || 'TN';
      const result = applySkipTraceImport(workspace, input?.value || '', { candidateParcels: sellerPoolForState(stateCode) });
      workspace = result.workspace;
      persistWorkspace();
      const buyers = buyerPoolForState(stateCode);
      const sellers = sellerPoolForState(stateCode);
      const conveyor = buildExecutionConveyor({ buyers, sellerCandidates: sellers, limit: 50 });
      lastBuilderSkipTraceImportStatus = `Imported ${result.summary.matched}/${result.summary.imported} skip-trace rows; ${conveyor.callReadySellers.length} now sit in seller cockpit review for ${stateCode}.`;
      renderAll();
    }

    if (event.target.matches('#load-buyer-contact-template')) {
      const input = document.querySelector('#buyer-contact-csv');
      if (input) input.value = buyerContactTemplateRow();
      const status = document.querySelector('#buyer-contact-status');
      if (status) status.textContent = 'Loaded top builder signal.';
    }

    if (event.target.matches('#import-buyer-contact')) {
      const input = document.querySelector('#buyer-contact-csv');
      const status = document.querySelector('#buyer-contact-status');
      const result = applyBuyerContactImport(workspace, input?.value || '', { candidateBuyers: generatedCandidateBuyers() });
      workspace = result.workspace;
      persistWorkspace();
      if (status) status.textContent = `Enriched ${result.summary.matched}/${result.summary.imported} buyer contacts.`;
      renderAll();
    }

    if (event.target.matches('#export-json')) {
      downloadText(`land-dealflow-workspace-${new Date().toISOString().slice(0, 10)}.json`, exportWorkspace(workspace), 'application/json');
    }

    if (event.target.matches('#load-selected-contract-deal')) {
      const selected = getSelectedParcel(getVisibleParcels()) || {};
      workspace = { ...workspace, contractDraft: currentContractDraftInputs(selected) };
      persistWorkspace();
      renderClosingDeskPanel();
      return;
    }

    if (event.target.matches('[data-contract-status]')) {
      const form = document.querySelector('#contract-packet-form');
      const values = form ? Object.fromEntries(new FormData(form).entries()) : (workspace.contractDraft || {});
      const action = event.target.dataset.contractStatus;
      const nextStatus = { ...(workspace.contractStageStatus || {}) };
      if (action === 'seller-ready') nextStatus.sellerAgreement = 'ready';
      if (action === 'seller-signed') nextStatus.sellerAgreement = 'seller-signed';
      if (action === 'assignment-ready') nextStatus.assignmentAgreement = 'ready';
      if (action === 'buyer-signed') nextStatus.assignmentAgreement = 'buyer-signed';
      if (action === 'title-opened') nextStatus.titlePacket = 'title-opened';
      workspace = { ...workspace, contractDraft: values, contractStageStatus: nextStatus };
      persistWorkspace();
      renderClosingDeskPanel();
      return;
    }

    if (event.target.matches('#save-contract-packet')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      workspace = { ...workspace, contractDraft: values, contractPackets: [packet, ...asArray(workspace.contractPackets).filter(item => item.id !== packet.id)].slice(0, 12) };
      persistWorkspace();
      const status = document.querySelector('#contract-packet-status');
      if (status) status.textContent = `${packet.status}; draft stored locally.`;
      renderClosingDeskPanel();
      return;
    }

    if (event.target.matches('#print-contract-packet, [data-print-contract-packet]')) {
      const form = document.querySelector('#contract-packet-form');
      if (form) workspace = { ...workspace, contractDraft: Object.fromEntries(new FormData(form).entries()) };
      persistWorkspace();
      triggerContractPrint(event.target.dataset.printContractPacket || 'packet');
      return;
    }

    if (event.target.matches('#export-seller-contract')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      downloadText(`land-dealflow-seller-agreement-${slugify(values.propertyAddress || values.parcelId || 'draft')}-${new Date().toISOString().slice(0, 10)}.md`, `# Seller Land Sale Agreement\n\n${renderContractDocumentText(packet.sellerAgreement, packet.inputs)}\n\n## Legal guardrail\n\n${packet.legalGuardrail}`, 'text/markdown');
      return;
    }

    if (event.target.matches('#export-assignment-contract')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      downloadText(`land-dealflow-assignment-agreement-${slugify(values.propertyAddress || values.parcelId || 'draft')}-${new Date().toISOString().slice(0, 10)}.md`, `# Assignment Agreement\n\n${renderContractDocumentText(packet.buyerAssignment, packet.inputs)}\n\n## Legal guardrail\n\n${packet.legalGuardrail}`, 'text/markdown');
      return;
    }

    if (event.target.matches('#export-contract-packet')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      downloadText(`land-dealflow-title-packet-${slugify(values.propertyAddress || values.parcelId || 'draft')}-${new Date().toISOString().slice(0, 10)}.md`, exportContractPacketMarkdown(packet), 'text/markdown');
      const status = document.querySelector('#contract-packet-status');
      if (status) status.textContent = 'Title packet exported with review letter, seller agreement, and assignment agreement.';
      return;
    }

    if (event.target.matches('#export-filtered-csv')) {
      downloadText(`land-dealflow-filtered-${filter}-${new Date().toISOString().slice(0, 10)}.csv`, exportParcelsCsv(getVisibleParcels()));
    }

    if (event.target.matches('#export-top20-csv')) {
      const calls = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 20 });
      downloadText(`land-dealflow-top20-call-list-${new Date().toISOString().slice(0, 10)}.csv`, exportParcelsCsv(calls));
    }

    if (event.target.matches('#export-matched-seller-batch')) {
      const stateCode = selectedBuilderMarketState || 'TN';
      const buyers = buyerPoolForState(stateCode);
      const sellers = sellerPoolForState(stateCode);
      const conveyor = buildExecutionConveyor({ buyers, sellerCandidates: sellers, limit: 50 });
      downloadText(`land-dealflow-matched-seller-batch-${stateCode.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, exportMatchedSellerBatchCsv(conveyor.matchedSellerBatch));
      const status = document.querySelector('#matched-seller-export-status');
      if (status) status.textContent = `Exported ${conveyor.matchedSellerBatch.length} buyer-box-matched sellers from saved selected-builder buy boxes.`;
    }

    const executionOutcomeButton = event.target.closest('[data-execution-call-outcome]');
    if (executionOutcomeButton) {
      event.preventDefault();
      const card = executionOutcomeButton.closest('[data-phase7-seller-card]');
      const capture = card?.querySelector('[data-execution-capture]');
      const parcelId = executionOutcomeButton.dataset.parcelId || card?.dataset.phase7SellerCard || '';
      workspace = applyCallOutcome(workspace, parcelId, executionOutcomeButton.dataset.executionCallOutcome, {
        updates: {
          sellerAskingPrice: capture?.querySelector('.phase7-ask')?.value || '',
          askingPrice: capture?.querySelector('.phase7-ask')?.value || '',
          sellerTimeline: capture?.querySelector('.phase7-timeline')?.value || '',
          nextFollowUp: capture?.querySelector('.phase7-callback')?.value || '',
          sellerMotivation: capture?.querySelector('.phase7-motivation')?.value || '',
          accessBuildabilityNotes: capture?.querySelector('.phase7-access')?.value || '',
          exactSellerLanguage: capture?.querySelector('.phase7-language')?.value || '',
        },
      });
      persistWorkspace();
      lastBuilderSkipTraceImportStatus = 'Seller outcome captured; contract/title gate, buyer memo, and feedback rewrite recomputed.';
      renderAll();
      return;
    }

    const executionMemoButton = event.target.closest('[data-download-execution-memo]');
    if (executionMemoButton) {
      event.preventDefault();
      const parcelId = executionMemoButton.dataset.downloadExecutionMemo;
      const stateCode = selectedBuilderMarketState || 'TN';
      const sellers = sellerPoolForState(stateCode);
      const buyers = buyerPoolForState(stateCode);
      const parcel = sellers.find(item => String(item.id || '') === String(parcelId) || String(item.parcelId || '') === String(parcelId));
      const buyer = buyers.find(item => String(item.id || item.buyerId || '') === String(parcel?.buyerId || parcel?.buyer?.id || '')) || buyers[0] || {};
      if (!parcel) return;
      const memo = generateBuyerSendMemo(parcel, buyer, generateOfferPacket(parcel, buyer));
      downloadText(`land-dealflow-buyer-send-memo-${stateCode.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`, exportBuyerSendMemoMarkdown(memo), 'text/markdown');
      const status = executionMemoButton.closest('[data-phase7-seller-card]')?.querySelector('.phase7-save-status');
      if (status) status.textContent = 'Buyer memo downloaded for this seller row.';
      return;
    }

    if (event.target.matches('#export-daily-call-sheet')) {
      const queue = buildDailyMoneyQueue({ parcels: workspace.parcels || [], buyers: workspace.buyers || [], limit: 20, requireRealContact: true });
      downloadText(`land-dealflow-daily-call-sheet-${new Date().toISOString().slice(0, 10)}.csv`, exportDailyCallSheetCsv([...queue.followUps, ...queue.today]));
    }

    if (event.target.matches('#export-mailmerge-csv')) {
      downloadText(`land-dealflow-mail-merge-${new Date().toISOString().slice(0, 10)}.csv`, exportMailMergeCsv(getVisibleParcels()));
    }

    if (event.target.matches('#capture-sample-buybox')) {
      workspace = { ...workspace, buyers: (workspace.buyers || []).map((buyer, index) => index === 0 ? captureBuyBox(buyer, { lotSizeMin: 0.23, lotSizeMax: 0.32, maxPrice: buyer.maxPrice || 42000, targetMarkets: [buyer.market || 'lehigh'], requiredRoadAccess: true, requiredUtilities: false, avoidFloodZones: ['AE'], avoidWetlands: true, notes: 'captured from v0.7 buyer validation panel' }) : buyer) };
      persistWorkspace();
      const status = document.querySelector('#buyer-validation-status');
      if (status) status.textContent = 'Sample buy-box captured.';
      renderAll();
    }

    if (event.target.matches('#add-sample-buyer-note')) {
      workspace = { ...workspace, buyers: (workspace.buyers || []).map((buyer, index) => index === 0 ? addBuyerCallNote(buyer, { date: new Date().toISOString().slice(0, 10), contact: buyer.contactName || '', outcome: 'answered', note: 'Validated buyer criteria and captured feedback loop.', dealFeedback: { parcelId: 'parcel-1', decision: 'accept', reason: 'clean infill' } }) : buyer) };
      persistWorkspace();
      const status = document.querySelector('#buyer-validation-status');
      if (status) status.textContent = 'Buyer call note added.';
      renderAll();
    }

    if (event.target.matches('#bulk-contact-callnow')) {
      const callNowIds = scoredParcels().filter(parcel => parcel.action === 'Call now').map(parcel => parcel.id);
      const followUp = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      workspace = bulkMarkContacted(workspace, callNowIds, { channel: 'phone', nextFollowUp: followUp, note: 'bulk marked from v0.5 outreach panel' });
      persistWorkspace();
      const status = document.querySelector('#outreach-status');
      if (status) status.textContent = `Marked ${callNowIds.length} parcels contacted.`;
      renderAll();
    }

    if (event.target.matches('#export-deal-memo')) {
      const packet = currentOfferPacket();
      if (!packet) return;
      downloadText(`land-dealflow-deal-memo-${new Date().toISOString().slice(0, 10)}.md`, exportDealMemoMarkdown(packet), 'text/markdown');
      const status = document.querySelector('#deal-memo-status');
      if (status) status.textContent = 'Deal memo exported.';
    }

    if (event.target.matches('#download-buyer-send-memo, .download-buyer-send-memo')) {
      const memo = currentBuyerSendMemo();
      if (!memo) return;
      downloadText(`land-dealflow-buyer-send-memo-${new Date().toISOString().slice(0, 10)}.md`, exportBuyerSendMemoMarkdown(memo), 'text/markdown');
      const status = event.target.closest('.buyer-send-memo, .machine-panel')?.querySelector('.buyer-send-memo-status, #buyer-send-memo-status');
      if (status) status.textContent = 'Buyer memo downloaded.';
    }

    if (event.target.matches('#copy-buyer-send-memo, .copy-buyer-send-memo')) {
      const memo = currentBuyerSendMemo();
      if (!memo) return;
      const status = event.target.closest('.buyer-send-memo, .machine-panel')?.querySelector('.buyer-send-memo-status, #buyer-send-memo-status');
      const write = navigator.clipboard?.writeText?.(memo.message) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Buyer memo copied.'; }).catch(() => {
        downloadText(`land-dealflow-buyer-send-memo-${new Date().toISOString().slice(0, 10)}.txt`, memo.message, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-title-email]')) {
      const email = currentTitleCompanyEmail();
      if (!email) return;
      const status = event.target.closest('.title-closing-desk')?.querySelector('.title-email-status');
      const write = navigator.clipboard?.writeText?.(email) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Title email copied.'; }).catch(() => {
        downloadText(`land-dealflow-title-company-email-${new Date().toISOString().slice(0, 10)}.txt`, email, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-research-title-email]')) {
      const template = titleCompanyProcess?.templates?.titlePacketEmail || {};
      const payload = `Subject: ${template.subject || '<PROPERTY ADDRESS> - Assignment closing packet'}\n\n${template.body || ''}`;
      const status = event.target.closest('.title-email-template-card')?.querySelector('.research-title-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Template copied.'; }).catch(() => {
        downloadText(`land-dealflow-title-packet-template-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }


    const copyBuilderEmailAddressButton = event.target.closest('[data-copy-builder-email-address]');
    if (copyBuilderEmailAddressButton) {
      event.preventDefault();
      const email = copyBuilderEmailAddressButton.dataset.copyBuilderEmailAddress || '';
      if (!email) return;
      const status = copyBuilderEmailAddressButton.closest('.validation-focus-card')?.querySelector('.validation-email-status');
      const write = navigator.clipboard?.writeText?.(email) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Email address copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-email-address-${new Date().toISOString().slice(0, 10)}.txt`, email, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded address instead.';
      });
      return;
    }

    if (event.target.matches('[data-copy-validation-email]')) {
      const center = buildBuyerValidationCommandCenter(getActiveValidationRows(), workspace.buyerValidations || []);
      const builder = center.items.find(item => item.builderId === selectedValidationBuilderId) || center.next || center.items[0] || {};
      const email = builder.emailDraft || {};
      const fallbackEmail = generateBuilderEmail(builder);
      const subject = email.subject || fallbackEmail.subject;
      const body = fallbackEmail.body;
      const payload = `Subject: ${subject}

${body}`;
      const status = event.target.closest('.validation-actions')?.querySelector('.validation-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Buy-box email copied.'; }).catch(() => {
        downloadText(`land-dealflow-validation-email-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
      return;
    }

    if (event.target.matches('[data-save-buyer-validation]')) {
      event.preventDefault();
      const form = event.target.closest('[data-validation-form]');
      const builderId = form?.dataset.validationForm;
      const sourceRow = findLoadedBuilderRow(builderId);
      if (!builderId) return;
      const updated = mergeBuyerValidationPatch(builderId, {
        callStatus: form.querySelector('.validation-status')?.value || 'not_called',
        lastContacted: form.querySelector('.validation-last')?.value || '',
        callbackDate: form.querySelector('.validation-callback')?.value || '',
        callNotes: form.querySelector('.validation-notes')?.value || '',
        buyBox: {
          geography: form.querySelector('.validation-geography')?.value || '',
          lotSize: form.querySelector('.validation-lot')?.value || '',
          maxPrice: Number(form.querySelector('.validation-price')?.value || 0) || '',
          closeSpeed: form.querySelector('.validation-speed')?.value || '',
          packageRecipient: form.querySelector('.validation-recipient')?.value || '',
          utilitiesAccess: form.querySelector('.validation-utilities')?.value || '',
          productType: form.querySelector('.validation-product')?.value || '',
          dealKillers: parseListInput(form.querySelector('.validation-killers')?.value || ''),
        },
      });
      const centerRow = buildBuyerValidationCommandCenter([sourceRow], [updated]).items[0] || updated;
      upsertBuyerValidation(updated);
      const promotedBuyer = centerRow.validation?.sellerEligible ? upsertBuyerFromValidation(centerRow) : null;
      persistWorkspace();
      const status = form.querySelector('.validation-save-status');
      if (status) status.textContent = promotedBuyer ? 'Validation saved; selected builder is now the buyer object for seller matching and CSV export.' : 'Validation saved. Complete the six-field buy box and set validated status to unlock seller matching.';
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    if (event.target.matches('[data-save-builder-buybox]')) {
      event.preventDefault();
      const form = event.target.closest('[data-builder-form]');
      const builderId = form?.dataset.builderForm;
      const builders = getPermitBuilders();
      const builder = builders.find(item => item.builderId === builderId);
      if (!builder) return;
      const updated = {
        ...builder,
        buyBoxStatus: 'captured',
        buyBox: {
          zipCodes: String(form.querySelector('.builder-zip')?.value || '').split(',').map(item => item.trim()).filter(Boolean),
          lotSizeRange: form.querySelector('.builder-size')?.value || '',
          maxPrice: Number(form.querySelector('.builder-price')?.value || 0) || null,
          dealKillers: String(form.querySelector('.builder-killers')?.value || '').split(',').map(item => item.trim()).filter(Boolean),
          closeSpeedDays: form.querySelector('.builder-speed')?.value || '',
          submissionMethod: form.querySelector('.builder-submit')?.value || '',
        },
      };
      workspace = { ...workspace, permitBuilders: [...asArray(workspace.permitBuilders).filter(item => item.builderId !== builderId), updated] };
      persistWorkspace();
      const status = form.querySelector('.builder-save-status');
      if (status) status.textContent = 'Buy box captured; builder promoted from permitVerified.';
      renderBuilderListEnginePanel({ preserveViewport: true });
    }

    if (event.target.matches('[data-copy-builder-script]')) {
      const builder = getSelectedBuilder();
      const script = generateBuilderCallScript(builder);
      const status = event.target.closest('.builder-script-panel')?.querySelector('.builder-script-status');
      const write = navigator.clipboard?.writeText?.(script) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Call script copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-call-script-${new Date().toISOString().slice(0, 10)}.txt`, script, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-builder-email]')) {
      const builder = getSelectedBuilder();
      const email = generateBuilderEmail(builder);
      const payload = `Subject: ${email.subject}\n\n${email.body}`;
      const status = event.target.closest('.builder-script-panel')?.querySelector('.builder-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Buy-box email copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-email-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-builder-marketing-email]')) {
      const builder = getSelectedBuilder();
      const email = generateBuilderMarketingEmailTemplate(builder);
      const payload = `Subject: ${email.subject}\n\n${email.body}`;
      const status = event.target.closest('.builder-script-panel')?.querySelector('.builder-marketing-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Marketing template copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-marketing-template-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('#import-json')) {
      const input = document.querySelector('#json-input');
      workspace = importWorkspace(input.value);
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('#reset-workspace')) {
      workspace = { markets: seedMarkets, buyers: seedBuyers, parcels: seedParcels, permitRecords: seedPermitRecords, permitBuilders: [], buyerValidations: [] };
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('.save-buyer-feedback')) {
      const panel = event.target.closest('.buyer-feedback-capture');
      const parcelId = panel?.dataset.feedbackParcelId;
      workspace = applyBuyerFeedback(workspace, parcelId, {
        decision: panel.querySelector('.buyer-feedback-decision')?.value || 'reject',
        reason: panel.querySelector('.buyer-feedback-reason')?.value || 'other',
        maxPrice: panel.querySelector('.buyer-feedback-max')?.value || '',
        note: panel.querySelector('.buyer-feedback-note')?.value || '',
      });
      persistWorkspace();
      const status = panel.querySelector('.buyer-feedback-status');
      if (status) status.textContent = 'Buyer feedback saved; next-call guidance recalculated.';
      renderAll();
      return;
    }

    if (event.target.matches('.save-crm')) {
      const row = event.target.closest('.crm-row');
      const parcelId = row.dataset.parcelId;
      workspace = applyCrmUpdate(workspace, parcelId, {
        crmStatus: row.querySelector('.crm-status').value,
        nextFollowUp: row.querySelector('.crm-followup').value,
        negotiatedSellerRange: row.querySelector('.crm-negotiated-range')?.value || '',
        titlePacketStatus: row.querySelector('.crm-title-status')?.value || 'missing',
        buyerMemoStatus: row.querySelector('.crm-buyer-memo-status')?.value || 'missing',
        assignmentStatus: row.querySelector('.crm-assignment-status')?.value || 'not-started',
        notes: row.querySelector('.crm-notes').value,
      });
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('[data-filter]')) {
      filter = event.target.dataset.filter;
      renderFilters();
      renderParcels();
      renderTopCallList();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (document.body?.dataset?.activeView !== 'builders') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target?.tagName?.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    const rows = [...document.querySelectorAll('[data-select-validation-builder]')];
    if (!rows.length || !['j', 'k'].includes(event.key.toLowerCase())) return;
    event.preventDefault();
    const currentIndex = Math.max(0, rows.findIndex(row => row.dataset.selectValidationBuilder === selectedValidationBuilderId));
    const nextIndex = event.key.toLowerCase() === 'j' ? Math.min(rows.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    const nextId = rows[nextIndex]?.dataset.selectValidationBuilder;
    if (!nextId || nextId === selectedValidationBuilderId) return;
    selectedValidationBuilderId = nextId;
    renderBuilderListEnginePanel({ preserveViewport: true });
  });

  document.addEventListener('toggle', (event) => {
    const disclosure = event.target.closest?.('.source-disclosure');
    if (!disclosure || !disclosure.open) return;
    document.querySelectorAll('.source-disclosure[open]').forEach((other) => {
      if (other !== disclosure) other.open = false;
    });
  }, true);

  window.addEventListener('hashchange', () => {
    const view = hashToView();
    if (view) setActiveView(view, { scrollToTop: true });
  });
}

function renderFilters() {
  const target = document.querySelector('#parcel-filters');
  if (!target) return;
  const options = [
    ['all', 'All deals'],
    ['seller-calls', 'Seller calls'],
    ['offer-ready', 'Offer-ready'],
    ['research', 'Needs research'],
    ['follow-up', 'Follow-up'],
    ['blocked', 'Blocked'],
  ];
  target.innerHTML = options.map(([value, label]) => `<button class="filter ${filter === value ? 'active' : ''}" type="button" data-filter="${h(value)}">${h(label)}</button>`).join('');
}

function renderAll() {
  renderCommandCenter();
  renderWorkspaceTools();
  renderSkipTraceIntakePanel();
  renderBuyerContactIntakePanel();
  renderSourcePriorityBoard();
  renderPipeline();
  renderMarkets();
  renderBuyers();
  renderFilters();
  renderParcels();
  renderClosingDeskPanel();
  renderBuilderListEnginePanel();
  renderTopCallList();
  renderWeeklyMarketScout();
  renderLeadEnginePanel();
  renderQualityControl();
  renderBuyerValidationPanel();
  renderOutreachPanel();
  renderOfferPacketPanel();
  renderAppShell();
}

bindEvents();
renderAll();
loadGeneratedLeads().then(renderAll);
loadKnoxvilleBuyerCallSheet().then(renderAll);
loadBuilderMarketData().then(renderAll);
loadWeeklyMarketScout().then(renderAll);
loadTitleCompanyResearch().then(renderAll);
