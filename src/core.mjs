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
    owner_name: 'ownerName',
    ownername: 'ownerName',
    owner_phone: 'ownerPhone',
    ownerphone: 'ownerPhone',
    owner_email: 'ownerEmail',
    owneremail: 'ownerEmail',
    owner_mailing_address: 'ownerMailingAddress',
    ownermailingaddress: 'ownerMailingAddress',
    skip_trace_confidence: 'skipTraceConfidence',
    skiptraceconfidence: 'skipTraceConfidence',
    buyer_contact_name: 'buyerContactName',
    buyercontactname: 'buyerContactName',
    buyer_phone: 'buyerPhone',
    buyerphone: 'buyerPhone',
    buyer_email: 'buyerEmail',
    buyeremail: 'buyerEmail',
    buyer_website: 'buyerWebsite',
    buyerwebsite: 'buyerWebsite',
    acquisition_notes: 'acquisitionNotes',
    acquisitionnotes: 'acquisitionNotes',
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

export const LEHIGH_IMPORT_HEADERS = [
  'address', 'market', 'buyerId', 'parcelId', 'lotSize', 'ownerName', 'ownerPhone', 'ownerEmail', 'ownerMailingAddress',
  'skipTraceConfidence', 'buyerContactName', 'buyerPhone', 'buyerEmail', 'buyerWebsite', 'acquisitionNotes',
  'buyerMaxPrice', 'lowestActiveListing', 'askingPrice', 'heldYears', 'paid', 'wetlands', 'floodZone', 'roadAccess',
  'utilities', 'slope', 'wildlifeFlag', 'crmStatus', 'nextFollowUp', 'notes'
];

