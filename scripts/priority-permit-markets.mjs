import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function asArray(value) { return Array.isArray(value) ? value : []; }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function readJson(path, fallback = null) {
  try { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback; }
  catch { return fallback; }
}

export const PERMIT_STATE_PRIORITY = ['TN', 'FL', 'AZ', 'NC', 'TX', 'GA', 'SC'];
export const PERMIT_STATE_LABELS = {
  TN: 'Tennessee',
  FL: 'Inland Florida',
  AZ: 'Arizona',
  NC: 'North Carolina',
  TX: 'Texas',
  GA: 'Georgia secondary',
  SC: 'South Carolina secondary',
};

export const PRIORITY_PERMIT_MARKETS = [
  {
    id: 'knoxville-tn', name: 'Knoxville / Knox County, TN', city: 'Knoxville', county: 'Knox County', state: 'TN', buyerType: 'infill-builder', priority: 100,
    directAdapter: 'knoxville-kgis-public-leads', realDir: 'knoxville', platform: 'KGIS ArcGIS + Buildchek coverage', portalUrl: 'https://www.kgis.org/',
    thesis: 'TN live-first permit market: KGIS public permits and parcel layers give the fastest verified builder-signal plus skip-trace research loop.',
  },
  { id: 'nashville-edge-tn', name: 'Nashville / Davidson County, TN', city: 'Nashville', county: 'Davidson County', state: 'TN', buyerType: 'production-builder', priority: 96, platform: 'Buildchek + Metro Nashville Codes', portalUrl: 'https://www.nashville.gov/departments/codes', thesis: 'High-growth Tennessee perimeter market; use Buildchek/Metro permit evidence before seller promotion.' },
  { id: 'chattanooga-tn', name: 'Chattanooga / Hamilton County, TN', city: 'Chattanooga', county: 'Hamilton County', state: 'TN', buyerType: 'custom-builder', priority: 92, platform: 'Buildchek + Hamilton County GIS', portalUrl: 'https://gis.hamiltontn.gov/', thesis: 'TN builder-sprawl source well; pull permit builders before parcel sourcing.' },
  { id: 'murfreesboro-tn', name: 'Murfreesboro / Rutherford County, TN', city: 'Murfreesboro', county: 'Rutherford County', state: 'TN', buyerType: 'production-builder', priority: 90, platform: 'CivicPlus / CivicGov Citizen Portal', portalUrl: 'https://www.rutherfordcountytn.gov/', thesis: 'Hot TN builder-sprawl jurisdiction; CivicPlus permit monitoring should feed buyer validation first.' },
  { id: 'franklin-tn', name: 'Franklin / Williamson County, TN', city: 'Franklin', county: 'Williamson County', state: 'TN', buyerType: 'custom-builder', priority: 88, platform: 'IDT Plans + county permit records', portalUrl: 'https://williamson.idtplans.com/', thesis: 'High-value TN infill/perimeter market; direct portal source review before parcel calls.' },

  { id: 'polk-fl', name: 'Polk County / Lakeland, FL', city: 'Lakeland', county: 'Polk County', state: 'FL', buyerType: 'spec-builder', priority: 84, directAdapter: 'polk-accela-permit-builders', realDir: 'polk', platform: 'Accela Citizen Access', portalUrl: 'https://aca-prod.accela.com/POLKCO/Cap/CapHome.aspx?module=Building', thesis: 'Top inland FL target with builder demand and less coastal insurance friction.' },
  { id: 'ocala-fl', name: 'Ocala / Marion County, FL', city: 'Ocala', county: 'Marion County', state: 'FL', buyerType: 'custom-builder', priority: 80, platform: 'Civic Access / CivicPlus', portalUrl: 'https://www.marionfl.org/', thesis: 'Inland FL resource well; prioritize permit-active builders and quarter/rural-edge lot criteria.' },
  { id: 'clermont-fl', name: 'Clermont / Lake County, FL', city: 'Clermont', county: 'Lake County', state: 'FL', buyerType: 'spec-builder', priority: 78, platform: 'TRAKiT / CentralSquare migration', portalUrl: 'https://www.clermontfl.gov/', thesis: 'Inland Orlando-edge growth market; monitor permit portal migration and builder concentration.' },
  { id: 'alachua-fl', name: 'Gainesville / Alachua County, FL', city: 'Gainesville', county: 'Alachua County', state: 'FL', buyerType: 'custom-builder', priority: 74, platform: 'Accela', portalUrl: 'https://growth-management.alachuacounty.us/', thesis: 'Inland FL permit well with manageable fragmentation.' },

  { id: 'maricopa-az', name: 'Maricopa County / Phoenix-Mesa, AZ', city: 'Phoenix', county: 'Maricopa County', state: 'AZ', buyerType: 'production-builder', priority: 70, directAdapter: 'maricopa-xlsx-permit-builders', realDir: 'maricopa', platform: 'Maricopa weekly permit reports + Accela cities', portalUrl: 'https://www.maricopa.gov/Archive.aspx?AMID=128', thesis: 'AZ goldmine: weekly permit activity reports normalize Phoenix-metro builder velocity.' },
  { id: 'tucson-az', name: 'Tucson / Pima County, AZ', city: 'Tucson', county: 'Pima County', state: 'AZ', buyerType: 'custom-builder', priority: 66, platform: 'Accela / Tucson Development Services', portalUrl: 'https://pro.tucsonaz.gov/', thesis: 'Secondary AZ permit well; Accela-style builder evidence before seller sourcing.' },
  { id: 'buckeye-az', name: 'Buckeye, AZ', city: 'Buckeye', county: 'Maricopa County', state: 'AZ', buyerType: 'production-builder', priority: 64, platform: 'City custom permit portal', portalUrl: 'https://www.buckeyeaz.gov/', thesis: 'Fast-growth Phoenix-edge market; source review and portal monitoring.' },

  { id: 'raleigh-nc', name: 'Raleigh / Wake County, NC', city: 'Raleigh', county: 'Wake County', state: 'NC', buyerType: 'infill-builder', priority: 60, directAdapter: 'raleigh-arcgis-permit-builders', realDir: 'raleigh', platform: 'Wake/Raleigh ArcGIS + Power BI', portalUrl: 'https://data.wake.gov/', thesis: 'NC Piedmont corridor source well with direct ArcGIS permit data.' },
  { id: 'charlotte-nc', name: 'Charlotte / Mecklenburg County, NC', city: 'Charlotte', county: 'Mecklenburg County', state: 'NC', buyerType: 'production-builder', priority: 56, platform: 'Accela + Power BI Daily Building Permits', portalUrl: 'https://www.mecknc.gov/', thesis: 'Large NC buyer market; use direct permit dashboards and Buildchek coverage.' },
  { id: 'greensboro-nc', name: 'Greensboro / Guilford County, NC', city: 'Greensboro', county: 'Guilford County', state: 'NC', buyerType: 'custom-builder', priority: 52, platform: 'Custom county/city systems + Buildchek coverage', portalUrl: 'https://www.guilfordcountync.gov/', thesis: 'Piedmont corridor seller/builder well once buyer evidence is captured.' },
  { id: 'cabarrus-nc', name: 'Concord / Cabarrus County, NC', city: 'Concord', county: 'Cabarrus County', state: 'NC', buyerType: 'custom-builder', priority: 50, platform: 'ArcGIS Open Data + Accela', portalUrl: 'https://data-cabarrus.opendata.arcgis.com/', thesis: 'ArcGIS source well for permit and parcel normalization.' },

  { id: 'austin-tx', name: 'Austin, TX', city: 'Austin', county: 'Travis County', state: 'TX', buyerType: 'production-builder', priority: 44, directAdapter: 'austin-socrata-permit-builders', realDir: 'austin', platform: 'Socrata Open Data / BLDS', portalUrl: 'https://data.austintexas.gov/', thesis: 'TX open-data beachhead; useful but lower than TN/FL/AZ/NC under current stack.' },
  { id: 'san-antonio-tx', name: 'San Antonio, TX', city: 'San Antonio', county: 'Bexar County', state: 'TX', buyerType: 'production-builder', priority: 42, directAdapter: 'san-antonio-ckan-permit-builders', realDir: 'san-antonio', platform: 'Open Data SA / CKAN', portalUrl: 'https://data.sanantonio.gov/', thesis: 'TX open-data permit well with daily normalization potential.' },
  { id: 'plano-tx', name: 'Plano / Collin County, TX', city: 'Plano', county: 'Collin County', state: 'TX', buyerType: 'production-builder', priority: 38, platform: 'Accela + custom county portals', portalUrl: 'https://www.plano.gov/', thesis: 'DFW-edge resource well; direct portal/PermitVector required before seller sourcing.' },
  { id: 'mcallen-tx', name: 'McAllen, TX', city: 'McAllen', county: 'Hidalgo County', state: 'TX', buyerType: 'spec-builder', priority: 34, platform: 'Accela', portalUrl: 'https://aca-prod.accela.com/MCALLEN/Default.aspx', thesis: 'Accela-powered TX resource well; lower priority than open-data TX markets.' },

  { id: 'forsyth-ga', name: 'Forsyth County / Atlanta data-center corridor, GA', city: 'Cumming', county: 'Forsyth County', state: 'GA', buyerType: 'data-center-commuter-builder', priority: 30, realDir: 'forsyth-ga', platform: 'Forsyth ArcGIS EnerGov layer + Tyler SelfService detail', portalUrl: 'https://geo.forsythco.com/gis3/rest/services/Public_EnerGovPlans/Building_Permits/FeatureServer/0', thesis: 'GA secondary source well: high Atlanta/data-center corridor relevance, but current public layer has no contractor field; solve Tyler detail before builder promotion.' },
  { id: 'hall-ga', name: 'Hall County / Gainesville, GA', city: 'Gainesville', county: 'Hall County', state: 'GA', buyerType: 'commuter-builder', priority: 28, platform: 'Accela + county issued-permit PDF archive', portalUrl: 'https://www.hallcounty.org/230/Issued-Permits-Public-Reports', thesis: 'GA data-center/NE Atlanta corridor source candidate; PDF issued-permit reports need extraction/OCR before builder queue.' },
  { id: 'jackson-ga', name: 'Jackson County, GA', city: 'Jefferson', county: 'Jackson County', state: 'GA', buyerType: 'data-center-commuter-builder', priority: 26, platform: 'County/city permit portals + ArcGIS review', portalUrl: 'https://www.jacksoncountygov.com/', thesis: 'GA I-85/data-center corridor watchlist; build permit adapter only after public contractor rows are verified.' },
  { id: 'douglas-ga', name: 'Douglas County / Atlanta west, GA', city: 'Douglasville', county: 'Douglas County', state: 'GA', buyerType: 'commuter-builder', priority: 24, platform: 'County/city permit portals + Accela/CentralSquare review', portalUrl: 'https://www.celebratedouglascounty.com/', thesis: 'GA west-Atlanta data-center/workforce-housing watchlist; source review before seller sourcing.' },

  { id: 'dorchester-sc', name: 'Dorchester County / Charleston edge, SC', city: 'Summerville', county: 'Dorchester County', state: 'SC', buyerType: 'coastal-edge-builder', priority: 29, directAdapter: 'dorchester-evolve-permit-builders', realDir: 'dorchester-sc', platform: 'Evolve Public permit search', portalUrl: 'https://evolvepublic.infovisionsoftware.com/Dorchester/', thesis: 'SC coastal-edge live queue: Dorchester exposes contractor names and clears the 20-builder floor for Charleston-edge buyer validation.' },
  { id: 'berkeley-sc', name: 'Berkeley County / Charleston edge, SC', city: 'Moncks Corner', county: 'Berkeley County', state: 'SC', buyerType: 'coastal-edge-builder', priority: 27, platform: 'Public builder portal / Cloudflare-challenged', portalUrl: 'https://build.berkeleycountysc.gov/', thesis: 'Strong Charleston expansion county, but portal blocks this environment; keep as watchlist until a reliable public/API path is found.' },
  { id: 'greenville-sc', name: 'Greenville County, SC', city: 'Greenville', county: 'Greenville County', state: 'SC', buyerType: 'upstate-builder', priority: 22, platform: 'County/city permit portal review', portalUrl: 'https://www.greenvillecounty.org/', thesis: 'Upstate SC secondary builder market; source review after Dorchester/Berkeley.' },
];

