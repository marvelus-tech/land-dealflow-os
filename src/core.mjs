export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function scoreMarket(market) {
  const components = {
    newConstruction: clamp((market.newBuilds90d / 40) * 20, 0, 20),
    builderBase: clamp((market.activeBuilders / 10) * 20, 0, 20),
    landVelocity: clamp((market.vacantLotSales90d / 80) * 15, 0, 15),
    vacantSupply: clamp((market.offMarketVacantLots / 1000) * 12, 0, 12),
    standardization: clamp((market.lotStandardization / 10) * 12, 0, 12),
    growth: clamp((market.growthSignal / 10) * 8, 0, 8),
    compliance: clamp((market.complianceSimplicity / 10) * 6, 0, 6),
    buildability: clamp(((10 - market.buildabilityRisk) / 10) * 7, 0, 7),
  };
  const total = Math.round(Object.values(components).reduce((sum, value) => sum + value, 0));
  const flags = [];
  const reasons = [];

  if (market.activeBuilders < 5) flags.push('too few builders');
  else if (market.activeBuilders >= 10) reasons.push('strong builder base');

  if (market.newBuilds90d < 5) flags.push('too little new construction');
  else if (market.newBuilds90d >= 25) reasons.push('active new construction');

  if (market.lotStandardization >= 7) reasons.push('cookie-cutter lot pattern');
  if (market.vacantLotSales90d >= 50) reasons.push('healthy vacant-land velocity');
  if (market.buildabilityRisk >= 7) flags.push('high buildability risk');
  if (market.complianceSimplicity <= 4) flags.push('compliance friction');

  let grade = 'D';
  if (total >= 80 && flags.length === 0) grade = 'A';
  else if (total >= 65) grade = 'B';
  else if (total >= 50) grade = 'C';

  return { total, grade, components, flags, reasons };
}

export function computeOffer({ buyerMaxPrice, desiredSpreadPct = 0.16, closingCosts = 1800, riskDiscount = 0, lowestActiveListing = null }) {
  const marketCeiling = lowestActiveListing ? Math.min(buyerMaxPrice, lowestActiveListing * 0.92) : buyerMaxPrice;
  const buyerPrice = Math.round(Math.min(buyerMaxPrice, marketCeiling));
  const targetSpread = Math.round(buyerPrice * desiredSpreadPct);
  const initialSellerOffer = Math.max(0, Math.round(buyerPrice - targetSpread - closingCosts - riskDiscount));
  const maxSellerOffer = Math.max(initialSellerOffer, Math.round(buyerPrice - Math.max(5000, targetSpread)));
  const killPrice = Math.round(buyerPrice - Math.max(7500, targetSpread * 0.9));
  return {
    buyerPrice,
    targetSpread,
    initialSellerOffer,
    maxSellerOffer,
    killPrice,
    estimatedClosingCosts: closingCosts,
    riskDiscount,
    sellerNetAngle: `Offer ${formatMoney(initialSellerOffer)} net, cover closing costs, close in 21–30 days.`,
  };
}

export function classifyParcelRisk(parcel) {
  const flags = [];
  if (parcel.wetlands && parcel.wetlands !== 'none') flags.push(`wetlands: ${parcel.wetlands}`);
  if (parcel.floodZone) flags.push('flood zone');
  if (!parcel.roadAccess) flags.push('no confirmed road access');
  if (!parcel.utilities || parcel.utilities === 'unknown') flags.push('utilities unknown');
  if (parcel.slope && parcel.slope !== 'flat' && parcel.slope !== 'gentle') flags.push(`slope: ${parcel.slope}`);
  if (parcel.wildlifeFlag) flags.push('protected wildlife risk');
  if (parcel.powerLine) flags.push('power line/easement risk');
  if (parcel.mainRoad) flags.push('main road exposure');

  let status = 'Pass';
  if (flags.length >= 4 || flags.some(flag => flag.includes('wetlands: likely') || flag.includes('no confirmed road access'))) status = 'Kill';
  else if (flags.length > 0) status = 'Review';
  return { status, flags };
}

export function rankBuyers(buyers) {
  return buyers
    .map((buyer) => {
      let score = 0;
      score += Math.min(30, buyer.recentBuilds * 2);
      score += buyer.scatteredLots ? 25 : 0;
      score += buyer.hasBuyBox ? 20 : 0;
      score += Math.max(0, 15 - Math.min(15, buyer.closeSpeedDays || 30) / 2);
      score += Math.min(10, buyer.repeatDemand || 0);
      return { ...buyer, score: Math.round(score) };
    })
    .sort((a, b) => b.score - a.score);
}

export const CRM_STATUSES = ['New', 'Researching', 'Owner Found', 'Contacted', 'Negotiating', 'Under Contract', 'Sent to Buyer', 'Assigned/Sold', 'Dead', 'Kill'];