export function getLehighImportTemplate() {
  const rows = [
    LEHIGH_IMPORT_HEADERS,
    ['123 Grant Blvd, Lehigh Acres, FL', 'lehigh', 'precision', '30-44-27-L1-01001.0010', '0.25 ac', 'Avery Santos', '239-555-0131', 'avery@example.com', '88 Pine St, Tampa FL 33602', 82, 'Maya Chen', '239-555-0100', 'maya@precisiongulf.example', 'https://precisiongulf.example', 'Buys paved-road quarter-acre infill lots under 42k', 42000, 48000, 28500, 11, 6200, 'none', false, true, 'nearby', 'flat', false, 'New', '', 'Template row: clean call-now candidate'],
    ['2511 W 9th St, Lehigh Acres, FL', 'lehigh', 'precision', '30-44-27-L2-03021.0000', '0.23 ac', 'Jordan Estate', '239-555-0199', '', 'PO Box 44, Fort Myers FL 33902', 71, 'Maya Chen', '239-555-0100', 'maya@precisiongulf.example', 'https://precisiongulf.example', 'Inherited owner; verify road and utilities', 42000, 46500, 31000, 14, 4500, 'none', false, true, 'unknown', 'flat', false, 'Researching', '', 'Call owner after utility check'],
    ['711 Meadow Rd, Lehigh Acres, FL', 'lehigh', 'precision', '30-44-27-L3-04041.0000', '0.25 ac', 'Morgan Trust', '239-555-0177', 'trust@example.com', '12 Oak Ave, Naples FL 34102', 64, 'Maya Chen', '239-555-0100', 'maya@precisiongulf.example', 'https://precisiongulf.example', 'Wetlands/access risk; likely kill', 42000, 47000, 35000, 17, 3000, 'likely', true, false, 'unknown', 'flat', true, 'Kill', '', 'Template row: risk kill example'],
  ];
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

export function buildTopCallList({ parcels = [], buyers = [], limit = 20 } = {}) {
  const rankedBuyers = rankBuyers(buyers);
  return parcels
    .map((parcel) => {
      const buyer = rankedBuyers.find(item => item.id === parcel.buyerId) || rankedBuyers.find(item => item.market === parcel.market) || {};
      const scored = scoreParcelDeal(parcel, buyer);
      return {
        ...scored,
        ownerName: parcel.ownerName || parcel.owner || '',
        ownerPhone: parcel.ownerPhone || '',
        ownerEmail: parcel.ownerEmail || '',
        ownerMailingAddress: parcel.ownerMailingAddress || '',
        skipTraceConfidence: parcel.skipTraceConfidence || '',
        buyerContactName: parcel.buyerContactName || buyer.contactName || '',
        buyerPhone: parcel.buyerPhone || buyer.phone || '',
        buyerEmail: parcel.buyerEmail || buyer.email || '',
        buyerWebsite: parcel.buyerWebsite || buyer.website || '',
        acquisitionNotes: parcel.acquisitionNotes || buyer.acquisitionNotes || '',
      };
    })
    .filter(parcel => parcel.action === 'Call now' && parcel.risk.status !== 'Kill' && Boolean(parcel.ownerPhone || parcel.ownerEmail))
    .sort((a, b) => b.score - a.score || b.metrics.spread - a.metrics.spread)
    .slice(0, limit)
    .map((parcel, index) => ({ ...parcel, callPriority: index + 1 }));
}

export function exportParcelsCsv(parcels = [], columns = [
  'address', 'ownerName', 'ownerPhone', 'ownerEmail', 'ownerMailingAddress', 'skipTraceConfidence',
  'buyerContactName', 'buyerPhone', 'buyerEmail', 'score', 'action', 'crmStatus', 'nextFollowUp',
  'buyerMaxPrice', 'askingPrice', 'spread', 'riskStatus', 'notes'
]) {
  const rows = [columns];
  for (const parcel of parcels) {
    rows.push(columns.map((column) => {
      if (column === 'spread') return parcel.metrics?.spread ?? parcel.spread ?? '';
      if (column === 'riskStatus') return parcel.risk?.status ?? parcel.riskStatus ?? '';
      return parcel[column] ?? '';
    }));
  }
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

function csvEscape(value) {
  const raw = String(value ?? '');
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export const NORMALIZATION_PRESETS = {
  'land-dealflow': {},
  'lee-county': {
    situsAddress: 'address',
    parcelNumber: 'parcelId',
    ownerName: 'ownerName',
    mailingAddress: 'ownerMailingAddress',
    justValue: 'lowestActiveListing',
  },
  propstream: {
    propertyAddress: 'address',
    apn: 'parcelId',
    owner1FullName: 'ownerName',
    ownerMailingAddress: 'ownerMailingAddress',
    estimatedValue: 'lowestActiveListing',
    phone1: 'ownerPhone',
    email1: 'ownerEmail',
  },
  landglide: {
    address: 'address',
    parcelId: 'parcelId',
    owner: 'ownerName',
    ownerAddress: 'ownerMailingAddress',
    assessedValue: 'lowestActiveListing',
  },
};

export function normalizeCsvToParcels(csvText, preset = 'land-dealflow', defaults = {}) {
  const records = parseCsvRecords(csvText);
  const mapping = NORMALIZATION_PRESETS[preset] || {};
  return records.map((record, index) => {
    const normalized = { ...defaults };
    for (const [key, value] of Object.entries(record)) {
      normalized[mapping[key] || key] = value;
    }
    return {
      market: 'lehigh',
      buyerId: 'precision',
      crmStatus: 'New',
      notes: '',
      nextFollowUp: '',
      ...normalized,
      id: normalized.id || normalized.parcelId || `normalized-${preset}-${Date.now()}-${index + 1}`,
    };
  });
}

export function findDuplicateParcels(parcels = []) {
  const groups = [];
  const seenPairs = new Set();
  const addGroup = (key, ids, reason) => {
    const unique = [...new Set(ids)].sort();
    if (unique.length < 2) return;
    const pairKey = unique.join('|');
    if (seenPairs.has(pairKey)) return;
    seenPairs.add(pairKey);
    groups.push({ key, reason, ids: unique });
  };
  const byParcelId = new Map();
  const byAddress = new Map();
  for (const parcel of parcels) {
    const id = parcel.id || parcel.parcelId || parcel.address;
    const parcelKey = String(parcel.parcelId || '').trim().toLowerCase();
    const addressKey = normalizeAddressKey(parcel.address);
    if (parcelKey) byParcelId.set(parcelKey, [...(byParcelId.get(parcelKey) || []), id]);
    if (addressKey) byAddress.set(addressKey, [...(byAddress.get(addressKey) || []), id]);
  }
  for (const [key, ids] of byParcelId) addGroup(key, ids, 'same parcel/APN');
  for (const [key, ids] of byAddress) addGroup(key, ids, 'same normalized address');
  return groups;
}

function normalizeAddressKey(address = '') {
  return String(address).toLowerCase()
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\bst\b/g, 'street')
    .replace(/\brd\b/g, 'road')
    .replace(/\bave\b/g, 'avenue')
    .replace(/[^a-z0-9]/g, '');
}

export function reportMissingData(parcels = []) {
  const rows = parcels.map((parcel) => {
    const missing = [];
    if (!parcel.address && !parcel.parcelId) missing.push('identity');
    if (!parcel.ownerName && !parcel.owner) missing.push('ownerName');
    if (!parcel.ownerPhone && !parcel.ownerEmail) missing.push('ownerContact');
    if (!parcel.buyerMaxPrice || !parcel.askingPrice) missing.push('pricing');
    if (!parcel.roadAccess || !parcel.utilities || parcel.utilities === 'unknown' || parcel.wetlands === '' || parcel.wetlands == null || parcel.floodZone === '' || parcel.floodZone == null) missing.push('buildability');
    return { id: parcel.id || parcel.parcelId || parcel.address, address: parcel.address || '', missing, severity: missing.length };
  }).sort((a, b) => b.severity - a.severity);
  return {
    totalParcels: parcels.length,
    rows,
    summary: {
      ownerContactMissing: rows.filter(row => row.missing.includes('ownerContact')).length,
      buildabilityMissing: rows.filter(row => row.missing.includes('buildability')).length,
      pricingMissing: rows.filter(row => row.missing.includes('pricing')).length,
      identityMissing: rows.filter(row => row.missing.includes('identity')).length,
    },
  };
}

export function getDataSourceChecklist(market = 'lehigh') {
  return [
    { id: 'county-parcel-export', label: 'County parcel export loaded', required: true, blocksCallList: false, detail: `${market}: APN, situs address, owner, mailing address, assessed/just value.` },
    { id: 'market-pricing-export', label: 'Pricing/comps attached', required: true, blocksCallList: false, detail: 'Lowest active listing, buyer max price, or estimated market value.' },
    { id: 'owner-contact-enrichment', label: 'Owner phone/email enriched', required: true, blocksCallList: true, detail: 'Skip-trace or direct contact field present before call-list export.' },
    { id: 'buildability-screen', label: 'Buildability screen complete', required: true, blocksCallList: true, detail: 'Wetlands, flood, road access, utilities, slope/wildlife checked.' },
    { id: 'duplicate-review', label: 'Duplicate APN/address review complete', required: true, blocksCallList: false, detail: 'Resolve duplicate APN/address groups before calling.' },
  ];
}

export function generateOwnerCallScript(parcel = {}, buyer = {}) {
  const firstName = String(parcel.ownerName || parcel.owner || 'there').split(/\s+/)[0];
  const address = parcel.address || 'your lot';
  const buyerContext = buyer.buyBox || 'buildable residential lots in this area';
  const ask = Number(parcel.askingPrice || 0);
  const max = Number(parcel.buyerMaxPrice || buyer.maxPrice || 0);
  return {
    opener: `Hi ${firstName}, this is a quick call about ${address}. Did I catch you at an okay time?`,
    positioning: `I work with buyers looking for ${buyerContext}. If the lot is buildable and the numbers are fair, we can make this simple.`,
    priceAnchor: ask ? `I saw value around ${ask.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}; if we handled closing and made it easy, what price would make sense for you?` : `If you were to sell it as-is, what price would make sense for you?`,
    maxBuyerContext: max ? `My buyer ceiling appears to be around ${max.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}, so I need room for closing, risk, and a spread.` : 'I need room for closing, risk, and a spread.',
    questions: [
      'Are you still the owner?',
      'Have you thought about selling this parcel?',
      'What made you keep it until now?',
      'Do you know if road access, utilities, wetlands, or flood restrictions are clean?',
      'If we covered normal closing costs, what price would you say yes to?',
    ],
    objections: [
      { objection: 'I want retail price.', reply: 'That may work with a retail buyer. My advantage is speed, certainty, and a simple close without listing friction.' },
      { objection: 'Send me an offer.', reply: 'I can, but I do not want to waste your time. If I can close quickly and cover normal closing costs, what range would you actually consider?' },
      { objection: 'I am not interested.', reply: 'Understood. Is that because you want to keep it long-term, or because the number would need to be higher?' },
    ],
    close: 'If that works, I will verify the parcel details and send a simple written offer with the next step clearly laid out.',
  };
}

export function buildFollowUpQueue(parcels = [], today = new Date().toISOString().slice(0, 10), horizonDays = 7) {
  const base = Date.parse(`${today}T00:00:00Z`);
  const terminal = new Set(['Dead', 'Kill', 'Assigned/Sold']);
  return parcels
    .filter(parcel => parcel.nextFollowUp && !terminal.has(parcel.crmStatus))
    .map((parcel) => {
      const due = Date.parse(`${parcel.nextFollowUp}T00:00:00Z`);
      const daysUntil = Math.round((due - base) / 86400000);
      return {
        ...parcel,
        daysUntil,
        urgency: daysUntil < 0 ? 'overdue' : daysUntil <= horizonDays ? 'due soon' : 'later',
      };
    })
    .filter(item => item.urgency !== 'later')
    .sort((a, b) => a.daysUntil - b.daysUntil || String(a.address || '').localeCompare(String(b.address || '')));
}

export function exportMailMergeCsv(parcels = []) {
  const columns = ['ownerName', 'ownerMailingAddress', 'ownerPhone', 'ownerEmail', 'address', 'askingPrice', 'crmStatus', 'nextFollowUp', 'notes'];
  const contactable = parcels.filter(parcel => parcel.ownerMailingAddress || parcel.ownerPhone || parcel.ownerEmail);
  return [columns.join(','), ...contactable.map(parcel => columns.map(col => csvEscape(parcel[col])).join(','))].join('\n');
}

export function bulkMarkContacted(workspace = {}, parcelIds = [], { date = new Date().toISOString().slice(0, 10), channel = 'phone', nextFollowUp = '', note = '' } = {}) {
  const selected = new Set(parcelIds);
  return {
    ...workspace,
    parcels: (workspace.parcels || []).map((parcel) => {
      if (!selected.has(parcel.id)) return parcel;
      const entry = `[${date} ${channel}] ${note || 'contact attempted'}`;
      return {
        ...parcel,
        crmStatus: 'Contacted',
        lastContacted: date,
        lastContactChannel: channel,
        nextFollowUp: nextFollowUp || parcel.nextFollowUp || '',
        notes: [parcel.notes, entry].filter(Boolean).join('\n'),
      };
    }),
  };
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