function sourceCandidateForMarket(market) {
  const sourceType = /permit|accela|buildchek|civic|idt|socrata|ckan|weekly/i.test(market.platform) ? 'permit' : 'source_review';
  return {
    market: market.id,
    state: market.state,
    areaName: market.name,
    platform: market.platform,
    sourceType,
    title: `${market.name} — ${market.platform}`,
    url: market.portalUrl,
    confidence: market.directAdapter ? 96 : Math.max(55, Math.min(92, Math.round(Number(market.priority || 0) * 0.85))),
    suggestedUse: market.directAdapter ? 'run_direct_permit_builder_adapter' : 'source_review_then_adapter_build',
    query: `${market.name} ${market.platform} building permits`,
    priorityStateRank: PERMIT_STATE_PRIORITY.indexOf(market.state) + 1,
    targetStatePriority: PERMIT_STATE_LABELS[market.state] || market.state,
    directAdapter: market.directAdapter || '',
  };
}

function sourceForBuilderSignals(market, rows) {
  return {
    id: `${market.id}-priority-permit-builder-signals`,
    market: market.id,
    state: market.state,
    type: 'public-permit-builder-signal',
    cadence: market.state === 'TN' ? 'daily' : 'priority-refresh',
    sourceUrl: market.portalUrl,
    portalUrl: market.portalUrl,
    description: `${market.name} public permit-builder signals from ${market.platform}. Buyer-validation only until buy box/contact proof is captured.`,
    records: rows.map(row => ({ ...row, market: market.id, state: market.state })),
  };
}

