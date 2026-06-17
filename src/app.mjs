import {
  scoreMarket,
  computeOffer,
  classifyParcelRisk,
  rankBuyers,
  scoreParcelDeal,
  applyCrmUpdate,
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
  calculateBuyerScorecard,
  captureBuyBox,
  addBuyerCallNote,
  buildDealFitMatrix,
  buildBuyerFeedbackLoop,
  formatMoney,
} from './core.mjs';

const STORAGE_KEY = 'land-dealflow-os-v2-workspace';

const seedMarkets = [
  { id: 'lehigh', name: 'Lehigh Acres, FL', thesis: 'High-volume cookie-cutter vacant lots with active builder demand.', newBuilds90d: 84, activeBuilders: 18, vacantLotSales90d: 99, offMarketVacantLots: 2400, lotStandardization: 9, growthSignal: 8, complianceSimplicity: 7, buildabilityRisk: 4 },
  { id: 'cape-coral', name: 'Cape Coral, FL', thesis: 'Canal/seawall value pockets; strong demand but wetlands/utilities must be checked.', newBuilds90d: 66, activeBuilders: 16, vacantLotSales90d: 76, offMarketVacantLots: 1800, lotStandardization: 8, growthSignal: 8, complianceSimplicity: 7, buildabilityRisk: 5 },
  { id: 'bentonville', name: 'NW Arkansas / Bentonville', thesis: 'Growth market with slope/setback risk; likely profitable if buildability is filtered.', newBuilds90d: 38, activeBuilders: 11, vacantLotSales90d: 46, offMarketVacantLots: 520, lotStandardization: 6, growthSignal: 9, complianceSimplicity: 8, buildabilityRisk: 6 },
  { id: 'houston-edge', name: 'Houston outskirts, TX', thesis: 'Mega-neighborhood growth and many builders; non-disclosure/texting caveats.', newBuilds90d: 91, activeBuilders: 22, vacantLotSales90d: 88, offMarketVacantLots: 1500, lotStandardization: 8, growthSignal: 9, complianceSimplicity: 4, buildabilityRisk: 4 },
];

const seedBuyers = [
  { id: 'precision', market: 'lehigh', name: 'Precision Gulf Homes', type: 'Spec Builder', recentBuilds: 18, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 14, repeatDemand: 9, maxPrice: 42000, contactName: 'Maya Chen', phone: '239-555-0100', email: 'maya@precisiongulf.example', website: 'https://precisiongulf.example', acquisitionNotes: 'Fastest buyer for clean paved-road Lehigh quarter-acre infill lots.', buyBox: '0.23–0.29 acre infill lots, paved road, no wetlands, $42k max', buyBoxCaptured: true, exactBuyBox: { targetMarkets: ['lehigh'], lotSizeMin: 0.23, lotSizeMax: 0.29, maxPrice: 42000, requiredRoadAccess: true, requiredUtilities: false, avoidFloodZones: ['AE'], avoidWetlands: true, notes: 'Paved-road quarter-acre Lehigh infill only.' }, validation: { calls: 4, answered: 3, buyBoxCaptured: true, proofOfFunds: true, feedbackCount: 3, acceptedDeals: 2, rejectedDeals: 1 }, callNotes: [{ date: '2026-06-16', contact: 'Maya Chen', outcome: 'answered', note: 'Confirmed paved road and no wetlands are non-negotiable.' }], feedback: [{ parcelId: 'parcel-1', decision: 'accept', reason: 'clean infill' }, { parcelId: 'parcel-4', decision: 'reject', reason: 'wetlands/access' }] },
  { id: 'sunbelt', market: 'cape-coral', name: 'Sunbelt Custom Builders', type: 'Custom Builder', recentBuilds: 11, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 21, repeatDemand: 7, maxPrice: 95000, contactName: 'Andre Wells', phone: '239-555-0144', email: 'land@sunbelt.example', website: 'https://sunbelt.example', acquisitionNotes: 'Likes utility-confirmed lots; seawall/canal premium only after verification.', buyBox: 'Quarter-acre residential lots, utilities nearby, seawall premium, $95k max' },
  { id: 'ozark', market: 'bentonville', name: 'Ozark Ridge Homes', type: 'Custom Builder', recentBuilds: 9, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 18, repeatDemand: 6, maxPrice: 65000, contactName: 'Nina Brooks', phone: '479-555-0182', email: 'acquisitions@ozarkridge.example', website: 'https://ozarkridge.example', acquisitionNotes: 'Needs slope/perc viability before soft commitment.', buyBox: '0.4–1.0 acre lots, gentle slope, perc viable, $65k max' },
  { id: 'investor', market: 'lehigh', name: 'Evergreen Land Fund', type: 'Land Investor', recentBuilds: 0, scatteredLots: false, hasBuyBox: true, closeSpeedDays: 30, repeatDemand: 4, maxPrice: 35000, contactName: 'Sam Patel', phone: '305-555-0108', email: 'sam@evergreenland.example', website: 'https://evergreenland.example', acquisitionNotes: 'Backup buyer; only use when builder spread fails.', buyBox: 'Will buy at 60–70% market only; backup buyer' },
];

