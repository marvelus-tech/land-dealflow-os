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
  seller_interested: { label: 'Interested', crmStatus: 'Negotiating', followUpDays: 1, note: 'Seller interested. Capture ask, timeline, motivation, and clear title gate.' },
  seller_maybe: { label: 'Maybe', crmStatus: 'Contacted', followUpDays: 2, note: 'Seller may consider. Schedule callback and keep exact language.' },
  seller_rejected: { label: 'No', crmStatus: 'Dead', followUpDays: null, note: 'Seller rejected the offer.' },
  bad_number: { label: 'Bad number', crmStatus: 'Researching', followUpDays: null, note: 'Bad number. Send back to enrichment before another call.' },
  wrong_owner: { label: 'Wrong owner', crmStatus: 'Researching', followUpDays: null, note: 'Wrong owner. Verify assessor ownership and skip-trace artifact.' },
  price_too_high: { label: 'Price too high', crmStatus: 'Dead', followUpDays: null, note: 'Seller price too high for buyer-backed max. Preserve counter for pricing feedback.' },
  title_issue: { label: 'Title issue', crmStatus: 'Researching', followUpDays: 3, note: 'Title issue surfaced. Hold seller/buyer memo behind title preflight.' },
  needs_callback: { label: 'Needs callback', crmStatus: 'Contacted', followUpDays: 3, note: 'Seller requested callback. Set callback date and exact callback context.' },
  needs_follow_up: { label: 'Needs follow-up', crmStatus: 'Contacted', followUpDays: 3, note: 'Needs follow-up. Re-open with buyer-backed proof.' },
  dead_lead: { label: 'Dead lead', crmStatus: 'Dead', followUpDays: null, note: 'Dead lead. Remove from active call queue.' },
};

export const BUYER_FEEDBACK_REASONS = [
  'price', 'wetlands', 'access', 'utilities', 'street', 'lot-size', 'title', 'timing', 'accepted', 'other'
];

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
  const key = String(parcelId || '');
  return {
    ...workspace,
    parcels: (workspace.parcels || []).map(parcel => (String(parcel.id || '') === key || String(parcel.parcelId || '') === key) ? { ...parcel, ...updates, updatedAt: new Date().toISOString() } : parcel),
  };
}


export const BUYER_VALIDATION_STATUSES = [
  'not_called',
  'left_voicemail',
  'spoke_to_gatekeeper',
  'spoke_to_decision_maker',
  'validated_buy_box',
  'not_a_buyer',
  'follow_up',
];

export const BUY_BOX_REQUIRED_FIELDS = [
  { id: 'geography', label: 'Target geography' },
  { id: 'lotSize', label: 'Lot-size band' },
  { id: 'maxPrice', label: 'Max acquisition price' },
  { id: 'closeSpeed', label: 'Close speed' },
  { id: 'packageRecipient', label: 'Package recipient' },
  { id: 'dealKillers', label: 'Deal-killer criteria' },
];

function valuePresent(value) {
  if (Array.isArray(value)) return value.some(valuePresent);
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'boolean') return true;
  return String(value ?? '').trim().length > 0;
}

export function evaluateBuilderBuyBox(buyBox = {}) {
  const checks = BUY_BOX_REQUIRED_FIELDS.map(field => ({
    ...field,
    met: valuePresent(buyBox[field.id]),
    value: buyBox[field.id] ?? '',
  }));
  const met = checks.filter(check => check.met).length;
  const percent = Math.round((met / checks.length) * 100);
  const missing = checks.filter(check => !check.met).map(check => check.label);
  const complete = missing.length === 0;
  return { complete, percent, met, total: checks.length, checks, missing };
}

export function scoreBuyerValidation(row = {}) {
  const buyBox = evaluateBuilderBuyBox(row.buyBox || {});
  const outreach = row.outreach || {};
  const phoneContacted = Boolean(outreach.phone?.contacted || row.contactedByPhone);
  const emailContacted = Boolean(outreach.email?.contacted || row.contactedByEmail);
  const permitPoints = Math.min(30, Math.round(Number(row.recentBuilds || 0) / 3));
  const callablePoints = row.callable ? 14 : 0;
  const phonePoints = row.phone ? 6 : 0;
  const emailPoints = row.email ? 4 : 0;
  const buyBoxPoints = Math.round(buyBox.percent * 0.34);
  const decisionMakerPoints = row.callStatus === 'spoke_to_decision_maker' ? 8 : 0;
  const validatedPoints = row.callStatus === 'validated_buy_box' && buyBox.complete ? 12 : 0;
  const outreachPoints = (phoneContacted ? 2 : 0) + (emailContacted ? 2 : 0);
  const reviewPenalty = row.route === 'humanReview' || !row.callable ? -12 : 0;
  let score = permitPoints + callablePoints + phonePoints + emailPoints + buyBoxPoints + decisionMakerPoints + validatedPoints + outreachPoints + reviewPenalty;
  score = Math.round(clamp(score, 0, 100));
  const breakdown = [
    { label: 'Permit proof', value: permitPoints, detail: `${Number(row.recentBuilds || 0)} recent permit proofs, capped at 30` },
    { label: 'Public contact', value: callablePoints + phonePoints + emailPoints, detail: `${row.callable ? 'call-ready' : 'not call-ready'} · ${row.phone ? 'phone found' : 'phone missing'} · ${row.email ? 'email found' : 'email missing'}` },
    { label: 'Buy box', value: buyBoxPoints, detail: `${buyBox.met}/${buyBox.total} required fields captured` },
    { label: 'Decision maker', value: decisionMakerPoints + validatedPoints, detail: row.callStatus || 'not_called' },
    { label: 'Outreach', value: outreachPoints, detail: `${phoneContacted ? 'called' : 'not called'} · ${emailContacted ? 'emailed' : 'not emailed'}` },
    { label: 'Review hold', value: reviewPenalty, detail: reviewPenalty ? 'contact/source needs review before promotion' : 'none' },
  ];
  const tier = buyBox.complete && row.callStatus === 'validated_buy_box'
    ? 'Tier 1 · seller search eligible'
    : buyBox.percent >= 67 || row.callStatus === 'spoke_to_decision_maker'
      ? 'Tier 2 · follow-up to finish buy box'
      : 'Tier 3 · call queue only';
  const sellerEligible = buyBox.complete && row.callStatus === 'validated_buy_box';
  const nextAction = sellerEligible
    ? 'Generate seller parcel search criteria and start buyer-backed seller sourcing.'
    : row.route === 'humanReview' || !row.callable
      ? 'Resolve public business contact before calling.'
      : phoneContacted || emailContacted
        ? 'Contact logged. Buy box still missing — follow up until geography, price, speed, recipient, and deal killers are captured.'
        : row.callStatus === 'left_voicemail'
          ? 'Follow up with the exact buy-box email and call again.'
          : row.callStatus === 'spoke_to_gatekeeper'
            ? 'Ask for land/acquisitions decision-maker and package recipient.'
            : 'Call and capture geography, lot size, max price, close speed, recipient, and deal killers.';
  return { score, tier, sellerEligible, buyBox, nextAction, breakdown };
}

export function buildSellerSearchInstructions(row = {}) {
  const box = row.buyBox || {};
  const validation = scoreBuyerValidation(row);
  if (!validation.sellerEligible) {
    return {
      eligible: false,
      headline: 'Seller search locked until buy box is complete.',
      criteria: [],
      blockers: validation.buyBox.missing,
    };
  }
  const criteria = [
    `Market/geography: ${box.geography}`,
    `Lot-size band: ${box.lotSize}`,
    `Max acquisition price: ${formatMoney(Number(box.maxPrice || 0))}`,
    `Close speed: ${box.closeSpeed}`,
    `Avoid/kill: ${Array.isArray(box.dealKillers) ? box.dealKillers.join(', ') : box.dealKillers}`,
    `Submit package to: ${box.packageRecipient}`,
  ];
  if (box.utilitiesAccess) criteria.push(`Utilities/access: ${box.utilitiesAccess}`);
  if (box.productType) criteria.push(`Finished product: ${box.productType}`);
  return {
    eligible: true,
    headline: `Find seller parcels for ${row.name || 'validated builder'} under ${formatMoney(Number(box.maxPrice || 0))}.`,
    criteria,
    offerCeiling: Math.max(0, Math.round(Number(box.maxPrice || 0) * 0.82)),
    sellerAngle: `I am calling because a permit-active Knoxville builder is looking for lots matching ${box.geography} / ${box.lotSize}; if title and access are clean, I can move quickly.`,
  };
}