function watchlistForMarket(market) {
  return {
    id: `${market.id}-priority-permit-watchlist`,
    market: market.id,
    state: market.state,
    type: 'public-source-watchlist',
    cadence: market.state === 'TN' ? 'daily-discovery' : 'priority-discovery',
    portalUrl: market.portalUrl,
    description: `${market.name} priority permit-source watchlist (${market.platform}). No buyer records are promoted until verified public permit/builder rows are ingested.`,
    records: [],
  };
}

export function enhanceSourcesWithPriorityPermitMarkets(sources, { repoRoot = process.cwd(), includeExistingTargets = true } = {}) {
  const next = structuredClone(sources || {});
  next.version = Math.max(Number(next.version || 1), 3);
  next.mode = next.mode || 'zero-fabrication';
  const existingTargets = includeExistingTargets ? asArray(next.targetMarkets) : [];
  const targetMap = new Map(existingTargets.map(market => [market.id, market]));
  for (const market of PRIORITY_PERMIT_MARKETS) targetMap.set(market.id, { ...market, rank: undefined, directAdapter: undefined, realDir: undefined, platform: market.platform, permitPortalUrl: market.portalUrl });
  next.targetMarkets = [...targetMap.values()].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

  const buyerMap = new Map(asArray(next.buyerSources).map(source => [source.id, source]));
  for (const market of PRIORITY_PERMIT_MARKETS) {
    const realRows = market.realDir ? readJson(resolve(repoRoot, 'data', 'real', market.realDir, 'builder_signals.json'), []) : [];
    if (asArray(realRows).length) {
      for (const [id, source] of buyerMap.entries()) {
        if (source.market === market.id && source.type === 'public-permit-builder-signal') buyerMap.delete(id);
      }
      buyerMap.set(`${market.id}-priority-permit-builder-signals`, sourceForBuilderSignals(market, asArray(realRows)));
    } else if (![...buyerMap.values()].some(source => source.market === market.id && source.type === 'public-permit-builder-signal')) {
      buyerMap.set(`${market.id}-priority-permit-watchlist`, watchlistForMarket(market));
    }
  }
  next.buyerSources = [...buyerMap.values()];
  next.parcelSources = asArray(next.parcelSources);
  return next;
}

