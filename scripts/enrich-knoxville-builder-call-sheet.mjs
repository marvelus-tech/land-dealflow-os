import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INPUT = path.join(ROOT, 'data/real/knoxville/builder_signals.json');
const OUT_JSON = path.join(ROOT, 'data/real/knoxville/buyer_call_sheet.json');
const OUT_CSV = path.join(ROOT, 'data/real/knoxville/buyer_call_sheet.csv');
const MINIMUM_UNIQUE_BUILDERS = 20;

const capturedAt = new Date().toISOString();

const CONTACT_LEDGER = {
  'knoxville-builder-ball-homes': {
    website: 'https://www.ballhomes.com/Locations/Knoxville/',
    phone: '865-862-4774',
    email: 'customerservice@ballhomes.com',
    contactLabel: 'Knoxville Area Office / customer service',
    sourceType: 'official-business-site',
    sourceUrl: 'https://www.ballhomes.com/contact/',
    sourceEvidence: 'Official contact page lists Knoxville Area Office phone 865.862.4774 and public customer service email.',
    confidence: 90,
    contactStatus: 'public-office-contact',
  },
  'knoxville-builder-smithbilt-homes': {
    website: 'https://smithbilthomes.com/',
    phone: '865-694-8582',
    email: '',
    contactLabel: 'Main office',
    sourceType: 'official-business-site',
    sourceUrl: 'https://smithbilthomes.com/contact/',
    sourceEvidence: 'Official contact page lists 4909 Ball Rd, Knoxville TN and phone (865) 694-8582.',
    confidence: 92,
    contactStatus: 'public-office-contact',
  },
  'knoxville-builder-turner-homes-llc': {
    website: 'https://www.turnerhomes.com/',
    phone: '865-777-1700',
    email: 'info@turnerhomes.com',
    contactLabel: 'Knoxville office',
    sourceType: 'official-business-site',
    sourceUrl: 'https://www.turnerhomes.com/contact-us/',
    sourceEvidence: 'Official contact page lists Knoxville Office (865)777-1700 and info@turnerhomes.com.',
    confidence: 96,
    contactStatus: 'public-office-contact',
  },
  'knoxville-builder-cook-bros-homes': {
    website: 'https://www.cookbroshomes.com/',
    phone: '865-325-2500',
    email: 'juliem@cookbroshomes.com',
    contactLabel: 'Sales inquiries',
    sourceType: 'official-business-site',
    sourceUrl: 'https://cookbroshomes.com/contact.php',
    sourceEvidence: 'Official contact page lists Sales Inquiries 865-325-2500 and email juliem@cookbroshomes.com.',
    confidence: 96,
    contactStatus: 'public-sales-contact',
  },
  'knoxville-builder-maggie-watson-of-clayton-properties-group-inc-db': {
    website: 'https://www.goodallhomes.com/communities/knoxville-area',
    phone: '615-989-6223',
    email: '',
    contactLabel: 'Online sales / Knoxville area contact',
    sourceType: 'official-business-site',
    sourceUrl: 'https://www.goodallhomes.com/contact-us',
    sourceEvidence: 'Official contact page lists Knoxville, TN area and Call Today 615-989-6223.',
    confidence: 90,
    contactStatus: 'public-office-contact',
  },
  'knoxville-builder-robert-mohney-of-saddlebrook-properties-llc': {
    website: 'https://www.saddlebrookproperties.com/',
    phone: '865-966-8700',
    email: 'info@saddlebrookproperties.com',
    contactLabel: 'Saddlebrook Properties office',
    sourceType: 'official-business-site-plus-chamber',
    sourceUrl: 'https://www.saddlebrookproperties.com/',
    sourceEvidence: 'Public search snippets from official site and Knoxville Chamber list 122 Perimeter Park Road, phone (865) 966-8700, and info@saddlebrookproperties.com.',
    confidence: 88,
    contactStatus: 'public-office-contact',
  },
  'knoxville-builder-worley-builders-inc': {
    website: 'https://worleybuildersinc.com/',
    phone: '865-850-2117',
    email: 'sales@worleybuildersinc.com',
    contactLabel: 'Sales line',
    sourceType: 'official-business-site',
    sourceUrl: 'https://worleybuildersinc.com/contact-us/',
    sourceEvidence: 'Official contact page lists Office 865-922-2600, Sales 865-850-2117, info@worleybuildersinc.com, sales@worleybuildersinc.com.',
    confidence: 96,
    contactStatus: 'public-sales-contact',
  },
  'knoxville-builder-curbed-construction-llc': {
    website: 'https://www.curbedconstruction.com/',
    phone: '423-488-6920',
    email: 'info@curbedconstruction.com',
    contactLabel: 'Main office',
    sourceType: 'official-business-site',
    sourceUrl: 'https://www.curbedconstruction.com/contact',
    sourceEvidence: 'Official contact page lists phone 423-488-6920 and info@curbedconstruction.com; Knoxville permit evidence suggests active project but office is Chattanooga.',
    confidence: 82,
    contactStatus: 'public-office-contact-verify-market',
  },
  'knoxville-builder-davinci-design-and-contracting-llc': {
    website: '',
    phone: '865-321-1310',
    email: '',
    contactLabel: 'Directory-listed contractor phone',
    sourceType: 'contractor-directory',
    sourceUrl: 'https://www.buildzoom.com/contractor/davinci-design-and-contracting',
    sourceEvidence: 'BuildZoom contractor profile lists Davinci Design and Contracting in Knoxville and phone (865) 321-1310. No official business site verified in this pass.',
    confidence: 62,
    contactStatus: 'directory-contact-human-review',
  },
  'knoxville-builder-definity-construction-llc': {
    website: '',
    phone: '',
    email: '',
    contactLabel: 'Contact not verified',
    sourceType: 'permit-plus-directory-no-callable-contact',
    sourceUrl: 'https://www.buildzoom.com/contractor/definity-construction-llc',
    sourceEvidence: 'KGIS permits and directory/license pages confirm entity signal, but scrape returned noisy third-party contact ads and no reliable business-facing phone/email. Keep in research.',
    confidence: 45,
    contactStatus: 'find-contact',
  },
};

