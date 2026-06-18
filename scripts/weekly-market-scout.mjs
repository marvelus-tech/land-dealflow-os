import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function asArray(value) { return Array.isArray(value) ? value : []; }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'; }
function writeJson(path, data) { writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`); }
function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }

export function loadMarketScoutSource(input = resolve(repoRoot, 'data', 'market-expansion', 'transcript_markets.json')) {
  const source = typeof input === 'string' ? JSON.parse(readFileSync(input, 'utf8')) : input;
  const criteria = asArray(source.criteria);
  const markets = asArray(source.markets);
  if (!criteria.length) throw new Error('Weekly market scout requires criteria');
  if (!markets.length) throw new Error('Weekly market scout requires candidate markets');
  return { ...source, criteria, markets };
}

export function scoreMarketCandidate(market = {}, criteria = []) {
  const weights = Object.fromEntries(asArray(criteria).map(item => [item.id, Number(item.weight || 0)]));
  const scores = market.scores || {};
  const components = {};
  for (const criterion of asArray(criteria)) {
    const raw = Number(scores[criterion.id] ?? 0);
    components[criterion.id] = {
      label: criterion.label,
      raw: clamp(raw, 0, 10),
      weight: Number(criterion.weight || 0),
      points: Math.round((clamp(raw, 0, 10) / 10) * Number(criterion.weight || 0)),
      threshold: criterion.threshold || '',
    };
  }
  const total = Object.values(components).reduce((sum, item) => sum + item.points, 0);
  const flags = [];
  const reasons = [];
  if ((scores.newBuildSignal || 0) < 5) flags.push('fails new-build threshold');
  else if ((scores.newBuildSignal || 0) >= 7) reasons.push('visible new-build activity');
  if ((scores.builderDiscoverability || 0) < 5) flags.push('too few discoverable builders');
  else if ((scores.builderDiscoverability || 0) >= 7) reasons.push('builder contacts likely discoverable');
  if ((scores.vacantLotSupply || 0) < 5) flags.push('thin vacant-lot supply');
  else if ((scores.vacantLotSupply || 0) >= 7) reasons.push('seller inventory likely sufficient');
  if ((scores.lotStandardization || 0) >= 7) reasons.push('repeatable/cookie-cutter lot pattern');
  if ((scores.buildabilitySimplicity || 0) <= 4) flags.push('buildability complexity');
  if ((scores.complianceSimplicity || 0) <= 4) flags.push('compliance gate required');
  const eligible = !['active', 'watchlist', 'avoid'].includes(String(market.status || '').toLowerCase()) && !flags.some(flag => flag.startsWith('fails') || flag.startsWith('too few') || flag.startsWith('thin'));
  let grade = 'D';
  if (total >= 80 && !flags.length) grade = 'A';
  else if (total >= 70) grade = 'B';
  else if (total >= 58) grade = 'C';
  return { total, grade, components, flags, reasons, eligible, weightTotal: Object.values(weights).reduce((sum, value) => sum + value, 0) };
}

function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function pickWeeklyMarket(candidates = [], { now = new Date().toISOString(), includeActive = false } = {}) {
  const date = new Date(now);
  const week = isoWeekNumber(date);
  const scored = asArray(candidates)
    .map(market => ({ ...market, id: market.id || slug(market.name), score: scoreMarketCandidate(market, candidates.criteria || []) }));
  const eligible = scored
    .filter(market => includeActive || market.score.eligible)
    .sort((a, b) => b.score.total - a.score.total || a.name.localeCompare(b.name));
  if (!eligible.length) throw new Error('No eligible weekly market candidates');
  const index = (week - 1) % eligible.length;
  return { selected: eligible[index], eligible, scored, week, index };
}

export function buildWeeklyMarketScout(sourceInput, { now = new Date().toISOString(), runId = '', includeActive = false } = {}) {
  const source = loadMarketScoutSource(sourceInput);
  const scoredMarkets = source.markets.map(market => ({ ...market, id: market.id || slug(market.name), score: scoreMarketCandidate(market, source.criteria) }));
  const eligible = scoredMarkets
    .filter(market => includeActive || market.score.eligible)
    .sort((a, b) => b.score.total - a.score.total || a.name.localeCompare(b.name));
  if (!eligible.length) throw new Error('No eligible weekly market candidates');
  const date = new Date(now);
  const week = isoWeekNumber(date);
  const selected = eligible[(week - 1) % eligible.length];
  const criteriaChecklist = source.criteria.map(criterion => ({
    id: criterion.id,
    label: criterion.label,
    threshold: criterion.threshold,
    weight: criterion.weight,
    score: selected.score.components[criterion.id]?.raw ?? 0,
    points: selected.score.components[criterion.id]?.points ?? 0,
  }));
  const firstActions = [
    `Search Zillow/Realtor/Redfin manually for ${selected.name} homes built 2025–2026 or new construction listings.`,
    'Capture 10 visible listing screenshots/snippets with address, price, builder/agent/company, phone if visible, and source URL.',
    'Call 5 builder/listing contacts to validate exact buy boxes before touching seller owners.',
    'Only after buyer demand is confirmed, pull public vacant-lot owners and create a skip-trace batch.',
  ];
  const candidate = {
    id: selected.id,
    name: selected.name,
    state: selected.state,
    grade: selected.score.grade,
    score: selected.score.total,
    thesis: selected.thesis,
    status: selected.status,
    mentionedAs: selected.mentionedAs,
    reasons: selected.score.reasons,
    flags: selected.score.flags,
    caveats: selected.caveats || [],
    criteria: criteriaChecklist,
    firstActions,
    nextStatus: 'buyer-validation-research',
  };
  return {
    version: 1,
    runId: runId || `weekly-market-${String(now).slice(0, 10)}`,
    generatedAt: now,
    source: source.source,
    week,
    recommendedMarket: candidate,
    eligibleMarkets: eligible.map(market => ({ id: market.id, name: market.name, state: market.state, score: market.score.total, grade: market.score.grade, flags: market.score.flags, status: market.status })),
    allMarkets: scoredMarkets.map(market => ({ id: market.id, name: market.name, state: market.state, score: market.score.total, grade: market.score.grade, flags: market.score.flags, status: market.status, mentionedAs: market.mentionedAs })),
    hardFilters: source.hardFilters || [],
  };
}

export function writeWeeklyMarketScoutOutputs({ scout, outputDir = resolve(repoRoot, 'data', 'generated', 'weekly-market') } = {}) {
  if (!scout) throw new Error('writeWeeklyMarketScoutOutputs requires scout');
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(join(outputDir, 'history'), { recursive: true });
  const stamp = String(scout.generatedAt || new Date().toISOString()).slice(0, 10);
  const files = [];
  const latestPath = join(outputDir, 'latest.json');
  writeJson(latestPath, scout); files.push(latestPath);
  const historyPath = join(outputDir, 'history', `${stamp}.json`);
  writeJson(historyPath, scout); files.push(historyPath);
  const md = [
    `# Weekly Market Scout — ${stamp}`,
    '',
    `Recommended market: ${scout.recommendedMarket.name}`,
    `Score: ${scout.recommendedMarket.score} (${scout.recommendedMarket.grade})`,
    '',
    `Thesis: ${scout.recommendedMarket.thesis}`,
    '',
    '## First actions',
    ...scout.recommendedMarket.firstActions.map((item, index) => `${index + 1}. ${item}`),
    '',
    '## Caveats',
    ...asArray(scout.recommendedMarket.caveats).map(item => `- ${item}`),
    '',
  ].join('\n');
  const briefingPath = join(outputDir, 'briefing.md');
  writeFileSync(briefingPath, md); files.push(briefingPath);
  return { files };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const nowArg = process.argv.find(arg => arg.startsWith('--now='))?.split('=')[1];
  const now = nowArg || new Date().toISOString();
  const scout = buildWeeklyMarketScout(undefined, { now });
  const result = writeWeeklyMarketScoutOutputs({ scout });
  console.log(JSON.stringify({ ok: true, recommendedMarket: scout.recommendedMarket.name, score: scout.recommendedMarket.score, files: result.files }, null, 2));
}