const seedParcels = [
  { id: 'parcel-1', market: 'lehigh', buyerId: 'precision', address: '123 Grant Blvd, Lehigh Acres, FL', lotSize: '0.25 ac', owner: 'Out-of-state owner', ownerName: 'Avery Santos', ownerPhone: '239-555-0131', ownerEmail: 'avery@example.com', ownerMailingAddress: '88 Pine St, Tampa FL 33602', skipTraceConfidence: 82, buyerContactName: 'Maya Chen', buyerPhone: '239-555-0100', buyerEmail: 'maya@precisiongulf.example', buyerWebsite: 'https://precisiongulf.example', acquisitionNotes: 'Clean Lehigh candidate; call first.', buyerMaxPrice: 42000, lowestActiveListing: 48000, askingPrice: 28500, crmStatus: 'New', nextFollowUp: '', notes: '', heldYears: 11, paid: 6200, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'nearby', slope: 'flat', wildlifeFlag: false },
  { id: 'parcel-2', market: 'cape-coral', buyerId: 'sunbelt', address: '904 SW Canal Ter, Cape Coral, FL', lotSize: '0.23 ac', owner: 'Multiple-lot owner', buyerMaxPrice: 95000, lowestActiveListing: 112000, askingPrice: 76000, crmStatus: 'Researching', nextFollowUp: '', notes: 'Verify seawall/utilities premium.', heldYears: 8, paid: 21000, wetlands: 'review', floodZone: false, roadAccess: true, utilities: 'water+sewer', slope: 'flat', wildlifeFlag: false },
  { id: 'parcel-3', market: 'bentonville', buyerId: 'ozark', address: 'Lot 18 Ridge Line Dr, Bella Vista, AR', lotSize: '0.62 ac', owner: 'Absentee owner', buyerMaxPrice: 65000, lowestActiveListing: 74000, askingPrice: 54000, crmStatus: 'Researching', nextFollowUp: '', notes: 'Needs slope/perc review.', heldYears: 6, paid: 12000, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'unknown', slope: 'steep', wildlifeFlag: false },
  { id: 'parcel-4', market: 'lehigh', buyerId: 'precision', address: '711 Meadow Rd, Lehigh Acres, FL', lotSize: '0.25 ac', owner: 'Inherited owner', buyerMaxPrice: 42000, lowestActiveListing: 47000, askingPrice: 35000, crmStatus: 'Kill', nextFollowUp: '', notes: 'Killed by wetlands/access risk.', heldYears: 17, paid: 3000, wetlands: 'likely', floodZone: true, roadAccess: false, utilities: 'unknown', slope: 'flat', wildlifeFlag: true },
];

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
let filter = 'all';
let selectedParcelId = '';
let activeView = (location.hash || '#today').replace('#', '') || 'today';
const validViews = new Set(['today', 'deals', 'sources', 'machine']);

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return importWorkspace(saved);
  } catch (error) {
    console.warn('Could not load workspace', error);
  }
  return { markets: seedMarkets, buyers: seedBuyers, parcels: seedParcels };
}

function persistWorkspace() {
  localStorage.setItem(STORAGE_KEY, exportWorkspace(workspace));
}