function h(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function slugFromId(id = '') {
  return id;
}

function formatMoney(value) {
  const n = Number(value || 0);
  if (!n) return 'unknown';
  return `$${Math.round(n).toLocaleString()}`;
}

function dominantAreas(permits = []) {
  const areas = permits.slice(0, 5).map(p => h(p.address).split(' ').slice(-2).join(' ')).filter(Boolean);
  return [...new Set(areas)].slice(0, 3);
}

function buildCallScript(builder, contact) {
  const sample = builder.recentPermits?.[0] || {};
  const area = sample.address || 'Knoxville / Knox County';
  return [
    `Hi, this is Okeito. I’m calling ${contact.contactLabel || builder.name} at ${builder.name}. I track permit-verified land demand around Knoxville and noticed ${builder.name} has ${builder.recentBuilds} recent public KGIS residential build signals, including ${sample.permitNumber || 'recent permits'} near ${area}.`,
    `I’m not calling with a random property. I’m trying to understand your exact land buy box so I only send lots that fit.`,
    `Quick questions:`,
    `1. Which Knoxville / Knox County zip codes or subdivisions are you actively buying lots in right now?`,
    `2. What lot size range works — infill, subdivision paper lots, quarter-acre, half-acre, acreage?`,
    `3. What is your max lot price or price-to-finished-home ratio before the deal is dead?`,
    `4. What kills a lot instantly: slope, flood, septic, sewer distance, no road frontage, HOA, title, utility extension, grade?`,
    `5. How fast can you close if title and due diligence are clean?`,
    `6. Who should receive lot packages — name, direct email, phone, and required fields?`,
    `If I find something matching that, do you want first look before I speak with other builders?`,
  ].join('\n');
}

function buildBuyBoxCapture(builder) {
  return {
    geography: 'ASK: exact Knoxville / Knox County zip codes, subdivisions, school zones, and no-go areas.',
    lotSize: 'ASK: minimum/maximum lot size, frontage, infill vs subdivision lot preference.',
    maxPrice: 'ASK: max raw lot price and price as % of expected finished-home sale.',
    utilitiesAccess: 'ASK: sewer/septic, water, electric, road frontage and driveway constraints.',
    killCriteria: 'ASK: slope, flood, wetlands, zoning, HOA, title, access, utility extension, soil/septic blockers.',
    closeSpeed: 'ASK: decision-maker, due-diligence period, earnest money norm, and close timeline.',
    packageFields: 'ASK: APN/parcel ID, map, dimensions, zoning, utilities, asking price, comps, seller terms, photos.',
  };
}

function toCsv(rows) {
  const columns = ['rank','builderId','name','phone','email','website','contactLabel','contactStatus','confidence','recentBuilds','topPermit','topPermitAddress','sourceUrl','nextAction'];
  const esc = value => {
    const raw = String(value ?? '');
    return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return [columns.join(','), ...rows.map(row => columns.map(col => esc(row[col])).join(','))].join('\n');
}

function uniqueBuilders(builders = []) {
  const seen = new Set();
  return builders.filter(builder => {
    const key = h(builder.id || builder.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const sourceBuilders = uniqueBuilders(JSON.parse(fs.readFileSync(INPUT, 'utf8')));
if (sourceBuilders.length < MINIMUM_UNIQUE_BUILDERS) {
  throw new Error(`Knoxville builder call sheet requires at least ${MINIMUM_UNIQUE_BUILDERS} unique builders; found ${sourceBuilders.length}. Expand permit-source collection before rendering the buyer-validation queue.`);
}
const builders = sourceBuilders.slice(0, Math.max(MINIMUM_UNIQUE_BUILDERS, sourceBuilders.length));
const rows = builders.map((builder, index) => {
  const key = slugFromId(builder.id);
  const contact = CONTACT_LEDGER[key] || {
    website: builder.website || '', phone: '', email: '', contactLabel: 'Contact not verified', sourceType: 'unknown', sourceUrl: builder.sourceUrl, sourceEvidence: 'No public business-facing contact verified.', confidence: 35, contactStatus: 'find-contact',
  };
  const topPermit = builder.recentPermits?.[0] || {};
  const callable = Boolean(contact.phone || contact.email || contact.website) && contact.confidence >= 60;
  const needsHumanReview = contact.confidence < 70 || contact.contactStatus.includes('review') || contact.contactStatus.includes('find-contact');
  return {
    rank: index + 1,
    builderId: builder.id,
    name: builder.name,
    market: builder.market,
    state: builder.state,
    website: contact.website,
    phone: contact.phone,
    email: contact.email,
    contactLabel: contact.contactLabel,
    contactStatus: contact.contactStatus,
    sourceType: contact.sourceType,
    sourceUrl: contact.sourceUrl,
    sourceEvidence: contact.sourceEvidence,
    confidence: contact.confidence,
    route: needsHumanReview ? 'humanReview' : 'buyerValidation',
    callable,
    recentBuilds: builder.recentBuilds,
    topPermit: topPermit.permitNumber || '',
    topPermitAddress: topPermit.address || '',
    topPermitIssuedAt: topPermit.issuedAt || '',
    permitEvidence: (builder.recentPermits || []).slice(0, 3),
    demandSignal: builder.acquisitionNotes,
    dominantAreas: dominantAreas(builder.recentPermits),
    nextAction: callable
      ? 'Call public business contact and capture exact buy box; do not promote to validated buyer until price/geography/lot/kill criteria are captured.'
      : 'Find official business-facing contact before calling; keep permit signal in buyer-validation research.',
    buyBoxCapture: buildBuyBoxCapture(builder),
    callScript: buildCallScript(builder, contact),
    emailDraft: {
      subject: `Knoxville lots that fit ${builder.name}?`,
      body: `Hi ${contact.contactLabel || 'team'},\n\nI’m tracking public KGIS permit-backed builder activity in Knoxville. ${builder.name} shows ${builder.recentBuilds} recent residential build signals, including ${topPermit.permitNumber || 'a recent permit'} near ${topPermit.address || 'Knox County'}.\n\nI’m building a small list of off-market lots and only want to send properties that fit your actual buy box. What zip codes/subdivisions, lot sizes, max lot price, utility/access requirements, and deal killers should I screen for before sending anything?\n\nIf there is a better land/acquisitions contact, who should I send parcel packages to?\n\nThanks,\nOkeito`,
    },
  };
});

const callSheet = {
  version: 1,
  generatedAt: capturedAt,
  purpose: `Enrich at least ${MINIMUM_UNIQUE_BUILDERS} unique Knoxville permit-verified builder signals with lawful public business contact info and buyer buy-box capture scripts.`,
  rules: [
    'No personal/people-search scraping.',
    'No guessed phones or emails.',
    `Every pull must include at least ${MINIMUM_UNIQUE_BUILDERS} unique builders before the Builders page is considered usable.`,
    'Public permit activity is a demand signal, not a validated buyer buy box.',
    'Promote only after geography, lot size, max price, close speed, package recipient, and kill criteria are captured.',
  ],
  summary: {
    total: rows.length,
    minimumUniqueBuilders: MINIMUM_UNIQUE_BUILDERS,
    uniqueBuilders: new Set(rows.map(row => row.builderId)).size,
    callablePublicBusinessContacts: rows.filter(r => r.callable).length,
    humanReview: rows.filter(r => r.route === 'humanReview').length,
    totalRecentBuildSignals: rows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0),
  },
  rows,
};

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(callSheet, null, 2)}\n`);
fs.writeFileSync(OUT_CSV, `${toCsv(rows)}\n`);
console.log(`wrote ${path.relative(ROOT, OUT_JSON)} (${rows.length} rows)`);
console.log(`wrote ${path.relative(ROOT, OUT_CSV)}`);
console.log(JSON.stringify(callSheet.summary));
