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

export const CALL_OUTCOMES = {
  call_attempted: { label: 'Call attempted', crmStatus: 'Contacted', followUpDays: 1, note: 'Call attempted.' },
  no_answer: { label: 'No answer', crmStatus: 'Contacted', followUpDays: 1, note: 'No answer. Try again tomorrow.' },
  left_voicemail: { label: 'Left voicemail', crmStatus: 'Contacted', followUpDays: 2, note: 'Left voicemail. Follow up in two days.' },
  seller_interested: { label: 'Seller interested', crmStatus: 'Negotiating', followUpDays: 1, note: 'Seller interested. Prepare/confirm offer terms.' },
  seller_rejected: { label: 'Seller rejected', crmStatus: 'Dead', followUpDays: null, note: 'Seller rejected the offer.' },
  needs_follow_up: { label: 'Needs follow-up', crmStatus: 'Contacted', followUpDays: 3, note: 'Needs follow-up. Re-open with buyer-backed proof.' },
  dead_lead: { label: 'Dead lead', crmStatus: 'Dead', followUpDays: null, note: 'Dead lead. Remove from active call queue.' },
};

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
    contact_name: 'buyerContactName',
    contactname: 'buyerContactName',
    phone: 'ownerPhone',
    phone1: 'ownerPhone',
    email: 'ownerEmail',
    email1: 'ownerEmail',
    website: 'buyerWebsite',
    buy_box: 'buyBox',
    buybox: 'buyBox',
    max_price: 'maxPrice',
    maxprice: 'maxPrice',
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

export function calculateBuyBoxCompleteness(buyer = {}) {
  const box = buyer.exactBuyBox || {};
  const checks = [
    { id: 'market', label: 'Target market named', met: Boolean((box.targetMarkets || []).length || buyer.market) },
    { id: 'lot-size', label: 'Lot size band', met: Boolean((box.lotSizeMin && box.lotSizeMax) || String(buyer.buyBox || '').match(/acre|ac|sf|lot/i)) },
    { id: 'price', label: 'Max buy price', met: Boolean(box.maxPrice || buyer.maxPrice || buyer.buyerMaxPrice) },
    { id: 'road', label: 'Road / access rule', met: box.requiredRoadAccess !== undefined || /road|access|paved/i.test(String(buyer.buyBox || buyer.acquisitionNotes || '')) },
    { id: 'risk', label: 'Wetland / flood kills', met: Boolean((box.avoidFloodZones || []).length || box.avoidWetlands !== undefined || /wetland|flood|kill/i.test(String(buyer.buyBox || buyer.acquisitionNotes || ''))) },
    { id: 'speed', label: 'Close speed', met: Boolean(buyer.closeSpeedDays) },
    { id: 'contact', label: 'Decision-maker contact', met: Boolean(buyer.phone || buyer.email || buyer.buyerPhone || buyer.buyerEmail || buyer.contactName || buyer.buyerContactName) },
    { id: 'proof', label: 'Funding / feedback proof', met: Boolean(buyer.validation?.proofOfFunds || buyer.validation?.feedbackCount || (buyer.feedback || []).length) },
  ];
  const met = checks.filter(check => check.met).length;
  const percent = Math.round((met / checks.length) * 100);
  const missing = checks.filter(check => !check.met).map(check => check.label);
  const grade = percent >= 88 ? 'A' : percent >= 70 ? 'B' : percent >= 50 ? 'C' : 'D';
  return { percent, grade, met, total: checks.length, checks, missing };
}

export function calculateSellerMotivation(parcel = {}) {
  const signals = [];
  let score = 0;
  const ownerText = `${parcel.owner || ''} ${parcel.ownerName || ''} ${parcel.ownerMailingAddress || ''}`;
  const heldYears = Number(parcel.heldYears || 0);
  const paid = Number(parcel.paid || 0);
  const ask = Number(parcel.askingPrice || parcel.sellerAsk || 0);

  if (/out-of-state|absentee/i.test(ownerText)) { score += 18; signals.push('absentee / out-of-area owner'); }
  if (/inherited|estate|heir|probate/i.test(ownerText)) { score += 16; signals.push('inherited / estate language'); }
  if (/multiple|llc|corp|trust/i.test(ownerText)) { score += 10; signals.push('portfolio-style owner'); }
  if (heldYears >= 15) { score += 18; signals.push('held 15+ years'); }
  else if (heldYears >= 8) { score += 12; signals.push('long-held parcel'); }
  if (paid > 0 && ask > 0 && paid <= ask * 0.35) { score += 14; signals.push('low basis vs current ask'); }
  else if (paid > 0 && Number(parcel.buyerMaxPrice || 0) && paid <= Number(parcel.buyerMaxPrice) * 0.45) { score += 12; signals.push('low basis vs buyer ceiling'); }
  if (parcel.ownerPhone || parcel.ownerEmail) { score += 10; signals.push('real owner contact found'); }
  if (Number(parcel.skipTraceConfidence || 0) >= 80) { score += 8; signals.push('high skip-trace confidence'); }
  if (/tax|vacant|unused|sell|motivated/i.test(String(parcel.notes || ''))) { score += 8; signals.push('motivation note'); }
  if (String(parcel.crmStatus || '').match(/Negotiating|Contacted/i)) { score += 8; signals.push('conversation already open'); }

  score = Math.round(clamp(score, 0, 100));
  const temperature = score >= 75 ? 'Hot' : score >= 55 ? 'Warm' : score >= 35 ? 'Watch' : 'Cold';
  return { score, temperature, signals };
}