export function buildPermitMarketJudgement(snapshot, { repoRoot = process.cwd() } = {}) {
  const buyers = asArray(snapshot.buyers);
  const parcels = asArray(snapshot.parcels);
  const markets = PRIORITY_PERMIT_MARKETS.map((market, index) => {
    const evidence = market.realDir ? readJson(resolve(repoRoot, 'data', 'real', market.realDir, 'market_evidence.json'), {}) : {};
    const builderSignals = buyers.filter(row => row.market === market.id);
    const parcelSignals = parcels.filter(row => row.market === market.id);
    const uniqueBuilders = builderSignals.length || Number(evidence?.summary?.uniqueBuilders || evidence?.confidenceSurface?.activeBuilderSignals || 0);
    const adapterStatus = market.directAdapter ? (uniqueBuilders > 0 ? 'pulled' : 'adapter-ready-needs-refresh') : 'source-review-needed';
    const buyerFirstGate = uniqueBuilders >= 20 ? 'ready-for-buyer-validation' : uniqueBuilders > 0 ? 'below-20-builder-floor' : 'find-public-permit-source';
    return {
      rank: index + 1,
      stateRank: PERMIT_STATE_PRIORITY.indexOf(market.state) + 1,
      market: market.id,
      areaName: market.name,
      state: market.state,
      platform: market.platform,
      portalUrl: market.portalUrl,
      directAdapter: market.directAdapter || '',
      adapterStatus,
      buyerFirstGate,
      activeBuilderSignals: uniqueBuilders,
      parcelSignals: parcelSignals.length,
      judgementScore: Math.max(1, Math.min(100, Number(market.priority || 0) + Math.min(20, uniqueBuilders) - (buyerFirstGate === 'find-public-permit-source' ? 15 : 0))),
      nextAction: uniqueBuilders >= 20
        ? `Call/email top permit-active builders in ${market.name} to capture buy box before seller sourcing.`
        : market.directAdapter
          ? `Run/fix ${market.directAdapter} until it produces 20+ unique permit-active builders.`
          : `Review ${market.platform} and build a direct adapter for ${market.name}.`,
    };
  }).sort((a, b) => a.stateRank - b.stateRank || b.judgementScore - a.judgementScore || a.rank - b.rank);
  return { statePriority: PERMIT_STATE_PRIORITY, markets };
}

export function prioritySourceCandidates() {
  return PRIORITY_PERMIT_MARKETS.map(sourceCandidateForMarket);
}
