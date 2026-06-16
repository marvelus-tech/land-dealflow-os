import {
  scoreMarket,
  computeOffer,
  classifyParcelRisk,
  rankBuyers,
  parseCsvRecords,
  scoreParcelDeal,
  applyCrmUpdate,
  exportWorkspace,
  importWorkspace,
  CRM_STATUSES,
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
  { id: 'precision', market: 'lehigh', name: 'Precision Gulf Homes', type: 'Spec Builder', recentBuilds: 18, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 14, repeatDemand: 9, maxPrice: 42000, buyBox: '0.23–0.29 acre infill lots, paved road, no wetlands, $42k max' },
  { id: 'sunbelt', market: 'cape-coral', name: 'Sunbelt Custom Builders', type: 'Custom Builder', recentBuilds: 11, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 21, repeatDemand: 7, maxPrice: 95000, buyBox: 'Quarter-acre residential lots, utilities nearby, seawall premium, $95k max' },
  { id: 'ozark', market: 'bentonville', name: 'Ozark Ridge Homes', type: 'Custom Builder', recentBuilds: 9, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 18, repeatDemand: 6, maxPrice: 65000, buyBox: '0.4–1.0 acre lots, gentle slope, perc viable, $65k max' },
  { id: 'investor', market: 'lehigh', name: 'Evergreen Land Fund', type: 'Land Investor', recentBuilds: 0, scatteredLots: false, hasBuyBox: true, closeSpeedDays: 30, repeatDemand: 4, maxPrice: 35000, buyBox: 'Will buy at 60–70% market only; backup buyer' },
];

const seedParcels = [
  { id: 'parcel-1', market: 'lehigh', buyerId: 'precision', address: '123 Grant Blvd, Lehigh Acres, FL', lotSize: '0.25 ac', owner: 'Out-of-state owner', buyerMaxPrice: 42000, lowestActiveListing: 48000, askingPrice: 28500, crmStatus: 'New', nextFollowUp: '', notes: '', heldYears: 11, paid: 6200, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'nearby', slope: 'flat', wildlifeFlag: false },
  { id: 'parcel-2', market: 'cape-coral', buyerId: 'sunbelt', address: '904 SW Canal Ter, Cape Coral, FL', lotSize: '0.23 ac', owner: 'Multiple-lot owner', buyerMaxPrice: 95000, lowestActiveListing: 112000, askingPrice: 76000, crmStatus: 'Researching', nextFollowUp: '', notes: 'Verify seawall/utilities premium.', heldYears: 8, paid: 21000, wetlands: 'review', floodZone: false, roadAccess: true, utilities: 'water+sewer', slope: 'flat', wildlifeFlag: false },
  { id: 'parcel-3', market: 'bentonville', buyerId: 'ozark', address: 'Lot 18 Ridge Line Dr, Bella Vista, AR', lotSize: '0.62 ac', owner: 'Absentee owner', buyerMaxPrice: 65000, lowestActiveListing: 74000, askingPrice: 54000, crmStatus: 'Researching', nextFollowUp: '', notes: 'Needs slope/perc review.', heldYears: 6, paid: 12000, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'unknown', slope: 'steep', wildlifeFlag: false },
  { id: 'parcel-4', market: 'lehigh', buyerId: 'precision', address: '711 Meadow Rd, Lehigh Acres, FL', lotSize: '0.25 ac', owner: 'Inherited owner', buyerMaxPrice: 42000, lowestActiveListing: 47000, askingPrice: 35000, crmStatus: 'Kill', nextFollowUp: '', notes: 'Killed by wetlands/access risk.', heldYears: 17, paid: 3000, wetlands: 'likely', floodZone: true, roadAccess: false, utilities: 'unknown', slope: 'flat', wildlifeFlag: true },
];

const stages = [
  ['Market Finder', 'Score zip codes/suburbs for new builds, builders, vacant lot velocity and lot standardization.'],
  ['Buyer Finder', 'Find builders, land acquisition managers and repeat buyers. Capture exact buy boxes.'],
  ['Land Finder', 'Find vacant parcels matching buyer criteria, then filter for equity and owner motivation.'],
  ['Owner Contact', 'Find owner phone, email, mailing address and confidence score.'],
  ['Offer Engine', 'Price initial/max/kill offers from builder demand and seller net logic.'],
  ['Risk Filter', 'Flag wetlands, flood, slope, utilities, wildlife, access and zoning before contracts.'],
  ['Outreach CRM', 'Track calls, mailers, contracts, title handoff, seller updates and referrals.'],
];

