import {
  scoreMarket,
  computeOffer,
  classifyParcelRisk,
  rankBuyers,
  scoreParcelDeal,
  applyCrmUpdate,
  applyCallOutcome,
  buildDailyMoneyQueue,
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

const stages = [
  { id: 'market', name: 'Market Finder', desc: 'Score zip codes/suburbs for new builds, builders, vacant lot velocity and lot standardization.', sourceType: 'market' },
  { id: 'buyer', name: 'Buyer Finder', desc: 'Find builders, land acquisition managers and repeat buyers. Capture exact buy boxes.', sourceType: 'buyer' },
  { id: 'parcel', name: 'Land Finder', desc: 'Find vacant parcels matching buyer criteria, then filter for equity and owner motivation.', sourceType: 'parcel' },
  { id: 'owner', name: 'Owner Contact', desc: 'Find owner phone, email, mailing address and confidence score.', sourceType: 'owner' },
  { id: 'offer', name: 'Offer Engine', desc: 'Price initial/max/kill offers from builder demand and seller net logic.', sourceType: 'offer' },
  { id: 'risk', name: 'Risk Filter', desc: 'Flag wetlands, flood, slope, utilities, wildlife, access and zoning before contracts.', sourceType: 'risk' },
  { id: 'crm', name: 'Outreach CRM', desc: 'Track calls, mailers, contracts, title handoff, seller updates and referrals.', sourceType: 'crm' },
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

let workspace = loadWorkspace();
let generatedLeads = null;
let weeklyMarketScout = null;
let knoxvilleBuyerCallSheet = null;
let filter = 'all';
let selectedParcelId = '';
let selectedBuilderId = '';
let selectedValidationBuilderId = '';
let selectedSourceType = 'market';
let selectedMoneyCallId = '';
let leadEngineStateFilter = 'all';
let activeView = (location.hash || '#today').replace('#', '') || 'today';
const validViews = new Set(['today', 'deals', 'builders', 'closing', 'sources', 'machine']);

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
  const sourceText = blueprint.sources.map(item => `<li>${h(item)}</li>`).join('');
  const fieldText = blueprint.fields.map(item => `<li>${h(item)}</li>`).join('');
  const sourceIdText = status.ids.length ? status.ids.map(id => `<code>${h(id)}</code>`).join(' ') : '<span>derived/local</span>';
  return `<details class="source-disclosure" data-source-type="${h(type)}">
    <summary><span>Source</span><b>${h(blueprint.label)}</b><em>${h(status.count)} records</em></summary>
    <div class="source-popover">
      <div class="source-meta"><span>Last sourced</span><b>${formatDateTime(status.latest)}</b></div>
      <div class="source-meta"><span>Records visible</span><b>${h(status.count)}</b></div>
      <div class="source-meta wide"><span>Source IDs</span><b>${sourceIdText}</b></div>
      <div><strong>Pulls from</strong><ul>${sourceText}</ul></div>
      <div><strong>Fields used here</strong><ul>${fieldText}</ul></div>
    </div>
  </details>`;
}

function setActiveView(view) {
  activeView = validViews.has(view) ? view : 'today';
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
    <label>Negotiated range<input class="crm-negotiated-range" type="text" value="${h(parcel.negotiatedSellerRange || '')}" placeholder="$28k–$32k or seller counter"></label>
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
  if (['blocked', 'assignment-friendly-title-needed'].includes(status)) return 'bad';
  if (['missing-title-company', 'docs-out-for-signature', 'title-search'].includes(status)) return 'warn';
  return 'neutral';
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
        <p>${h(desk.titleCompany.name || 'No title company selected yet. Search assignment-friendly title companies near the property.')}</p>
      </aside>
    </div>

    <div class="title-metric-strip">
      ${hudItems.map(([label, value, detail]) => `<article><span>${h(label)}</span><b>${formatMoney(value)}</b><em>${h(detail)}</em></article>`).join('')}
    </div>

    <div class="title-desk-grid">
      <article class="title-glass-card checklist-card">
        <div class="card-kicker"><span>Packet gate</span><b>${h(desk.status)}</b></div>
        <div class="title-checklist">
          ${desk.items.map(item => `<div class="title-check ${h(item.status)}"><span>${item.status === 'clear' ? '✓' : item.status === 'review' ? '!' : '–'}</span><div><b>${h(item.label)}</b><p>${h(item.detail)}</p></div></div>`).join('')}
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
          <li>Closed only means closed/funded/disbursed — not merely signed.</li>
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

function renderBuyerValidationCommandCenter() {
  const rows = asArray(knoxvilleBuyerCallSheet?.rows);
  if (!rows.length) {
    return `<section class="validation-command loading"><span class="eyebrow">Buyer Validation Command Center</span><h3>Waiting on Knoxville call sheet.</h3><p>Run <code>npm run enrich:knoxville-builders</code> to load the permit-backed builder queue.</p></section>`;
  }
  const center = buildBuyerValidationCommandCenter(rows, workspace.buyerValidations || []);
  const selected = center.items.find(item => item.builderId === selectedValidationBuilderId) || center.next || center.items[0] || {};
  selectedValidationBuilderId = selected.builderId || selectedValidationBuilderId;
  const sellerCriteria = selected.sellerSearch?.eligible
    ? selected.sellerSearch.criteria.map(item => `<li>${h(item)}</li>`).join('')
    : selected.sellerSearch?.blockers?.map(item => `<li>${h(item)}</li>`).join('') || '<li>Complete buy-box fields to unlock seller search.</li>';
  const statusOptions = BUYER_VALIDATION_STATUSES.map(status => `<option value="${h(status)}" ${selected.callStatus === status ? 'selected' : ''}>${h(callStatusLabel(status))}</option>`).join('');
  const queue = center.items.map((item, index) => {
    const active = item.builderId === selected.builderId;
    const tone = item.validation.sellerEligible ? 'good' : item.route === 'humanReview' ? 'warn' : item.validation.buyBox.percent >= 67 ? 'warn' : 'neutral';
    return `<button type="button" class="validation-queue-item ${active ? 'active' : ''}" data-select-validation-builder="${h(item.builderId)}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(item.name)}</b>
      <small>${h(callStatusLabel(item.callStatus))} · ${h(item.recentBuilds)} permits · ${h(item.validation.buyBox.percent)}% buy box</small>
      ${badge(item.validation.sellerEligible ? 'seller search unlocked' : 'validation locked', tone)}
    </button>`;
  }).join('');
  const contact = [selected.phone, selected.email].filter(Boolean).join(' · ') || 'Public business contact unresolved';
  const scriptQuestions = Object.values(selected.buyBoxCapture || {}).map(item => `<li>${h(item)}</li>`).join('');
  const phoneHref = selected.phone ? `tel:${h(String(selected.phone).replace(/[^0-9+]/g, ''))}` : '#';
  const validationEmail = selected.emailDraft || {};
  const validationEmailSubject = validationEmail.subject || `Knoxville lots that fit ${selected.name || 'your team'}?`;
  const validationEmailBody = validationEmail.body || `Hi ${selected.contactName || selected.name || 'there'},

I’m tracking public permit-backed builder activity in Knoxville and want to only send lots that fit your exact buy box.

What zip codes/subdivisions, lot sizes, max lot price, utility/access requirements, closing timeline, monthly lot appetite, and deal killers should I screen for before sending anything?

Regards,
Okeito`;
  const mailHref = selected.email ? `mailto:${h(selected.email)}?subject=${encodeURIComponent(validationEmailSubject)}&body=${encodeURIComponent(validationEmailBody)}` : '#';
  return `<section class="validation-command" aria-label="Buyer Validation Command Center">
    <div class="validation-hero">
      <div>
        <span class="eyebrow">Buyer Validation Command Center</span>
        <h3>Turn permit activity into buyer truth.</h3>
        <p>An Apple-clean call cockpit for Knoxville builders: one active queue, one focused decision-maker form, and a hard gate that refuses seller sourcing until the buy box is real.</p>
      </div>
      <aside class="validation-orb">
        <span>Next money action</span>
        <strong>${h(center.next?.name || 'Call queue empty')}</strong>
        <p>${h(center.next?.validation?.nextAction || 'Load buyer rows.')}</p>
      </aside>
    </div>
    <div class="validation-metrics">
      <div><span>Builders</span><strong>${h(center.summary.total)}</strong></div>
      <div><span>Call-ready</span><strong>${h(center.summary.callReady)}</strong></div>
      <div><span>Validated</span><strong>${h(center.summary.validated)}</strong></div>
      <div><span>Avg buy box</span><strong>${h(center.summary.averageCompleteness)}%</strong></div>
    </div>
    <div class="validation-grid-main">
      <aside class="validation-queue"><div class="panel-kicker"><span>Call queue</span><b>ranked by validation leverage</b></div>${queue}</aside>
      <article class="validation-focus-card">
        <div class="validation-focus-head">
          <div><span class="eyebrow">Selected builder</span><h3>${h(selected.name || 'Select builder')}</h3><p><b>Permit market: Knoxville, Tennessee.</b> ${h(selected.recentBuilds || 0)} verified permit signals. Contact/HQ may be regional: ${h(contact)}</p></div>
          <div class="validation-score"><strong>${h(selected.validation?.score || 0)}</strong><span>validation score</span></div>
        </div>
        <div class="validation-actions">
          <a class="validation-call-button ${selected.phone ? '' : 'disabled'}" href="${phoneHref}">Call office</a>
          <a class="validation-call-button secondary ${selected.email ? '' : 'disabled'}" href="${mailHref}">Draft email</a>
          <button type="button" class="validation-call-button secondary copy-email-button" data-copy-validation-email>Copy email</button>
          ${selected.sourceUrl ? safeLink(selected.sourceUrl, 'Source proof', 'validation-call-button secondary') : ''}
          <span class="validation-email-status" aria-live="polite"></span>
        </div>
        <div class="validation-progress"><span style="width:${h(selected.validation?.buyBox?.percent || 0)}%"></span></div>
        <p class="validation-next-action">${h(selected.validation?.nextAction || '')}</p>
        <div class="validation-form" data-validation-form="${h(selected.builderId || '')}">
          <label>Call status <select class="validation-status">${statusOptions}</select></label>
          <label>Last contacted <input type="date" class="validation-last" value="${h(selected.lastContacted || '')}" /></label>
          <label>Callback date <input type="date" class="validation-callback" value="${h(selected.callbackDate || '')}" /></label>
          <label>Target geography <input class="validation-geography" value="${h(selected.buyBox?.geography || '')}" placeholder="West Knoxville, Karns, Hardin Valley..." /></label>
          <label>Lot-size band <input class="validation-lot" value="${h(selected.buyBox?.lotSize || '')}" placeholder="0.25–1.0 ac, infill/subdivision lots" /></label>
          <label>Max acquisition price <input class="validation-price" value="${h(selected.buyBox?.maxPrice || '')}" placeholder="65000" /></label>
          <label>Close speed / monthly appetite <input class="validation-speed" value="${h(selected.buyBox?.closeSpeed || '')}" placeholder="14–30 days / 2 lots per month" /></label>
          <label>Package recipient <input class="validation-recipient" value="${h(selected.buyBox?.packageRecipient || '')}" placeholder="Name + direct email for parcel packages" /></label>
          <label>Utilities / access rules <input class="validation-utilities" value="${h(selected.buyBox?.utilitiesAccess || '')}" placeholder="paved road, sewer nearby, water/electric at street" /></label>
          <label>Finished product <input class="validation-product" value="${h(selected.buyBox?.productType || '')}" placeholder="entry-level SFR, infill spec, move-up homes" /></label>
          <label>Deal killers <input class="validation-killers" value="${h(asArray(selected.buyBox?.dealKillers).join(', ') || selected.buyBox?.dealKillers || '')}" placeholder="steep slope, flood, wetlands, no frontage, title issue" /></label>
          <label class="wide">Exact buyer language <textarea class="validation-notes" placeholder="Paste what they actually said. No interpretation, no fabrication.">${h(selected.callNotes || '')}</textarea></label>
          <div class="validation-save-row"><button type="button" data-save-buyer-validation>Save validation</button><span class="validation-save-status"></span></div>
        </div>
      </article>
      <aside class="seller-unlock-card ${selected.sellerSearch?.eligible ? 'unlocked' : ''}">
        <div class="panel-kicker"><span>Seller search gate</span><b>${selected.sellerSearch?.eligible ? 'unlocked' : 'locked'}</b></div>
        <h4>${h(selected.sellerSearch?.headline || 'Seller search locked.')}</h4>
        <ul>${sellerCriteria}</ul>
        ${selected.sellerSearch?.eligible ? `<div class="unlock-price"><span>Suggested seller offer ceiling</span><strong>${formatMoney(selected.sellerSearch.offerCeiling)}</strong></div><p>${h(selected.sellerSearch.sellerAngle)}</p>` : '<p>Permit volume is only a demand signal. Seller calls wait until buyer criteria are captured.</p>'}
      </aside>
    </div>
    <details class="validation-script-drawer">
      <summary>Open exact buy-box questions + call script</summary>
      <div class="script-grid"><div><h5>Ask these fields</h5><ul>${scriptQuestions}</ul></div><div><h5>Public proof</h5><p>${h(selected.sourceEvidence || '')}</p><p>${h(selected.demandSignal || '')}</p></div></div>
      <pre>${h(selected.callScript || '')}</pre>
    </details>
  </section>`;
}

function renderKnoxvilleBuyerCallSheet() {
  const rows = asArray(knoxvilleBuyerCallSheet?.rows);
  if (!rows.length) {
    return `<section class="buyer-war-room loading"><span class="eyebrow">Knoxville Buyer War Room</span><h3>Buyer call sheet loading.</h3><p>Run <code>npm run enrich:knoxville-builders</code> if the generated call sheet is missing.</p></section>`;
  }
  const summary = knoxvilleBuyerCallSheet.summary || {};
  const primary = rows[0] || {};
  const rowCards = rows.map(row => {
    const tone = row.route === 'humanReview' ? 'warn' : 'good';
    const contact = [row.phone, row.email].filter(Boolean).join(' · ') || 'No reliable public contact yet';
    return `<article class="buyer-call-card ${row.route === 'humanReview' ? 'needs-review' : ''}">
      <div class="buyer-call-rank"><span>${String(row.rank).padStart(2, '0')}</span><b>${h(row.recentBuilds)}</b><small>permit signals</small></div>
      <div class="buyer-call-main">
        <div class="buyer-call-title"><h4>${h(row.name)}</h4>${badge(row.route === 'humanReview' ? 'human review' : 'call to validate', tone)}</div>
        <p>${h(contact)}</p>
        <div class="buyer-call-meta">
          <span>${safeLink(row.sourceUrl, row.sourceType || 'source')}</span>
          <span>${h(row.contactStatus)}</span>
          <span>${h(row.confidence)} confidence</span>
        </div>
        <details class="call-script-drawer">
          <summary>Open buy-box script + source proof</summary>
          <div class="script-grid">
            <div><h5>Public proof</h5><p>${h(row.sourceEvidence)}</p><p>${h(row.demandSignal)}</p></div>
            <div><h5>Buy-box questions</h5><ul>${Object.values(row.buyBoxCapture || {}).map(item => `<li>${h(item)}</li>`).join('')}</ul></div>
          </div>
          <pre>${h(row.callScript)}</pre>
        </details>
      </div>
    </article>`;
  }).join('');

  return `<section class="buyer-war-room" aria-label="Knoxville buyer call sheet">
    <div class="war-room-hero">
      <div>
        <span class="eyebrow">Knoxville Buyer War Room</span>
        <h3>Call builders with proof. Capture the buy box. Then touch sellers.</h3>
        <p>Top 10 KGIS permit-verified builders enriched with lawful public business contacts. Every row stays buyer-validation until exact geography, lot size, max price, close speed, package recipient, and deal killers are captured.</p>
      </div>
      <aside>
        <span>First call</span>
        <b>${h(primary.name)}</b>
        <p>${h(primary.phone || primary.email || 'find contact first')} · ${h(primary.recentBuilds || 0)} permit signals</p>
        ${safeLink('data/real/knoxville/buyer_call_sheet.csv', 'Download CSV', 'war-room-link')}
      </aside>
    </div>
    <div class="war-room-metrics">
      <div><span>Call sheet rows</span><strong>${h(summary.total || rows.length)}</strong></div>
      <div><span>Public business contacts</span><strong>${h(summary.callablePublicBusinessContacts || 0)}</strong></div>
      <div><span>Human review</span><strong>${h(summary.humanReview || 0)}</strong></div>
      <div><span>Recent build signals</span><strong>${h(summary.totalRecentBuildSignals || 0)}</strong></div>
    </div>
    <div class="buyer-call-sheet-list">${rowCards}</div>
  </section>`;
}

function renderBuilderListEnginePanel() {
  const target = document.querySelector('#builder-list-panel');
  if (!target) return;
  const builders = getPermitBuilders();
  const callSheetRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const displayedBuilderCount = builders.length || callSheetRows.length;
  const displayedTopSignal = builders[0]?.score || callSheetRows[0]?.recentBuilds || 0;
  const selected = getSelectedBuilder(builders) || {};
  const email = generateBuilderEmail(selected);
  const marketingEmail = generateBuilderMarketingEmailTemplate(selected);
  const callScript = generateBuilderCallScript(selected);
  const permits = asArray(selected.recentPermits).slice(0, 3);
  const permitLandscape = getPermitPortalLandscape();
  const adapterRows = getSourceAdapterChecklist().map(adapter => `<article class="adapter-card">
    <span>${h(adapter.name)}</span>
    <p>${h(adapter.use)}</p>
    <small>${adapter.fields.map(field => h(field)).join(' · ')}</small>
  </article>`).join('');
  const leadingMarketRows = asArray(permitLandscape.leadingMarkets).map(item => `<article class="priority-market-card">
    <strong>#${h(item.rank)} · ${h(item.state)}</strong>
    <b>${h(item.market)}</b>
    <p>${h(item.reason)}</p>
  </article>`).join('');
  const statePortalRows = permitLandscape.states.map(state => `<article class="permit-state-card">
    <div class="permit-state-head">
      <div><span>${h(state.state)}</span><p>${h(state.reality)}</p></div>
      <strong>${h(state.platforms.length)} platforms</strong>
    </div>
    <div class="permit-platform-tags">${state.platforms.map(platform => `<em>${h(platform)}</em>`).join('')}</div>
    <div class="portal-link-list">
      ${state.portals.map(portal => `<a href="${h(portal.url)}" target="_blank" rel="noopener noreferrer">
        <b>${h(portal.market)}</b>
        <span>${h(portal.jurisdiction)}</span>
        <small>${h(portal.system)}</small>
      </a>`).join('')}
    </div>
    <p class="permit-strategy">${h(state.strategy)}</p>
  </article>`).join('');
  const tierRows = permitLandscape.tiers.map(tier => `<article class="normalization-tier">
    <h4>${h(tier.name)}</h4>
    ${tier.items.map(item => `<p>${safeLink(item.url, item.label)} <span>${h(item.note)}</span></p>`).join('')}
  </article>`).join('');
  const tableRows = builders.map(builder => `<button type="button" class="builder-row ${builder.builderId === selected.builderId ? 'active' : ''}" data-select-builder="${h(builder.builderId)}">
    <span><b>${h(builder.companyName)}</b><small>${h(builder.sourceJurisdictions?.join(' · ') || 'source pending')}</small></span>
    <strong>${h(builder.qualifyingPermitCount)} permits</strong>
    <em>${h(builder.activityTier || 'active')}</em>
    <i>${h(builder.buyBoxStatus || 'unknown')}</i>
  </button>`).join('');
  const evidenceRows = permits.map((permit, index) => `<article class="permit-evidence-card">
    <span>${String(index + 1).padStart(2, '0')} · ${h(permit.permitStatus)}</span>
    <h4>${h(permit.permitType)}</h4>
    <p>${h(permit.siteAddress || 'address hidden')} · ${h(permit.jurisdiction || 'jurisdiction pending')}</p>
    <small>${h(permit.permitNumber)} · ${h(permit.issueDate)} · ${h(permit.licenseNumber || 'license pending')}</small>
  </article>`).join('');

  target.innerHTML = `<div class="builder-engine-shell">
    <section class="builder-hero-panel">
      <span class="eyebrow">Builder List Engine</span>
      <h3>Permit-verified builders before seller calls.</h3>
      <p>Surface builders with three or more recent approved/issued residential permits, then capture a real buy box before the OS promotes them to validated buyers.</p>
      <div class="title-metric-strip">
        <div><span>Verified builders</span><strong>${h(displayedBuilderCount)}</strong></div>
        <div><span>Evidence threshold</span><strong>3+</strong></div>
        <div><span>Top signal</span><strong>${h(displayedTopSignal)}</strong></div>
      </div>
    </section>

    ${renderBuyerValidationCommandCenter()}

    ${renderKnoxvilleBuyerCallSheet()}

    <section class="builder-grid-main">
      <aside class="builder-table-panel">
        <div class="panel-kicker"><span>Permit table</span><b>active builder signals</b></div>
        <div class="builder-table">${tableRows || '<p>No permit-verified builders yet.</p>'}</div>
      </aside>

      <article class="builder-detail-panel">
        <div class="panel-kicker"><span>3-permit evidence drawer</span><b>${h(selected.companyName || 'Select builder')}</b></div>
        <div class="builder-detail-header">
          <div><h3>${h(selected.companyName || 'No builder selected')}</h3><p>${h(selected.phone || 'phone pending')} · ${h(selected.email || 'email pending')}</p></div>
          ${badge(`${h(selected.buyBoxStatus || 'permitVerified')}`, selected.buyBoxStatus === 'captured' ? 'good' : 'warn')}
        </div>
        <div class="permit-evidence-grid">${evidenceRows}</div>
      </article>
    </section>

    <section class="builder-two-col">
      <article class="builder-form-panel">
        <div class="panel-kicker"><span>Buy-box capture</span><b>promote only after criteria</b></div>
        <div class="buybox-form" data-builder-form="${h(selected.builderId || '')}">
          <label>Zip codes / subdivisions <input class="builder-zip" value="${h(selected.buyBox?.zipCodes?.join(', ') || '')}" placeholder="33971, 33972, Palm Bay NW" /></label>
          <label>Lot size range <input class="builder-size" value="${h(selected.buyBox?.lotSizeRange || '')}" placeholder="0.23–0.29 ac" /></label>
          <label>Max price <input class="builder-price" value="${h(selected.buyBox?.maxPrice || '')}" placeholder="42000" /></label>
          <label>Deal killers <input class="builder-killers" value="${h(asArray(selected.buyBox?.dealKillers).join(', '))}" placeholder="wetlands, no road, flood AE" /></label>
          <label>Close speed / volume <input class="builder-speed" value="${h(selected.buyBox?.closeSpeedDays || '')}" placeholder="14 days / 5 lots month" /></label>
          <label>Submission method <input class="builder-submit" value="${h(selected.buyBox?.submissionMethod || '')}" placeholder="email Maya with APN + map" /></label>
          <button type="button" data-save-builder-buybox>Save buy box</button><span class="builder-save-status"></span>
        </div>
      </article>

      <article class="builder-script-panel">
        <div class="panel-kicker"><span>Copied scripts</span><b>call + email</b></div>
        <h4>Call script</h4><pre>${h(callScript)}</pre>
        <div class="button-row"><button type="button" class="secondary" data-copy-builder-script>Copy call script</button><span class="builder-script-status"></span></div>
        <h4>Buy-box capture email</h4><div class="email-subject"><span>Subject</span><strong>${h(email.subject)}</strong></div><pre>${h(email.body)}</pre>
        <div class="button-row"><button type="button" class="secondary" data-copy-builder-email>Copy buy-box email</button><span class="builder-email-status"></span></div>
        <h4>Marketing intro email template</h4><div class="email-subject"><span>Subject</span><strong>${h(marketingEmail.subject)}</strong></div><pre>${h(marketingEmail.body)}</pre>
        <div class="button-row"><button type="button" class="secondary" data-copy-builder-marketing-email>Copy marketing template</button><span class="builder-marketing-email-status"></span></div>
      </article>
    </section>

    <section class="builder-two-col">
      <article class="builder-vendor-panel">
        <div class="panel-kicker"><span>Landscaper/vendor sourcing</span><b>site-prep network</b></div>
        <p>Use vendors as condition-checkers, clearing/grading quote sources, and builder referral nodes.</p>
        <div class="vendor-chip-grid">
          ${['land clearing', 'grading', 'excavation', 'forestry mulching', 'tree removal', 'site prep', 'drainage', 'driveway/culvert', 'irrigation'].map(item => `<span>${h(item)}</span>`).join('')}
        </div>
        <pre>Hey {{Name}}, this is {{YourName}}. I work with landowners and builders around {{City}}. I’m looking for reliable local people who can help with clearing, grading, site-prep, and quick condition checks on vacant lots. Are you taking on that kind of work, and do you cover {{Area}}?</pre>
      </article>

      <article class="builder-adapter-panel wide-permit-panel">
        <div class="panel-kicker"><span>Permit portal landscape</span><b>five-state normalization map</b></div>
        <p class="permit-landscape-summary">${h(permitLandscape.summary)}</p>
        <h4>Lead-generation priority stack</h4>
        <div class="priority-market-grid">${leadingMarketRows}</div>
        <h4>Source adapter checklist</h4>
        <div class="adapter-grid">${adapterRows}</div>
        <h4>Target-state portals to monitor</h4>
        <div class="permit-state-grid">${statePortalRows}</div>
        <h4>Normalization playbook</h4>
        <div class="normalization-grid">${tierRows}</div>
      </article>
    </section>
  </div>`;
}

function renderClosingDeskPanel() {
  const target = document.querySelector('#title-closing-panel');
  if (!target) return;
  const visible = getVisibleParcels();
  const selected = getSelectedParcel(visible);
  if (!selected) {
    target.innerHTML = `<article class="card empty-state"><h3>No deal selected.</h3><p>Add a buyer-backed seller record before opening title.</p></article>`;
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
  target.innerHTML = `<div class="closing-layout">
    <aside class="deal-queue title-queue" aria-label="Closing file queue">
      <div class="queue-header"><span class="eyebrow">Closing files</span><strong>${h(scoredParcels().length)} deals</strong></div>
      <div class="queue-list">${alternatives}</div>
    </aside>
    <div>${renderTitleClosingDesk(selected, buyer)}</div>
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
      <span class="eyebrow">Land Dealflow OS · permit-market command center</span>
      <h1>Stop browsing. Start operating the market.</h1>
      <p>Form follows function: Tennessee permit evidence picks the builders, builder buy boxes pick the sellers, and the UI only promotes calls that can become assignment-fee cash.</p>
      <div class="vision-actions">
        <a class="button-link" href="#builders" data-view="builders">Open buyer war room</a>
        <a class="button-link secondary" href="#daily-calls">Seller calls with proof</a>
      </div>
      <div class="vision-proof-strip">
        <div><span>Permit market</span><strong>Knoxville, TN</strong><em>HQ/contact may be regional</em></div>
        <div><span>Builder signals</span><strong>${h(totalBuilderSignals)}</strong><em>${h(callableBuilders)} callable contacts</em></div>
        <div><span>Buy box</span><strong>${h(boxMeter.percent)}%</strong><em>${h(boxMeter.grade)} confidence</em></div>
        <div><span>Call-ready</span><strong>${h(moneyQueue.stats.callReady)}</strong><em>${h(buyerContactQueue.length)} buyer contacts</em></div>
      </div>
    </div>
    <aside class="mission-console" aria-label="Market mission console">
      <div class="mission-topbar"><span></span><span></span><span></span><b>MARKET OPS</b></div>
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

function renderCommandCenter() {
  const bestMarket = (workspace.markets || []).map(m => ({ ...m, score: scoreMarket(m) })).sort((a, b) => b.score.total - a.score.total)[0] || { name: 'None', score: { total: 0 } };
  const topBuyer = rankBuyers(workspace.buyers || [])[0] || { name: 'None', score: 0 };
  const parcelScores = scoredParcels();
  const moneyQueue = buildDailyMoneyQueue({ parcels: workspace.parcels || [], buyers: workspace.buyers || [], limit: 5, requireRealContact: true });
  const moneyCalls = [...moneyQueue.followUps, ...moneyQueue.today];
  const publicSkipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const buyerContactQueue = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()]);
  const buyerFirst = buildBuyerFirstBoard({ buyers: [...generatedCandidateBuyers(), ...enrichedBuilderContacts(), ...(workspace.buyers || [])], sellerCandidates: [...publicSkipTrace, ...(workspace.parcels || [])], limit: 25 });
  const leadBuyer = buyerFirst.validatedBuyers[0] || buyerContactQueue[0] || topBuyer;
  const buyerRows = (buyerFirst.validatedBuyers.length ? buyerFirst.validatedBuyers : buyerContactQueue).slice(0, 5).map((buyer, index) => `<article class="buyer-first-card ${index === 0 ? 'featured' : ''}"><span>${buyerFirst.validatedBuyers.includes(buyer) ? 'Validated buy box' : 'Contact first'}</span><b>${h(buyer.name || 'Buyer unknown')}</b><p>${h(buyer.buyBox || buyer.acquisitionNotes || buyer.task || 'Find contact and ask exact buy box.')}</p><em>${h(buyer.phone || buyer.email || buyer.website || `${buyer.recentBuilds || 0} build signals`)}</em></article>`).join('');
  const matchedRows = buyerFirst.sellerMatches.slice(0, 6).map((item, index) => `<div class="engine-row"><b>${index + 1}. ${h(item.address || item.parcelId)}</b><span>${h(item.buyerName)} · fit ${h(item.fitScore)} · ${h(item.nextAction)} · ${formatMoney(item.offer?.buyerPrice || item.buyerMaxPrice || 0)} buyer ceiling</span></div>`).join('') || '<p>No seller parcels selected yet. Validate at least one buyer buy box, then the seller list becomes precise.</p>';
  const heroCall = moneyCalls.find(call => call.id === selectedMoneyCallId) || moneyCalls[0] || {};
  selectedMoneyCallId = heroCall.id || '';
  const callRows = moneyCalls.length ? moneyCalls.map((call, index) => `<button type="button" class="money-call ${call.id === selectedMoneyCallId ? 'active' : ''}" data-select-money-call="${h(call.id)}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(call.ownerName || call.owner || 'owner unknown')}</b>
      <small>${h(call.address || 'No address')}</small>
      <em>${h(call.moneyStage)} · ${h(call.score)} score · ${formatMoney(call.projectedSpread)} spread</em>
    </button>`).join('') : '<article class="money-empty"><b>No real seller calls ready yet.</b><span>Import skip-traced owner phones. Public parcel records stay out of Today until a real phone/email matches.</span></article>';
  const outcomeButtons = Object.entries(CALL_OUTCOMES).map(([key, outcome]) => `<button type="button" class="outcome-chip" data-call-outcome="${h(key)}" ${heroCall.id ? '' : 'disabled'}>${h(outcome.label)}</button>`).join('');
  const script = heroCall.callScript || {};
  const boxMeter = calculateBuyBoxCompleteness(leadBuyer || {});
  const heroMotivation = heroCall.id ? calculateSellerMotivation(heroCall) : { score: 0, temperature: 'Cold', signals: [] };
  const netScript = heroCall.id ? generateSellerNetOfferScript(heroCall, getBuyer(heroCall)) : null;
  const todayChecklist = heroCall.id ? buildOperatorChecklist(heroCall, getBuyer(heroCall)) : null;
  const todayBuyerMemo = heroCall.id ? generateBuyerSendMemo(heroCall, getBuyer(heroCall), generateOfferPacket(heroCall, getBuyer(heroCall))) : null;
  document.querySelector('#command').innerHTML = `
    ${renderOperatorVisionHero({ leadBuyer, boxMeter, moneyQueue, publicSkipTrace, buyerContactQueue, heroMotivation, netScript })}
    <section class="phase-one-strip" aria-label="Phase one infusion controls">
      <article class="infusion-card land-photo-card"><img src="./assets/land-imagery/lehigh-golden-lot.png" alt="Dreamy DSLR view of a Lehigh vacant lot"><span class="eyebrow">Chapter I</span><h3>Buy box completeness</h3><p>${h(boxMeter.met)}/${h(boxMeter.total)} buyer facts captured before seller outreach.</p></article>
      <article class="infusion-card"><span class="eyebrow">Chapter II</span><h3>Seller motivation score</h3><div class="large-score">${h(heroMotivation.score)}<em>${h(heroMotivation.temperature)}</em></div><p>${h(heroMotivation.signals.slice(0, 2).join(' · ') || 'Select a callable seller to reveal motivation signals.')}</p></article>
      <article class="infusion-card land-photo-card"><img src="./assets/land-imagery/builder-edge-market.png" alt="Dreamy DSLR builder lots on a suburban edge market"><span class="eyebrow">Chapter III</span><h3>Seller net script</h3><p>${h(netScript?.headline || 'Choose a seller call to generate the net-cash opener.')}</p></article>
    </section>
    <section class="buyer-first-board" aria-label="Buyer-first buy box validation">
      <article class="buyer-first-lane"><span class="eyebrow">Step 1 · Buyer demand</span><h2>Validate a real buy box.</h2><div class="buyer-first-list">${buyerRows}</div></article>
      <article class="buyer-first-lane"><span class="eyebrow">Step 2 · Seller selection</span><h2>Only then choose parcels.</h2><div class="queue-card">${matchedRows}</div></article>
      <article class="buyer-first-lane script-card"><span class="eyebrow">Buyer call script</span><h2>“Do you actively buy Lehigh infill lots?”</h2><p>Ask: preferred streets/areas, lot size, max price, road/utilities requirements, flood/wetland kills, closing timeline, and whether they want off-market matches sent weekly.</p></article>
    </section>
    ${todayChecklist ? renderOperatorChecklist(todayChecklist, { compact: true }) : ''}
    ${todayBuyerMemo ? renderBuyerSendMemoCard(todayBuyerMemo, { compact: true }) : ''}
    ${heroCall.id ? renderBuyerFeedbackCapture(heroCall, getBuyer(heroCall)) : ''}
    <section id="daily-calls" class="cashflow-board" aria-label="Daily cashflow operating board">
      <div class="money-queue-panel">
        <div class="daily-heading"><span class="eyebrow">Today’s calls</span><h2>One queue. No wandering.</h2></div>
        <div class="money-call-list">${callRows}</div>
        <div class="money-stats">
          <div><span>Call-ready</span><b>${h(moneyQueue.stats.callReady)}</b></div>
          <div><span>Follow-ups due</span><b>${h(moneyQueue.stats.followUpsDue)}</b></div>
          <div><span>Buyer-backed</span><b>${h(moneyQueue.stats.buyerBacked)}</b></div>
          <div><span>Need skip trace</span><b>${h(publicSkipTrace.length)}</b></div>
          <div><span>Buyer contacts</span><b>${h(buyerContactQueue.length)}</b></div>
        </div>
      </div>
      <article class="call-script-panel" aria-label="What to say">
        <span class="eyebrow">What to say</span>
        <h2>${h(netScript?.opening || script.opening || 'No callable seller selected yet.')}</h2>
        <div class="script-grid">
          <div><span>Seller net line</span><b>${h(netScript?.netLine || script.anchorLine || 'No offer anchor yet.')}</b></div>
          <div><span>Motivation question</span><b>${h(netScript?.ask || script.motivationQuestion || 'Add seller contact data first.')}</b></div>
          <div><span>Buyer proof</span><b>${h(netScript?.buyerProof || script.buyerProof || heroCall.buyerBacking?.summary || 'No buyer proof yet.')}</b></div>
          <div><span>Risk / close</span><b>${h(netScript?.close || script.riskLine || 'No risk read yet.')}</b></div>
        </div>
      </article>
      <aside class="outcome-panel" aria-label="What happened after the call">
        <span class="eyebrow">What happened?</span>
        <h3>Tap the outcome while the call is fresh.</h3>
        <div class="outcome-grid">${outcomeButtons}</div>
        <div class="side-panel compact" aria-label="Today summary">
          <div><span>Best target area</span><b>${h(bestMarket.name)}</b><em>${bestMarket.score.total}/100 market score</em></div>
          <div><span>Most validated buyer</span><b>${h(topBuyer.name)}</b><em>${topBuyer.score}/100 buyer score</em></div>
          <div class="priority"><span>Clean pass parcels</span><b>${parcelScores.filter(p => p.risk.status === 'Pass').length}/${parcelScores.length}</b><em>fuel for tomorrow</em></div>
        </div>
      </aside>
    </section>`;
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
  target.innerHTML = `<div class="intake-grid">
    <section class="intake-card hero-intake"><span class="eyebrow">Buyer-first validation</span><h3>Call builders. Capture the buy box. Then touch sellers.</h3><p>Find a real acquisition contact, ask max price and kill criteria, and only send parcels that match confirmed demand.</p><div class="deal-strip three"><div><span>Buyer contacts needed</span><strong>${h(buyerQueue.length)}</strong></div><div><span>Top signal</span><strong>${h(sample?.recentBuilds || 0)}</strong></div><div><span>Market</span><strong>${h(sample?.market || 'lehigh')}</strong></div></div></section>
    <section class="intake-card"><h4>CSV format</h4><pre>buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice\n${h(sample?.buyerId || 'lehigh-builder-career-financial-corp')},${h(sample?.name || 'CAREER FINANCIAL CORP')},Acquisitions,239-555-8822,deals@example.com,https://example.com,"Lehigh quarter-acre lots under $42k",42000</pre><textarea id="buyer-contact-csv" rows="7" placeholder="buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice"></textarea><div class="button-row"><button id="load-buyer-contact-template" class="secondary" type="button">Use top builder signal</button><button id="import-buyer-contact" type="button">Import buyer contact</button><span id="buyer-contact-status"></span></div></section>
    <section class="intake-card queue-card"><h4>Top builder signals</h4>${buyerQueue.slice(0, 8).map((item, index) => `<div class="engine-row"><b>${index + 1}. ${h(item.name)}</b><span>${h(item.task)} · ${h(item.recentBuilds)} builds/signals · ${h(item.phone || item.website || 'find contact')}</span></div>`).join('') || '<p>All buyer contacts enriched.</p>'}</section>
  </div>`;
}

function skipTraceTemplateRow() {
  const item = asArray(generatedLeads?.queues?.skipTrace)[0] || {};
  return `parcelId,ownerName,ownerPhone,ownerEmail,skipTraceConfidence\n${item.parcelId || '274527L4110560090'},${item.ownerName || 'MONTEAN PETER & WENDY'},239-555-7722,owner@example.com,91`;
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

async function loadWeeklyMarketScout() {
  try {
    const response = await fetch('data/generated/weekly-market/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`weekly market ${response.status}`);
    weeklyMarketScout = await response.json();
  } catch (error) {
    weeklyMarketScout = { error: error.message };
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
  target.innerHTML = `<section class="weekly-market-card">
    <div class="weekly-market-head">
      <div><span class="eyebrow">Market Expansion Engine · week ${h(weeklyMarketScout.week || '')}</span><h3>${h(market.name || 'No market selected')}</h3><p>${h(market.thesis || 'No thesis generated yet.')}</p></div>
      <div class="market-grade"><span>Score</span><strong>${h(market.score ?? 0)}</strong><em>Grade ${h(market.grade || '—')}</em></div>
    </div>
    <div class="deal-strip four"><div><span>State</span><strong>${h(market.state || '—')}</strong></div><div><span>Status</span><strong>${h(market.nextStatus || market.status || 'research')}</strong></div><div><span>Mentioned as</span><strong>${h(market.mentionedAs || 'transcript market')}</strong></div><div><span>Generated</span><strong>${formatDateTime(weeklyMarketScout.generatedAt)}</strong></div></div>
    <div class="weekly-market-grid">
      <div><h4>Transcript criteria</h4>${criteria.map(item => `<div class="criterion-row"><b>${h(item.label)}</b><span>${h(item.score)}/10 · ${h(item.points)} pts · ${h(item.threshold)}</span></div>`).join('')}</div>
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
        history.replaceState(null, '', `#${view}`);
        setActiveView(view);
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
      selectedBuilderId = builderButton.dataset.selectBuilder;
      renderBuilderListEnginePanel();
      return;
    }

    const validationBuilderButton = event.target.closest('[data-select-validation-builder]');
    if (validationBuilderButton) {
      selectedValidationBuilderId = validationBuilderButton.dataset.selectValidationBuilder;
      renderBuilderListEnginePanel();
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

    if (event.target.matches('#export-filtered-csv')) {
      downloadText(`land-dealflow-filtered-${filter}-${new Date().toISOString().slice(0, 10)}.csv`, exportParcelsCsv(getVisibleParcels()));
    }

    if (event.target.matches('#export-top20-csv')) {
      const calls = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 20 });
      downloadText(`land-dealflow-top20-call-list-${new Date().toISOString().slice(0, 10)}.csv`, exportParcelsCsv(calls));
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


    if (event.target.matches('[data-copy-validation-email]')) {
      const center = buildBuyerValidationCommandCenter(asArray(knoxvilleBuyerCallSheet?.rows), workspace.buyerValidations || []);
      const builder = center.items.find(item => item.builderId === selectedValidationBuilderId) || center.next || center.items[0] || {};
      const email = builder.emailDraft || {};
      const subject = email.subject || `Knoxville lots that fit ${builder.name || 'your team'}?`;
      const body = email.body || `Hi ${builder.contactName || builder.name || 'there'},

I’m tracking public permit-backed builder activity in Knoxville and want to only send lots that fit your exact buy box.

What zip codes/subdivisions, lot sizes, max lot price, utility/access requirements, closing timeline, monthly lot appetite, and deal killers should I screen for before sending anything?

Regards,
Okeito`;
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
      const form = event.target.closest('[data-validation-form]');
      const builderId = form?.dataset.validationForm;
      const rows = asArray(knoxvilleBuyerCallSheet?.rows);
      const sourceRow = rows.find(item => item.builderId === builderId) || {};
      if (!builderId) return;
      const updated = {
        builderId,
        name: sourceRow.name || '',
        phone: sourceRow.phone || '',
        email: sourceRow.email || '',
        callable: sourceRow.callable || false,
        route: sourceRow.route || 'buyerValidation',
        recentBuilds: sourceRow.recentBuilds || 0,
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
        updatedAt: new Date().toISOString(),
      };
      workspace = { ...workspace, buyerValidations: [...asArray(workspace.buyerValidations).filter(item => item.builderId !== builderId), updated] };
      persistWorkspace();
      const status = form.querySelector('.validation-save-status');
      if (status) status.textContent = updated.callStatus === 'validated_buy_box' ? 'Validation saved; seller gate will unlock if required fields are complete.' : 'Validation saved.';
      renderBuilderListEnginePanel();
      return;
    }

    if (event.target.matches('[data-save-builder-buybox]')) {
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
      renderBuilderListEnginePanel();
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

  document.addEventListener('toggle', (event) => {
    const disclosure = event.target.closest?.('.source-disclosure');
    if (!disclosure || !disclosure.open) return;
    document.querySelectorAll('.source-disclosure[open]').forEach((other) => {
      if (other !== disclosure) other.open = false;
    });
  }, true);

  window.addEventListener('hashchange', () => {
    setActiveView((location.hash || '#today').replace('#', ''));
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
loadWeeklyMarketScout().then(renderAll);
