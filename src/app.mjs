import { scoreMarket, computeOffer, classifyParcelRisk, rankBuyers, formatMoney } from './core.mjs';

const markets = [
  { id: 'lehigh', name: 'Lehigh Acres, FL', thesis: 'High-volume cookie-cutter vacant lots with active builder demand.', newBuilds90d: 84, activeBuilders: 18, vacantLotSales90d: 99, offMarketVacantLots: 2400, lotStandardization: 9, growthSignal: 8, complianceSimplicity: 7, buildabilityRisk: 4 },
  { id: 'cape-coral', name: 'Cape Coral, FL', thesis: 'Canal/seawall value pockets; strong demand but wetlands/utilities must be checked.', newBuilds90d: 66, activeBuilders: 16, vacantLotSales90d: 76, offMarketVacantLots: 1800, lotStandardization: 8, growthSignal: 8, complianceSimplicity: 7, buildabilityRisk: 5 },
  { id: 'bentonville', name: 'NW Arkansas / Bentonville', thesis: 'Growth market with slope/setback risk; likely profitable if buildability is filtered.', newBuilds90d: 38, activeBuilders: 11, vacantLotSales90d: 46, offMarketVacantLots: 520, lotStandardization: 6, growthSignal: 9, complianceSimplicity: 8, buildabilityRisk: 6 },
  { id: 'houston-edge', name: 'Houston outskirts, TX', thesis: 'Mega-neighborhood growth and many builders; non-disclosure/texting caveats.', newBuilds90d: 91, activeBuilders: 22, vacantLotSales90d: 88, offMarketVacantLots: 1500, lotStandardization: 8, growthSignal: 9, complianceSimplicity: 4, buildabilityRisk: 4 },
];

const buyers = [
  { id: 'precision', market: 'lehigh', name: 'Precision Gulf Homes', type: 'Spec Builder', recentBuilds: 18, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 14, repeatDemand: 9, buyBox: '0.23–0.29 acre infill lots, paved road, no wetlands, $42k max' },
  { id: 'sunbelt', market: 'cape-coral', name: 'Sunbelt Custom Builders', type: 'Custom Builder', recentBuilds: 11, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 21, repeatDemand: 7, buyBox: 'Quarter-acre residential lots, utilities nearby, seawall premium, $95k max' },
  { id: 'ozark', market: 'bentonville', name: 'Ozark Ridge Homes', type: 'Custom Builder', recentBuilds: 9, scatteredLots: true, hasBuyBox: true, closeSpeedDays: 18, repeatDemand: 6, buyBox: '0.4–1.0 acre lots, gentle slope, perc viable, $65k max' },
  { id: 'investor', market: 'lehigh', name: 'Evergreen Land Fund', type: 'Land Investor', recentBuilds: 0, scatteredLots: false, hasBuyBox: true, closeSpeedDays: 30, repeatDemand: 4, buyBox: 'Will buy at 60–70% market only; backup buyer' },
];