function h(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
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
  return `<details class="source-disclosure">
    <summary><span>Source</span><b>${h(blueprint.label)}</b></summary>
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
    <label>Notes<textarea class="crm-notes" rows="2" placeholder="Call notes, seller ask, buyer feedback...">${h(parcel.notes || '')}</textarea></label>
    <button class="save-crm" type="button">Save CRM</button>
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
  document.querySelector('#pipeline').innerHTML = stages.map((stage, i) => `<div class="stage">
    <span>${String(i + 1).padStart(2, '0')}</span>
    <strong>${h(stage.name)}</strong>
    <p>${h(stage.desc)}</p>
    ${sourceDisclosure(stage.sourceType)}
  </div>`).join('');
}

function renderCommandCenter() {
  const bestMarket = (workspace.markets || []).map(m => ({ ...m, score: scoreMarket(m) })).sort((a, b) => b.score.total - a.score.total)[0] || { name: 'None', score: { total: 0 } };
  const topBuyer = rankBuyers(workspace.buyers || [])[0] || { name: 'None', score: 0 };
  const parcelScores = scoredParcels();
  const topCalls = buildTopCallList({ parcels: workspace.parcels || [], buyers: workspace.buyers || [], limit: 3 });
  const callNow = parcelScores.filter(p => p.action === 'Call now').length;
  const passParcels = parcelScores.filter(p => p.risk.status === 'Pass').length;
  const heroCall = topCalls[0] || parcelScores[0] || {};
  const callRows = topCalls.length ? topCalls.map((call, index) => `<article class="call-tile">
      <span>0${index + 1}</span>
      <b>${h(call.address || 'No address')}</b>
      <small>${h(call.ownerName || call.owner || 'owner unknown')} · ${h(call.ownerPhone || call.ownerEmail || 'contact missing')}</small>
      <em>${h(call.score ?? '')} score · spread ${formatMoney(Number(call.spread || call.metrics?.spread || 0))}</em>
    </article>`).join('') : '<article class="call-tile"><span>00</span><b>No calls ready</b><small>Import or generate parcels to create the daily callroom.</small><em>Waiting for deal flow</em></article>';
  document.querySelector('#command').innerHTML = `
    <div class="brand-hero">
      <div class="hero-copy">
        <span class="eyebrow">Land Dealflow OS · v1.8 split-pane deal desk</span>
        <h1>Three calls. One spread.</h1>
        <p>A quieter, lighter operating system for land wholesale leads: start with today’s calls, then drill into deals, sources, or machine-room controls only when needed.</p>
        <div class="hero-actions"><button type="button" data-view="deals">Review seller calls</button><button class="secondary" type="button" data-view="sources">Audit data sources</button></div>
      </div>
      <aside class="hero-deal-card" aria-label="Top deal today">
        <span>First call</span>
        <h2>${h(heroCall.address || 'Generate today’s call list')}</h2>
        <p>${h(heroCall.ownerName || heroCall.owner || 'Owner unknown')} · ${h(heroCall.ownerPhone || heroCall.ownerEmail || 'contact missing')}</p>
        <div class="deal-strip two"><div><span>Deal score</span><strong>${h(heroCall.score ?? 0)}</strong></div><div><span>Projected spread</span><strong>${formatMoney(Number(heroCall.spread || heroCall.metrics?.spread || 0))}</strong></div></div>
      </aside>
    </div>
    <section id="daily-calls" class="daily-calls" aria-label="Daily call priority">
      <div class="daily-heading"><span class="eyebrow">Today’s money path</span><h2>Make these calls before touching the plumbing.</h2></div>
      <div class="call-tile-grid">${callRows}</div>
      <div class="side-panel" aria-label="Today summary">
        <div><span>Best target area</span><b>${h(bestMarket.name)}</b><em>${bestMarket.score.total}/100 market score</em></div>
        <div><span>Most validated buyer</span><b>${h(topBuyer.name)}</b><em>${topBuyer.score}/100 buyer score</em></div>
        <div class="priority"><span>Seller calls ready</span><b>${callNow}/${parcelScores.length}</b><em>${passParcels} clean pass</em></div>
      </div>
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
      <details class="machine-panel" open>
        <summary><span>01</span><strong>Generated lead output</strong><em>Review conveyor belt health</em></summary>
        <div id="lead-engine-panel"></div>
      </details>
      <details class="machine-panel">
        <summary><span>02</span><strong>Import parcel data</strong><em>CSV, county exports, PropStream, LandGlide</em></summary>
        <p class="helper-copy">Paste only when you need to refresh the local workspace. The app normalizes source-specific headers into one parcel model.</p>
        <details class="mini-disclosure"><summary>Supported CSV fields</summary><p>address, market, buyerId, parcelId, lotSize, ownerName, ownerPhone, ownerEmail, ownerMailingAddress, skipTraceConfidence, buyerContactName, buyerPhone, buyerEmail, buyerWebsite, acquisitionNotes, buyerMaxPrice, lowestActiveListing, askingPrice, heldYears, paid, wetlands, floodZone, roadAccess, utilities, slope, wildlifeFlag, crmStatus, nextFollowUp, notes.</p></details>
        <textarea id="csv-input" rows="7" placeholder="address,market,buyerMaxPrice,roadAccess\n123 Grant Blvd,lehigh,42000,true"></textarea>
        <label class="preset-row">Source preset<select id="source-preset"><option value="land-dealflow">Land Dealflow template</option><option value="lee-county">Lee County property export</option><option value="propstream">PropStream export</option><option value="landglide">LandGlide export</option></select></label>
        <div class="button-row"><button id="load-lehigh-template" class="secondary" type="button">Use sample Lehigh CSV</button><button id="import-csv" type="button">Import parcel rows</button><span id="import-status"></span></div>
      </details>
      <details class="machine-panel">
        <summary><span>03</span><strong>Workspace backup</strong><em>Move or restore local state</em></summary>
        <textarea id="json-input" rows="7" placeholder="Paste exported workspace JSON here"></textarea>
        <div class="button-row"><button id="import-json" type="button">Restore JSON backup</button><button id="export-json" class="secondary" type="button">Download JSON backup</button><button id="reset-workspace" class="danger" type="button">Reset to seed data</button></div>
      </details>
      <details class="machine-panel">
        <summary><span>04</span><strong>Exports for action</strong><em>Call list, filtered CSV, mail merge</em></summary>
        <p class="helper-copy">Exports respect the active deal filter. Use the call-list export when you are ready to execute.</p>
        <div class="button-row"><button id="export-top20-csv" type="button">Download Top 20 seller call list</button><button id="export-filtered-csv" class="secondary" type="button">Download current deal view</button><button id="export-mailmerge-csv" class="secondary" type="button">Download mail merge file</button></div>
        <div id="top-call-list" class="call-list"></div>
      </details>
      <details class="machine-panel">
        <summary><span>05</span><strong>Data quality gate</strong><em>Find blockers before calling</em></summary>
        <div id="quality-gate"></div>
      </details>
      <details class="machine-panel">
        <summary><span>06</span><strong>Buyer validation</strong><em>Buy boxes, proof, rejection lessons</em></summary>
        <div class="button-row"><button id="capture-sample-buybox" type="button">Capture sample buy box</button><button id="add-sample-buyer-note" class="secondary" type="button">Add sample buyer note</button><span id="buyer-validation-status"></span></div>
        <div id="buyer-validation-panel"></div>
      </details>
      <details class="machine-panel">
        <summary><span>07</span><strong>Outreach execution</strong><em>Follow-ups and seller script</em></summary>
        <div class="button-row"><button id="bulk-contact-callnow" type="button">Mark all “Call now” as contacted</button><span id="outreach-status"></span></div>
        <div id="outreach-panel"></div>
      </details>
      <details class="machine-panel">
        <summary><span>08</span><strong>Offer packet generator</strong><em>Seller letter and buyer assignment memo</em></summary>
        <div class="button-row"><button id="export-deal-memo" type="button">Download current deal memo</button><span id="deal-memo-status"></span></div>
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

async function loadGeneratedLeads() {
  try {
    const response = await fetch('data/generated/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`lead engine ${response.status}`);
    generatedLeads = await response.json();
  } catch (error) {
    generatedLeads = { error: error.message };
  }
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
  const topCalls = queues.topSellerCalls || [];
  const buyerTasks = queues.buyerValidation || [];
  const offerReady = queues.offerReady || [];
  const buyerDiscovery = queues.buyerDiscovery || [];
  const sellerDiscovery = queues.sellerDiscovery || [];
  const sourceCandidates = snapshot.sourceCandidates || [];
  const blockers = queues.missingData || [];
  const sourceSummary = ['market', 'buyer', 'parcel', 'owner', 'offer', 'risk', 'crm'];
  target.innerHTML = `<div class="lead-engine-grid">
    <div class="deal-strip four hero-metrics"><div><span>Parcel leads</span><strong>${snapshot.parcels?.length || 0}</strong></div><div><span>Buyer leads</span><strong>${snapshot.buyers?.length || 0}</strong></div><div><span>Seller calls</span><strong>${topCalls.length}</strong></div><div><span>Source candidates</span><strong>${sourceCandidates.length}</strong></div></div>
    <details class="engine-column primary-column source-ledger"><summary><h4>Source ledger</h4><span>Last-sourced provenance by phase</span></summary><p>Every phase now exposes where the data comes from and when the underlying records were last sourced.</p>${sourceSummary.map(type => {
      const blueprint = sourceBlueprint[type];
      const status = getPhaseSourceStatus(type);
      return `<div class="engine-row"><b>${h(blueprint.label)}</b><span>${formatDateTime(status.latest)} · ${h(status.count)} records · ${status.ids.length ? status.ids.map(id => h(id)).join(', ') : 'derived/local'}</span></div>`;
    }).join('')}</details>
    <div class="engine-column primary-column"><h4>Call these sellers first</h4>${topCalls.slice(0, 3).map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item.address)}</b><span>${h(item.ownerName || 'owner')} · ${h(item.ownerPhone || item.ownerEmail || 'needs contact')} · score ${h(item.score ?? '')}</span></div>`).join('') || '<p>No seller calls generated yet.</p>'}</div>
    <div class="engine-column"><h4>Source candidates</h4>${sourceCandidates.slice(0, 4).map(source => `<div class="engine-row"><b>${h(source.areaName || source.market)} · ${h(source.platform)} · ${h(source.sourceType)}</b><span>${h(source.title)} · confidence ${h(source.confidence ?? '')}</span></div>`).join('') || '<p>No external source candidates discovered yet.</p>'}</div>
    <div class="engine-column"><h4>New-area discovery</h4>${[...buyerDiscovery, ...sellerDiscovery].slice(0, 4).map(task => `<div class="engine-row"><b>${h(task.areaName || task.market)}</b><span>${h(task.reason)} · ${h(task.task)}</span></div>`).join('') || '<p>All target areas have buyer and seller seed data.</p>'}</div>
    <div class="engine-column"><h4>Buyer validation</h4>${buyerTasks.slice(0, 4).map(task => `<div class="engine-row"><b>${h(task.name)}</b><span>${h(task.task)} · ${h(task.phone || task.website || 'find contact')}</span></div>`).join('') || '<p>No buyer-validation tasks generated yet.</p>'}</div>
    <div class="engine-column"><h4>Offer-ready</h4>${offerReady.slice(0, 4).map(item => `<div class="engine-row"><b>${h(item.address)}</b><span>${h(item.ownerName)} · ask ${h(item.askingPrice)} · max ${h(item.buyerMaxPrice)}</span></div>`).join('') || '<p>No offer-ready deals generated yet.</p>'}</div>
    <div class="engine-column"><h4>Blockers</h4>${blockers.filter(item => item.severity > 0).slice(0, 4).map(item => `<div class="engine-row"><b>${h(item.address || item.parcelId)}</b><span>Missing: ${h(item.missing || 'unknown')}</span></div>`).join('') || '<p>No critical blockers in generated leads.</p>'}</div>
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
    <div class="feedback-loop"><h4>Feedback loop</h4><div class="deal-strip"><div><span>Total feedback</span><strong>${loop.totalFeedback}</strong></div><div><span>Accepted</span><strong>${loop.accepted}</strong></div><div><span>Rejected</span><strong>${loop.rejected}</strong></div></div><p>${h(loop.lessons || 'No rejection lessons captured yet.')}</p></div>
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

function currentOfferPacket() {
  const candidate = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 1 })[0] || scoredParcels()[0];
  if (!candidate) return null;
  return generateOfferPacket(candidate, getBuyer(candidate));
}