export function calculateContractReadiness(parcel = {}, buyer = {}) {
  const risk = classifyParcelRisk(parcel);
  const blockers = [];
  if (risk.status !== 'Pass') blockers.push('buildability still needs review');
  if (!(parcel.ownerPhone || parcel.ownerEmail)) blockers.push('real seller contact missing');
  if (!(buyer.phone || buyer.email || buyer.buyerPhone || buyer.buyerEmail)) blockers.push('buyer contact missing');
  if (!Number(parcel.buyerMaxPrice || buyer.maxPrice || buyer.buyerMaxPrice || 0)) blockers.push('buyer ceiling missing');
  if (!Number(parcel.askingPrice || parcel.sellerAsk || 0)) blockers.push('seller ask / offer anchor missing');
  const ready = blockers.length === 0;
  const score = Math.round(clamp(100 - blockers.length * 18, 0, 100));
  return { ready, score, label: ready ? 'Attorney/title packet ready' : 'Ops gate not ready', blockers };
}

export function generateSellerNetOfferScript(parcel = {}, buyer = {}) {
  const offer = computeOffer({
    buyerMaxPrice: Number(parcel.buyerMaxPrice || buyer.maxPrice || buyer.buyerMaxPrice || 0),
    lowestActiveListing: Number(parcel.lowestActiveListing || 0) || null,
    riskDiscount: classifyParcelRisk(parcel).status === 'Review' ? 2500 : 0,
  });
  const sellerNet = Math.max(0, offer.initialSellerOffer);
  const ownerName = String(parcel.ownerName || parcel.owner || 'there').split(/\s+/)[0];
  const buyerProof = buyer.name ? `${buyer.name} is buying this exact kind of lot when road/access and buildability are clean.` : 'I only move forward when a real buyer already wants this kind of lot.';
  return {
    headline: `${formatMoney(sellerNet)} estimated net-style opening offer`,
    opening: `Hi ${ownerName}, I am calling about ${parcel.address || 'your lot'}. I work buyer-first, so I only call owners when the parcel appears to match real demand.`,
    netLine: `If title and buildability check out, my clean opening would be around ${formatMoney(sellerNet)} with normal seller closing costs handled through title, not a drawn-out listing process.`,
    buyerProof,
    ask: 'If that were simple, what number would make you say yes instead of keeping it another year?',
    close: 'If the range is close, I will verify title/buildability and send a simple written offer for attorney/title review.',
  };
}

export function generateNeighborPrompt(parcel = {}) {
  const street = String(parcel.address || 'this street').split(',')[0];
  return `After this call, search adjacent parcels around ${street}. Ask: “Do you know any neighbors on this block who also own unused land and might want a clean cash exit?”`;
}

