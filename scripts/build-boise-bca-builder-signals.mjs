import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const sourceDirectoryUrl = 'https://business.bcaswi.org/memberdirectory/Search/builders-369948';
const today = new Date().toISOString().slice(0, 10);

const selected = [
  { builderName: 'Berkeley Building Co.', market: 'Meridian / Ada County / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/berkeley-building-co-2017817', website: 'https://www.berkeleybuildingco.com/', phone: '(208) 995-2885', categories: 'Builder, Developer, Land Development', confidence: 86, note: 'BCA SW Idaho directory lists as Builder plus Developer/Land Development.' },
  { builderName: 'Biltmore Company', market: 'Meridian / Ada County / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/biltmore-company-2017816', website: 'https://www.biltmoreco.com/', phone: '(208) 895-0500', categories: 'Builder', confidence: 84, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'KB Home', market: 'Meridian / Ada County / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/kb-home-2113968', website: 'https://www.kbhome.com/new-homes-idaho', phone: '(208) 250-6161', categories: 'Builder', confidence: 86, note: 'BCA SW Idaho directory lists as Builder; national production builder with Idaho new-home page.' },
  { builderName: 'Tresidio Homes', market: 'Meridian / Ada County / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/tresidio-homes-2017773', website: 'https://www.tresidio.com/', phone: '(208) 917-7500', categories: 'Builder', confidence: 84, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Alturas Homes, LLC', market: 'Boise / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/alturas-homes-llc-2017878', website: '', phone: '(208) 391-4445', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder; website not harvested from directory card.' },
  { builderName: 'Amyx Homes', market: 'Eagle / Ada County / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/amyx-homes-2017687', website: '', phone: '(208) 939-5665', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Blackrock Homes', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/blackrock-homes-3018930', website: '', phone: '208-297-5940', categories: 'Builder', confidence: 76, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Boise Hunter Homes', market: 'Boise / Ada County / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/boise-hunter-homes-2017858', website: 'https://boisehunterhomes.com/', phone: '(208) 577-5501', categories: 'Builder', confidence: 82, note: 'BCA SW Idaho directory lists as Builder; official builder site previously validated in existing lane.' },
  { builderName: 'Capstone Homes Idaho', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/capstone-homes-idaho-3168930', website: '', phone: '(208) 999-7640', categories: 'Builder', confidence: 76, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'CBH Homes', market: 'Boise / Ada / Canyon / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/cbh-homes-2017856', website: 'https://cbhhomes.com', phone: '(208) 288-5560', categories: 'Builder', confidence: 88, note: 'BCA SW Idaho directory lists as Builder; official builder site previously validated in existing lane.' },
  { builderName: 'Clark & Co Homes', market: 'Boise / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/clark-co-homes-2017731', website: '', phone: '(208) 991-4010', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Conger Group', market: 'Boise / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/conger-group-2017814', website: '', phone: '(208) 336-5355', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Element Design Build LLC', market: 'Boise / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/element-design-build-llc-2098989', website: '', phone: '(208) 274-8000', categories: 'Builder, Developer, Land Development', confidence: 84, note: 'BCA SW Idaho directory lists as Builder plus Developers/Land Development.' },
  { builderName: 'Gardner Homes Idaho', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/gardner-homes-idaho-2017912', website: '', phone: '(208) 917-9029', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Hallmark Homes', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/hallmark-homes-2017808', website: '', phone: '(208) 887-9090', categories: 'Builder, Construction', confidence: 78, note: 'BCA SW Idaho directory lists as Builder/Construction.' },
  { builderName: 'Hayden Homes, LLC', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/hayden-homes-llc-2017806', website: '', phone: '(800) 971-4691', categories: 'Builder', confidence: 80, note: 'BCA SW Idaho directory lists as Builder; regional production builder.' },
  { builderName: 'Highland Homes LLC', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/highland-homes-llc-2017724', website: '', phone: '(208) 288-2722', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Hubble Homes, LLC', market: 'Boise / Ada / Canyon / Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/hubble-homes-llc-2017684', website: 'https://www.hubblehomes.com', phone: '(208) 433-8800', categories: 'Builder', confidence: 86, note: 'BCA SW Idaho directory lists as Builder; official builder site previously validated in existing lane.' },
  { builderName: 'James Clyde Homes', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/james-clyde-homes-2017905', website: '', phone: '(208) 297-5822', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Legacy Homes', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/legacy-homes-2017755', website: '', phone: '(208) 860-8235', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Lennar Homes of Idaho, LLC', market: 'Boise / Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/lennar-homes-of-idaho-llc-2017804', website: '', phone: '(208) 314-6730', categories: 'Builder', confidence: 84, note: 'BCA SW Idaho directory lists as Builder; national production builder.' },
  { builderName: 'Pacific Lifestyle Homes', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/pacific-lifestyle-homes-3588056', website: '', phone: '(360) 304-9901', categories: 'Builder', confidence: 80, note: 'BCA SW Idaho directory lists as Builder; regional production builder.' },
  { builderName: 'Rennison Companies', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/rennison-companies-2017751', website: '', phone: '(208) 938-2440', categories: 'Builder, Developer', confidence: 82, note: 'BCA SW Idaho directory lists as Builder plus Developer.' },
  { builderName: 'Richmond American Homes', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/richmond-american-homes-2206085', website: '', phone: '208-713-7237', categories: 'Builder', confidence: 82, note: 'BCA SW Idaho directory lists as Builder; national production builder.' },
  { builderName: 'Riverwood Homes, Inc.', market: 'Treasure Valley', detail: 'https://business.bcaswi.org/memberdirectory/Details/riverwood-homes-inc-2017718', website: '', phone: '(208) 850-2983', categories: 'Builder', confidence: 78, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Schell Brothers', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/schell-brothers-3636991', website: '', phone: '(208) 609-5011', categories: 'Builder', confidence: 80, note: 'BCA SW Idaho directory lists as Builder.' },
  { builderName: 'Shea Homes Inc.', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/shea-homes-inc-2017946', website: '', phone: '(425) 450-7161', categories: 'Builder', confidence: 80, note: 'BCA SW Idaho directory lists as Builder; national/regional production builder.' },
  { builderName: 'Toll Brothers Idaho Division', market: 'Boise / Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/toll-brothers-idaho-division-2017796', website: '', phone: '(208) 424-0020', categories: 'Builder', confidence: 84, note: 'BCA SW Idaho directory lists as Builder; national production builder.' },
  { builderName: 'Williams Homes Inc', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/williams-homes-inc-2017793', website: '', phone: '(661) 222-9207', categories: 'Builder', confidence: 80, note: 'BCA SW Idaho directory lists as Builder; regional production builder.' },
  { builderName: 'Woodbridge Pacific Group', market: 'Treasure Valley / Idaho', detail: 'https://business.bcaswi.org/memberdirectory/Details/woodbridge-pacific-group-2017708', website: '', phone: '(208) 889-9112', categories: 'Builder', confidence: 80, note: 'BCA SW Idaho directory lists as Builder.' }
];

const signals = selected.map((row) => {
  const slug = row.builderName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sourceUrls = [sourceDirectoryUrl, row.detail];
  if (row.website) sourceUrls.push(row.website);
  return {
    id: `boise-bca-${slug}`,
    name: row.builderName,
    builderName: row.builderName,
    market: 'boise-id',
    marketLabel: row.market,
    state: 'ID',
    website: row.website,
    contactPage: row.detail,
    phone: row.phone,
    email: '',
    acquisitionContactStatus: 'public association contact found; acquisition contact unknown; no outreach performed',
    recentBuilds: 0,
    validationStatus: 'needs-call-confirmation',
    status: 'buyer-validation-candidate',
    confidence: row.confidence,
    sourceUrl: row.detail,
    sourceUrls,
    evidenceType: 'Building Contractors Association of Southwestern Idaho public member directory; category includes Builder/Builders' + (row.categories.includes('Developer') ? '; developer/land-development category also present' : ''),
    permitEvidence: [],
    sourceEvidence: `${row.builderName} appears in the Building Contractors Association of Southwestern Idaho public member directory under categories: ${row.categories}.`,
    evidenceFreshness: today,
    notes: `${row.note} No outreach performed; phone is public directory phone where present.`
  };
});

const outDir = resolve('/root/land-dealflow-os/data/real/boise-id');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'builder_signals.json'), `${JSON.stringify(signals, null, 2)}\n`);
writeFileSync(join(outDir, 'idaho_builder_research_packet.json'), `${JSON.stringify({
  market: 'Boise / Ada / Canyon / Treasure Valley, Idaho',
  state: 'ID',
  generatedAt: today,
  recordCount: signals.length,
  mostProductiveSourcePath: 'Building Contractors Association of Southwestern Idaho public member directory category page: /memberdirectory/Search/builders-369948. It yielded 133 public Builder-category members with phones, category tags, detail URLs, and some websites.',
  conversionNotes: 'Map BCA directory cards to data/real/boise-id/builder_signals.json. Use name/builderName, state=ID, market=boise-id, contactPage=member detail URL, phone=directory phone, sourceUrls=[directory category URL, detail URL, website if harvested], evidenceType=BCA public member directory Builder category, confidence 76-88 with higher scores for production builders or Developer/Land Development category tags. Keep validationStatus=needs-call-confirmation until permit/license or direct buy-box validation is added.',
  candidates: signals.map(({ builderName, marketLabel, state, website, contactPage, phone, email, sourceUrls, evidenceType, confidence, notes }) => ({
    builderName,
    market: marketLabel,
    state,
    websiteOrContactUrl: website || contactPage,
    phone,
    email,
    sourceUrls,
    evidenceType,
    confidence,
    notes
  }))
}, null, 2)}\n`);

console.log(JSON.stringify({ outDir, count: signals.length }, null, 2));