export function buildBuyerValidationCommandCenter(rows = [], savedRows = []) {
  const saved = new Map((savedRows || []).map(row => [row.builderId, row]));
  const items = (rows || []).map(row => {
    const savedRow = saved.get(row.builderId) || {};
    const merged = {
      ...row,
      ...savedRow,
      buyBox: { ...(row.buyBox || {}), ...(savedRow.buyBox || {}) },
      callStatus: savedRow.callStatus || row.callStatus || 'not_called',
      lastContacted: savedRow.lastContacted || row.lastContacted || '',
      callbackDate: savedRow.callbackDate || row.callbackDate || '',
      callNotes: savedRow.callNotes || row.callNotes || '',
      outreach: {
        ...(row.outreach || {}),
        ...(savedRow.outreach || {}),
      },
    };
    const validation = scoreBuyerValidation(merged);
    const sellerSearch = buildSellerSearchInstructions(merged);
    return { ...merged, validation, sellerSearch };
  }).sort((a, b) => b.validation.score - a.validation.score || Number(b.recentBuilds || 0) - Number(a.recentBuilds || 0));
  const summary = {
    total: items.length,
    callReady: items.filter(item => item.callable && item.route !== 'humanReview').length,
    validated: items.filter(item => item.validation.sellerEligible).length,
    followUp: items.filter(item => ['left_voicemail', 'spoke_to_gatekeeper', 'spoke_to_decision_maker', 'follow_up'].includes(item.callStatus)).length,
    locked: items.filter(item => !item.validation.sellerEligible).length,
    averageCompleteness: items.length ? Math.round(items.reduce((sum, item) => sum + item.validation.buyBox.percent, 0) / items.length) : 0,
  };
  const next = items.find(item => item.callable && item.route !== 'humanReview' && item.callStatus === 'not_called') || items[0] || null;
  return { summary, items, next };
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
    permitRecords: Array.isArray(parsed.permitRecords) ? parsed.permitRecords : [],
    permitBuilders: Array.isArray(parsed.permitBuilders) ? parsed.permitBuilders : [],
    buyerValidations: Array.isArray(parsed.buyerValidations) ? parsed.buyerValidations : [],
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

export function buildSellerSearchControlLayer({ buyers = [], sellerCandidates = [], titleCandidates = [], state = 'TN', limit = 6 } = {}) {
  const targetState = String(state || '').toUpperCase();
  const stateMatches = row => !targetState || targetState === 'ALL' || String(row.state || row.marketState || row.stateCode || '').toUpperCase() === targetState || String(row.market || row.marketName || '').toUpperCase().includes(`-${targetState}`) || String(row.address || '').toUpperCase().includes(`, ${targetState}`);
  const relevantBuyers = (buyers || []).filter(stateMatches);
  const relevantSellers = (sellerCandidates || []).filter(stateMatches);
  const exactGate = (buyer = {}) => {
    const box = buyer.exactBuyBox || {};
    const text = `${buyer.buyBox || ''} ${buyer.acquisitionNotes || ''} ${buyer.task || ''}`;
    const checks = [
      { id: 'geography', label: 'Geography', met: Boolean((box.targetMarkets || []).length || buyer.market || /county|market|subdivision|zip|tn|fl|az|nc|tx/i.test(text)) },
      { id: 'lot-size', label: 'Lot size', met: Boolean((box.lotSizeMin && box.lotSizeMax) || /acre|ac|sf|lot|quarter/i.test(text)) },
      { id: 'max-price', label: 'Max price', met: Boolean(box.maxPrice || buyer.maxPrice || buyer.buyerMaxPrice || /\$|price|under|max/i.test(text)) },
      { id: 'close-speed', label: 'Close speed', met: Boolean(buyer.closeSpeedDays || buyer.closeSpeed || /close|days|cash|fast/i.test(text)) },
      { id: 'package-recipient', label: 'Package recipient', met: Boolean(buyer.packageRecipient || buyer.contactName || buyer.buyerContactName || buyer.email || buyer.buyerEmail) },
      { id: 'deal-killers', label: 'Deal killers', met: Boolean((box.avoidFloodZones || []).length || box.avoidWetlands !== undefined || box.requiredRoadAccess !== undefined || /wetland|flood|road|access|utility|slope|kill/i.test(text)) },
    ];
    const complete = checks.filter(check => check.met).length;
    return { checks, complete, total: checks.length, missing: checks.filter(check => !check.met).map(check => check.label), unlocked: complete === checks.length };
  };
  const buyerRows = relevantBuyers.map(buyer => {
    const broad = calculateBuyBoxCompleteness(buyer);
    const gate = exactGate(buyer);
    const recentBuilds = Number(buyer.recentBuilds || buyer.recentPermits || buyer.permitCount || buyer.qualifyingPermitCount || 0);
    return {
      id: buyer.id || buyer.buyerId || buyer.builderId || buyer.name,
      name: buyer.name || buyer.companyName || 'Permit-active builder',
      market: buyer.market || buyer.marketName || '',
      recentBuilds,
      contact: buyer.phone || buyer.email || buyer.website || buyer.contactName || '',
      broadCompletion: broad,
      gate,
      nextAction: gate.unlocked ? 'Pull matching seller parcels' : `Capture ${gate.missing[0] || 'buyer rule'}`,
      sourceUrl: buyer.sourceUrl || buyer.website || buyer.permitUrl || '',
    };
  }).sort((a, b) => Number(b.gate.unlocked) - Number(a.gate.unlocked) || b.gate.complete - a.gate.complete || b.recentBuilds - a.recentBuilds || String(a.name).localeCompare(String(b.name)));
  const unlockedBuyers = buyerRows.filter(row => row.gate.unlocked);
  const unlockedBuyerIds = new Set(unlockedBuyers.map(row => String(row.id || '')));
  const contractBuyer = relevantBuyers.find(buyer => unlockedBuyerIds.has(String(buyer.id || buyer.buyerId || buyer.builderId || buyer.name || ''))) || relevantBuyers[0] || {};
  const sellerRows = relevantSellers.map(seller => {
    const hasContact = Boolean(seller.ownerPhone || seller.ownerEmail || seller.phone || seller.email || seller.realContact);
    const contract = calculateContractReadiness(seller, contractBuyer);
    const motivation = calculateSellerMotivation(seller);
    const risk = classifyParcelRisk(seller);
    const lockedReasons = [];
    if (!unlockedBuyers.length) lockedReasons.push('buyer buy box missing');
    if (!hasContact) lockedReasons.push('owner phone/email missing');
    if (risk.status === 'Kill') lockedReasons.push('buildability kill flag');
    if (!contract.ready) lockedReasons.push('contract/title gate incomplete');
    return {
      id: seller.id || seller.leadId || seller.parcelId || seller.address,
      address: seller.address || seller.parcelId || 'Public owner record',
      ownerName: seller.ownerName || seller.owner || 'owner unknown',
      market: seller.market || seller.marketName || '',
      hasContact,
      riskStatus: risk.status,
      motivation,
      contract,
      locked: lockedReasons.length > 0,
      lockedReasons,
      nextAction: !unlockedBuyers.length ? 'finish buyer buy-box validation first' : !hasContact ? 'skip trace public owner contact' : !contract.ready ? `clear ${contract.blockers[0] || 'title/contract gate'}` : 'seller call ready',
    };
  }).sort((a, b) => Number(a.locked) - Number(b.locked) || b.motivation.score - a.motivation.score).slice(0, limit);
  const titleReady = titleCandidates.filter(candidate => String(candidate.state || candidate.market || '').toUpperCase().includes(targetState) && candidate.assignmentFriendly !== true).length;
  const stageRows = [
    { id: 'buyer-proof', label: 'Buyer proof', status: unlockedBuyers.length ? 'clear' : 'locked', detail: unlockedBuyers.length ? `${unlockedBuyers.length} buyer buy box ready` : `${buyerRows.length} builders still need six-field buy-box capture` },
    { id: 'seller-match', label: 'Seller match', status: unlockedBuyers.length && relevantSellers.length ? 'review' : 'locked', detail: relevantSellers.length ? `${relevantSellers.length} public owner records available` : 'pull seller parcels only after buyer proof' },
    { id: 'contact-enrichment', label: 'Contact enrichment', status: sellerRows.some(row => row.hasContact) ? 'review' : 'locked', detail: sellerRows.some(row => row.hasContact) ? 'owner contact exists on at least one row' : 'public records stay skip-trace until enriched' },
    { id: 'contract-title', label: 'Contract/title', status: sellerRows.some(row => row.contract.ready) ? 'review' : 'locked', detail: titleReady ? 'title candidates need assignment verification' : 'state packet/title provider must be ready before serious calls' },
    { id: 'buyer-memo', label: 'Buyer memo', status: sellerRows.some(row => !row.locked) ? 'review' : 'locked', detail: 'memo unlocks only after seller range and title packet are defensible' },
    { id: 'feedback-loop', label: 'Feedback loop', status: 'armed', detail: 'buyer yes/no rewrites tomorrow’s seller-call queue' },
  ];
  const nextAction = !unlockedBuyers.length
    ? `Call ${buyerRows[0]?.name || 'permit-active builder'} and capture: ${buyerRows[0]?.gate.missing.slice(0, 2).join(' + ') || 'geography + max price'}.`
    : !sellerRows.length
      ? 'Pull public owner parcel candidates matching the unlocked buy box.'
      : sellerRows.every(row => !row.hasContact)
        ? 'Export the matched public-owner batch for skip tracing; do not call yet.'
        : sellerRows.find(row => !row.locked)?.nextAction || sellerRows[0].nextAction;
  return {
    state: targetState,
    status: unlockedBuyers.length && sellerRows.some(row => !row.locked) ? 'seller-call-ready' : unlockedBuyers.length ? 'skip-trace-ready' : 'buyer-validation-first',
    nextAction,
    stats: {
      buyers: buyerRows.length,
      unlockedBuyers: unlockedBuyers.length,
      sellerCandidates: relevantSellers.length,
      callReady: sellerRows.filter(row => !row.locked).length,
      skipTrace: sellerRows.filter(row => row.locked && row.lockedReasons.includes('owner phone/email missing')).length,
    },
    buyerRows: buyerRows.slice(0, limit),
    sellerRows,
    stageRows,
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

export function applyCallOutcome(workspace, parcelId, outcomeKey, { now = new Date().toISOString(), note = '', updates = {} } = {}) {
  const outcome = CALL_OUTCOMES[outcomeKey] || CALL_OUTCOMES.call_attempted;
  const nextFollowUp = updates.nextFollowUp || (outcome.followUpDays == null ? '' : addDays(now, outcome.followUpDays));
  const key = String(parcelId || '');
  return {
    ...workspace,
    parcels: (workspace.parcels || []).map((parcel) => {
      if (String(parcel.id || '') !== key && String(parcel.parcelId || '') !== key) return parcel;
      const callCapture = {
        askingPrice: updates.sellerAskingPrice || updates.askingPrice || parcel.sellerAskingPrice || parcel.askingPrice || '',
        motivation: updates.sellerMotivation || parcel.sellerMotivation || '',
        timeline: updates.sellerTimeline || parcel.sellerTimeline || '',
        accessBuildability: updates.accessBuildabilityNotes || parcel.accessBuildabilityNotes || '',
        titleConcerns: updates.titleConcerns || parcel.titleConcerns || '',
        sentiment: updates.ownerSentiment || parcel.ownerSentiment || '',
        exactLanguage: updates.exactSellerLanguage || parcel.exactSellerLanguage || '',
        capturedAt: now,
      };
      const notes = [parcel.notes, outcome.note, note, callCapture.exactLanguage ? `Seller exact language: ${callCapture.exactLanguage}` : ''].filter(Boolean).join('\n');
      return {
        ...parcel,
        ...updates,
        crmStatus: updates.crmStatus || outcome.crmStatus,
        callOutcome: outcomeKey,
        sellerCallOutcome: outcome.label,
        sellerCallCapture: callCapture,
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
  const feedback = note.dealFeedback ? [{ ...normalizeBuyerFeedback(note.dealFeedback), date: note.date || new Date().toISOString().slice(0, 10) }, ...(buyer.feedback || [])] : (buyer.feedback || []);
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

export function normalizeBuyerFeedback(feedback = {}) {
  const decision = ['yes', 'accept', 'accepted'].includes(String(feedback.decision || '').toLowerCase()) ? 'accept'
    : ['maybe', 'review'].includes(String(feedback.decision || '').toLowerCase()) ? 'maybe'
      : 'reject';
  const rawReason = String(feedback.reason || (decision === 'accept' ? 'accepted' : 'other')).toLowerCase().trim();
  const reason = BUYER_FEEDBACK_REASONS.includes(rawReason) ? rawReason : 'other';
  return {
    parcelId: feedback.parcelId || feedback.id || '',
    decision,
    reason,
    reasonDetail: rawReason,
    maxPrice: feedback.maxPrice ? Number(feedback.maxPrice) : undefined,
    note: feedback.note || '',
    date: feedback.date || new Date().toISOString().slice(0, 10),
  };
}

export function applyBuyerFeedback(workspace = {}, parcelId = '', feedback = {}) {
  const parcel = (workspace.parcels || []).find(item => item.id === parcelId || item.parcelId === parcelId) || {};
  const buyerId = feedback.buyerId || parcel.buyerId;
  const normalized = normalizeBuyerFeedback({ ...feedback, parcelId: parcel.id || parcelId });
  const nextMemoStatus = normalized.decision === 'accept' ? 'accepted' : feedback.buyerMemoStatus || parcel.buyerMemoStatus || 'sent';
  return {
    ...workspace,
    buyers: (workspace.buyers || []).map(buyer => {
      if (buyer.id !== buyerId) return buyer;
      const validation = { ...(buyer.validation || {}) };
      validation.feedbackCount = Number(validation.feedbackCount || 0) + 1;
      if (normalized.decision === 'accept') validation.acceptedDeals = Number(validation.acceptedDeals || 0) + 1;
      if (normalized.decision === 'reject') validation.rejectedDeals = Number(validation.rejectedDeals || 0) + 1;
      return { ...buyer, validation, feedback: [normalized, ...(buyer.feedback || [])] };
    }),
    parcels: (workspace.parcels || []).map(item => {
      if (item.id !== parcelId && item.parcelId !== parcelId) return item;
      const feedbackLine = `Buyer feedback: ${normalized.decision}/${normalized.reason}${normalized.maxPrice ? ` max ${formatMoney(normalized.maxPrice)}` : ''}${normalized.note ? ` — ${normalized.note}` : ''}`;
      return {
        ...item,
        buyerFeedbackDecision: normalized.decision,
        buyerFeedbackReason: normalized.reason,
        buyerFeedbackMaxPrice: normalized.maxPrice || item.buyerFeedbackMaxPrice,
        buyerMemoStatus: nextMemoStatus,
        crmStatus: normalized.decision === 'accept' ? 'Sent to Buyer' : item.crmStatus,
        notes: [item.notes, feedbackLine].filter(Boolean).join('\n'),
        updatedAt: new Date().toISOString(),
      };
    }),
  };
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

export function exportMatchedSellerBatchCsv(matches = []) {
  const columns = [
    'buyerName', 'buyerId', 'market', 'parcelId', 'ownerName', 'ownerMailingAddress',
    'parcelAddress', 'lotSize', 'riskFlags', 'sourceId', 'sourceUrl', 'skipTraceStatus', 'nextAction',
  ];
  const rows = [columns];
  for (const match of matches) {
    rows.push([
      match.buyerName || '',
      match.buyerId || '',
      match.market || match.marketName || '',
      match.parcelId || match.id || '',
      match.ownerName || match.owner || '',
      match.ownerMailingAddress || '',
      match.address || '',
      match.lotSize || match.acres || '',
      [...(match.flags || []), ...(match.risk?.flags || []), ...(match.misses || [])].filter(Boolean).join('; '),
      match.sourceId || match.source || '',
      match.sourceUrl || match.publicRecordUrl || match.assessorUrl || '',
      match.ownerPhone || match.ownerEmail || match.realContact ? 'contact-enriched' : 'needs-skip-trace',
      match.nextAction || 'skip trace this matched seller',
    ]);
  }
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

export function buildExecutionConveyor({ buyers = [], sellerCandidates = [], titleCandidates = [], limit = 12 } = {}) {
  const board = buildBuyerFirstBoard({ buyers, sellerCandidates, limit });
  const callReadySellers = board.sellerMatches
    .filter(match => match.ownerPhone || match.ownerEmail || match.realContact)
    .map(match => {
      const buyer = buyers.find(item => String(item.id || item.buyerId) === String(match.buyerId)) || {};
      const contract = calculateContractReadiness(match, buyer);
      const offerPacket = generateOfferPacket(match, buyer);
      const memo = generateBuyerSendMemo(match, buyer, offerPacket);
      const checklist = buildOperatorChecklist(match, buyer);
      return {
        ...match,
        buyer,
        contract,
        offerPacket,
        memo,
        checklist,
        ownerCallScript: generateOwnerCallScript(match, buyer),
        sellerNetOfferScript: generateSellerNetOfferScript(match, buyer),
        neighborPrompt: generateNeighborPrompt(match),
        readyForSellerCall: contract.ready && match.risk?.status !== 'Kill',
        nextAction: contract.ready ? 'call seller with net offer range' : `clear ${contract.blockers?.[0] || 'contract/title gate'}`,
      };
    })
    .sort((a, b) => Number(b.readyForSellerCall) - Number(a.readyForSellerCall) || b.score - a.score || b.metrics.spread - a.metrics.spread)
    .slice(0, limit);
  const feedbackLoop = buildBuyerFeedbackLoop(buyers);
  const feedbackRecommendations = recommendNextSellerCallsFromFeedback(callReadySellers.length ? callReadySellers : board.sellerMatches, buyers).slice(0, Math.min(5, limit));
  const contactEnrichedCount = callReadySellers.length;
  const sellerCallReadyCount = callReadySellers.filter(row => row.readyForSellerCall).length;
  const stageRows = [
    { id: 'buyer-call-capture', label: 'Buyer call capture', status: board.validatedBuyers.length ? 'clear' : 'locked', detail: board.validatedBuyers.length ? `${board.validatedBuyers.length} buy boxes can drive seller search` : 'capture geography, lot size, max price, close speed, package recipient, and deal killers' },
    { id: 'matched-seller-export', label: 'Matched seller CSV', status: board.skipTraceBatch.length ? 'ready' : 'locked', detail: board.skipTraceBatch.length ? `${board.skipTraceBatch.length} public owner rows ready for skip-trace export` : 'no buyer-box-matched public owner batch yet' },
    { id: 'skiptrace-return', label: 'Skip-trace return', status: contactEnrichedCount ? 'contact-enriched' : 'needs-skip-trace', detail: contactEnrichedCount ? `${contactEnrichedCount} owner contact rows imported; review seller-call gates` : 'import phone/email before seller calls' },
    { id: 'seller-call-cockpit', label: 'Seller cockpit review', status: sellerCallReadyCount ? 'ready' : (contactEnrichedCount ? 'review' : 'locked'), detail: sellerCallReadyCount ? 'seller opener, net-offer range, neighbor prompt and outcome controls are armed' : 'seller calls wait for contact + contract/title clearance' },
    { id: 'buyer-memo-title', label: 'Contract/title gate', status: callReadySellers.some(row => row.memo) ? 'armed' : 'locked', detail: 'memo, title email, contract blockers and assignment math travel with each seller row' },
    { id: 'feedback-rewrite', label: 'Feedback rewrite', status: feedbackLoop.totalFeedback ? 'armed' : 'listening', detail: feedbackLoop.totalFeedback ? feedbackLoop.tightening : 'capture buyer yes/no/maybe to rewrite tomorrow’s seller queue' },
  ];
  return {
    board,
    stageRows,
    matchedSellerBatch: board.skipTraceBatch,
    matchedSellerBatchCsv: exportMatchedSellerBatchCsv(board.skipTraceBatch),
    callReadySellers,
    feedbackLoop,
    feedbackRecommendations,
    stats: {
      validatedBuyers: board.stats.validatedBuyBoxes,
      matchedSellerBatch: board.skipTraceBatch.length,
      promotedSellerCalls: callReadySellers.length,
      contactEnrichedRows: contactEnrichedCount,
      sellerCallReady: sellerCallReadyCount,
      memoReady: callReadySellers.filter(row => row.memo && row.contract?.ready).length,
      feedbackEvents: feedbackLoop.totalFeedback,
    },
    nextAction: !board.validatedBuyers.length
      ? 'Capture one complete buyer buy box before pulling sellers.'
      : callReadySellers.length
        ? 'Review imported owner contacts in the seller cockpit, clear contract/title blockers, then call.'
        : board.skipTraceBatch.length
          ? 'Download the matched seller batch, skip trace owner contact, then import the return CSV.'
          : 'Import skip-trace returns and clear title/contract blockers before seller calls.',
  };
}

export function buildOperatorSessionMode({ buyerContactQueue = [], executionConveyor = {}, moneyQueue = {}, now = new Date().toISOString() } = {}) {
  const board = executionConveyor.board || {};
  const stages = executionConveyor.stageRows || [];
  const firstBuyer = board.validatedBuyers?.[0] || buyerContactQueue?.[0] || {};
  const firstSeller = executionConveyor.callReadySellers?.[0] || moneyQueue.followUps?.[0] || moneyQueue.today?.[0] || {};
  const matchedBatch = executionConveyor.matchedSellerBatch || [];
  const feedbackLoop = executionConveyor.feedbackLoop || { totalFeedback: 0, tightening: 'Buyer feedback has not rewritten the next seller queue yet.' };
  const dealPacketReady = Boolean(firstSeller.contract?.ready && firstSeller.memo && (firstSeller.callOutcome === 'seller_interested' || firstSeller.crmStatus === 'Negotiating'));
  const sprintSteps = [
    {
      id: 'buyer-call',
      label: '01',
      title: 'Call the buyer first',
      status: board.validatedBuyers?.length ? 'clear' : 'active',
      action: firstBuyer.name ? `Call ${firstBuyer.name}` : 'Select one permit-active builder',
      detail: firstBuyer.phone || firstBuyer.email || 'Capture geography, lot size, max price, close speed, package recipient, utilities/access, and deal killers.',
      href: '#builders',
    },
    {
      id: 'seller-export',
      label: '02',
      title: 'Export matched sellers',
      status: matchedBatch.length ? 'active' : 'locked',
      action: matchedBatch.length ? `${matchedBatch.length} public owner rows match buyer demand` : 'Seller batch waits for buyer proof',
      detail: 'Export only buyer-box-matched public records; no seed/demo leads enter the call queue.',
      href: '#builders',
    },
    {
      id: 'skiptrace-return',
      label: '03',
      title: 'Import skip-trace return',
      status: executionConveyor.stats?.contactEnrichedRows ? 'clear' : matchedBatch.length ? 'active' : 'locked',
      action: executionConveyor.stats?.contactEnrichedRows ? `${executionConveyor.stats.contactEnrichedRows} owner contact rows enriched` : 'Paste returned phone/email CSV',
      detail: 'Phone/email promotes the row; missing or fake contact keeps it out of seller calls.',
      href: '#builders',
    },
    {
      id: 'seller-call',
      label: '04',
      title: 'Run seller call cockpit',
      status: executionConveyor.callReadySellers?.length ? 'active' : 'locked',
      action: firstSeller.ownerName ? `${firstSeller.ownerName} · ${firstSeller.address || firstSeller.parcelId}` : 'No seller call armed yet',
      detail: firstSeller.nextAction || 'Capture outcome, ask, timeline, motivation, access/buildability, and exact seller language.',
      href: '#builders',
    },
    {
      id: 'deal-packet',
      label: '05',
      title: 'Assemble deal packet gate',
      status: dealPacketReady ? 'clear' : executionConveyor.callReadySellers?.length ? 'active' : 'locked',
      action: dealPacketReady ? 'Buyer memo + title gate are sendable' : firstSeller.contract?.blockers?.[0] ? `Clear ${firstSeller.contract.blockers[0]}` : 'Wait for interested seller + title gate',
      detail: 'Package must carry parcel facts, buyer fit, seller range, assignment math, risk notes, title gate, and yes/no deadline.',
      href: '#builders',
    },
    {
      id: 'feedback-rewrite',
      label: '06',
      title: 'Rewrite tomorrow from buyer feedback',
      status: feedbackLoop.totalFeedback ? 'clear' : dealPacketReady ? 'active' : 'locked',
      action: feedbackLoop.totalFeedback ? feedbackLoop.tightening : 'Capture accept / maybe / reject after memo send',
      detail: 'Buyer response becomes the next seller-call filter instead of dead notes.',
      href: '#builders',
    },
  ];
  const activeStep = sprintSteps.find(step => step.status === 'active') || sprintSteps.find(step => step.status === 'locked') || sprintSteps.at(-1);
  const packetGate = [
    { label: 'Buyer demand', status: board.validatedBuyers?.length ? 'clear' : 'locked', detail: board.validatedBuyers?.length ? `${board.validatedBuyers.length} validated buy box row(s)` : 'No seller motion before complete buy box.' },
    { label: 'Seller outcome', status: firstSeller.callOutcome ? 'clear' : 'locked', detail: firstSeller.callOutcome ? (firstSeller.sellerCallOutcome || firstSeller.callOutcome) : 'Needs interested/maybe seller outcome.' },
    { label: 'Title/contract', status: firstSeller.contract?.ready ? 'clear' : 'review', detail: firstSeller.contract?.ready ? 'Gate clear enough for packet review.' : (firstSeller.contract?.blockers || ['contract/title packet pending']).join(' · ') },
    { label: 'Buyer memo', status: firstSeller.memo ? 'clear' : 'locked', detail: firstSeller.memo?.subject || 'Memo waits for seller range and gate clarity.' },
    { label: 'Feedback capture', status: feedbackLoop.totalFeedback ? 'clear' : 'review', detail: feedbackLoop.totalFeedback ? `${feedbackLoop.totalFeedback} buyer answer(s) captured.` : 'Add accept/maybe/reject after buyer send.' },
  ];
  const metrics = {
    buyers: executionConveyor.stats?.validatedBuyers || 0,
    sellers: executionConveyor.stats?.matchedSellerBatch || 0,
    contacts: executionConveyor.stats?.contactEnrichedRows || 0,
    packetReady: dealPacketReady ? 1 : 0,
  };
  return {
    generatedAt: now,
    title: 'Today’s Call Sprint',
    subtitle: 'One complete operator session: buyer proof → seller export → skip-trace return → seller outcome → deal packet → feedback rewrite.',
    activeStep,
    sprintSteps,
    packetGate,
    dealPacketReady,
    metrics,
    stages,
  };
}

export function buildBuyerFeedbackLoop(buyers = []) {
  const all = buyers.flatMap(buyer => (buyer.feedback || []).map(item => ({ buyerId: buyer.id, buyerName: buyer.name, ...normalizeBuyerFeedback(item) })));
  const accepted = all.filter(item => item.decision === 'accept').length;
  const rejected = all.filter(item => item.decision === 'reject').length;
  const maybe = all.filter(item => item.decision === 'maybe').length;
  const reasons = new Map();
  for (const item of all.filter(item => item.decision !== 'accept')) {
    const reason = String(item.reasonDetail || item.reason || 'other').toLowerCase();
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
  }
  const topRejectReasons = [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  const topReason = topRejectReasons[0]?.reason || '';
  const lessons = topRejectReasons.map(item => `${item.reason} ×${item.count}`).join('; ');
  const tightening = {
    price: 'Lower seller max offer or call cheaper owner basis first.',
    wetlands: 'Exclude wetland/review flags before seller calls.',
    access: 'Require legal/physical road access proof before memo.',
    utilities: 'Prioritize utility-nearby parcels and mark unknown utilities as review.',
    street: 'Ask buyer for street/area exclusions and stop sending off-street matches.',
    'lot-size': 'Tighten lot-size min/max in exact buy box.',
    title: 'Do title preflight before seller negotiation.',
    timing: 'Send only deals with decision-ready deadline and close-speed match.',
    other: 'Call buyer for exact rejection language before more seller outreach.',
  }[topReason] || 'No rejection pattern yet. Keep sending buyer-box-matched deals.';
  return { totalFeedback: all.length, accepted, rejected, maybe, acceptanceRate: all.length ? accepted / all.length : 0, topRejectReasons, lessons, tightening, feedback: all };
}

export function recommendNextSellerCallsFromFeedback(parcels = [], buyers = []) {
  const loop = buildBuyerFeedbackLoop(buyers);
  const topReason = loop.topRejectReasons[0]?.reason || '';
  const scored = parcels.map(parcel => {
    const buyer = buyers.find(item => item.id === parcel.buyerId) || {};
    const deal = scoreParcelDeal(parcel, buyer);
    let penalty = 0;
    if (topReason === 'price' && Number(parcel.askingPrice || 0) > Number(buyer.maxPrice || parcel.buyerMaxPrice || 0) * 0.75) penalty += 18;
    if (topReason === 'wetlands' && String(parcel.wetlands || '').match(/true|likely|review|yes/i)) penalty += 35;
    if (topReason === 'access' && parcel.roadAccess !== true) penalty += 30;
    if (topReason === 'utilities' && !String(parcel.utilities || '').match(/nearby|water|sewer|true/i)) penalty += 14;
    if (topReason === 'lot-size' && !parcelAcres(parcel)) penalty += 10;
    if (topReason === 'title' && !['attorney-reviewed', 'title-opened', 'active'].includes(String(parcel.titlePacketStatus || '').toLowerCase())) penalty += 14;
    const adjustedScore = Math.max(0, deal.score - penalty);
    return { ...deal, adjustedScore, feedbackPenalty: penalty, feedbackReason: topReason, nextCallReason: penalty ? `Penalty for buyer rejection pattern: ${topReason}` : `Matches current feedback pattern; ${loop.tightening}` };
  });
  return scored.sort((a, b) => b.adjustedScore - a.adjustedScore || b.metrics.spread - a.metrics.spread);
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

export function generateBuyerSendMemo(parcel = {}, buyer = {}, packet = generateOfferPacket(parcel, buyer), options = {}) {
  const scored = scoreParcelDeal(parcel, buyer);
  const contract = calculateContractReadiness({ ...scored, ...parcel }, buyer);
  const checklist = buildOperatorChecklist({ ...scored, ...parcel }, buyer);
  const deadline = options.deadline || parcel.buyerDecisionDeadline || 'Reply by 5pm today with yes/no and any diligence kill items.';
  const fit = buildDealFitMatrix([parcel], [buyer])[0] || { score: scored.score || 0, fit: scored.score >= 75 ? 'Strong' : scored.score >= 55 ? 'Review' : 'Weak', misses: [] };
  const riskLines = (packet.riskChecklist || buildRiskChecklist(parcel)).map(item => `${item.label}: ${item.status}${item.detail ? ` — ${item.detail}` : ''}`);
  const titleStatus = parcel.titlePacketStatus || (contract.ready ? 'attorney/title gate ready' : 'not ready');
  const assignmentFee = Math.max(0, Number(packet.assignmentPrice || 0) - Number(packet.sellerOffer || 0));
  const subject = `${parcel.address || 'Parcel'} — ${formatMoney(Number(packet.assignmentPrice || 0))} buyer memo`;
  const bullets = [
    `Parcel: ${parcel.address || packet.address || 'Unknown parcel'}${parcel.parcelId ? ` / APN ${parcel.parcelId}` : ''}`,
    `Fit: ${fit.fit || 'Review'} (${fit.score || scored.score || 0}/100) for ${buyer.name || packet.buyerName || 'buyer'} buy box`,
    `Price: seller target ${formatMoney(Number(packet.sellerOffer || 0))}; assignment price ${formatMoney(Number(packet.assignmentPrice || 0))}; estimated gross assignment fee ${formatMoney(assignmentFee)}`,
    `Spread after estimated closing costs: ${formatMoney(Number(packet.projectedSpread || 0))}`,
    `Buildability: ${scored.risk?.status || 'Review'}${scored.flags?.length ? ` — ${scored.flags.join(', ')}` : ''}`,
    `Title/contract gate: ${titleStatus}${contract.blockers?.length ? ` — blockers: ${contract.blockers.join('; ')}` : ''}`,
    `Decision deadline: ${deadline}`,
  ];
  const ask = `Can you confirm yes/no on this parcel, your max assignment price, and any immediate kill criteria (${riskLines.slice(0, 3).join('; ') || 'access/utilities/title'})?`;
  const message = `Subject: ${subject}\n\n${buyer.contactName ? `${buyer.contactName},` : 'Team,'}\n\nI have a buyer-box-matched parcel for review. Quick facts below.\n\n${bullets.map(item => `- ${item}`).join('\n')}\n\nRisk/detail notes:\n${riskLines.map(item => `- ${item}`).join('\n') || '- Risk checklist not available'}\n\nAsk: ${ask}\n\nIf this is a fit, I will hold the seller path open and coordinate title/assignment mechanics. If not, send the exact miss so I can tighten the next parcel batch.\n\n— Land Dealflow OS`;
  return { subject, bullets, ask, message, deadline, assignmentFee, fit, riskLines, contract, checklist, packet };
}

export function exportBuyerSendMemoMarkdown(memo = {}) {
  return `# Buyer Send Memo\n\n**Subject:** ${memo.subject || ''}\n\n## Send-ready message\n\n${memo.message || ''}\n\n## Operator controls\n- Decision deadline: ${memo.deadline || ''}\n- Assignment fee path: ${formatMoney(Number(memo.assignmentFee || 0))}\n- Contract gate: ${memo.contract?.label || 'unknown'}\n- Close probability: ${memo.checklist?.probability ?? 0}%\n`;
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

export const TITLE_CLOSING_STATUSES = [
  'missing-title-company',
  'assignment-friendly-title-needed',
  'title-packet-ready',
  'sent-to-title',
  'receipt-confirmed',
  'file-opened',
  'title-search',
  'clear-to-close',
  'hud-review',
  'docs-out-for-signature',
  'buyer-funded',
  'closed-funded',
  'blocked',
];

function moneyValue(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return 0;
}

function truthyStatus(value) {
  if (value === true) return true;
  return /^(yes|true|verified|attached|sent|complete|confirmed|secure-channel)$/i.test(String(value || '').trim());
}

export function calculateAssignmentMath(parcel = {}, buyer = {}, packet = generateOfferPacket(parcel, buyer)) {
  const sellerPrice = moneyValue(parcel.sellerContractPrice, parcel.cashToSeller, parcel.acceptedSellerPrice, packet.sellerOffer, parcel.askingPrice);
  const buyerPrice = moneyValue(parcel.buyerContractPrice, parcel.cashFromBuyer, packet.assignmentPrice, parcel.buyerMaxPrice, buyer.maxPrice);
  const closingCostsEstimate = moneyValue(parcel.closingCostEstimate, packet.closingCosts, buyer.closingCostsEstimate, 700);
  const assignmentFee = Math.max(0, moneyValue(parcel.assignmentFee, buyerPrice - sellerPrice));
  const netAfterCosts = Math.max(0, assignmentFee - closingCostsEstimate);
  return {
    sellerPrice,
    buyerPrice,
    assignmentFee,
    closingCostsEstimate,
    netAfterCosts,
    closingCostsPayer: parcel.closingCostsPayer || buyer.closingCostsPayer || 'buyer',
    spreadHealthy: assignmentFee >= Math.max(5000, buyerPrice * 0.12),
  };
}

export function buildTitleClosingChecklist(parcel = {}, buyer = {}, options = {}) {
  const packet = options.packet || generateOfferPacket(parcel, buyer);
  const math = calculateAssignmentMath(parcel, buyer, packet);
  const titleCompany = parcel.titleCompany || {};
  const titleCompanyName = parcel.titleCompanyName || titleCompany.name || '';
  const titleOfficer = parcel.titleOfficer || titleCompany.titleOfficer || '';
  const titleEmail = parcel.titleCompanyEmail || titleCompany.email || '';
  const buyerContact = parcel.buyerContactName || buyer.contactName || buyer.name || '';
  const buyerEmail = parcel.buyerEmail || buyer.email || '';
  const sellerContact = parcel.ownerName || parcel.owner || '';
  const sellerPhoneOrEmail = parcel.ownerPhone || parcel.ownerEmail || '';
  const assignmentFriendly = parcel.assignmentFriendlyTitleCompany ?? titleCompany.assignmentFriendly;
  const items = [
    { key: 'seller-contract', label: 'Seller purchase agreement executed', status: truthyStatus(parcel.sellerContractSigned || parcel.sellerContractStatus || parcel.titlePacketStatus) ? 'clear' : 'missing', detail: `${sellerContact || 'Seller'} at ${formatMoney(math.sellerPrice)}.` },
    { key: 'buyer-contract', label: 'Buyer / assignment agreement executed', status: truthyStatus(parcel.buyerContractSigned || parcel.buyerContractStatus || parcel.titlePacketStatus) ? 'clear' : 'missing', detail: `${buyerContact || 'Buyer'} at ${formatMoney(math.buyerPrice)}.` },
    { key: 'title-company', label: 'Assignment-friendly title company selected', status: titleCompanyName && assignmentFriendly !== false && String(assignmentFriendly || 'unknown') !== 'no' ? 'clear' : titleCompanyName ? 'review' : 'missing', detail: titleCompanyName ? `${titleCompanyName}${titleOfficer ? ` · ${titleOfficer}` : ''}` : 'Find/call local assignment-friendly title company.' },
    { key: 'party-info', label: 'Seller, buyer, assignor contact info complete', status: sellerContact && sellerPhoneOrEmail && buyerContact && buyerEmail ? 'clear' : 'missing', detail: `Seller: ${sellerPhoneOrEmail || 'missing'} · Buyer: ${buyerEmail || 'missing'}` },
    { key: 'closing-costs', label: 'Closing-cost payer captured', status: math.closingCostsPayer && math.closingCostsPayer !== 'unknown' ? 'clear' : 'missing', detail: `${math.closingCostsPayer || 'unknown'} · est. ${formatMoney(math.closingCostsEstimate)}` },
    { key: 'wire-safety', label: 'Wire/payee process verified safely', status: truthyStatus(parcel.wireInstructionsStatus) ? 'clear' : 'review', detail: parcel.wireInstructionsStatus || 'Use secure title-approved channel + verbal verification.' },
    { key: 'hud-review', label: 'HUD/settlement numbers ready for review', status: truthyStatus(parcel.hudReviewed || parcel.hudStatus) ? 'clear' : 'review', detail: `Seller ${formatMoney(math.sellerPrice)} · buyer ${formatMoney(math.buyerPrice)} · fee ${formatMoney(math.assignmentFee)}` },
  ];
  const clear = items.filter(item => item.status === 'clear').length;
  const missing = items.filter(item => item.status === 'missing');
  const review = items.filter(item => item.status === 'review');
  let status = 'title-packet-ready';
  if (!titleCompanyName) status = 'missing-title-company';
  else if (assignmentFriendly === false || String(assignmentFriendly || '').toLowerCase() === 'no') status = 'assignment-friendly-title-needed';
  else if (missing.length) status = 'assignment-friendly-title-needed';
  if (truthyStatus(parcel.fileOpened || parcel.titleFileNumber)) status = 'file-opened';
  if (truthyStatus(parcel.titleSearchStarted)) status = 'title-search';
  if (truthyStatus(parcel.clearToClose)) status = 'clear-to-close';
  if (truthyStatus(parcel.hudReviewed || parcel.hudStatus)) status = 'hud-review';
  if (truthyStatus(parcel.buyerFunded)) status = 'buyer-funded';
  if (truthyStatus(parcel.closedFunded || parcel.disbursementConfirmed)) status = 'closed-funded';
  if (truthyStatus(parcel.titleBlocked)) status = 'blocked';
  return {
    status,
    label: status.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' '),
    readiness: Math.round((clear / items.length) * 100),
    clear,
    missing: missing.map(item => item.label),
    review: review.map(item => item.label),
    items,
    math,
    packet,
    titleCompany: { name: titleCompanyName, titleOfficer, email: titleEmail, fileNumber: parcel.titleFileNumber || titleCompany.fileNumber || '' },
  };
}

export function generateTitleCompanyEmail(parcel = {}, buyer = {}, assignor = {}) {
  const packet = generateOfferPacket(parcel, buyer);
  const math = calculateAssignmentMath(parcel, buyer, packet);
  const propertyAddress = parcel.address || packet.address || '<PROPERTY ADDRESS>';
  const closingDate = parcel.targetClosingDate || parcel.closingDate || '<CLOSING DATE>';
  const assignorName = assignor.name || parcel.assignorName || '<YOUR NAME>';
  const assignorCompany = assignor.company || parcel.assignorCompany || 'Land Dealflow OS';
  const assignorPhone = assignor.phone || parcel.assignorPhone || '<YOUR NUMBER>';
  const assignorEmail = assignor.email || parcel.assignorEmail || '<YOUR EMAIL>';
  const subject = `${propertyAddress} - Assignment`;
  const body = `Hello,\n\nI hope you’re doing well. We are opening an assignment closing for this property. I included the seller, buyer, and assignor information below, along with the purchase/assignment contracts. Please confirm receipt of this email once you receive it. Thank you!\n\nPlease confirm your office can handle this assignment closing, who the assigned title officer is, the expected closing timeline, and when we should expect the preliminary HUD/settlement statement for review.\n\nWire/payee note: we will use your secure title-company-approved process and verbally verify instructions before funds move.\n\nClosing Date: ${closingDate}\nProperty: ${propertyAddress}${parcel.parcelId ? `\nParcel ID: ${parcel.parcelId}` : ''}\n\nSeller:\nName: ${parcel.ownerName || parcel.owner || '<SELLER NAME>'}\nPhone: ${parcel.ownerPhone || '<SELLER PHONE NUMBER>'}\nEmail: ${parcel.ownerEmail || '<SELLER EMAIL ADDRESS>'}\nCash to seller: ${formatMoney(math.sellerPrice)}\n\nAssignor:\nName: ${assignorName}\nCompany: ${assignorCompany}\nPhone: ${assignorPhone}\nEmail: ${assignorEmail}\nAssignment Fee: ${formatMoney(math.assignmentFee)}\n\nBuyer:\nName: ${parcel.buyerContactName || buyer.contactName || buyer.name || '<BUYER NAME>'}\nPhone Number: ${parcel.buyerPhone || buyer.phone || '<BUYER PHONE NUMBER>'}\nEmail: ${parcel.buyerEmail || buyer.email || '<BUYER EMAIL>'}\nCash from Buyer: ${formatMoney(math.buyerPrice)}\nClosing Costs Payer: ${math.closingCostsPayer}\n\nAttachments:\n- Seller purchase agreement\n- Buyer/assignment agreement\n- Any addenda\n- W-9/payee information if required\n\nThank you,\n${assignorName}\n${assignorCompany}`;
  return { subject, body, math, packet };
}

export const CONTRACT_PACKET_RESEARCH_NOTES = [
  'Public template research shows reusable business terms: parties, property, purchase price, earnest money, due diligence, title, closing, assignability, and signatures.',
  'Public bar and template forms still warn users to consult counsel before signing; this app cannot mark wording lawyer verified until a licensed attorney for the property state approves it.',
  'Use state adapted vacant land forms and title company instructions. Keep a 50 state baseline as a drafting checklist, not as legal approval.',
];

export function buildContractPacketDraft(inputs = {}) {
  const propertyState = String(inputs.propertyState || inputs.state || '').toUpperCase();
  const stateMode = propertyState ? `${propertyState} attorney review required` : 'property state required';
  const sellerAgreement = {
    title: 'Vacant Land Purchase Agreement',
    role: 'seller',
    fields: [
      'effectiveDate', 'buyerName', 'sellerName', 'propertyAddress', 'city', 'county', 'propertyState', 'zip', 'parcelId',
      'legalDescription', 'includedRights', 'purchasePrice', 'earnestMoney', 'earnestMoneyHolder', 'closingAgent',
      'feasibilityDeadline', 'closingDate', 'closingCostsPayer', 'taxProration', 'deedType', 'assignability',
      'additionalTerms', 'sellerSignature', 'buyerSignature', 'attorneyReviewer', 'attorneyReviewDate'
    ],
    clauses: [
      'Buyer offers to purchase and Seller agrees to sell the described vacant land, together with appurtenant rights stated in this packet.',
      'Property is sold as is, subject to Buyer feasibility, title, survey, access, utilities, zoning, environmental, flood, wetland, and buildability review.',
      'If Buyer disapproves title or feasibility before the stated deadline, Buyer may cancel by written notice and recover refundable earnest money unless state counsel changes this clause.',
      'Buyer may assign this agreement only if assignability is permitted by the property state, the title company, and the attorney reviewed version of this packet.',
      'Closing occurs through a licensed title, escrow, closing, or attorney office authorized for the property state. No party relies on this app as legal advice.',
    ],
  };
  const buyerAssignment = {
    title: 'Assignment of Vacant Land Purchase Agreement',
    role: 'buyer',
    fields: [
      'effectiveDate', 'assignorName', 'assigneeName', 'underlyingSellerName', 'propertyAddress', 'parcelId',
      'propertyState', 'originalPurchasePrice', 'assignmentFee', 'assigneePurchasePrice', 'earnestMoneyDue',
      'earnestMoneyDeadline', 'inspectionAcknowledgement', 'titleCompany', 'settlementStatementApproval',
      'additionalTerms', 'assignorSignature', 'assigneeSignature', 'attorneyReviewer', 'attorneyReviewDate'
    ],
    clauses: [
      'Assignor assigns to Assignee the assignable buyer rights in the underlying purchase agreement for the property identified in this packet.',
      'Assignee accepts the assigned buyer position and agrees to perform the buyer obligations that survive assignment, subject to title company and attorney approval.',
      'The assignment fee is payable only through the closing or settlement statement unless state counsel and the title company approve another written method.',
      'Assignee must deliver required earnest money by the stated deadline and confirm title company opening requirements before the operator marks the packet active.',
      'This assignment is not usable until the underlying seller contract, property state requirements, title company instructions, and attorney review gate are clear.',
    ],
  };
  const required = [...sellerAgreement.fields, ...buyerAssignment.fields];
  const filled = required.filter(field => String(inputs[field] ?? '').trim()).length;
  const attorneyReviewed = Boolean(inputs.attorneyReviewer && inputs.attorneyReviewDate && inputs.propertyState);
  const status = attorneyReviewed ? 'attorney-reviewed' : propertyState ? 'draft-needs-attorney-review' : 'missing-property-state';
  return {
    id: inputs.id || `contract-packet-${Date.now()}`,
    generatedAt: inputs.generatedAt || new Date().toISOString(),
    status,
    stateMode,
    attorneyReviewed,
    completion: Math.round((filled / required.length) * 100),
    inputs: { ...inputs, propertyState },
    sellerAgreement,
    buyerAssignment,
    coverLetter: {
      title: 'Attorney and title company contract review letter',
      subject: `Contract review request - ${inputs.propertyAddress || 'vacant land packet'}`,
      body: `Please review the attached seller purchase agreement and buyer assignment packet for ${inputs.propertyAddress || 'the vacant land property'} in ${propertyState || '<STATE>'}. Confirm state specific wording, assignability, feasibility/title contingencies, earnest money timing, closing/title instructions, settlement statement treatment of any assignment fee, and any required disclosures or addenda before this packet is used for signature.`,
    },
    researchNotes: CONTRACT_PACKET_RESEARCH_NOTES,
    legalGuardrail: 'Drafting aid only. Do not use for signature until reviewed by a licensed attorney for the property state and accepted by the closing/title provider.',
  };
}

export function renderContractDocumentText(document = {}, inputs = {}) {
  const lines = [
    document.title || 'Contract Document',
    '',
    `Effective Date: ${inputs.effectiveDate || '__________'}`,
    `Property: ${inputs.propertyAddress || '__________'}, ${inputs.city || ''} ${inputs.propertyState || ''} ${inputs.zip || ''}`.trim(),
    `County: ${inputs.county || '__________'}`,
    `Parcel ID: ${inputs.parcelId || '__________'}`,
    `Legal Description: ${inputs.legalDescription || 'see attached exhibit / to be verified by title'}`,
    '',
    'Business Terms',
    `Purchase Price: ${inputs.purchasePrice || inputs.originalPurchasePrice || '__________'}`,
    `Earnest Money: ${inputs.earnestMoney || inputs.earnestMoneyDue || '__________'}`,
    `Closing Agent / Title Company: ${inputs.closingAgent || inputs.titleCompany || '__________'}`,
    `Closing Date: ${inputs.closingDate || '__________'}`,
    '',
    'Draft Clauses Requiring State Attorney Review',
    ...(document.clauses || []).map((clause, index) => `${index + 1}. ${clause}`),
    '',
    'Additional Terms',
    inputs.additionalTerms || '____________________________________________________________',
    '',
    'Attorney Review Gate',
    `Reviewer: ${inputs.attorneyReviewer || 'NOT REVIEWED'}`,
    `Review Date: ${inputs.attorneyReviewDate || 'NOT REVIEWED'}`,
    '',
    'Signatures',
    `Seller / Assignor: ${inputs.sellerSignature || inputs.assignorSignature || '____________________________'}`,
    `Buyer / Assignee: ${inputs.buyerSignature || inputs.assigneeSignature || '____________________________'}`,
  ];
  return lines.join('\n');
}

export function exportContractPacketMarkdown(packet = {}) {
  return `# ${packet.inputs?.propertyAddress || 'Vacant Land Contract Packet'}\n\n**Status:** ${packet.status || 'draft'}\n\n**Legal guardrail:** ${packet.legalGuardrail || ''}\n\n## Attorney And Title Review Letter\n\n**Subject:** ${packet.coverLetter?.subject || ''}\n\n${packet.coverLetter?.body || ''}\n\n## Seller One Page Contract\n\n${renderContractDocumentText(packet.sellerAgreement, packet.inputs)}\n\n## Buyer Assignment One Page Contract\n\n${renderContractDocumentText(packet.buyerAssignment, packet.inputs)}\n\n## Research Notes\n${(packet.researchNotes || []).map(note => `- ${note}`).join('\n')}\n`;
}

export function buildTitleCompanyClosingDesk(parcel = {}, buyer = {}, options = {}) {
  const checklist = buildTitleClosingChecklist(parcel, buyer, options);
  const email = generateTitleCompanyEmail(parcel, buyer, options.assignor || {});
  const timeline = [
    { day: 'Day 0', label: 'Send packet', detail: 'Seller/buyer contracts + party info emailed to title.' },
    { day: 'Day 1', label: 'Receipt confirmed', detail: 'File opened, title officer assigned, buyer EMD/funding instructions clarified.' },
    { day: 'Days 2–7', label: 'Title/lien/tax search', detail: 'Title clears deed, liens, taxes, judgments, and proration.' },
    { day: 'Days 7–10', label: 'HUD + final docs', detail: 'Review seller cash, buyer cash, closing costs, assignment fee.' },
    { day: 'Days 10–14', label: 'Sign, fund, close', detail: 'Docs notarized/returned, buyer wires, title disburses.' },
  ];
  const nextAction = checklist.status === 'missing-title-company'
    ? 'Find and call an assignment-friendly title company local to the property.'
    : checklist.missing.length
      ? `Complete: ${checklist.missing[0]}.`
      : checklist.review.length
        ? `Review: ${checklist.review[0]}.`
        : checklist.status === 'closed-funded'
          ? 'Archive the file and record the assignment fee collected.'
          : 'Send the title packet and request receipt/file number.';
  return { ...checklist, email, timeline, nextAction };
}


export function normalizeBuilderName(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(inc|llc|l\.l\.c|corp|corporation|company|co|builders?|homes?|construction|contractors?)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isQualifyingResidentialPermit(record = {}) {
  const type = String(record.permitType || record.type || record.workClass || record.description || '').toLowerCase();
  const status = String(record.permitStatus || record.status || '').toLowerCase();
  const includeType = /(new|single family|sfr|residential|dwelling|1 family)/.test(type)
    && !/(roof|solar|hvac|mechanical|plumb|electric|pool|fence|shed|remodel|alteration|addition|demo|demolition|repair)/.test(type);
  const includeStatus = /(approved|issued|final|completed|co issued|certificate)/.test(status)
    && !/(cancel|expire|denied|void|withdraw|rejected)/.test(status);
  return includeType && includeStatus;
}

function recentEnough(dateValue, months = 12, now = new Date()) {
  const date = new Date(dateValue || 0);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return date >= cutoff;
}

export function buildPermitVerifiedBuilders(records = [], options = {}) {
  const months = options.months || 12;
  const minimumPermits = options.minimumPermits || 3;
  const now = options.now ? new Date(options.now) : new Date();
  const groups = new Map();

  for (const record of records || []) {
    if (!isQualifyingResidentialPermit(record)) continue;
    const issueDate = record.issueDate || record.approvedDate || record.date || record.permitDate;
    if (!recentEnough(issueDate, months, now)) continue;
    const rawName = record.contractorName || record.builderName || record.applicantName || record.companyName || '';
    const normalizedName = normalizeBuilderName(rawName || record.licenseNumber || 'unknown');
    if (!normalizedName) continue;
    const key = `${normalizedName}|${record.licenseNumber || ''}`;
    const existing = groups.get(key) || {
      builderId: `builder-${normalizedName.replace(/\s+/g, '-')}`,
      companyName: rawName,
      normalizedName,
      licenseNumber: record.licenseNumber || '',
      contactName: record.contactName || '',
      phone: record.phone || '',
      email: record.email || '',
      website: record.website || '',
      sourceJurisdictions: [],
      recentPermits: [],
      qualifyingPermitCount: 0,
      contactConfidence: 0,
      buyBoxStatus: 'unknown',
      buyBox: {},
      nextAction: 'call',
    };
    existing.companyName = existing.companyName || rawName;
    existing.licenseNumber = existing.licenseNumber || record.licenseNumber || '';
    existing.contactName = existing.contactName || record.contactName || '';
    existing.phone = existing.phone || record.phone || '';
    existing.email = existing.email || record.email || '';
    existing.website = existing.website || record.website || '';
    if (record.jurisdiction && !existing.sourceJurisdictions.includes(record.jurisdiction)) existing.sourceJurisdictions.push(record.jurisdiction);
    existing.recentPermits.push({
      permitNumber: record.permitNumber || record.id || '',
      permitStatus: record.permitStatus || record.status || '',
      permitType: record.permitType || record.type || '',
      issueDate,
      jurisdiction: record.jurisdiction || '',
      siteAddress: record.siteAddress || record.address || '',
      parcelId: record.parcelId || '',
      contractorName: rawName,
      licenseNumber: record.licenseNumber || '',
      sourceUrl: record.sourceUrl || '',
      sourceRetrievedAt: record.sourceRetrievedAt || '',
    });
    existing.qualifyingPermitCount = existing.recentPermits.length;
    existing.contactConfidence = Math.min(100, (existing.phone ? 35 : 0) + (existing.email ? 35 : 0) + (existing.website ? 15 : 0) + (existing.licenseNumber ? 15 : 0));
    existing.activityTier = existing.qualifyingPermitCount >= 25 ? 'production_builder' : existing.qualifyingPermitCount >= 6 ? 'local_regional' : 'small_active';
    groups.set(key, existing);
  }

  return [...groups.values()]
    .filter(builder => builder.qualifyingPermitCount >= minimumPermits)
    .map(builder => ({ ...builder, score: scorePermitVerifiedBuilder(builder) }))
    .sort((a, b) => b.score - a.score);
}

export function scorePermitVerifiedBuilder(builder = {}) {
  const permitScore = Math.min(38, Number(builder.qualifyingPermitCount || 0) * 7);
  const recencyScore = Math.min(22, (builder.recentPermits || []).filter(row => row.issueDate).length * 5);
  const contactScore = Math.round((Number(builder.contactConfidence || 0) / 100) * 22);
  const buyBoxScore = builder.buyBoxStatus === 'captured' ? 18 : builder.buyBoxStatus === 'contacted' ? 8 : 0;
  return Math.min(100, permitScore + recencyScore + contactScore + buyBoxScore);
}

export function generateBuilderCallScript(builder = {}) {
  const city = builder.primaryCity || builder.market || '{{City}}';
  const name = builder.companyName || '{{CompanyName}}';
  return `Hey ${builder.contactName || '{{Name}}'}, this is {{YourName}}. I saw ${name} has recent new-construction permits in ${city}. I source off-market residential lots for builders. Are you still buying land there? What zip codes, lot sizes, max price, and deal-breakers are you looking for right now? If I find lots that match your terms below your target price, can I send them over for a quick yes/no?`;
}

function getBuilderTopPermitEvidence(builder = {}) {
  const permit = (builder.permitEvidence || builder.recentPermits || [])[0] || {};
  const permitNumber = builder.topPermit || permit.permitNumber || permit.id || '';
  const permitAddress = builder.topPermitAddress || permit.address || permit.siteAddress || '';
  return { permitNumber, permitAddress };
}

function getPermitSourcePhrase(builder = {}) {
  const source = `${builder.sourceType || ''} ${builder.sourceEvidence || ''} ${builder.marketName || ''} ${builder.market || ''}`.toLowerCase();
  if (source.includes('kgis') || source.includes('knoxville')) return 'public KGIS permit-backed';
  if (source.includes('socrata')) return 'public open-data permit-backed';
  if (source.includes('accela')) return 'public Accela permit-backed';
  if (source.includes('arcgis')) return 'public ArcGIS permit-backed';
  return 'public permit-backed';
}

export function generateBuilderEmail(builder = {}) {
  const market = builder.marketName || builder.primaryCity || builder.market || '{{Market}}';
  const company = builder.name || builder.companyName || '{{CompanyName}}';
  const recentBuilds = Number(builder.recentBuilds || builder.qualifyingPermitCount || 0);
  const { permitNumber, permitAddress } = getBuilderTopPermitEvidence(builder);
  const sourcePhrase = getPermitSourcePhrase(builder);
  const proofClause = recentBuilds
    ? `${company} shows ${recentBuilds} recent residential build signals${permitNumber || permitAddress ? `, including ${permitNumber || 'a recent permit'} near ${permitAddress || market}` : ''}.`
    : `${company} shows recent residential permit/build activity in ${market}.`;
  const subject = 'Off-Market Lots for Builders - Let’s Connect';
  const buyBoxQuestions = [
    'What zip codes/subdivisions?',
    'Lot sizes?',
    'Max lot price?',
    'Utility/access requirements?',
    'Any deal killers I should screen for before sending anything?',
  ].map(question => `- ${question}`).join('\n');
  const body = `Good morning,\n\nMy name is Okeito, and I run MarvelUs Intel LLC. We specialize in sourcing off-market lots at a discount for builders.\n\nI’m tracking ${sourcePhrase} builder activity in ${market}. ${proofClause}\n\nI’m building a small list of off-market lots and only want to send properties that fit your actual buy box. Could you send me your criteria on these?\n\n${buyBoxQuestions}\n\nIf there is a better land/acquisitions contact, who should I send parcel packages to?\n\nLooking forward to working together!\n\nOkeito S.\nMarvelUs Intel LLC`;
  return { subject, body };
}

export function generateBuilderMarketingEmailTemplate(builder = {}) {
  return generateBuilderEmail(builder);
}

export function getSourceAdapterChecklist() {
  return [
    { id: 'accela', name: 'Accela', use: 'Florida-style Citizen Access portals; search by record/date/contractor/parcel.', fields: ['record number', 'status', 'permit type', 'issue date', 'contractor license', 'site address'] },
    { id: 'socrata', name: 'Socrata', use: 'Best-case open-data API; query issued residential permits by date and contractor.', fields: ['dataset id', 'where clause', 'contractor fields', 'API pagination'] },
    { id: 'energov', name: 'EnerGov / Tyler', use: 'County/city permitting portals with reports or public search.', fields: ['permit type filter', 'status filter', 'date range', 'contractor/applicant'] },
    { id: 'etrakit', name: 'eTRAKiT', use: 'Municipal permit search; often good for contractor and address lookups.', fields: ['project type', 'issued date', 'contractor', 'parcel/address'] },
    { id: 'manual-csv', name: 'Manual CSV', use: 'Human/browser export fallback; normalize columns into permit evidence rows.', fields: ['permitNumber', 'permitStatus', 'permitType', 'issueDate', 'contractorName'] },
  ];
}


export function getPermitPortalLandscape() {
  return {
    summary: 'No target state has a unified statewide building-permit database. Normalize by platform first, then monitor the county/city portals that control your target markets.',
    leadingMarkets: [
      { rank: 1, state: 'TN', market: 'Knoxville / Knox County', reason: 'Current live permit-backed builder queue; Buildchek + Knoxville/KGIS-style public records; validate buyer buy boxes first.', zillowUrl: 'https://www.zillow.com/knoxville-tn/' },
      { rank: 2, state: 'TN', market: 'Murfreesboro / Rutherford County', reason: 'CivicPlus/CivicGov sprawl market near Nashville edge; direct portal monitoring priority.', zillowUrl: 'https://www.zillow.com/murfreesboro-tn/' },
      { rank: 3, state: 'TN', market: 'Franklin / Williamson County', reason: 'IDT Plans/GeoCivix electronic plan review; high builder demand, higher land-price discipline required.', zillowUrl: 'https://www.zillow.com/franklin-tn/' },
      { rank: 4, state: 'TN', market: 'Clarksville / Montgomery County', reason: 'Buildchek + county portal; growth corridor with simpler seller-search expansion than Nashville proper.', zillowUrl: 'https://www.zillow.com/clarksville-tn/' },
      { rank: 5, state: 'FL', market: 'Polk / Marion / Lake / Alachua inland Florida', reason: 'Accela/Civic Access-heavy inland growth; avoids coastal insurance-friction bias while keeping builder demand.', zillowUrl: 'https://www.zillow.com/polk-county-fl/' },
      { rank: 6, state: 'AZ', market: 'Maricopa velocity markets', reason: 'Weekly reports + Accela/self-certification cities: Phoenix, Mesa, Scottsdale, Tempe, Buckeye.', zillowUrl: 'https://www.zillow.com/maricopa-county-az/' },
      { rank: 7, state: 'NC', market: 'Charlotte / Mecklenburg → Wake → Guilford corridor', reason: 'Buildchek + Accela + Power BI/ArcGIS data; strong Piedmont land-flipping corridor.', zillowUrl: 'https://www.zillow.com/charlotte-nc/' },
      { rank: 8, state: 'TX', market: 'Austin / San Antonio open-data corridor', reason: 'Socrata/open data gives programmatic permit intake before fragmented Houston/Dallas work; PermitVector covers normalized paid expansion.', zillowUrl: 'https://www.zillow.com/austin-tx/' },
    ],
    states: [
      {
        id: 'tn',
        state: 'Tennessee',
        reality: 'No statewide portal. Counties and cities run independent systems.',
        platforms: ['CivicPlus / CivicGov', 'IDT Plans / GeoCivix', 'Buildchek', 'Tyler Permitting Pro'],
        portals: [
          { market: 'Nashville', jurisdiction: 'Davidson County / Metro Nashville', system: 'Buildchek + Metro Nashville Codes', url: 'https://www.buildchek.com/' },
          { market: 'Nashville Codes', jurisdiction: 'Metro Nashville', system: 'Codes Administration', url: 'https://www.nashville.gov/departments/codes' },
          { market: 'Memphis', jurisdiction: 'Shelby County', system: 'Buildchek + Shelby County portal', url: 'https://shelbycountytn.gov/2175/Code-Enforcement' },
          { market: 'Knoxville', jurisdiction: 'Knox County / City of Knoxville', system: 'Buildchek + Knoxville portal', url: 'https://www.knoxvilletn.gov/government/city_departments_offices/plans_review_inspections' },
          { market: 'Chattanooga', jurisdiction: 'Hamilton County', system: 'Buildchek + county inspection office', url: 'https://www.hamiltontn.gov/BuildingInspection' },
          { market: 'Clarksville', jurisdiction: 'Montgomery County', system: 'Buildchek + county building/codes', url: 'https://mcgtn.org/building-codes' },
          { market: 'Murfreesboro', jurisdiction: 'Rutherford County / City of Murfreesboro', system: 'CivicPlus / CivicGov Citizen Portal', url: 'https://www.murfreesborotn.gov/175/Building-Codes' },
          { market: 'Franklin', jurisdiction: 'Williamson County', system: 'IDT Plans / GeoCivix electronic plan review', url: 'https://williamson.geocivix.com/secure/' },
          { market: 'Jackson', jurisdiction: 'Madison County', system: 'CivicGov Citizen Portal / Building + Zoning', url: 'https://www.madisoncountytn.gov/191/Building-Zoning' },
        ],
        strategy: 'Use Buildchek as the single first pass across major metros. For real-time builder sprawl, bookmark Rutherford, Williamson, Montgomery, Davidson, Shelby, Knox, and Hamilton direct portals.',
        sequence: { status: 'live', label: 'Live source lane', unlock: 'Keep Knoxville at 20+ unique builders and expand Tennessee county lanes before seller sourcing.' },
        pipeline: [
          { step: '01', title: 'Aggregate recent permits', source: 'Buildchek + Knox/Metro/direct county portals', action: 'Pull issued/approved residential permits from Knoxville first, then Rutherford, Williamson, Montgomery, Davidson, Shelby, Knox, and Hamilton.', output: '20+ unique permit-active builders with jurisdiction and recent-permit proof.' },
          { step: '02', title: 'Deduplicate builder entities', source: 'Company name, license number, permit applicant, public business records', action: 'Merge regional/HQ variants while preserving permit-market geography.', output: 'One builder row per operating company, not one row per office address.' },
          { step: '03', title: 'Enrich public contact path', source: 'Official website, state/county contractor/business pages, public company contact pages', action: 'Attach lawful public phone/email/contact page only; route weak contacts to human review.', output: 'Buyer-validation queue with callable/public-contact confidence.' },
          { step: '04', title: 'Capture buy box', source: 'Phone/email outreach scripts', action: 'Ask geography, lot size, max price, close speed, utilities/access, and deal killers before any seller pull.', output: 'Validated buy boxes that unlock Tennessee seller matching.' }
        ]
      },
      {
        id: 'fl',
        state: 'Florida — inland markets',
        reality: 'No statewide building-permit portal. MyFloridaMarketPlace is state procurement, not building permits.',
        platforms: ['Accela Citizen Access', 'Tyler EnerGov', 'TRAKiT / CentralSquare', 'Munis', 'Civic Access / CivicPlus'],
        portals: [
          { market: 'Orlando', jurisdiction: 'Orange County', system: 'Fast Track / permit services', url: 'https://fasttrack.ocfl.net/OnlineServices/' },
          { market: 'Orlando city', jurisdiction: 'City of Orlando', system: 'Citizen Access permit portal', url: 'https://permits.cityoforlando.net/CitizenAccess/Default.aspx' },
          { market: 'Lakeland', jurisdiction: 'Polk County / City of Lakeland', system: 'Custom / Accela-style local permitting', url: 'https://www.lakelandgov.net/departments/community-economic-development/building-inspection/' },
          { market: 'Ocala', jurisdiction: 'Marion County', system: 'Civic Access / Building Safety', url: 'https://www.marionfl.org/agencies-departments/departments-facilities-offices/building-safety' },
          { market: 'Jacksonville', jurisdiction: 'Duval County / City of Jacksonville', system: 'Jacksonville permit/inspection services', url: 'https://jaxepics.coj.net/' },
          { market: 'Gainesville', jurisdiction: 'Alachua County', system: 'Permit tracking / Accela-style portal', url: 'https://growth-management.alachuacounty.us/Building/PermitTracking' },
          { market: 'St. Lucie', jurisdiction: 'St. Lucie County', system: 'Tyler EnerGov self service', url: 'https://energovweb.stlucieco.gov/EnerGovProd/SelfService#/home' },
          { market: 'Homestead', jurisdiction: 'City of Homestead', system: 'Tyler EnerGov self service', url: 'https://energov.cityofhomestead.com/EnerGovProd/SelfService#/home' },
          { market: 'Clermont', jurisdiction: 'City of Clermont', system: 'TRAKiT / CentralSquare legacy + migration', url: 'https://www.clermontfl.gov/186/Building-Services' },
        ],
        strategy: 'Florida is the most fragmented. Learn Accela first, then monitor inland growth counties: Polk, Marion, Lake, Sumter, Alachua, St. Lucie, and Orange. Inland markets avoid some coastal insurance friction while keeping builder demand.',
        sequence: { status: 'resource', label: 'Source lane', unlock: 'Pull this market whenever it becomes strategically useful; no fixed state order is required.' },
        pipeline: [
          { step: '01', title: 'Stand up Accela/EnerGov search pattern', source: 'Polk, Marion, Lake, Sumter, Alachua, Orange, St. Lucie direct portals', action: 'Search recent issued residential/new-construction permits and normalize applicant/contractor names.', output: 'Inland Florida permit candidate sheet by county and portal type.' },
          { step: '02', title: 'Separate inland growth from coastal friction', source: 'Permit jurisdiction + county risk context', action: 'Prioritize Polk/Marion/Lake/Sumter/Alachua before coastal-heavy markets.', output: 'Builder batch limited to markets with cleaner seller-call economics.' },
          { step: '03', title: 'Enrich builder contact path', source: 'Public company websites, Sunbiz/business pages, permit applicant metadata', action: 'Attach only public business contact channels and mark weak rows human-review.', output: '20+ inland Florida builder-validation candidates.' },
          { step: '04', title: 'Gate seller search by buy box', source: 'Buyer-validation calls/emails', action: 'Capture price, parcel size, utilities/access, flood/wetland deal killers, and close timeline before seller pulls.', output: 'Florida seller-geography rules ready for later skip-trace.' }
        ]
      },
      {
        id: 'az',
        state: 'Arizona',
        reality: 'No statewide building-permit database. The state has 100+ building-regulating jurisdictions with local codes, fees, and portals.',
        platforms: ['Accela', 'Custom / Socrata open data', 'Maricopa County weekly reports', 'Self-certification city programs'],
        portals: [
          { market: 'Phoenix', jurisdiction: 'City of Phoenix', system: 'Planning & Development / online services', url: 'https://www.phoenix.gov/pdd/onlineservices' },
          { market: 'Mesa', jurisdiction: 'City of Mesa', system: 'Accela Citizen Access', url: 'https://aca-prod.accela.com/MESA/Default.aspx' },
          { market: 'Scottsdale', jurisdiction: 'City of Scottsdale', system: 'Accela Citizen Access', url: 'https://aca-prod.accela.com/SCOTTSDALE/Default.aspx' },
          { market: 'Phoenix metro', jurisdiction: 'Maricopa County', system: 'Weekly permit activity / planning development', url: 'https://www.maricopa.gov/797/Planning-Development' },
          { market: 'Tucson', jurisdiction: 'City of Tucson', system: 'Development Services / Accela-style portal', url: 'https://www.tucsonaz.gov/Departments/Planning-Development-Services' },
          { market: 'Tucson / Pima', jurisdiction: 'Pima County', system: 'Development Services', url: 'https://www.pima.gov/1389/Development-Services' },
          { market: 'Buckeye', jurisdiction: 'City of Buckeye', system: 'Custom development services', url: 'https://www.buckeyeaz.gov/business/development-services' },
          { market: 'Casa Grande', jurisdiction: 'City of Casa Grande', system: 'Custom development services', url: 'https://casagrandeaz.gov/development-services/' },
        ],
        strategy: 'Maricopa weekly reports are the Phoenix-metro normalization goldmine. Then use Accela-heavy cities and self-certification markets — Phoenix, Scottsdale, Mesa, Tempe — as velocity markets.',
        sequence: { status: 'resource', label: 'Source lane', unlock: 'Pull this market whenever it becomes strategically useful; no fixed state order is required.' },
        pipeline: [
          { step: '01', title: 'Normalize weekly permit drops', source: 'Maricopa County weekly permit activity + Phoenix/Mesa/Scottsdale Accela-style portals', action: 'Pull new residential permits and self-certification activity, then map applicant/contractor names to permit-market jurisdictions.', output: 'Phoenix-metro recent-permit builder candidate sheet.' },
          { step: '02', title: 'Prioritize velocity cities', source: 'Phoenix, Scottsdale, Mesa, Tempe, Buckeye, Casa Grande', action: 'Rank jurisdictions by recency, permit volume, and ease of portal access.', output: 'AZ market order for the first 20-builder pull.' },
          { step: '03', title: 'Public contact enrichment', source: 'Arizona contractor/business records and builder websites', action: 'Attach public company contacts; hold rows with weak proof for human review.', output: '20+ Arizona builder-validation candidates.' },
          { step: '04', title: 'Buy-box capture before parcels', source: 'Phone/email outreach', action: 'Capture zip/subdivision appetite, lot size, max price, utilities/access, slope/flood constraints, and close speed.', output: 'Arizona seller-search gates ready only after buyer demand is validated.' }
        ]
      },
      {
        id: 'nc',
        state: 'North Carolina',
        reality: 'No statewide portal. Counties operate independent permit stacks.',
        platforms: ['Accela', 'Buildchek', 'Power BI / Open Data', 'ArcGIS Open Data'],
        portals: [
          { market: 'Charlotte', jurisdiction: 'Mecklenburg County', system: 'Accela + daily permit dashboards', url: 'https://aca-prod.accela.com/Charlotte/Default.aspx' },
          { market: 'Raleigh-Durham', jurisdiction: 'Wake County', system: 'Permit portal + data reports', url: 'https://permitportal.wakegov.com/' },
          { market: 'Wake data', jurisdiction: 'Wake County', system: 'Building permit data / reports', url: 'https://www.wake.gov/departments-government/planning-development-inspections/development-permits/building-permit-data' },
          { market: 'Raleigh', jurisdiction: 'City of Raleigh', system: 'Accela Citizen Access', url: 'https://aca-prod.accela.com/RALEIGH/Default.aspx' },
          { market: 'Greensboro', jurisdiction: 'Guilford County', system: 'County planning/development services', url: 'https://www.guilfordcountync.gov/our-county/planning-development' },
          { market: 'Wilmington', jurisdiction: 'New Hanover County', system: 'Buildchek + county permitting', url: 'https://www.buildchek.com/' },
          { market: 'Asheville', jurisdiction: 'Buncombe County', system: 'Buildchek + county permits', url: 'https://www.buncombecounty.org/governing/depts/permits/' },
          { market: 'Concord', jurisdiction: 'Cabarrus County', system: 'ArcGIS Open Data + Accela-style records', url: 'https://data-cabarrus.opendata.arcgis.com/' },
          { market: 'Fayetteville', jurisdiction: 'Cumberland County', system: 'Buildchek + local permitting', url: 'https://www.cumberlandcountync.gov/departments/planning-group/planning-and-inspections' },
        ],
        strategy: 'Use Buildchek for broad NC metro coverage. For direct research, prioritize Mecklenburg Power BI/daily data, Wake spreadsheets, and Cabarrus ArcGIS. The Mecklenburg → Wake → Guilford Piedmont corridor is the land-flipping sweet spot.',
        sequence: { status: 'resource', label: 'Source lane', unlock: 'Pull this market whenever it becomes strategically useful; no fixed state order is required.' },
        pipeline: [
          { step: '01', title: 'Pull Piedmont permit sources', source: 'Buildchek, Mecklenburg daily permits, Wake reports, Cabarrus ArcGIS, Raleigh Accela', action: 'Collect recent issued/approved residential permit rows across Mecklenburg → Wake → Guilford/Cabarrus.', output: 'NC Piedmont candidate sheet with source URL and jurisdiction proof.' },
          { step: '02', title: 'Normalize builder names', source: 'Applicant/contractor fields + public builder websites', action: 'Deduplicate subsidiaries, LLC variants, and regional office names while keeping permit-market geography.', output: '20+ unique NC builder entities, not duplicate permit rows.' },
          { step: '03', title: 'Rank by buyer-validation leverage', source: 'Permit frequency, callable public contact, market concentration, recent activity', action: 'Score builders for who to call first and route missing contacts to review.', output: 'NC buyer-validation queue ordered by permit-backed demand.' },
          { step: '04', title: 'Capture Piedmont buy boxes', source: 'Builder outreach', action: 'Ask target counties/subdivisions, lot size, max price, utilities/access, close speed, and deal killers.', output: 'NC seller-search map unlocked only for validated buy boxes.' }
        ]
      },
      {
        id: 'tx',
        state: 'Texas',
        reality: 'No statewide building-permit portal. TDLR/TABS is ADA architectural-barriers compliance, not normal building permits.',
        platforms: ['Accela', 'Socrata / Open Data', 'Hansen legacy', 'Custom / open records', 'PermitVector'],
        portals: [
          { market: 'Austin', jurisdiction: 'City of Austin', system: 'Socrata Open Data / BLDS-style records', url: 'https://data.austintexas.gov/' },
          { market: 'San Antonio', jurisdiction: 'City of San Antonio', system: 'Open Data SA / Hansen + Accela migration', url: 'https://data.sanantonio.gov/' },
          { market: 'Houston', jurisdiction: 'City of Houston', system: 'Houston Permitting Center / fragmented departments', url: 'https://www.houstonpermittingcenter.org/' },
          { market: 'Houston county layer', jurisdiction: 'Harris County', system: 'ePermits / county records', url: 'https://epermits.harriscountytx.gov/' },
          { market: 'DFW Plano', jurisdiction: 'City of Plano', system: 'Accela phased implementation', url: 'https://aca-prod.accela.com/PLANO/Default.aspx' },
          { market: 'DFW Collin', jurisdiction: 'Collin County', system: 'County permits / custom', url: 'https://www.collincountytx.gov/Services/Permits' },
          { market: 'DFW Denton', jurisdiction: 'Denton County', system: 'Development permits', url: 'https://developmentpermits.dentoncounty.gov/' },
          { market: 'Dallas', jurisdiction: 'City of Dallas', system: 'Permit Center / open records', url: 'https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/Pages/permit_center.aspx' },
          { market: 'McAllen', jurisdiction: 'City of McAllen', system: 'Accela Citizen Access', url: 'https://aca-prod.accela.com/MCALLEN/Default.aspx' },
          { market: 'Travis County', jurisdiction: 'Travis County', system: 'Permitting Center + open records', url: 'https://www.traviscountytx.gov/tnr/development-services/permits' },
          { market: 'Texas aggregator', jurisdiction: 'Multiple Texas markets', system: 'PermitVector daily refresh', url: 'https://permitvector.com/' },
        ],
        strategy: 'Texas has the most volume and the worst fragmentation. Use PermitVector first for normalized market coverage. DIY: Austin and San Antonio Socrata are clean; Houston and Dallas proper require county-by-county work or aggregator coverage.',
        sequence: { status: 'resource', label: 'Source lane', unlock: 'Texas is fully scaffolded as a source lane; pull Austin/San Antonio open data first when you choose to activate it.' },
        pipeline: [
          { step: '01', title: 'Start with normalized Texas coverage', source: 'PermitVector + Austin Socrata + San Antonio Open Data', action: 'Pull recent residential permits from Austin and San Antonio first, then compare against PermitVector-covered Texas markets.', output: 'Texas recent-permit candidate sheet with source, jurisdiction, permit date, and applicant/builder fields.' },
          { step: '02', title: 'Avoid black-hole markets first', source: 'Austin/San Antonio open data before Houston/Dallas proper', action: 'Defer Houston and Dallas proper until county-by-county or aggregator coverage is ready; do not let fragmented portals block the Texas launch.', output: 'Execution order: Austin → San Antonio → Travis/Plano/Collin/Denton/McAllen → Houston/Dallas later.' },
          { step: '03', title: 'Deduplicate and qualify builders', source: 'Permit applicant/contractor names, Accela/Socrata metadata, public business records', action: 'Deduplicate LLC/name variants and require recent issued/approved residential activity before buyer-validation promotion.', output: '20+ unique Texas permit-active builders for the call queue.' },
          { step: '04', title: 'Enrich public contact + validate buy box', source: 'Official builder websites, public company contacts, phone/email outreach', action: 'Attach lawful public contact channels and capture target counties, lot size, max price, utilities/access, close speed, and deal killers.', output: 'Texas buyer-validation queue ready to unlock seller parcels only after buy boxes are captured.' }
        ]
      }
    ],
    tiers: [
      { name: 'Tier 1 — Aggregators first', items: [
        { label: 'Buildchek', url: 'https://www.buildchek.com/', note: 'Best first pass for Tennessee and North Carolina; partial Florida coverage.' },
        { label: 'PermitVector', url: 'https://permitvector.com/', note: 'Texas multi-market daily permit normalization; note Dallas/Houston proper gaps.' },
        { label: 'Mercator.ai', url: 'https://www.mercator.ai/', note: 'National construction intelligence layer for Texas, Florida, and expansion markets.' },
      ]},
      { name: 'Tier 2 — Direct county/city portals', items: [
        { label: 'Accela Citizen Access', url: 'https://www.accela.com/civic-apps/', note: 'Closest thing to a universal key across the five states.' },
        { label: 'Tyler EnerGov', url: 'https://www.tylertech.com/products/enterprise-permitting-licensing', note: 'Florida and smaller jurisdictions; self-service permit searches.' },
        { label: 'Socrata developer API', url: 'https://dev.socrata.com/', note: 'Programmatic API access for Austin, San Antonio, and other open data feeds.' },
        { label: 'ArcGIS Hub', url: 'https://hub.arcgis.com/', note: 'County GIS/open-data permit layers, especially Cabarrus-style sources.' },
        { label: 'Maricopa County Planning & Development', url: 'https://www.maricopa.gov/797/Planning-Development', note: 'Weekly Phoenix-metro permit activity normalization source.' },
      ]},
      { name: 'Tier 3 — Macro permit data', items: [
        { label: 'U.S. Census Building Permits Survey', url: 'https://www.census.gov/construction/bps/', note: 'County/metro annual and monthly permit context for market selection.' },
        { label: 'NAHB Housing Economics / Permits', url: 'https://www.nahb.org/news-and-economics/housing-economics/indices/housing-permits', note: 'Industry-facing permit trend context.' },
        { label: 'FRED housing permits series', url: 'https://fred.stlouisfed.org/searchresults/?search_type=series&search=housing+permits', note: 'State/metro time-series for macro trend checks.' },
      ]}
    ]
  };
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