export function parseCsvRecords(csvText) {
  const text = String(csvText || '').replace(/^\ufeff/, '').trim();
  if (!text) return [];
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some(cell => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some(cell => cell.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map(header => normalizeHeader(header));
  return rows.slice(1).map((cells, index) => {
    const record = { id: `import-${Date.now()}-${index + 1}` };
    headers.forEach((header, cellIndex) => {
      if (!header) return;
      record[header] = coerceCsvValue(cells[cellIndex] ?? '');
    });
    return record;
  });
}

function normalizeHeader(header) {
  const cleaned = String(header || '').trim();
  const aliases = {
    apn: 'parcelId',
    parcel_id: 'parcelId',
    parcelid: 'parcelId',
    buyer_max_price: 'buyerMaxPrice',
    buyermaxprice: 'buyerMaxPrice',
    lowest_active_listing: 'lowestActiveListing',
    lowestactivelisting: 'lowestActiveListing',
    asking_price: 'askingPrice',
    askingprice: 'askingPrice',
    road_access: 'roadAccess',
    roadaccess: 'roadAccess',
    flood_zone: 'floodZone',
    floodzone: 'floodZone',
    wildlife_flag: 'wildlifeFlag',
    wildlifeflag: 'wildlifeFlag',
    held_years: 'heldYears',
    heldyears: 'heldYears',
    crm_status: 'crmStatus',
    crmstatus: 'crmStatus',
    next_follow_up: 'nextFollowUp',
    nextfollowup: 'nextFollowUp',
    buyer_id: 'buyerId',
    buyerid: 'buyerId',
    lot_size: 'lotSize',
    lotsize: 'lotSize',
  };
  const snake = cleaned.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
  if (aliases[snake]) return aliases[snake];
  return snake.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function coerceCsvValue(value) {
  const raw = String(value ?? '').trim();
  if (raw === '') return '';
  if (/^(true|yes|y)$/i.test(raw)) return true;
  if (/^(false|no|n)$/i.test(raw)) return false;
  const numeric = raw.replace(/^\$/, '').replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(numeric)) return Number(numeric);
  return raw;
}

export function scoreParcelDeal(parcel, buyer = {}) {
  const risk = classifyParcelRisk(parcel);
  const offer = computeOffer({
    buyerMaxPrice: Number(parcel.buyerMaxPrice || buyer.maxPrice || buyer.buyerMaxPrice || 0),
    lowestActiveListing: Number(parcel.lowestActiveListing || 0) || null,
    riskDiscount: risk.status === 'Review' ? 2500 : risk.status === 'Kill' ? 7500 : 0,
  });
  const askingPrice = Number(parcel.askingPrice || parcel.sellerAsk || offer.initialSellerOffer || 0);
  const spread = Math.max(0, offer.buyerPrice - askingPrice);
  const spreadPct = offer.buyerPrice ? spread / offer.buyerPrice : 0;
  const reasons = [];
  const flags = [...risk.flags];
  let score = 0;

  if (risk.status === 'Pass') { score += 28; reasons.push('clean buildability pass'); }
  else if (risk.status === 'Review') { score += 12; flags.push('requires manual buildability review'); }
  else { score -= 20; flags.push('fatal buildability risk'); }

  if (buyer?.id && parcel.buyerId && buyer.id === parcel.buyerId) { score += 14; reasons.push('matched buyer buy box'); }
  else if (buyer?.market && parcel.market && buyer.market === parcel.market) { score += 8; reasons.push('same-market buyer fit'); }
  if (Number(buyer?.score || 0) >= 70) { score += 8; reasons.push('strong buyer demand'); }

  if (spreadPct >= 0.2) { score += 25; reasons.push('large spread'); }
  else if (spreadPct >= 0.12) { score += 18; reasons.push('healthy spread'); }
  else if (spreadPct >= 0.08) { score += 10; }
  else flags.push('thin spread');

  if (Number(parcel.heldYears || 0) >= 8) { score += 8; reasons.push('long-held owner'); }
  if (String(parcel.owner || '').match(/absentee|out-of-state|inherited|multiple/i)) { score += 9; reasons.push('motivated-owner signal'); }
  if (Number(parcel.paid || 0) > 0 && Number(parcel.paid) <= offer.buyerPrice * 0.45) { score += 8; reasons.push('low basis owner'); }

  if (risk.status === 'Kill') score = Math.min(score, 30);
  score = Math.round(clamp(score, 0, 100));
  let action = 'Research more';
  if (risk.status === 'Kill') action = 'Kill';
  else if (score >= 78) action = 'Call now';
  else if (score >= 60) action = 'Mail first';

  return {
    ...parcel,
    score,
    action,
    risk,
    offer,
    reasons,
    flags,
    metrics: { spread, spreadPct, askingPrice, buyerPrice: offer.buyerPrice },
  };
}

export function applyCrmUpdate(workspace, parcelId, updates) {
  return {
    ...workspace,
    parcels: (workspace.parcels || []).map(parcel => parcel.id === parcelId ? { ...parcel, ...updates, updatedAt: new Date().toISOString() } : parcel),
  };
}

export function exportWorkspace(workspace) {
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...workspace }, null, 2);
}

export function importWorkspace(serialized) {
  const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  return {
    markets: Array.isArray(parsed.markets) ? parsed.markets : [],
    buyers: Array.isArray(parsed.buyers) ? parsed.buyers : [],
    parcels: Array.isArray(parsed.parcels) ? parsed.parcels : [],
  };
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
