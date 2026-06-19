const DEFAULT_KEYWORDS = [
  'parcels',
  'property parcels',
  'building permits',
  'code violations',
  'vacant property',
  'zoning',
  'property sales',
];

function asArray(value) { return Array.isArray(value) ? value : []; }
function compact(value) { return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim(); }
function numericConfidence(...parts) { return Math.max(1, Math.min(100, parts.reduce((sum, value) => sum + Number(value || 0), 0))); }
function sourceTypeFromText(text) {
  const haystack = String(text || '').toLowerCase();
  if (/permit|contractor|construction/.test(haystack)) return 'permit';
  if (/parcel|assessor|property ownership|cadastral/.test(haystack)) return 'parcel';
  if (/violation|code enforcement|nuisance/.test(haystack)) return 'distress';
  if (/vacant|abandoned/.test(haystack)) return 'vacancy';
  if (/zoning|land use/.test(haystack)) return 'zoning';
  if (/sale|deed|record(er)?/.test(haystack)) return 'sales';
  return 'unknown';
}
function suggestedUse(sourceType) {
  return {
    permit: 'buyer_builder_discovery',
    parcel: 'seller_parcel_discovery',
    distress: 'seller_motivation_overlay',
    vacancy: 'seller_motivation_overlay',
    zoning: 'deal_risk_and_fit_overlay',
    sales: 'buyer_and_market_comps',
  }[sourceType] || 'source_review';
}
function areaTerms(market) {
  return [market.name, market.county, market.city, market.state].filter(Boolean).map(compact);
}
function dedupeByUrlOrTitle(rows) {
  const seen = new Set();
  return rows.filter(row => {
    const key = `${row.market || ''}|${row.platform}|${row.url || ''}|${row.title || ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stateName(code) {
  return { TN: 'tennessee', FL: 'florida', AZ: 'arizona', NC: 'north carolina', TX: 'texas' }[String(code || '').toUpperCase()] || '';
}

function candidateMatchesMarket(candidate, market) {
  const text = `${candidate.title || ''} ${candidate.description || ''} ${candidate.url || ''}`.toLowerCase();
  const terms = [market.city, market.county, market.name, market.state, stateName(market.state)]
    .filter(Boolean)
    .map(term => String(term).toLowerCase().replace(/,.*$/, '').trim())
    .filter(term => term.length >= 2);
  return terms.some(term => text.includes(term));
}

function hasObviousWrongState(candidate, market) {
  const text = `${candidate.title || ''} ${candidate.description || ''} ${candidate.url || ''}`.toLowerCase();
  const own = String(market.state || '').toLowerCase();
  const wrongNames = ['indiana', 'florida', 'arkansas', 'texas', 'california', 'ohio', 'georgia', 'alabama', 'kentucky', 'north carolina'].filter(name => name !== stateName(own));
  return wrongNames.some(name => text.includes(name));
}

function resultRows(data) {
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.item)) return data.item;
  if (data?.item && typeof data.item === 'object') return [data.item];
  if (data?.results && typeof data.results === 'object') return Object.values(data.results).flat().filter(Boolean);
  return [];
}

export function buildDiscoveryQueries(market, { keywords = DEFAULT_KEYWORDS } = {}) {
  const terms = areaTerms(market);
  const primary = terms[0] || market.id;
  const county = terms.find(term => /county/i.test(term));
  const bases = county && county !== primary ? [primary, county] : [primary];
  return [...new Set(bases.flatMap(area => keywords.map(keyword => compact(`${area} ${keyword}`))))];
}

export async function defaultFetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

export function normalizeArcgisHubItem(item, market, query) {
  const title = compact(item.title || item.name || item.id || 'Untitled ArcGIS source');
  const description = compact(item.description || item.snippet || '');
  const url = item.url || item.itemUrl || item.landingPage || item.links?.self || '';
  const text = `${title} ${description} ${query}`;
  const sourceType = sourceTypeFromText(text);
  return {
    market: market.id,
    state: market.state || '',
    areaName: market.name,
    platform: 'arcgis',
    sourceType,
    title,
    url,
    description,
    confidence: numericConfidence(35, sourceType !== 'unknown' ? 25 : 0, /Feature Service|FeatureServer/i.test(`${item.type || ''} ${url}`) ? 20 : 0, /parcel|permit|violation|vacant|zoning/i.test(text) ? 10 : 0),
    suggestedUse: suggestedUse(sourceType),
    query,
  };
}

export function normalizeSocrataCatalogItem(result, market, query) {
  const resource = result.resource || result;
  const metadata = result.metadata || {};
  const title = compact(resource.name || resource.title || resource.id || 'Untitled Socrata dataset');
  const description = compact(resource.description || '');
  const domain = resource.domain || metadata.domain || result.domain || '';
  const id = resource.id || '';
  const url = resource.permalink || (domain && id ? `https://${domain}/resource/${id}.json` : '');
  const text = `${title} ${description} ${query}`;
  const sourceType = sourceTypeFromText(text);
  return {
    market: market.id,
    state: market.state || '',
    areaName: market.name,
    platform: 'socrata',
    sourceType,
    title,
    url,
    description,
    confidence: numericConfidence(30, sourceType !== 'unknown' ? 25 : 0, domain && id ? 20 : 0, /permit|parcel|violation|vacant|sale/i.test(text) ? 10 : 0),
    suggestedUse: suggestedUse(sourceType),
    query,
  };
}

export async function discoverAreaSourceCandidates(market, { fetchJson = defaultFetchJson, limitPerQuery = 3, platforms = ['arcgis', 'socrata'] } = {}) {
  const queries = buildDiscoveryQueries(market).slice(0, 8);
  const candidates = [];
  for (const query of queries) {
    const encoded = encodeURIComponent(query);
    if (platforms.includes('arcgis')) {
      try {
        const data = await fetchJson(`https://www.arcgis.com/sharing/rest/search?q=${encoded}&f=json&num=${limitPerQuery}`);
        const rows = resultRows(data);
        candidates.push(...rows.map(item => normalizeArcgisHubItem(item, market, query)));
      } catch (error) {
        candidates.push({ market: market.id, areaName: market.name, platform: 'arcgis', sourceType: 'error', title: `ArcGIS search failed: ${query}`, url: '', description: error.message, confidence: 0, suggestedUse: 'debug_adapter', query });
      }
    }
    if (platforms.includes('socrata')) {
      try {
        const data = await fetchJson(`https://api.us.socrata.com/api/catalog/v1?search=${encoded}&limit=${limitPerQuery}`);
        candidates.push(...asArray(data.results).map(item => normalizeSocrataCatalogItem(item, market, query)));
      } catch (error) {
        candidates.push({ market: market.id, areaName: market.name, platform: 'socrata', sourceType: 'error', title: `Socrata search failed: ${query}`, url: '', description: error.message, confidence: 0, suggestedUse: 'debug_adapter', query });
      }
    }
  }
  return dedupeByUrlOrTitle(candidates)
    .filter(item => item.sourceType !== 'error' || item.confidence > 0)
    .filter(item => !hasObviousWrongState(item, market))
    .filter(item => candidateMatchesMarket(item, market))
    .sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title));
}

export async function discoverSourcesForMarkets(markets, options = {}) {
  const nested = [];
  for (const market of asArray(markets)) nested.push(...await discoverAreaSourceCandidates(market, options));
  return dedupeByUrlOrTitle(nested).sort((a, b) => b.confidence - a.confidence || a.market.localeCompare(b.market));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const market = { id: process.argv[2] || 'ocala', name: process.argv.slice(3).join(' ') || 'Ocala, FL' };
  const rows = await discoverAreaSourceCandidates(market);
  console.log(JSON.stringify(rows, null, 2));
}