export function buildOperatorChecklist(parcel = {}, buyer = {}) {
  const scored = parcel.offer ? parcel : scoreParcelDeal(parcel, buyer);
  const contract = calculateContractReadiness(scored, buyer);
  const motivation = calculateSellerMotivation(scored);
  const buyerContact = Boolean(scored.buyerPhone || scored.buyerEmail || buyer.phone || buyer.email);
  const negotiated = Number(scored.negotiatedSellerMin || scored.negotiatedSellerMax || scored.negotiatedSellerPrice || 0) > 0
    || /negotiat|seller interested|range|counter|accepted|offer/i.test(String(scored.notes || ''))
    || scored.callOutcome === 'seller_interested'
    || String(scored.crmStatus || '').match(/Negotiating|Under Contract|Sent to Buyer|Assigned/i);
  const titleStatus = String(scored.titlePacketStatus || '').toLowerCase();
  const titleReady = contract.ready || ['draft', 'attorney-reviewed', 'title-opened', 'active'].includes(titleStatus);
  const buyerMemoReady = ['drafted', 'sent', 'accepted'].includes(String(scored.buyerMemoStatus || '').toLowerCase())
    || String(scored.crmStatus || '').match(/Sent to Buyer|Assigned/i);
  const assignmentReady = ['accepted', 'signed', 'deposited', 'closed'].includes(String(scored.assignmentStatus || '').toLowerCase())
    || String(scored.crmStatus || '').match(/Assigned|Sold/i);
  const steps = [
    { id: 'call-outcome', label: 'Seller call outcome captured', done: Boolean(scored.callOutcome || ['Contacted', 'Negotiating', 'Under Contract', 'Sent to Buyer', 'Assigned/Sold', 'Dead'].includes(scored.crmStatus)), detail: scored.callOutcome || scored.crmStatus || 'Tap a call outcome while the call is fresh.' },
    { id: 'negotiated-range', label: 'Negotiated seller range', done: negotiated, detail: negotiated ? 'Range captured or seller is in negotiation.' : `Anchor between ${formatMoney(scored.offer?.initialSellerOffer || 0)} and ${formatMoney(scored.offer?.maxSellerOffer || 0)}.` },
    { id: 'title-packet', label: 'Attorney/title packet gate', done: titleReady, detail: titleReady ? (scored.titlePacketStatus || contract.label) : contract.blockers.join(' · ') || 'Needs attorney/title packet status.' },
    { id: 'buyer-send-memo', label: 'Buyer-send memo ready', done: buyerMemoReady, detail: buyerMemoReady ? (scored.buyerMemoStatus || 'Memo moved to buyer.') : `${buyer.name || 'Buyer'} needs price, risk, title status, and deadline.` },
    { id: 'assignment-close', label: 'Assignment close path', done: assignmentReady, detail: assignmentReady ? (scored.assignmentStatus || 'Assignment path active.') : 'Get buyer go/no-go, earnest money timing, assignment fee/title confirmation.' },
  ];
  const complete = steps.filter(step => step.done).length;
  let probability = 8;
  probability += complete * 14;
  probability += contract.ready ? 10 : 0;
  probability += motivation.score >= 65 ? 8 : motivation.score >= 45 ? 4 : 0;
  probability += buyerContact ? 8 : 0;
  probability += Number(scored.metrics?.spread || 0) >= 10000 ? 8 : 0;
  probability -= scored.risk?.status === 'Review' ? 8 : scored.risk?.status === 'Kill' ? 35 : 0;
  probability = Math.round(clamp(probability, 0, 95));
  const next = steps.find(step => !step.done) || { id: 'closed', label: 'Close and collect assignment fee', detail: 'All checklist gates complete.' };
  return { steps, complete, total: steps.length, probability, next, contract, motivation };
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

function addDays(dateValue, days) {
  const date = new Date(dateValue || Date.now());
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isDue(dateValue, now = new Date().toISOString()) {
  if (!dateValue) return false;
  return String(dateValue).slice(0, 10) <= new Date(now).toISOString().slice(0, 10);
}

export function buildCallScript({ parcel = {}, buyer = {} } = {}) {
  const scored = parcel.offer ? parcel : scoreParcelDeal(parcel, buyer);
  const ownerFull = scored.ownerName || scored.owner || 'there';
  const owner = String(ownerFull).split(/\s+/)[0] || ownerFull;
  const address = scored.address || scored.parcelId || 'your lot';
  const buyerName = buyer.name || scored.buyerName || 'a local builder buyer';
  const buyerMax = Number(scored.offer?.buyerPrice || scored.buyerMaxPrice || buyer.maxPrice || 0);
  const initial = Number(scored.offer?.initialSellerOffer || 0);
  const max = Number(scored.offer?.maxSellerOffer || initial);
  const spread = Number(scored.metrics?.spread || Math.max(0, buyerMax - Number(scored.metrics?.askingPrice || scored.askingPrice || 0)));
  const riskStatus = scored.risk?.status || classifyParcelRisk(scored).status;
  return {
    opening: `Hi ${owner}, this is Okeito. I’m calling about the lot at ${address} — would you consider a clean cash offer if we covered closing costs?`,
    motivationQuestion: 'What would make selling worth it for you right now — speed, certainty, or price?',
    anchorLine: `I would start around ${formatMoney(initial)} and can stretch toward ${formatMoney(max)} if title, access, and buyer fit stay clean.`,
    buyerProof: `${buyerName} is the buyer-backstop: max around ${formatMoney(buyerMax)}, ${buyer.buyBox || buyer.acquisitionNotes || 'looking for clean buildable lots in this market'}.`,
    riskLine: `Current risk read: ${riskStatus}. ${scored.flags?.length ? scored.flags.join(', ') : 'No first-pass buildability blockers.'}`,
    closeLine: `If ${formatMoney(initial)} net is close, I can confirm terms and move this into an offer packet today.`,
    objection: `If they ask for more: stay under ${formatMoney(max)} unless buyer price improves; otherwise mark follow-up or dead lead.`,
    summary: `Open at ${formatMoney(initial)}, do not exceed ${formatMoney(max)}, target spread ${formatMoney(spread)}.`,
  };
}

function buyerForParcel(parcel, rankedBuyers) {
  return rankedBuyers.find(item => item.id === parcel.buyerId) || rankedBuyers.find(item => item.market === parcel.market) || {};
}

function enrichMoneyCall(parcel, buyer, index = 0, moneyStage = 'Call now') {
  const scored = scoreParcelDeal(parcel, buyer);
  const callScript = buildCallScript({ parcel: scored, buyer });
  const buyerName = buyer.name || scored.buyerContactName || 'buyer missing';
  return {
    ...scored,
    callPriority: index + 1,
    moneyStage,
    ownerName: scored.ownerName || scored.owner || '',
    ownerPhone: scored.ownerPhone || '',
    ownerEmail: scored.ownerEmail || '',
    buyerName,
    buyerContactName: scored.buyerContactName || buyer.contactName || buyer.name || '',
    buyerPhone: scored.buyerPhone || buyer.phone || '',
    buyerEmail: scored.buyerEmail || buyer.email || '',
    offerAnchor: scored.offer.initialSellerOffer,
    maxOffer: scored.offer.maxSellerOffer,
    projectedSpread: scored.metrics.spread,
    callScript,
    buyerBacking: {
      name: buyerName,
      maxPrice: scored.offer.buyerPrice,
      buyBox: buyer.buyBox || buyer.acquisitionNotes || 'No buy box captured yet.',
      summary: `${buyerName} can plausibly pay ${formatMoney(scored.offer.buyerPrice)}; call below ${formatMoney(scored.offer.maxSellerOffer)} to protect ${formatMoney(scored.metrics.spread)} spread.`,
    },
  };
}

export function buildDailyMoneyQueue({ parcels = [], buyers = [], limit = 5, now = new Date().toISOString(), requireRealContact = false } = {}) {
  const rankedBuyers = rankBuyers(buyers);
  const enriched = parcels.map((parcel) => enrichMoneyCall(parcel, buyerForParcel(parcel, rankedBuyers)));
  const callable = enriched.filter(parcel => {
    const hasContact = Boolean(parcel.ownerPhone || parcel.ownerEmail);
    const isReal = !requireRealContact || Boolean(parcel.skipTraceImportedAt || parcel.realContact === true);
    return parcel.action === 'Call now' && parcel.risk.status !== 'Kill' && hasContact && isReal;
  });
  const followUps = callable
    .filter(parcel => ['Contacted', 'Negotiating', 'Under Contract'].includes(parcel.crmStatus) && isDue(parcel.nextFollowUp, now))
    .sort((a, b) => b.score - a.score || b.projectedSpread - a.projectedSpread)
    .slice(0, limit)
    .map((parcel, index) => ({ ...parcel, callPriority: index + 1, moneyStage: 'Follow-up due' }));
  const today = callable
    .filter(parcel => !['Contacted', 'Negotiating', 'Under Contract', 'Dead', 'Kill'].includes(parcel.crmStatus || 'New'))
    .sort((a, b) => b.score - a.score || b.projectedSpread - a.projectedSpread)
    .slice(0, limit)
    .map((parcel, index) => ({ ...parcel, callPriority: index + 1, moneyStage: 'Call now' }));
  const interested = enriched.filter(parcel => parcel.callOutcome === 'seller_interested' || parcel.crmStatus === 'Negotiating');
  return {
    today,
    followUps,
    interested,
    stats: {
      callReady: today.length,
      followUpsDue: followUps.length,
      interested: interested.length,
      buyerBacked: callable.filter(parcel => parcel.buyerName && parcel.buyerName !== 'buyer missing').length,
    },
    generatedAt: now,
  };
}

export function buildBuyerContactQueue(buyers = []) {
  const unique = new Map();
  for (const buyer of buyers || []) {
    const key = normalizeMatchKey(buyer.id || buyer.buyerId || buyer.name);
    if (!key) continue;
    unique.set(key, { ...(unique.get(key) || {}), ...buyer });
  }
  return [...unique.values()]
    .filter(buyer => {
      const needsContact = !(buyer.phone || buyer.email || buyer.website);
      const needsValidation = buyer.validationStatus === 'needs-call-confirmation' || !(buyer.buyBox || buyer.exactBuyBox);
      return needsContact || needsValidation;
    })
    .map((buyer) => ({
      id: buyer.id || buyer.buyerId || buyer.name,
      buyerId: buyer.id || buyer.buyerId || '',
      name: buyer.name || '',
      market: buyer.market || '',
      recentBuilds: Number(buyer.recentBuilds || 0),
      phone: buyer.phone || '',
      email: buyer.email || '',
      website: buyer.website || '',
      maxPrice: buyer.maxPrice || buyer.buyerMaxPrice || '',
      validationStatus: buyer.validationStatus || 'needs-contact',
      task: !(buyer.phone || buyer.email || buyer.website) ? 'find buyer contact' : 'validate buy box',
      confidence: buyer.confidence || buyer.score || 0,
      acquisitionNotes: buyer.acquisitionNotes || buyer.buyBox || '',
    }))
    .sort((a, b) => b.recentBuilds - a.recentBuilds || b.confidence - a.confidence || String(a.name).localeCompare(String(b.name)));
}

function normalizeMatchKey(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findParcelMatch(record, parcels = []) {
  const parcelId = normalizeMatchKey(record.parcelId || record.apn || record.id);
  const owner = normalizeMatchKey(record.ownerName || record.owner);
  const address = normalizeMatchKey(record.address);
  return parcels.find(parcel => parcelId && normalizeMatchKey(parcel.parcelId || parcel.id) === parcelId)
    || parcels.find(parcel => owner && owner === normalizeMatchKey(parcel.ownerName || parcel.owner))
    || parcels.find(parcel => address && address === normalizeMatchKey(parcel.address));
}

function findBuyerMatch(record, buyers = []) {
  const buyerId = normalizeMatchKey(record.buyerId || record.id);
  const name = normalizeMatchKey(record.name || record.buyerName);
  return buyers.find(buyer => buyerId && normalizeMatchKey(buyer.id || buyer.buyerId) === buyerId)
    || buyers.find(buyer => name && name === normalizeMatchKey(buyer.name));
}

export function applySkipTraceImport(workspace = {}, csvText = '', { candidateParcels = [], now = new Date().toISOString() } = {}) {
  const records = parseCsvRecords(csvText);
  const current = [...(workspace.parcels || [])];
  const candidates = [...current, ...(candidateParcels || [])];
  let matched = 0;
  let created = 0;
  const unmatched = [];

  for (const record of records) {
    const phone = record.ownerPhone || record.phone || '';
    const email = record.ownerEmail || record.email || '';
    const match = findParcelMatch(record, candidates);
    if (!match || !(phone || email)) {
      unmatched.push(record);
      continue;
    }
    const id = match.id || match.parcelId || record.parcelId || `skiptrace-${matched + created + 1}`;
    const update = {
      ...match,
      ...record,
      id,
      parcelId: match.parcelId || record.parcelId || match.id || '',
      ownerName: record.ownerName || match.ownerName || match.owner || '',
      ownerPhone: phone || match.ownerPhone || '',
      ownerEmail: email || match.ownerEmail || '',
      skipTraceConfidence: record.skipTraceConfidence || match.skipTraceConfidence || '',
      crmStatus: ['Dead', 'Kill'].includes(match.crmStatus) ? match.crmStatus : 'New',
      nextFollowUp: match.nextFollowUp || '',
      realContact: true,
      skipTraceImportedAt: now,
      notes: [match.notes, record.notes, `Skip trace imported ${now.slice(0, 10)}.`].filter(Boolean).join('\n'),
    };
    const existingIndex = current.findIndex(parcel => normalizeMatchKey(parcel.id || parcel.parcelId) === normalizeMatchKey(id) || (update.parcelId && normalizeMatchKey(parcel.parcelId) === normalizeMatchKey(update.parcelId)));
    if (existingIndex >= 0) current[existingIndex] = { ...current[existingIndex], ...update };
    else { current.push(update); created += 1; }
    matched += 1;
  }

  return { workspace: { ...workspace, parcels: current }, summary: { imported: records.length, matched, created, unmatched: unmatched.length }, unmatched };
}

export function applyBuyerContactImport(workspace = {}, csvText = '', { candidateBuyers = [], now = new Date().toISOString() } = {}) {
  const records = parseCsvRecords(csvText);
  const current = [...(workspace.buyers || [])];
  const candidates = [...current, ...(candidateBuyers || [])];
  let matched = 0;
  let created = 0;
  const unmatched = [];

  for (const record of records) {
    const match = findBuyerMatch(record, candidates);
    if (!match && !(record.name || record.buyerName)) {
      unmatched.push(record);
      continue;
    }
    const id = match?.id || record.buyerId || normalizeMatchKey(record.name || record.buyerName) || `buyer-${matched + created + 1}`;
    const phone = record.buyerPhone || record.ownerPhone || match?.phone || '';
    const email = record.buyerEmail || record.ownerEmail || match?.email || '';
    const website = record.buyerWebsite || match?.website || '';
    const update = {
      ...(match || {}),
      id,
      market: record.market || match?.market || 'lehigh',
      name: record.name || record.buyerName || match?.name || '',
      contactName: record.buyerContactName || match?.contactName || '',
      phone,
      email,
      website,
      buyBox: record.buyBox || match?.buyBox || record.acquisitionNotes || match?.acquisitionNotes || '',
      maxPrice: record.maxPrice || record.buyerMaxPrice || match?.maxPrice || '',
      acquisitionNotes: record.acquisitionNotes || match?.acquisitionNotes || '',
      validationStatus: (phone || email || website) && (record.buyBox || record.acquisitionNotes || record.maxPrice || record.buyerMaxPrice) ? 'buy-box-validated' : (phone || email || website ? 'contact-enriched' : (match?.validationStatus || 'needs-contact')),
      contactEnrichedAt: now,
    };
    const existingIndex = current.findIndex(buyer => normalizeMatchKey(buyer.id) === normalizeMatchKey(id) || normalizeMatchKey(buyer.name) === normalizeMatchKey(update.name));
    if (existingIndex >= 0) current[existingIndex] = { ...current[existingIndex], ...update };
    else { current.push(update); created += 1; }
    matched += 1;
  }

  return { workspace: { ...workspace, buyers: current }, summary: { imported: records.length, matched, created, unmatched: unmatched.length }, unmatched };
}

export function applyCallOutcome(workspace, parcelId, outcomeKey, { now = new Date().toISOString(), note = '' } = {}) {
  const outcome = CALL_OUTCOMES[outcomeKey] || CALL_OUTCOMES.call_attempted;
  const nextFollowUp = outcome.followUpDays == null ? '' : addDays(now, outcome.followUpDays);
  return {
    ...workspace,
    parcels: (workspace.parcels || []).map((parcel) => {
      if (parcel.id !== parcelId) return parcel;
      const notes = [parcel.notes, outcome.note, note].filter(Boolean).join('\n');
      return {
        ...parcel,
        crmStatus: outcome.crmStatus,
        callOutcome: outcomeKey,
        lastCallAt: now,
        nextFollowUp,
        notes,
        updatedAt: now,
      };
    }),
  };
}

export function exportDailyCallSheetCsv(calls = []) {
  const columns = ['ownerName', 'ownerPhone', 'address', 'initialOffer', 'maxOffer', 'buyerName', 'buyerPhone', 'projectedSpread', 'callScript', 'status', 'nextFollowUp'];
  const rows = [columns];
  for (const call of calls) {
    rows.push([
      call.ownerName || call.owner || '',
      call.ownerPhone || '',
      call.address || '',
      call.offerAnchor ?? call.offer?.initialSellerOffer ?? '',
      call.maxOffer ?? call.offer?.maxSellerOffer ?? '',
      call.buyerName || call.buyerContactName || '',
      call.buyerPhone || '',
      call.projectedSpread ?? call.metrics?.spread ?? '',
      call.callScript?.summary || '',
      call.action || call.moneyStage || '',
      call.nextFollowUp || '',
    ]);
  }
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
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

function buyerGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 45) return 'C';
  return 'D';
}

export function calculateBuyerScorecard(buyer = {}) {
  const validation = buyer.validation || {};
  const answeredRate = validation.calls ? (Number(validation.answered || 0) / Number(validation.calls || 1)) : 0;
  const acceptanceRate = validation.feedbackCount ? (Number(validation.acceptedDeals || 0) / Number(validation.feedbackCount || 1)) : 0;
  let score = 0;
  score += Math.min(18, Number(buyer.recentBuilds || 0));
  score += Math.max(0, Math.min(14, 18 - Number(buyer.closeSpeedDays || 30) / 2));
  score += Math.min(12, Number(buyer.repeatDemand || 0) * 1.2);
  score += buyer.maxPrice ? 8 : 0;
  score += validation.buyBoxCaptured || buyer.buyBoxCaptured || buyer.exactBuyBox ? 16 : 0;
  score += validation.proofOfFunds ? 10 : 0;
  score += Math.min(10, Number(validation.feedbackCount || 0) * 2);
  score += Math.round(answeredRate * 8);
  score += Math.round(acceptanceRate * 8);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const signals = [];
  if (validation.buyBoxCaptured || buyer.buyBoxCaptured || buyer.exactBuyBox) signals.push('validated buy box');
  if (validation.proofOfFunds) signals.push('funding proof');
  if ((validation.feedbackCount || 0) > 0) signals.push('feedback loop active');
  if ((validation.acceptedDeals || 0) > (validation.rejectedDeals || 0)) signals.push('accepts matching deals');
  return { buyerId: buyer.id, name: buyer.name, score, grade: buyerGrade(score), answeredRate, acceptanceRate, signals };
}

export function captureBuyBox(buyer = {}, criteria = {}) {
  const exactBuyBox = {
    targetMarkets: criteria.targetMarkets || buyer.targetMarkets || [],
    lotSizeMin: Number(criteria.lotSizeMin || 0),
    lotSizeMax: Number(criteria.lotSizeMax || 0),
    maxPrice: Number(criteria.maxPrice || buyer.maxPrice || 0),
    requiredRoadAccess: criteria.requiredRoadAccess ?? true,
    requiredUtilities: criteria.requiredUtilities ?? false,
    avoidFloodZones: criteria.avoidFloodZones || [],
    avoidWetlands: criteria.avoidWetlands ?? true,
    notes: criteria.notes || '',
  };
  const range = exactBuyBox.lotSizeMin && exactBuyBox.lotSizeMax ? `${exactBuyBox.lotSizeMin}-${exactBuyBox.lotSizeMax} ac` : 'any lot size';
  return {
    ...buyer,
    maxPrice: exactBuyBox.maxPrice || buyer.maxPrice,
    exactBuyBox,
    buyBoxCaptured: true,
    buyBox: `${range}; max ${formatMoney(exactBuyBox.maxPrice || 0)}; markets ${(exactBuyBox.targetMarkets || []).join(', ') || 'any'}; ${exactBuyBox.notes}`.trim(),
    validation: { ...(buyer.validation || {}), buyBoxCaptured: true },
  };
}

export function addBuyerCallNote(buyer = {}, note = {}) {
  const callNotes = [{ date: note.date || new Date().toISOString().slice(0, 10), contact: note.contact || '', outcome: note.outcome || 'unknown', note: note.note || '' }, ...(buyer.callNotes || [])];
  const feedback = note.dealFeedback ? [{ ...note.dealFeedback, date: note.date || '' }, ...(buyer.feedback || [])] : (buyer.feedback || []);
  const validation = { ...(buyer.validation || {}) };
  validation.calls = Number(validation.calls || 0) + 1;
  if (note.outcome === 'answered') validation.answered = Number(validation.answered || 0) + 1;
  if (note.dealFeedback) {
    validation.feedbackCount = Number(validation.feedbackCount || 0) + 1;
    if (note.dealFeedback.decision === 'accept') validation.acceptedDeals = Number(validation.acceptedDeals || 0) + 1;
    if (note.dealFeedback.decision === 'reject') validation.rejectedDeals = Number(validation.rejectedDeals || 0) + 1;
  }
  return { ...buyer, validation, callNotes, feedback };
}

function parcelAcres(parcel = {}) {
  if (parcel.lotSizeAcres !== undefined) return Number(parcel.lotSizeAcres);
  const match = String(parcel.lotSize || '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

export function buildDealFitMatrix(parcels = [], buyers = []) {
  const rows = [];
  for (const parcel of parcels) {
    for (const buyer of buyers) {
      const box = buyer.exactBuyBox || {};
      const misses = [];
      let score = 100;
      const acres = parcelAcres(parcel);
      if ((box.targetMarkets || []).length && !(box.targetMarkets || []).includes(parcel.market)) { misses.push('market'); score -= 25; }
      if (box.lotSizeMin && acres && acres < box.lotSizeMin) { misses.push('too small'); score -= 15; }
      if (box.lotSizeMax && acres && acres > box.lotSizeMax) { misses.push('too large'); score -= 15; }
      if (box.maxPrice && Number(parcel.askingPrice || parcel.buyerMaxPrice || 0) > box.maxPrice) { misses.push('price'); score -= 20; }
      if (box.requiredRoadAccess && parcel.roadAccess !== true) { misses.push('road access'); score -= 25; }
      if (box.requiredUtilities && parcel.utilities !== true) { misses.push('utilities'); score -= 10; }
      if (box.avoidWetlands && (parcel.wetlands === true || ['true', 'likely', 'yes', 'review'].includes(String(parcel.wetlands || '').toLowerCase()))) { misses.push('wetlands'); score -= 35; }
      if ((box.avoidFloodZones || []).includes(String(parcel.floodZone || '').toUpperCase())) { misses.push('flood zone'); score -= 25; }
      score = Math.max(0, Math.round(score));
      rows.push({ parcelId: parcel.id || parcel.parcelId, buyerId: buyer.id, address: parcel.address, buyerName: buyer.name, score, fit: score >= 80 ? 'strong' : score >= 55 ? 'review' : 'weak', misses });
    }
  }
  return rows.sort((a, b) => b.score - a.score);
}

export function isBuyerBuyBoxValidated(buyer = {}) {
  const hasContact = Boolean(buyer.phone || buyer.email || buyer.website);
  const hasBuyBox = Boolean(buyer.exactBuyBox || buyer.buyBox || buyer.acquisitionNotes);
  const hasPrice = Boolean(Number(buyer.maxPrice || buyer.buyerMaxPrice || buyer.exactBuyBox?.maxPrice || 0));
  const status = String(buyer.validationStatus || '').toLowerCase();
  return hasContact && hasBuyBox && hasPrice && (buyer.buyBoxCaptured || buyer.exactBuyBox || status.includes('validated') || status.includes('enriched'));
}

export function matchSellerParcelsToBuyerBox(parcels = [], buyer = {}, { limit = 25 } = {}) {
  if (!isBuyerBuyBoxValidated(buyer)) return [];
  const rows = buildDealFitMatrix(parcels, [buyer]);
  return rows
    .filter(row => row.score >= 70)
    .slice(0, limit)
    .map((row, index) => {
      const parcel = parcels.find(item => (item.id || item.parcelId) === row.parcelId) || {};
      const enriched = scoreParcelDeal({ ...parcel, buyerId: buyer.id, buyerMaxPrice: buyer.maxPrice || buyer.exactBuyBox?.maxPrice || parcel.buyerMaxPrice }, buyer);
      return {
        ...enriched,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerPhone: buyer.phone || '',
        buyerEmail: buyer.email || '',
        buyBox: buyer.buyBox || buyer.acquisitionNotes || '',
        fitScore: row.score,
        fit: row.fit,
        misses: row.misses,
        buyerFirstRank: index + 1,
        nextAction: (parcel.ownerPhone || parcel.ownerEmail || parcel.realContact) ? 'ready for seller call' : 'skip trace this matched seller',
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore || b.score - a.score || b.metrics.spread - a.metrics.spread);
}

export function buildBuyerFirstBoard({ buyers = [], sellerCandidates = [], limit = 25 } = {}) {
  const validatedBuyers = rankBuyers(buyers)
    .filter(isBuyerBuyBoxValidated)
    .map(buyer => ({ ...buyer, scorecard: calculateBuyerScorecard(buyer) }));
  const buyerTasks = buildBuyerContactQueue(buyers).slice(0, limit);
  const sellerMatches = validatedBuyers.flatMap(buyer => matchSellerParcelsToBuyerBox(sellerCandidates, buyer, { limit }))
    .sort((a, b) => b.fitScore - a.fitScore || b.score - a.score || b.metrics.spread - a.metrics.spread)
    .slice(0, limit);
  const skipTraceBatch = sellerMatches.filter(item => item.nextAction === 'skip trace this matched seller');
  return {
    validatedBuyers,
    buyerTasks,
    sellerMatches,
    skipTraceBatch,
    stats: {
      validatedBuyBoxes: validatedBuyers.length,
      buyerContactsNeeded: buyerTasks.length,
      matchedSellerParcels: sellerMatches.length,
      skipTraceAfterBuyerFit: skipTraceBatch.length,
    },
  };
}

export function buildBuyerFeedbackLoop(buyers = []) {
  const all = buyers.flatMap(buyer => (buyer.feedback || []).map(item => ({ buyerName: buyer.name, ...item })));
  const accepted = all.filter(item => item.decision === 'accept').length;
  const rejected = all.filter(item => item.decision === 'reject').length;
  const reasons = new Map();
  for (const item of all) {
    const reason = String(item.reason || 'unspecified').toLowerCase();
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
  }
  const topRejectReasons = [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  const lessons = topRejectReasons.map(item => item.reason).join('; ');
  return { totalFeedback: all.length, accepted, rejected, acceptanceRate: all.length ? accepted / all.length : 0, topRejectReasons, lessons, feedback: all };
}

export function buildRiskChecklist(parcel = {}) {
  const flood = String(parcel.floodZone || '').toUpperCase();
  return [
    { label: 'Road access', status: parcel.roadAccess === true ? 'clear' : parcel.roadAccess === false ? 'fatal' : 'missing', detail: parcel.roadAccess === true ? 'Road access confirmed.' : 'Confirm legal/physical road access.' },
    { label: 'Utilities', status: parcel.utilities === true ? 'clear' : parcel.utilities === false ? 'review' : 'missing', detail: parcel.utilities === true ? 'Utilities indicated.' : 'Verify power/water/septic feasibility.' },
    { label: 'Wetlands', status: parcel.wetlands === true ? 'fatal' : parcel.wetlands === false ? 'clear' : 'missing', detail: parcel.wetlands === true ? 'Wetlands risk present.' : 'Confirm wetlands map/layer.' },
    { label: 'Flood zone', status: flood && flood !== 'X' ? 'review' : flood === 'X' ? 'clear' : 'missing', detail: flood ? `Flood zone ${flood}.` : 'Verify FEMA flood zone.' },
    { label: 'Slope/topography', status: parcel.slope ? (String(parcel.slope).toLowerCase().includes('steep') ? 'review' : 'clear') : 'missing', detail: parcel.slope || 'Confirm slope/topography.' },
    { label: 'Wildlife/environmental', status: parcel.wildlifeFlag === true ? 'review' : parcel.wildlifeFlag === false ? 'clear' : 'missing', detail: parcel.wildlifeFlag === true ? 'Protected species/environmental flag.' : 'Check local environmental constraints.' },
  ];
}

export function generateSellerOfferLetter(parcel = {}, packet = {}) {
  const owner = parcel.ownerName || parcel.owner || 'Property Owner';
  const address = parcel.address || 'the subject property';
  const offer = formatMoney(Number(packet.sellerOffer || 0));
  const closingDays = packet.closingDays || 21;
  const buyerName = packet.buyerName || packet.buyer?.name || 'our buying entity';
  return `Dear ${owner},\n\nThank you for discussing ${address}. Based on the information available today, ${buyerName} can offer ${offer} cash for the property, subject to title, access, buildability, and standard due diligence review.\n\nProposed terms:\n- Purchase price: ${offer}\n- Closing timeline: ${closingDays} days after signed agreement and clear title\n- Seller convenience: standard closing costs can be handled through the closing process\n- Due diligence: parcel access, utilities, wetlands/flood zone, zoning, and title review\n\nIf these terms are acceptable, the next step is a simple written purchase agreement and title-company review.\n\nRespectfully,\nLand Dealflow OS`;
}

export function generateBuyerAssignmentSummary(parcel = {}, buyer = {}, packet = {}) {
  const riskLines = (packet.riskChecklist || []).map(item => `- ${item.label}: ${item.status} — ${item.detail || ''}`).join('\n');
  return `Buyer Assignment Summary\n\nBuyer: ${buyer.name || packet.buyerName || 'Unknown buyer'}\nBuy box: ${buyer.buyBox || 'Not captured'}\nParcel: ${parcel.address || packet.address || 'Unknown parcel'}\nLot size: ${parcel.lotSize || 'unknown'}\nAssignment price: ${formatMoney(Number(packet.assignmentPrice || 0))}\nSeller offer: ${formatMoney(Number(packet.sellerOffer || 0))}\nProjected spread: ${formatMoney(Number(packet.projectedSpread || 0))}\n\nRisk checklist:\n${riskLines || '- Risk checklist not available'}\n\nDecision ask: confirm whether this parcel fits your buy box and what diligence item would kill the deal.`;
}

export function generateOfferPacket(parcel = {}, buyer = {}, options = {}) {
  const buyerMax = Number(parcel.buyerMaxPrice || buyer.maxPrice || 0);
  const ask = Number(parcel.askingPrice || 0);
  const targetMargin = Number(options.targetMargin ?? 0.18);
  const closingCosts = Number(options.closingCosts ?? 2000);
  const closingDays = Number(options.closingDays ?? 21);
  const fallbackOffer = buyerMax ? Math.max(0, Math.round(buyerMax * (1 - targetMargin) - closingCosts)) : ask;
  const sellerOffer = Math.max(0, Math.round(ask ? Math.min(ask, fallbackOffer) : fallbackOffer));
  const assignmentPrice = Math.max(0, Math.round(buyerMax ? Math.min(buyerMax, Math.max(sellerOffer + closingCosts + 5000, buyerMax * 0.94)) : sellerOffer + closingCosts));
  const projectedSpread = Math.max(0, assignmentPrice - sellerOffer - closingCosts);
  const riskChecklist = buildRiskChecklist(parcel);
  const packet = {
    address: parcel.address || 'Unknown parcel',
    parcelId: parcel.parcelId || parcel.apn || '',
    ownerName: parcel.ownerName || parcel.owner || '',
    buyerName: buyer.name || '',
    sellerOffer,
    assignmentPrice,
    projectedSpread,
    closingCosts,
    closingDays,
    riskChecklist,
    parcel,
    buyer,
    summary: `${parcel.address || 'Parcel'} for ${buyer.name || 'buyer'}: offer ${formatMoney(sellerOffer)}, assignment ${formatMoney(assignmentPrice)}, projected spread ${formatMoney(projectedSpread)}.`,
  };
  packet.sellerOfferLetter = generateSellerOfferLetter(parcel, packet);
  packet.buyerAssignmentSummary = generateBuyerAssignmentSummary(parcel, buyer, packet);
  return packet;
}

export function exportDealMemoMarkdown(packet = {}) {
  const risks = (packet.riskChecklist || []).map(item => `- **${item.label}**: ${item.status} — ${item.detail || ''}`).join('\n');
  return `# Deal Memo — ${packet.address || 'Unknown parcel'}\n\n## Economics\n- Seller offer: ${formatMoney(Number(packet.sellerOffer || 0))}\n- Assignment price: ${formatMoney(Number(packet.assignmentPrice || 0))}\n- Projected spread: ${formatMoney(Number(packet.projectedSpread || 0))}\n- Closing costs estimate: ${formatMoney(Number(packet.closingCosts || 0))}\n\n## Seller Offer Letter\n\n${packet.sellerOfferLetter || ''}\n\n## Buyer Assignment Summary\n\n${packet.buyerAssignmentSummary || ''}\n\n## Risk Checklist\n${risks || '- No risk checklist available'}\n`;
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