const parcels = [
  { id: 'parcel-1', market: 'lehigh', buyerId: 'precision', address: '123 Grant Blvd, Lehigh Acres, FL', lotSize: '0.25 ac', owner: 'Out-of-state owner', buyerMaxPrice: 42000, lowestActiveListing: 48000, heldYears: 11, paid: 6200, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'nearby', slope: 'flat', wildlifeFlag: false },
  { id: 'parcel-2', market: 'cape-coral', buyerId: 'sunbelt', address: '904 SW Canal Ter, Cape Coral, FL', lotSize: '0.23 ac', owner: 'Multiple-lot owner', buyerMaxPrice: 95000, lowestActiveListing: 112000, heldYears: 8, paid: 21000, wetlands: 'review', floodZone: false, roadAccess: true, utilities: 'water+sewer', slope: 'flat', wildlifeFlag: false },
  { id: 'parcel-3', market: 'bentonville', buyerId: 'ozark', address: 'Lot 18 Ridge Line Dr, Bella Vista, AR', lotSize: '0.62 ac', owner: 'Absentee owner', buyerMaxPrice: 65000, lowestActiveListing: 74000, heldYears: 6, paid: 12000, wetlands: 'none', floodZone: false, roadAccess: true, utilities: 'unknown', slope: 'steep', wildlifeFlag: false },
  { id: 'parcel-4', market: 'lehigh', buyerId: 'precision', address: '711 Meadow Rd, Lehigh Acres, FL', lotSize: '0.25 ac', owner: 'Inherited owner', buyerMaxPrice: 42000, lowestActiveListing: 47000, heldYears: 17, paid: 3000, wetlands: 'likely', floodZone: true, roadAccess: false, utilities: 'unknown', slope: 'flat', wildlifeFlag: true },
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

function badge(text, tone = 'neutral') {
  return `<span class="badge ${tone}">${text}</span>`;
}

function renderMarkets() {
  const rows = markets.map((market) => {
    const score = scoreMarket(market);
    const tone = score.grade === 'A' ? 'good' : score.grade === 'B' ? 'warn' : 'bad';
    return `<article class="card market-card">
      <div class="card-top"><h3>${market.name}</h3>${badge(`Grade ${score.grade} · ${score.total}`, tone)}</div>
      <p>${market.thesis}</p>
      <div class="meter"><span style="width:${score.total}%"></span></div>
      <div class="mini-grid">
        <div><b>${market.newBuilds90d}</b><span>new builds / 90d</span></div>
        <div><b>${market.activeBuilders}</b><span>active builders</span></div>
        <div><b>${market.vacantLotSales90d}</b><span>land sales / 90d</span></div>
        <div><b>${market.offMarketVacantLots.toLocaleString()}</b><span>off-market lots</span></div>
      </div>
      <div class="tags">${score.reasons.map(r => badge(r, 'good')).join('')}${score.flags.map(f => badge(f, 'bad')).join('')}</div>
    </article>`;
  }).join('');
  document.querySelector('#markets').innerHTML = rows;
}

function renderBuyers() {
  const ranked = rankBuyers(buyers);
  document.querySelector('#buyers').innerHTML = ranked.map((buyer) => `<article class="card buyer-card">
    <div class="card-top"><h3>${buyer.name}</h3>${badge(`${buyer.score} buyer score`, buyer.score >= 70 ? 'good' : 'warn')}</div>
    <p>${buyer.type} · ${buyer.buyBox}</p>
    <div class="mini-grid four">
      <div><b>${buyer.recentBuilds}</b><span>recent builds</span></div>
      <div><b>${buyer.scatteredLots ? 'Yes' : 'No'}</b><span>scattered lots</span></div>
      <div><b>${buyer.closeSpeedDays}d</b><span>close speed</span></div>
      <div><b>${buyer.repeatDemand}/10</b><span>repeat demand</span></div>
    </div>
  </article>`).join('');
}

function renderParcels() {
  document.querySelector('#parcels').innerHTML = parcels.map((parcel) => {
    const offer = computeOffer({ buyerMaxPrice: parcel.buyerMaxPrice, lowestActiveListing: parcel.lowestActiveListing, riskDiscount: classifyParcelRisk(parcel).status === 'Review' ? 2500 : 0 });
    const risk = classifyParcelRisk(parcel);
    const riskTone = risk.status === 'Pass' ? 'good' : risk.status === 'Review' ? 'warn' : 'bad';
    return `<article class="card parcel-card">
      <div class="card-top"><h3>${parcel.address}</h3>${badge(risk.status, riskTone)}</div>
      <p>${parcel.lotSize} · ${parcel.owner} · held ${parcel.heldYears} yrs · paid ${formatMoney(parcel.paid)}</p>
      <div class="deal-strip">
        <div><span>Buyer price</span><b>${formatMoney(offer.buyerPrice)}</b></div>
        <div><span>Initial offer</span><b>${formatMoney(offer.initialSellerOffer)}</b></div>
        <div><span>Max offer</span><b>${formatMoney(offer.maxSellerOffer)}</b></div>
        <div><span>Target spread</span><b>${formatMoney(offer.targetSpread)}</b></div>
      </div>
      <div class="tags">${risk.flags.length ? risk.flags.map(f => badge(f, riskTone)).join('') : badge('clean first pass', 'good')}</div>
    </article>`;
  }).join('');
}

function renderPipeline() {
  document.querySelector('#pipeline').innerHTML = stages.map(([name, desc], i) => `<div class="stage">
    <span>${String(i + 1).padStart(2, '0')}</span>
    <strong>${name}</strong>
    <p>${desc}</p>
  </div>`).join('');
}

function renderCommandCenter() {
  const bestMarket = markets.map(m => ({...m, score: scoreMarket(m)})).sort((a, b) => b.score.total - a.score.total)[0];
  const topBuyer = rankBuyers(buyers)[0];
  const passParcels = parcels.filter(p => classifyParcelRisk(p).status === 'Pass').length;
  document.querySelector('#command').innerHTML = `
    <div class="hero-card">
      <span class="eyebrow">Land Dealflow OS · v0.1 prototype</span>
      <h1>Builder-first land lead generation, from market signal to owner call.</h1>
      <p>Prototype dashboard for finding suitable markets, scoring buyers, matching vacant parcels, pricing offers and filtering deal-killers before outreach.</p>
      <div class="hero-actions"><a href="#markets">Review markets</a><a class="secondary" href="#parcels">Inspect parcels</a></div>
    </div>
    <div class="side-panel">
      <div><span>Best market</span><b>${bestMarket.name}</b><em>${bestMarket.score.total}/100</em></div>
      <div><span>Top buyer</span><b>${topBuyer.name}</b><em>${topBuyer.score}/100</em></div>
      <div><span>Clean parcels</span><b>${passParcels}/${parcels.length}</b><em>first-pass</em></div>
    </div>`;
}

renderCommandCenter();
renderPipeline();
renderMarkets();
renderBuyers();
renderParcels();