let workspace = loadWorkspace();
let filter = 'all';

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
  const all = scoredParcels();
  const visible = all.filter(parcel => {
    if (filter === 'all') return true;
    if (filter === 'pass') return parcel.risk.status === 'Pass';
    if (filter === 'review') return parcel.risk.status === 'Review';
    if (filter === 'call') return parcel.action === 'Call now';
    if (filter === 'kill') return parcel.action === 'Kill' || parcel.crmStatus === 'Kill';
    return parcel.crmStatus === filter;
  });

  document.querySelector('#parcels').innerHTML = visible.map((parcel) => {
    const riskTone = parcel.risk.status === 'Pass' ? 'good' : parcel.risk.status === 'Review' ? 'warn' : 'bad';
    const actionTone = parcel.action === 'Call now' ? 'good' : parcel.action === 'Mail first' ? 'warn' : parcel.action === 'Kill' ? 'bad' : 'neutral';
    return `<article class="card parcel-card">
      <div class="card-top"><h3>${h(parcel.address || parcel.parcelId || 'Untitled parcel')}</h3><div class="badge-stack">${badge(`${parcel.score} deal score`, actionTone)}${badge(parcel.action, actionTone)}${badge(parcel.risk.status, riskTone)}</div></div>
      <p>${h(parcel.lotSize || 'lot size unknown')} · ${h(parcel.owner || 'owner unknown')} · held ${h(parcel.heldYears || 0)} yrs · paid ${formatMoney(Number(parcel.paid || 0))}</p>
      <div class="deal-strip five">
        <div><span>Buyer price</span><b>${formatMoney(parcel.offer.buyerPrice)}</b></div>
        <div><span>Seller ask</span><b>${formatMoney(parcel.metrics.askingPrice)}</b></div>
        <div><span>Initial offer</span><b>${formatMoney(parcel.offer.initialSellerOffer)}</b></div>
        <div><span>Max offer</span><b>${formatMoney(parcel.offer.maxSellerOffer)}</b></div>
        <div><span>Spread</span><b>${formatMoney(parcel.metrics.spread)}</b></div>
      </div>
      <div class="tags">${parcel.reasons.map(r => badge(r, 'good')).join('')}${parcel.flags.length ? parcel.flags.map(f => badge(f, riskTone)).join('') : badge('clean first pass', 'good')}</div>
      ${crmControls(parcel)}
    </article>`;
  }).join('') || `<article class="card"><h3>No parcels match this filter.</h3><p>Import records or change the filter.</p></article>`;
}

function renderPipeline() {
  document.querySelector('#pipeline').innerHTML = stages.map(([name, desc], i) => `<div class="stage">
    <span>${String(i + 1).padStart(2, '0')}</span>
    <strong>${h(name)}</strong>
    <p>${h(desc)}</p>
  </div>`).join('');
}

function renderCommandCenter() {
  const bestMarket = (workspace.markets || []).map(m => ({ ...m, score: scoreMarket(m) })).sort((a, b) => b.score.total - a.score.total)[0] || { name: 'None', score: { total: 0 } };
  const topBuyer = rankBuyers(workspace.buyers || [])[0] || { name: 'None', score: 0 };
  const parcelScores = scoredParcels();
  const callNow = parcelScores.filter(p => p.action === 'Call now').length;
  const passParcels = parcelScores.filter(p => p.risk.status === 'Pass').length;
  document.querySelector('#command').innerHTML = `
    <div class="hero-card">
      <span class="eyebrow">Land Dealflow OS · v0.2 operational cockpit</span>
      <h1>Import parcels, score deals, manage CRM follow-up, export the workspace.</h1>
      <p>Static local-first prototype. Your data stays in this browser via localStorage until you export or reset it.</p>
      <div class="hero-actions"><a href="#workspace">Import data</a><a class="secondary" href="#parcels-section">Work parcels</a></div>
    </div>
    <div class="side-panel">
      <div><span>Best market</span><b>${h(bestMarket.name)}</b><em>${bestMarket.score.total}/100</em></div>
      <div><span>Top buyer</span><b>${h(topBuyer.name)}</b><em>${topBuyer.score}/100</em></div>
      <div><span>Call-now parcels</span><b>${callNow}/${parcelScores.length}</b><em>${passParcels} clean pass</em></div>
    </div>`;
}

function renderWorkspaceTools() {
  const existing = document.querySelector('#workspace');
  if (!existing) return;
  existing.innerHTML = `<div class="section-heading">
      <span class="eyebrow">v0.2 Workspace</span>
      <h2>Import, persist, filter, export</h2>
      <p>Paste parcel CSV, import a saved JSON workspace, export your current work, or reset to seed data.</p>
    </div>
    <div class="workspace-grid">
      <article class="card tool-card">
        <h3>CSV parcel import</h3>
        <p>Headers supported: address, market, buyerId, lotSize, owner, buyerMaxPrice, lowestActiveListing, askingPrice, heldYears, paid, wetlands, floodZone, roadAccess, utilities, slope, wildlifeFlag, crmStatus, nextFollowUp, notes.</p>
        <textarea id="csv-input" rows="8" placeholder="address,market,buyerMaxPrice,roadAccess\n123 Grant Blvd,lehigh,42000,true"></textarea>
        <div class="button-row"><button id="import-csv" type="button">Import CSV parcels</button><span id="import-status"></span></div>
      </article>
      <article class="card tool-card">
        <h3>Workspace JSON</h3>
        <p>Use this to backup or move the browser-local workspace. Export includes markets, buyers, parcels, CRM status and notes.</p>
        <textarea id="json-input" rows="8" placeholder="Paste exported workspace JSON here"></textarea>
        <div class="button-row"><button id="import-json" type="button">Import JSON</button><button id="export-json" type="button">Download export</button><button id="reset-workspace" class="danger" type="button">Reset seed</button></div>
      </article>
    </div>`;
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    if (event.target.matches('#import-csv')) {
      const input = document.querySelector('#csv-input');
      const status = document.querySelector('#import-status');
      const records = parseCsvRecords(input.value).map((record, index) => ({
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
      const blob = new Blob([exportWorkspace(workspace)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `land-dealflow-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
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
    }
  });
}

function renderFilters() {
  const target = document.querySelector('#parcel-filters');
  if (!target) return;
  const options = [
    ['all', 'All'], ['call', 'Call now'], ['pass', 'Pass'], ['review', 'Review'], ['kill', 'Kill'],
    ...CRM_STATUSES.map(status => [status, status]),
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
}

bindEvents();
renderAll();