function renderOfferPacketPanel() {
  const target = document.querySelector('#offer-packet-panel');
  if (!target) return;
  const packet = currentOfferPacket();
  if (!packet) {
    target.innerHTML = '<p>No parcel available for offer packet generation.</p>';
    return;
  }
  target.innerHTML = `<div class="packet-grid">
    <div class="packet-economics"><h4>${h(packet.address)}</h4><div class="deal-strip five"><div><span>Seller offer</span><strong>${formatMoney(packet.sellerOffer)}</strong></div><div><span>Assignment price</span><strong>${formatMoney(packet.assignmentPrice)}</strong></div><div><span>Projected spread</span><strong>${formatMoney(packet.projectedSpread)}</strong></div><div><span>Closing costs</span><strong>${formatMoney(packet.closingCosts)}</strong></div><div><span>Buyer</span><strong>${h(packet.buyerName || 'unknown')}</strong></div></div><p>${h(packet.summary)}</p></div>
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

    const parcelButton = event.target.closest('[data-select-parcel]');
    if (parcelButton) {
      selectedParcelId = parcelButton.dataset.selectParcel;
      renderParcels();
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

    if (event.target.matches('#import-json')) {
      const input = document.querySelector('#json-input');
      workspace = importWorkspace(input.value);
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('#reset-workspace')) {
      workspace = { markets: seedMarkets, buyers: seedBuyers, parcels: seedParcels };
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('.save-crm')) {
      const row = event.target.closest('.crm-row');
      const parcelId = row.dataset.parcelId;
      workspace = applyCrmUpdate(workspace, parcelId, {
        crmStatus: row.querySelector('.crm-status').value,
        nextFollowUp: row.querySelector('.crm-followup').value,
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
  renderPipeline();
  renderMarkets();
  renderBuyers();
  renderFilters();
  renderParcels();
  renderTopCallList();
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
