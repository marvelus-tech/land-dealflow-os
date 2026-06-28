import {
  scoreMarket,
  computeOffer,
  classifyParcelRisk,
  rankBuyers,
  scoreParcelDeal,
  applyCrmUpdate,
  applyCallOutcome,
  buildDailyMoneyQueue,
  buildSellerSearchControlLayer,
  buildExecutionConveyor,
  buildOperatorSessionMode,
  exportMatchedSellerBatchCsv,
  buildBuyerContactQueue,
  buildBuyerFirstBoard,
  applySkipTraceImport,
  applyLandReconParcelImport,
  applyBuyerContactImport,
  CALL_OUTCOMES,
  BUYER_FEEDBACK_REASONS,
  exportDailyCallSheetCsv,
  exportWorkspace,
  importWorkspace,
  CRM_STATUSES,
  getLehighImportTemplate,
  buildTopCallList,
  exportParcelsCsv,
  normalizeCsvToParcels,
  findDuplicateParcels,
  reportMissingData,
  getDataSourceChecklist,
  generateOwnerCallScript,
  buildFollowUpQueue,
  exportMailMergeCsv,
  bulkMarkContacted,
  generateOfferPacket,
  exportDealMemoMarkdown,
  generateBuyerSendMemo,
  exportBuyerSendMemoMarkdown,
  calculateBuyerScorecard,
  captureBuyBox,
  addBuyerCallNote,
  applyBuyerFeedback,
  buildDealFitMatrix,
  buildBuyerFeedbackLoop,
  recommendNextSellerCallsFromFeedback,
  calculateBuyBoxCompleteness,
  calculateSellerMotivation,
  calculateContractReadiness,
  generateSellerNetOfferScript,
  generateNeighborPrompt,
  buildOperatorChecklist,
  buildTitleCompanyClosingDesk,
  buildContractPacketDraft,
  exportContractPacketMarkdown,
  renderContractDocumentText,
  buildPermitVerifiedBuilders,
  buildBuyerValidationCommandCenter,
  BUYER_VALIDATION_STATUSES,
  generateBuilderCallScript,
  generateBuilderEmail,
  generateBuilderMarketingEmailTemplate,
  getSourceAdapterChecklist,
  getPermitPortalLandscape,
  formatMoney,
} from './core.mjs';

const STORAGE_KEY = 'land-dealflow-os-v3-zero-fabrication-workspace';

const seedMarkets = [
  { id: 'knoxville-tn', name: 'Knoxville, TN', state: 'TN', thesis: 'Tennessee public-source pivot: verify builder demand and parcel provenance before outreach.', newBuilds90d: 0, activeBuilders: 0, vacantLotSales90d: 0, offMarketVacantLots: 0, lotStandardization: 0, growthSignal: 0, complianceSimplicity: 0, buildabilityRisk: 0 },
  { id: 'chattanooga-tn', name: 'Chattanooga, TN', state: 'TN', thesis: 'Hamilton County source discovery first; no seller calls until verified public records exist.', newBuilds90d: 0, activeBuilders: 0, vacantLotSales90d: 0, offMarketVacantLots: 0, lotStandardization: 0, growthSignal: 0, complianceSimplicity: 0, buildabilityRisk: 0 },
  { id: 'nashville-edge-tn', name: 'Nashville edge, TN', state: 'TN', thesis: 'Metro Nashville perimeter watchlist; promote only source-backed parcels and buyers.', newBuilds90d: 0, activeBuilders: 0, vacantLotSales90d: 0, offMarketVacantLots: 0, lotStandardization: 0, growthSignal: 0, complianceSimplicity: 0, buildabilityRisk: 0 },
];

const seedBuyers = [];

const seedPermitRecords = [];

const seedParcels = [];

const builderMarketSources = [
  { key: 'knoxville', state: 'TN', marketName: 'Knoxville / Knox County, TN', csvUrl: 'data/real/knoxville/buyer_call_sheet.csv', signalsUrl: 'data/real/knoxville/builder_signals.json', evidenceUrl: 'data/real/knoxville/market_evidence.json' },
  { key: 'austin', state: 'TX', marketName: 'Austin, TX', csvUrl: 'data/real/austin/builder_validation_queue.csv', signalsUrl: 'data/real/austin/builder_signals.json', evidenceUrl: 'data/real/austin/market_evidence.json' },
  { key: 'san-antonio', state: 'TX', marketName: 'San Antonio, TX', csvUrl: 'data/real/san-antonio/builder_validation_queue.csv', signalsUrl: 'data/real/san-antonio/builder_signals.json', evidenceUrl: 'data/real/san-antonio/market_evidence.json' },
  { key: 'raleigh', state: 'NC', marketName: 'Raleigh / Wake County, NC', csvUrl: 'data/real/raleigh/builder_validation_queue.csv', signalsUrl: 'data/real/raleigh/builder_signals.json', evidenceUrl: 'data/real/raleigh/market_evidence.json' },
  { key: 'polk', state: 'FL', marketName: 'Polk / Lakeland, FL', csvUrl: 'data/real/polk/builder_validation_queue.csv', signalsUrl: 'data/real/polk/builder_signals.json', evidenceUrl: 'data/real/polk/market_evidence.json' },
  { key: 'maricopa', state: 'AZ', marketName: 'Phoenix / Maricopa County, AZ', csvUrl: 'data/real/maricopa/builder_validation_queue.csv', signalsUrl: 'data/real/maricopa/builder_signals.json', evidenceUrl: 'data/real/maricopa/market_evidence.json' },
  { key: 'dorchester-sc', state: 'SC', marketName: 'Dorchester County / Charleston edge, SC', csvUrl: 'data/real/dorchester-sc/builder_validation_queue.csv', signalsUrl: 'data/real/dorchester-sc/builder_signals.json', evidenceUrl: 'data/real/dorchester-sc/market_evidence.json' },
  { key: 'columbus-oh', state: 'OH', marketName: 'Columbus / Franklin County, OH', csvUrl: 'data/real/columbus-oh/builder_validation_queue.csv', signalsUrl: 'data/real/columbus-oh/builder_signals.json', evidenceUrl: 'data/real/columbus-oh/market_evidence.json' },
  { key: 'philadelphia-pa', state: 'PA', marketName: 'Philadelphia, PA', csvUrl: 'data/real/philadelphia-pa/builder_validation_queue.csv', signalsUrl: 'data/real/philadelphia-pa/builder_signals.json', evidenceUrl: 'data/real/philadelphia-pa/market_evidence.json' },
  { key: 'pittsburgh-pa', state: 'PA', marketName: 'Pittsburgh / Allegheny County, PA', csvUrl: 'data/real/pittsburgh-pa/builder_validation_queue.csv', signalsUrl: 'data/real/pittsburgh-pa/builder_signals.json', evidenceUrl: 'data/real/pittsburgh-pa/builder_discovery_packet.json' },
  { key: 'forsyth-ga', state: 'GA', marketName: 'Forsyth County / North Atlanta, GA', csvUrl: 'data/real/forsyth-ga/builder_validation_queue.csv', signalsUrl: 'data/real/forsyth-ga/builder_signals.json', evidenceUrl: 'data/real/forsyth-ga/market_evidence.json' },
  { key: 'hall-ga', state: 'GA', marketName: 'Hall County / Gainesville, GA', csvUrl: 'data/real/hall-ga/builder_validation_queue.csv', signalsUrl: 'data/real/hall-ga/builder_signals.json', evidenceUrl: 'data/real/hall-ga/market_evidence.json' },
  { key: 'boise-id', state: 'ID', marketName: 'Boise / Ada County, ID', csvUrl: 'data/real/boise-id/builder_validation_queue.csv', signalsUrl: 'data/real/boise-id/builder_signals.json', evidenceUrl: 'data/real/boise-id/market_evidence.json' },
  { key: 'evansville-in', state: 'IN', marketName: 'Evansville / Vanderburgh County, IN', csvUrl: 'data/real/evansville-in/builder_validation_queue.csv', signalsUrl: 'data/real/evansville-in/builder_signals.json', evidenceUrl: 'data/real/evansville-in/market_evidence.json' },
];

const builderMarketSourceByKey = new Map(builderMarketSources.map(source => [source.key, source]));

const builderMarketRegistry = [
  { key: 'knoxville', state: 'TN', label: 'Knoxville / Knox County', note: 'live Tennessee beachhead', platform: 'KGIS + Buildchek', suggestedRank: 1, sourceWork: 'Keep buyer calls moving; expand permit pull depth.' },
  { key: 'nashville-edge-tn', state: 'TN', label: 'Nashville / Davidson edge', note: 'Middle TN production-builder lane', platform: 'Buildchek + Metro Nashville Codes', suggestedRank: 2, sourceWork: 'Review Metro permit source and build contractor extraction.' },
  { key: 'chattanooga-tn', state: 'TN', label: 'Chattanooga / Hamilton County', note: 'TN builder-sprawl permit lane', platform: 'Buildchek + Hamilton County GIS', suggestedRank: 3, sourceWork: 'Verify direct county/city permit fields.' },
  { key: 'murfreesboro-tn', state: 'TN', label: 'Murfreesboro / Rutherford County', note: 'Nashville-edge sprawl lane', platform: 'CivicPlus / CivicGov', suggestedRank: 4, sourceWork: 'Build source monitor before seller sourcing.' },
  { key: 'franklin-tn', state: 'TN', label: 'Franklin / Williamson County', note: 'high-value TN custom-builder lane', platform: 'IDT Plans + county records', suggestedRank: 5, sourceWork: 'Confirm permit detail access and builder fields.' },
  { key: 'polk', state: 'FL', label: 'Polk / Lakeland', note: 'live inland Florida lane', platform: 'Accela Citizen Access', suggestedRank: 6, sourceWork: 'Refresh pull and enrich top builders.' },
  { key: 'keystone-heights-fl', state: 'FL', label: 'Keystone Heights / Clay County', note: 'source-backed landowner lane', platform: 'Clay County parcel GIS + property appraiser', suggestedRank: 7, sourceWork: 'Skip-trace top private vacant owners; buyer proof still leads before outreach.' },
  { key: 'ocala-fl', state: 'FL', label: 'Ocala / Marion County', note: 'inland FL permit lane', platform: 'Civic Access / CivicPlus', suggestedRank: 7, sourceWork: 'Probe portal for contractor export.' },
  { key: 'clermont-fl', state: 'FL', label: 'Clermont / Lake County', note: 'Orlando-edge growth lane', platform: 'TRAKiT / CentralSquare', suggestedRank: 8, sourceWork: 'Monitor migration and find machine-readable permits.' },
  { key: 'alachua-fl', state: 'FL', label: 'Gainesville / Alachua County', note: 'inland FL permit lane', platform: 'Accela', suggestedRank: 9, sourceWork: 'Build Accela adapter after contractor-field proof.' },
  { key: 'maricopa', state: 'AZ', label: 'Phoenix / Maricopa County', note: 'live AZ weekly-permit lane', platform: 'Maricopa weekly reports', suggestedRank: 10, sourceWork: 'Refresh weekly XLSX and call top permit builders.' },
  { key: 'tucson-az', state: 'AZ', label: 'Tucson / Pima County', note: 'secondary AZ permit lane', platform: 'Accela / Tucson DSD', suggestedRank: 11, sourceWork: 'Probe Accela-style details for contractor rows.' },
  { key: 'buckeye-az', state: 'AZ', label: 'Buckeye', note: 'fast-growth Phoenix edge', platform: 'City permit portal', suggestedRank: 12, sourceWork: 'Find export/API path for permit activity.' },
  { key: 'raleigh', state: 'NC', label: 'Raleigh / Wake County', note: 'live Piedmont ArcGIS lane', platform: 'Wake/Raleigh ArcGIS', suggestedRank: 13, sourceWork: 'Refresh direct permit-builder pull.' },
  { key: 'charlotte-nc', state: 'NC', label: 'Charlotte / Mecklenburg', note: 'large NC buyer market', platform: 'Accela + Power BI', suggestedRank: 14, sourceWork: 'Normalize dashboard/direct permit feed.' },
  { key: 'greensboro-nc', state: 'NC', label: 'Greensboro / Guilford County', note: 'Piedmont corridor permit lane', platform: 'County/city systems', suggestedRank: 15, sourceWork: 'Verify public contractor rows.' },
  { key: 'cabarrus-nc', state: 'NC', label: 'Concord / Cabarrus County', note: 'ArcGIS permit lane', platform: 'ArcGIS Open Data + Accela', suggestedRank: 16, sourceWork: 'Map permit/parcel layers and contractor fields.' },
  { key: 'austin', state: 'TX', label: 'Austin', note: 'live TX open-data lane', platform: 'Socrata Open Data / BLDS', suggestedRank: 17, sourceWork: 'Refresh Socrata pull and validate buy boxes.' },
  { key: 'san-antonio', state: 'TX', label: 'San Antonio', note: 'live CKAN/open-data lane', platform: 'Open Data SA / CKAN', suggestedRank: 18, sourceWork: 'Refresh CKAN pull and call active builders.' },
  { key: 'plano-tx', state: 'TX', label: 'Plano / Collin County', note: 'DFW-edge permit lane', platform: 'Accela + custom county portals', suggestedRank: 19, sourceWork: 'Find reliable permit detail source.' },
  { key: 'mcallen-tx', state: 'TX', label: 'McAllen', note: 'lower-priority Accela lane', platform: 'Accela', suggestedRank: 20, sourceWork: 'Probe Accela endpoint after higher-leverage markets.' },
  { key: 'forsyth-ga', state: 'GA', label: 'Forsyth County / Atlanta data-center corridor', note: 'GA data-center commuter lane', platform: 'Forsyth ArcGIS EnerGov + Tyler detail', suggestedRank: 21, sourceWork: 'Unblock contractor names from Tyler/EnerGov detail; open layer has no builder field.' },
  { key: 'hall-ga', state: 'GA', label: 'Hall County / Gainesville', note: 'NE Atlanta commuter lane', platform: 'Accela + issued-permit PDFs', suggestedRank: 22, sourceWork: 'Extract/OCR issued-permit PDFs or find detail export.' },
  { key: 'jackson-ga', state: 'GA', label: 'Jackson County', note: 'I-85 / data-center corridor', platform: 'County/city permit portals', suggestedRank: 23, sourceWork: 'Verify contractor-bearing public permit source.' },
  { key: 'douglas-ga', state: 'GA', label: 'Douglas County / Atlanta west', note: 'west Atlanta workforce-housing lane', platform: 'County/city portals', suggestedRank: 24, sourceWork: 'Review Accela/CentralSquare paths and contractor fields.' },
  { key: 'dorchester-sc', state: 'SC', label: 'Dorchester County / Charleston edge', note: 'live SC coastal-edge lane', platform: 'Evolve Public permit search', suggestedRank: 25, sourceWork: 'Enrich top 20 builders and deepen permit proof links.' },
  { key: 'berkeley-sc', state: 'SC', label: 'Berkeley County / Charleston edge', note: 'strong SC watchlist lane', platform: 'Builder portal / Cloudflare-challenged', suggestedRank: 26, sourceWork: 'Find reliable API/export path around portal challenge.' },
  { key: 'greenville-sc', state: 'SC', label: 'Greenville County', note: 'Upstate SC secondary lane', platform: 'County/city permit portal review', suggestedRank: 27, sourceWork: 'Review after Dorchester/Berkeley.' },
  { key: 'columbus-oh', state: 'OH', label: 'Columbus / Franklin County', note: 'Ohio source lane', platform: 'City/county permit portals + county GIS', suggestedRank: 28, sourceWork: 'Verify residential permit rows with contractor/builder names before buyer outreach.' },
  { key: 'boise-id', state: 'ID', label: 'Boise / Ada County', note: 'Idaho growth-market source lane', platform: 'City of Boise + Ada County permitting/GIS', suggestedRank: 29, sourceWork: 'Find machine-readable permit path and builder identity fields.' },
  { key: 'evansville-in', state: 'IN', label: 'Evansville / Vanderburgh County', note: 'live Indiana official-permit lane', platform: 'Evansville/Vanderburgh Building Commission ArcGIS', suggestedRank: 30, sourceWork: 'Enrich permit contractor principals to company DBA/contact URLs before any outreach.' },
  { key: 'indianapolis-in', state: 'IN', label: 'Indianapolis / Marion County', note: 'Indiana infill and edge-lot source lane', platform: 'Accela/Citizen Access + county property records', suggestedRank: 31, sourceWork: 'Probe permit export/detail pages for residential builder names.' },
  { key: 'philadelphia-pa', state: 'PA', label: 'Philadelphia', note: 'live PA L&I permit-backed lane', platform: 'OpenDataPhilly / Carto L&I permits', suggestedRank: 32, sourceWork: 'Enrich high-count permit builders with public company contact paths before outreach.' },
  { key: 'pittsburgh-pa', state: 'PA', label: 'Pittsburgh / Allegheny County', note: 'Pennsylvania source-work lane', platform: 'City/county permit portals + county assessment records', suggestedRank: 33, sourceWork: 'Verify permit-builder visibility and parcel source coverage before seller sourcing.' },
];

const builderMarketRegistryByKey = new Map(builderMarketRegistry.map(market => [market.key, market]));

const stages = [
  { id: 'market', name: 'Market Finder', desc: 'Where to hunt first.', sourceType: 'market' },
  { id: 'buyer', name: 'Buyer Finder', desc: 'Who is actively building.', sourceType: 'buyer' },
  { id: 'parcel', name: 'Land Finder', desc: 'Lots matching demand.', sourceType: 'parcel' },
  { id: 'owner', name: 'Owner Contact', desc: 'Reachable seller proof.', sourceType: 'owner' },
  { id: 'offer', name: 'Offer Engine', desc: 'Price, spread, kill line.', sourceType: 'offer' },
  { id: 'risk', name: 'Risk Filter', desc: 'Buildability blockers.', sourceType: 'risk' },
  { id: 'crm', name: 'Outreach CRM', desc: 'Calls and follow-up.', sourceType: 'crm' },
];

const sourceBlueprint = {
  market: {
    label: 'Location / market data',
    sources: ['Target-market config in data/sources.json', 'Generated source candidates: county GIS, ArcGIS/Socrata portals, Census/OSM queries', 'New-build, active-builder, vacant-lot velocity fields in the market snapshot'],
    fields: ['area name', 'state', 'buyer type', 'priority', 'market thesis', 'source candidates'],
  },
  buyer: {
    label: 'Buyer list',
    sources: ['Buyer source blocks in data/sources.json', 'Builder/buyer discovery queues for target areas with no buyer seed', 'Buyer call notes and exact buy-box validation captured in the workspace'],
    fields: ['buyer name', 'website', 'phone', 'email', 'contact', 'buy box', 'close speed', 'repeat demand'],
  },
  parcel: {
    label: 'Seller / parcel list',
    sources: ['Parcel source blocks in data/sources.json', 'County assessor/property-appraiser exports or normalized CSV imports', 'Generated seller-discovery queues for new target areas'],
    fields: ['parcel ID', 'address', 'lot size', 'owner', 'mailing address', 'asking price', 'held years', 'paid price'],
  },
  owner: {
    label: 'Owner contact data',
    sources: ['Owner fields carried on parcel records', 'CSV imports from county exports or skip-trace style enrichment', 'Missing-data quality gate flags incomplete owner contact before calling'],
    fields: ['owner name', 'owner phone', 'owner email', 'mailing address', 'skip-trace confidence'],
  },
  offer: {
    label: 'Pricing / offer math',
    sources: ['Parcel asking price and lowest active listing', 'Buyer max price and exact buy box', 'Offer engine formulas in src/core.mjs'],
    fields: ['buyer max price', 'seller ask', 'initial offer', 'max offer', 'projected spread'],
  },
  risk: {
    label: 'Buildability risk',
    sources: ['Parcel buildability fields from source records/imports', 'Risk filter in src/core.mjs', 'Quality gate for missing wetlands/flood/access/utilities/slope checks'],
    fields: ['wetlands', 'flood zone', 'road access', 'utilities', 'slope', 'wildlife flag'],
  },
  crm: {
    label: 'Outreach activity',
    sources: ['Browser-local workspace storage', 'CRM controls on each parcel card', 'Generated follow-up queue from current parcel CRM state'],
    fields: ['CRM status', 'next follow-up', 'notes', 'buyer feedback', 'call notes'],
  },
};

const titleCompanyProcessFallback = {"source":{"name":"Closing Desk operating model","basis":"internal title, escrow, contract, HUD, disbursement, and market candidate workflow","updatedAt":"2026-06-19","recordCount":420,"characters":16083},"operatorRules":["Do not mark a deal title ready until seller contract, buyer agreement and assignment agreement, party contacts, title company, closing cost payer, and settlement number review are present.","Do not mark closed merely because documents are signed; closed means buyer funded, title cleared, HUD/settlement approved, and disbursement confirmed.","Never display raw wire instructions in the app; track secure portal/verbal verification status instead.","Assignment friendly status must be verified by call/email for each title company; public title/escrow service pages are not proof they handle assignments."],"templates":{"titlePacketEmail":{"subject":"<PROPERTY ADDRESS>, Assignment closing packet","body":"Hello,\nI hope you're doing well. We are going to be doing an assignment for this property. I will input all of the seller, buyer and assignor information below, as well as the purchase contracts. Please confirm receipt of this email once you receive it. Thank you!\nPlease wire our funds at the time of closing. I've included our wiring instructions for your reference.\nClosing Date:\nJanuary 22, 2026\n\nProperty: <PROPERTY ADDRESS>\n\nSeller\nName: <SELLER NAME>\nPhone: <SELLER PHONE>\nEmail: <SELLER EMAIL>\nCash to seller: $<SELLER CONTRACT PRICE>\n\nAssignor\nName/company: <ASSIGNOR NAME / COMPANY>\nPhone: <ASSIGNOR PHONE>\nEmail: <ASSIGNOR EMAIL>\nAssignment fee: $<ASSIGNMENT FEE>\n\nBuyer / Assignee\nName/company: <BUYER NAME / COMPANY>\nPhone: <BUYER PHONE>\nEmail: <BUYER EMAIL>\nCash from buyer: $<BUYER CONTRACT PRICE>\n\nAttached purchase contracts\nSeller purchase agreement: <ATTACHMENT NAME>\nBuyer assignment agreement: <ATTACHMENT NAME>\nSupporting parcel information: <ATTACHMENT NAME>\n\nPlease also confirm: title search timing, closing cost payer, earnest money handling, remote online notarization options, and secure wire instruction process.\n\nImportant: we will only exchange wire instructions through your approved secure channel and will verbally verify instructions using a known office number.\n\nThank you,\n<YOUR NAME>"},"sellerPurchaseAgreementChecklist":["Vacant land purchase agreement for the property state","Buyer may assign clause selected / included","Due diligence or feasibility period included","Title/escrow closing language included","Seller price, parcel/APN, closing date, and seller contact complete","Attorney/title review before active use"],"buyerAssignmentAgreementChecklist":["Identifies original seller contract and parcel","Assigns buyer rights to assignee/builder","States assignment fee or buyer contract price path","Assignee assumes obligations after assignment","Earnest money/funding timing captured","Title company can show assignment fee on settlement statement or flags double close requirement"]},"closingDeskInsights":["Title company is the neutral escrow/closing party: contracts and party information go to title, buyer funds go to title, not directly to seller or assignor.","Title coordinates legal title transfer, runs title/lien/tax/deed checks, collects final signed and notarized documents, and prepares the settlement/HUD.","Assignment example: seller contract at $30,000, buyer agreement and assignment contract at $40,000, title disburses seller proceeds and the $10,000 assignment fee after closing conditions clear.","Seller trust script should explain title as neutral protection: title holds funds, verifies paperwork/title, and pays the seller at closing.","Closing packet email needs seller, buyer, assignor, contract prices, assignment fee, closing date, and attached contracts; wire instructions must be handled securely, not casually exposed.","Typical timeline is about 7 to 21 days, with 10 to 14 days as a practical planning range; a known efficient title company can be faster, but speed should not be promised.","Closing costs may be buyer paid, split, or assignor paid; operating examples use about $700 on a $20k land deal and roughly 2% on expensive properties."]};
const titleCompanyMarketsFallback = {"generatedAt":"2026-06-19","sourceMethod":"Public web search plus representative direct site checks; assignment friendly status remains unverified until operator call/email.","verificationScript":"Do you close vacant land assignments in <market>? Can the assignment fee appear on the settlement statement, or do you require double close? Can you handle remote seller/buyer notarization and secure wire instructions? What do you need to open a file?","markets":[{"state":"TN","market":"Knoxville / Knox County","priority":1,"candidates":[{"name":"Realty Title","url":"https://realtytitle.com/","publicEvidence":"Public site says Realty Title is a full service real estate title and escrow company conducting residential and commercial closings; representative scrape captured Prepare for Closing and 40+ locations copy.","serviceSignals":["title","escrow","closings","residential","commercial"],"assignmentFriendly":"unknown"},{"name":"LeConte Title","url":"https://lecontetitle.com/","publicEvidence":"Public site describes an attorney owned Knoxville title company providing residential and commercial real estate closings, title insurance, escrow services, and title searches in Knoxville/East Tennessee.","serviceSignals":["attorney owned","title insurance","escrow","title searches","closings"],"assignmentFriendly":"unknown"},{"name":"Southeast Title and Escrow","url":"https://www.setitle.net/","publicEvidence":"Search result describes a locally owned, full service Knoxville title and escrow company.","serviceSignals":["title","escrow","full service"],"assignmentFriendly":"unknown"}]},{"state":"TN","market":"Murfreesboro / Rutherford County","priority":2,"candidates":[{"name":"Magnolia Title & Escrow","url":"https://magnoliatitle.com/","publicEvidence":"Public site says Magnolia provides attorney staffed title and escrow services across Middle Tennessee with locations including Murfreesboro and Franklin.","serviceSignals":["attorney staffed","title","escrow","Middle Tennessee"],"assignmentFriendly":"unknown"},{"name":"Realty Title, Murfreesboro","url":"https://www.realtytitle.com/realty title/locations/office details.php?oid=212200212","publicEvidence":"Search result shows a Murfreesboro office for Realty Title with office phone and address.","serviceSignals":["local office","title","escrow","closing"],"assignmentFriendly":"unknown"},{"name":"Tri Star Title and Escrow","url":"https://www.tristartitleandescrow.com/services/settlement services","publicEvidence":"Search result says Tri Star provides title insurance, escrow, and closing services for residential and commercial settlements in Murfreesboro and Rutherford County.","serviceSignals":["title insurance","escrow","settlement","commercial"],"assignmentFriendly":"unknown"}]},{"state":"TN","market":"Franklin / Williamson County","priority":3,"candidates":[{"name":"Wagon Wheel Title","url":"https://wagonwheeltitle.com/","publicEvidence":"Search result says Wagon Wheel Title offers real estate title and escrow services to buyers, sellers, developers, investors, and lenders in Davidson/Williamson County areas.","serviceSignals":["title","escrow","developers","investors"],"assignmentFriendly":"unknown"},{"name":"Magnolia Title & Escrow, Franklin","url":"https://magnoliatitle.com/","publicEvidence":"Public site lists Franklin among Middle Tennessee locations for attorney staffed title and escrow services.","serviceSignals":["Franklin location","attorney staffed","title","escrow"],"assignmentFriendly":"unknown"},{"name":"Vanderpool Law, Franklin title company services","url":"https://vanderpoollaw.com/title company-franklin tn","publicEvidence":"Search result describes Franklin TN title company services with attorney review and title company closing support.","serviceSignals":["attorney review","title company services","closing"],"assignmentFriendly":"unknown"}]},{"state":"TN","market":"Clarksville / Montgomery County","priority":4,"candidates":[{"name":"Bankers Title, Clarksville","url":"https://www.banktitle.com/clarksville tn-title escrow","publicEvidence":"Search result says Bankers Title Clarksville provides complete closing and escrow service and title escrow support for buyers, sellers, and agents.","serviceSignals":["closing","escrow","title escrow"],"assignmentFriendly":"unknown"},{"name":"Stewart Title, Clarksville","url":"https://www.stewart.com/en/markets/clarksville","publicEvidence":"Search result says Stewart Title offers title insurance and escrow services in Clarksville.","serviceSignals":["title insurance","escrow","national underwriter"],"assignmentFriendly":"unknown"},{"name":"Clarksville Title & Escrow","url":"https://clarksvilletitle.com/about us/","publicEvidence":"Search result describes Clarksville Title & Escrow as having over 50 years combined law/real estate knowledge and specializing in residential title/escrow.","serviceSignals":["title","escrow","local"],"assignmentFriendly":"unknown"}]},{"state":"NC","market":"Charlotte / Mecklenburg + Cabarrus corridor","priority":5,"candidates":[{"name":"Allied Title & Escrow, Charlotte","url":"https://www.alliedtitleandescrow.com/charlotte nc","publicEvidence":"Public Charlotte page lists Allied Title & Escrow office address/phone and describes decades of underwriting/title experience.","serviceSignals":["title","escrow","Charlotte office"],"assignmentFriendly":"unknown"},{"name":"Stewart Title, Charlotte commercial services","url":"https://www.stewart.com/en/customer type/commercial title-closing services/find an-office/north carolina/charlotte","publicEvidence":"Search result shows Stewart Title Charlotte national commercial services for title/closing transactions.","serviceSignals":["commercial","title","closing","national"],"assignmentFriendly":"unknown"}]},{"state":"TX","market":"Austin / San Antonio corridor","priority":6,"candidates":[{"name":"Independence Title","url":"https://www.independencetitle.com/","publicEvidence":"Public site says Independence Title has 70+ locations across Texas metros and provides locations/services for title and escrow closings.","serviceSignals":["Texas metros","title","escrow","many offices"],"assignmentFriendly":"unknown"},{"name":"Alamo Title, San Antonio","url":"https://alamotitlesa.com/home","publicEvidence":"Public site advertises title underwriting/exam capabilities, escrow and closing services, and 1031 property exchanges.","serviceSignals":["title underwriting","escrow","closing","1031"],"assignmentFriendly":"unknown"},{"name":"N Title","url":"https://ntitle.com/","publicEvidence":"Search result describes a title company serving Houston, San Antonio, Dallas, and Austin with Texas real estate transaction expertise.","serviceSignals":["Austin","San Antonio","title","Texas"],"assignmentFriendly":"unknown"}]},{"state":"FL","market":"Ocala / Marion + inland Florida","priority":7,"candidates":[{"name":"Marion Title & Escrow Company","url":"https://www.mariontitlefl.com/","publicEvidence":"Public site says Marion Title & Escrow offers flexible real estate and escrow closing services throughout Florida, including mobile notary, online notarization, and secure wire instruction portal via Closinglock.","serviceSignals":["escrow","closing","mobile notary","online notarization","secure wire portal"],"assignmentFriendly":"unknown"},{"name":"Stewart Title, Ocala","url":"https://www.stewart.com/en/markets/ocala","publicEvidence":"Search result says Stewart Title Ocala offers title insurance, closing, and escrow services for residential and commercial transactions.","serviceSignals":["title insurance","closing","escrow","commercial"],"assignmentFriendly":"unknown"},{"name":"Ocala Land Title","url":"https://ocalalandtitle.com/","publicEvidence":"Search result describes a locally owned title insurance and real estate closing agency founded in 1995.","serviceSignals":["title insurance","real estate closing","local"],"assignmentFriendly":"unknown"}]},{"state":"AZ","market":"Phoenix / Mesa / Maricopa County","priority":8,"candidates":[{"name":"Equity Title of Arizona","url":"https://eta az.com/","publicEvidence":"Search result says Equity Title of Arizona has locations throughout Maricopa County and escrow officers focused on service.","serviceSignals":["Maricopa County","title","escrow"],"assignmentFriendly":"unknown"},{"name":"Clear Title Agency of Arizona","url":"https://cleartitleaz.com/","publicEvidence":"Search result says Clear Title Agency provides title and escrow services for residential and commercial real estate transactions.","serviceSignals":["title","escrow","residential","commercial"],"assignmentFriendly":"unknown"},{"name":"Title & Escrow Company, metro Phoenix","url":"https://www.arizonatitleandescrowcompany.com/","publicEvidence":"Search result describes a greater metro Phoenix independent title and escrow company.","serviceSignals":["Phoenix metro","title","escrow"],"assignmentFriendly":"unknown"}]}]};

let workspace = loadWorkspace();
let generatedLeads = null;
let weeklyMarketScout = null;
let knoxvilleBuyerCallSheet = null;
let dallasProofSprint = null;
let keystoneHeightsLandowners = null;
let freeGovOwnerSources = null;
let builderMarketData = { markets: {}, loaded: false, error: '' };
let titleCompanyProcess = titleCompanyProcessFallback;
let titleCompanyMarkets = titleCompanyMarketsFallback;
let filter = 'all';
let selectedParcelId = '';
let selectedBuilderId = '';
let selectedValidationBuilderId = '';
let selectedSourceType = 'market';
let selectedMoneyCallId = '';
let leadEngineStateFilter = 'all';
let selectedBuilderMarketState = 'GA';
let selectedBuilderMarketKey = '';
let selectedDealsMarketKey = 'all';
let selectedLandStateFilter = 'all';
let selectedLandSort = 'priority';
let lastBuilderSkipTraceImportStatus = '';
let lastLandReconImportStatus = '';
let openMachinePanel = '';
let cachedScoredParcels = null;
let cachedDealsMarketEntries = null;
let cachedLandStateOptions = null;
let cachedBuilderSwitchboardEntries = null;
const validViews = new Set(['today', 'deals', 'builders', 'closing', 'sources', 'machine']);

function invalidateLandPerformanceCaches() {
  cachedScoredParcels = null;
  cachedDealsMarketEntries = null;
  cachedLandStateOptions = null;
  cachedBuilderSwitchboardEntries = null;
}

function hashToView(hash = location.hash) {
  const view = String(hash || '#today').replace('#', '');
  return validViews.has(view) ? view : '';
}

let activeView = hashToView() || 'today';

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return importWorkspace(saved);
  } catch (error) {
    console.warn('Could not load workspace', error);
  }
  return { markets: seedMarkets, buyers: seedBuyers, parcels: seedParcels, permitRecords: seedPermitRecords, permitBuilders: [], buyerValidations: [] };
}

function persistWorkspace() {
  invalidateLandPerformanceCaches();
  localStorage.setItem(STORAGE_KEY, exportWorkspace(workspace));
}

function h(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function slugify(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function safeLink(url, label, className = '') {
  return `<a ${className ? `class="${h(className)}" ` : ''}href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(label)}</a>`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value) {
  if (!value) return 'not sourced yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return h(value);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function latestTimestamp(rows = []) {
  return asArray(rows)
    .map(row => row?.collectedAt || row?.generatedAt || row?.updatedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || '';
}

function sourceIds(rows = []) {
  return [...new Set(asArray(rows).map(row => row?.sourceId || row?.sourceAdapter || row?.sourceType).filter(Boolean))];
}

function getSourceRows(type) {
  const snapshot = generatedLeads?.snapshot || {};
  if (type === 'market') return asArray(snapshot.markets);
  if (type === 'buyer') return asArray(snapshot.buyers);
  if (type === 'parcel' || type === 'owner' || type === 'risk' || type === 'offer') return asArray(snapshot.parcels);
  return [];
}

function getPhaseSourceStatus(type) {
  const rows = getSourceRows(type);
  const snapshotGeneratedAt = generatedLeads?.generatedAt || generatedLeads?.snapshot?.generatedAt || '';
  const latest = type === 'crm' ? new Date().toISOString() : latestTimestamp(rows) || snapshotGeneratedAt;
  const ids = sourceIds(rows);
  const count = type === 'offer'
    ? asArray(generatedLeads?.queues?.offerReady).length
    : type === 'crm'
      ? asArray(workspace.parcels).filter(parcel => parcel.crmStatus || parcel.nextFollowUp || parcel.notes).length
      : rows.length;
  return { latest, ids, count };
}

function sourceDisclosure(type) {
  const blueprint = sourceBlueprint[type] || sourceBlueprint.market;
  const status = getPhaseSourceStatus(type);
  const sourceText = blueprint.sources.slice(0, 2).map(item => `<li>${h(item)}</li>`).join('');
  const fieldText = blueprint.fields.slice(0, 5).join(' · ');
  const sourceIdText = status.ids.length ? status.ids.slice(0, 2).map(id => `<code>${h(id)}</code>`).join(' ') : '<span>derived/local</span>';
  const freshness = status.latest ? formatDateTime(status.latest) : 'Source pending';
  return `<details class="source-disclosure" data-source-type="${h(type)}">
    <summary aria-label="Inspect ${h(blueprint.label)} source layer">
      <span>Source layer</span>
      <b>${h(blueprint.label)}</b>
      <em><strong>${h(status.count)}</strong><small>records</small></em>
    </summary>
    <div class="source-popover" role="note">
      <div class="source-popover-head"><span>${h(status.count)} records</span><b>${freshness}</b></div>
      <div class="source-popover-section"><strong>Origin</strong><ul>${sourceText}</ul></div>
      <div class="source-popover-section"><strong>Field shape</strong><p class="source-field-strip">${h(fieldText)}</p></div>
      <div class="source-id-foot"><span>Source IDs</span>${sourceIdText}</div>
    </div>
  </details>`;
}

function scrollToPageTop() {
  requestAnimationFrame(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

function setActiveView(view, options = {}) {
  activeView = validViews.has(view) ? view : 'today';
  document.body.dataset.activeView = activeView;
  document.querySelectorAll('.app-panel').forEach(panel => {
    const isActive = panel.dataset.panel === activeView;
    panel.hidden = !isActive;
    panel.classList.toggle('active-panel', isActive);
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    const isActive = button.dataset.view === activeView;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
  if (options.scrollToTop) scrollToPageTop();
}

function navigateToView(view) {
  if (!validViews.has(view)) return;
  history.replaceState(null, '', `#${view}`);
  setActiveView(view, { scrollToTop: true });
  renderAll();
}

function captureBuilderInteractionViewport() {
  const queue = document.querySelector('#buyer-validation-command .validation-queue');
  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    queueScrollTop: queue?.scrollTop || 0,
    selectedValidationBuilderId,
  };
}

function restoreBuilderInteractionViewport(viewport = {}) {
  const restore = () => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(viewport.scrollX || 0, viewport.scrollY || 0);
    const queue = document.querySelector('#buyer-validation-command .validation-queue');
    if (queue) queue.scrollTop = viewport.queueScrollTop || 0;
    const selectedButton = [...document.querySelectorAll('[data-select-validation-builder]')]
      .find(button => button.dataset.selectValidationBuilder === viewport.selectedValidationBuilderId);
    selectedButton?.focus?.({ preventScroll: true });
    root.style.scrollBehavior = previousScrollBehavior;
  };
  restore();
  requestAnimationFrame(restore);
}

function renderAppShell() {
  setActiveView(activeView);
}

function badge(text, tone = 'neutral') {
  return `<span class="badge ${tone}">${h(text)}</span>`;
}

function getBuyer(parcel) {
  const ranked = rankBuyers(workspace.buyers || []);
  return ranked.find(buyer => buyer.id === parcel.buyerId) || ranked.find(buyer => buyer.market === parcel.market) || {};
}

function generatedCandidateParcels() {
  return asArray(generatedLeads?.snapshot?.parcels).filter(parcel => parcel.sourceId || parcel.publicSource || parcel.crmStatus === 'Needs skip trace');
}

function keystoneHeightsCandidateParcels() {
  return asArray(keystoneHeightsLandowners?.parcels).filter(parcel => parcel.publicProofStatus === 'verified-public-source' || parcel.sourceUrl || parcel.publicSource);
}

function generatedCandidateBuyers() {
  return asArray(generatedLeads?.snapshot?.buyers).filter(buyer => {
    const source = String(buyer.sourceId || '').toLowerCase();
    return source === 'lehigh-builder-signals-fdor-2025' || source.includes('builder') || source.includes('kgis') || buyer.evidenceType === 'permitVerified active-builder signal';
  });
}

function rowState(row = {}) {
  const explicit = String(row.state || row.propertyState || '').trim().toUpperCase();
  if (explicit) return explicit;
  const text = `${row.market || ''} ${row.areaName || ''} ${row.address || ''}`.toLowerCase();
  if (/\btn\b|tennessee|knoxville|chattanooga|nashville/.test(text)) return 'TN';
  if (/\bfl\b|florida|lehigh|cape-coral|ocala|palm bay|orlando/.test(text)) return 'FL';
  if (/\bar\b|arkansas|bentonville|bella vista/.test(text)) return 'AR';
  if (/\btx\b|texas|houston|dallas/.test(text)) return 'TX';
  if (/\bga\b|georgia|forsyth|hall|jackson|douglas|atlanta|cumming|gainesville/.test(text)) return 'GA';
  if (/\bsc\b|south carolina|dorchester|berkeley|charleston|summerville|greenville/.test(text)) return 'SC';
  return 'UNKNOWN';
}

function normalizeParcelAddress(value = '') {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function dallasProofRows() {
  return asArray(dallasProofSprint?.rows);
}

function dallasPhase4Rows() {
  return asArray(generatedLeads?.snapshot?.parcels).filter(parcel => parcel.phase4Status || /Dallas \/ Dallas County/i.test(String(parcel.market || '')));
}

function dallasProofRowForParcel(parcel = {}) {
  const parcelId = String(parcel.parcelId || parcel.apn || parcel.id || '').trim();
  const address = normalizeParcelAddress(parcel.address || parcel.propertyAddress);
  return dallasProofRows().find(row => String(row.parcelId || '').trim() === parcelId || normalizeParcelAddress(`${row.propertyAddress || ''} ${row.propertyCity || ''} TX ${row.propertyZip || ''}`) === address || normalizeParcelAddress(row.propertyAddress) === address) || null;
}

function dallasProofGateTone(status = '') {
  const value = String(status || '').toLowerCase();
  if (/fail|reject|blocked|contradict|bad/.test(value)) return 'fail';
  if (/partial|evidence-present|legal-lot-reference-found/.test(value)) return 'partial';
  if (/hold|needed|needs|not-found|unknown|no-builder|pending/.test(value)) return 'needed';
  if (/lock/.test(value)) return 'locked';
  if (/^pass(?:\b|-)|\bpass-(?:public|contact|outside|inside)|verified|public-api-pass|public-zoning/.test(value)) return 'pass';
  return 'needed';
}

function dallasProofGateChip(label, status = '') {
  const tone = dallasProofGateTone(status);
  const glyphs = { pass: '✓', partial: '◐', fail: '×', locked: '🔒', needed: '…' };
  const copy = { pass: 'Pass', partial: 'Partial', fail: 'Fail', locked: 'Locked', needed: 'Needed' };
  return `<span class="dallas-proof-gate-chip is-${h(tone)}" title="${h(status || copy[tone])}"><i>${h(glyphs[tone])}</i><b>${h(label)}</b><em>${h(copy[tone])}</em></span>`;
}

function dallasProofGateItems(row = {}) {
  return [
    ['Parcel', row.cityParcelProofStatus || row.cityLimitsStatus || row.addressValidationStatus],
    ['Zoning', row.publicZoningProofStatus || row.zoning || row.zoningBuilderAcceptedStatus],
    ['Plat', row.recordedPlatProofStatus || row.platVerificationStatus],
    ['Water/sewer', row.waterSewerProofStatus],
    ['Electric/gas', row.electricGasProofStatus],
    ['Builder OK', row.zoningBuilderAcceptedStatus],
    ['Owner contact', row.ownerPhone || row.ownerEmail ? 'pass-contact-present' : 'locked-owner-contact-not-enriched'],
  ];
}

function dallasProofGateStrip(row = {}, limit = 7) {
  return `<div class="dallas-proof-gate-strip" aria-label="Dallas proof gate pass fail indicators">${dallasProofGateItems(row).slice(0, limit).map(([label, status]) => dallasProofGateChip(label, status)).join('')}</div>`;
}

function dallasProofAggregateStatus(row = {}) {
  const tones = dallasProofGateItems(row).map(([, status]) => dallasProofGateTone(status));
  if (tones.includes('fail')) return { label: 'Failed buyer gate', tone: 'fail' };
  if (tones.every(tone => tone === 'pass')) return { label: 'Offer-ready proof', tone: 'pass' };
  if (tones.includes('pass') || tones.includes('partial')) return { label: 'Partial proof / held', tone: 'partial' };
  return { label: 'Held for proof', tone: 'needed' };
}

function dallasProofSummary() {
  const complete = dallasPhase4Rows();
  const sprint = dallasProofRows();
  const rows = complete.length ? complete : sprint;
  const held = rows.filter(row => row.phase4Status === 'hold-needs-utility-plat-proof' || row.crmStatus === 'Needs utility/plat verification' || row.operatorDecision === 'hold').length;
  const offerReady = asArray(generatedLeads?.queues?.offerReady).filter(row => /dallas/i.test(`${row.market || ''} ${row.address || ''}`)).length;
  return {
    completeCount: dallasProofSprint?.completePhase4Count || complete.length || 0,
    sprintCount: dallasProofSprint?.sprintCount || sprint.length || 0,
    heldCount: held || Number(dallasProofSprint?.completePhase4Count || 0),
    offerReady,
    generatedAt: dallasProofSprint?.generatedAt || generatedLeads?.generatedAt || '',
    status: dallasProofSprint?.status || 'operator-proof-needed-before-owner-enrichment',
  };
}

function matchesLeadEngineState(row = {}) {
  return leadEngineStateFilter === 'all' || rowState(row) === leadEngineStateFilter;
}

function availableLeadEngineStates(snapshot = {}, queues = {}) {
  const rows = [
    ...asArray(snapshot.markets),
    ...asArray(snapshot.buyers),
    ...asArray(snapshot.parcels),
    ...asArray(snapshot.sourceCandidates),
    ...Object.values(queues).flatMap(value => asArray(value)),
  ];
  const states = [...new Set(rows.map(rowState).filter(state => state && state !== 'UNKNOWN'))].sort();
  return states.length ? states : ['TN'];
}

function filteredRows(rows = []) {
  return asArray(rows).filter(matchesLeadEngineState);
}

function provenancePill(row = {}) {
  const adapter = row.sourceAdapter || row.type || row.platform || 'source pending';
  const sourceId = row.sourceId || row.id || row.sourceType || 'unverified';
  const tone = /seed|fake|sample|demo/i.test(`${adapter} ${sourceId}`) ? 'bad' : row.sourceUrl || row.url || row.platform ? 'good' : 'warn';
  const label = tone === 'bad' ? 'blocked: fabricated' : tone === 'good' ? 'public-source' : 'source pending';
  return `${badge(label, tone)} ${badge(rowState(row), 'neutral')} <code>${h(sourceId)}</code>`;
}

function zeroFabricationNotice(snapshot = {}, queues = {}) {
  const activeLeadCount = asArray(queues.topSellerCalls).length + asArray(queues.offerReady).length + asArray(queues.skipTrace).length;
  const candidateCount = asArray(snapshot.sourceCandidates).length;
  return `<section class="fabrication-guard">
    <div><span class="eyebrow">Zero-fabrication mode</span><h3>No made-up leads are allowed in the money queue.</h3><p>Seed/demo records are blocked at generation time. Tennessee is currently a public-source watchlist: the app can show source candidates now, but seller calls stay empty until verified county/city records are ingested.</p></div>
    <div class="guard-stats"><strong>${h(activeLeadCount)}</strong><span>active source-backed lead rows</span><strong>${h(candidateCount)}</strong><span>source candidates discovered</span></div>
  </section>`;
}

function enrichedBuilderContacts() {
  return asArray(workspace.buyers).filter(buyer => buyer.contactEnrichedAt || buyer.sourceId === 'lehigh-builder-signals-fdor-2025' || buyer.market === 'knoxville-tn');
}

function parseLotSizeRange(value = '') {
  const numbers = String(value || '').match(/\d+(?:\.\d+)?/g)?.map(Number).filter(number => Number.isFinite(number)) || [];
  if (!numbers.length) return { lotSizeMin: 0, lotSizeMax: 0 };
  if (numbers.length === 1) return { lotSizeMin: numbers[0], lotSizeMax: numbers[0] };
  return { lotSizeMin: Math.min(...numbers), lotSizeMax: Math.max(...numbers) };
}

function stateFromBuilderRow(row = {}) {
  const explicit = String(row.state || row.marketState || row.stateCode || '').trim().toUpperCase();
  if (explicit) return explicit;
  const market = String(row.marketName || row.market || row.sourceMarket || '').toLowerCase();
  if (/tennessee|knoxville|nashville|chattanooga|murfreesboro|franklin/.test(market)) return 'TN';
  if (/florida|polk|lakeland|ocala|orlando|jacksonville/.test(market)) return 'FL';
  if (/arizona|phoenix|maricopa|mesa|tucson/.test(market)) return 'AZ';
  if (/north carolina|raleigh|wake|charlotte|mecklenburg|greensboro/.test(market)) return 'NC';
  if (/texas|austin|san antonio|travis|bexar|dfw|plano/.test(market)) return 'TX';
  if (/georgia|forsyth|hall|jackson|douglas|atlanta|cumming|gainesville/.test(market)) return 'GA';
  if (/south carolina|dorchester|berkeley|charleston|summerville|greenville/.test(market)) return 'SC';
  if (/ohio|columbus|franklin county/.test(market)) return 'OH';
  if (/idaho|boise|ada county/.test(market)) return 'ID';
  if (/indiana|indianapolis|marion county/.test(market)) return 'IN';
  if (/pennsylvania|pittsburgh|allegheny/.test(market)) return 'PA';
  return selectedBuilderMarketState || 'TN';
}

function buyerFromValidationRow(row = {}) {
  const buyBox = row.buyBox || {};
  const validation = row.validation || {};
  const lotRange = parseLotSizeRange(buyBox.lotSize || buyBox.lotSizeRange || '');
  const state = stateFromBuilderRow(row);
  const market = row.marketName || row.market || (buyBox.geography ? `${buyBox.geography}, ${state}` : state);
  const maxPrice = Number(buyBox.maxPrice || row.maxPrice || row.buyerMaxPrice || 0) || 0;
  const targetMarkets = [buyBox.geography, row.market, row.marketKey, market, state].filter(Boolean);
  const buyerId = `builder-buyer-${slugify(row.builderId || row.id || row.name || 'validated-builder')}`;
  return {
    id: buyerId,
    builderId: row.builderId || row.id || '',
    name: row.name || row.companyName || 'Validated builder buyer',
    phone: row.phone || '',
    email: row.email || buyBox.packageRecipient || '',
    website: row.website || row.sourceUrl || '',
    contactName: row.contactName || buyBox.packageRecipient || '',
    sourceId: row.sourceId || row.builderId || 'buyer-validation-command-center',
    sourceUrl: row.sourceUrl || row.publicSourceUrl || '',
    sourceType: row.sourceType || 'permit-backed builder validation',
    evidenceType: 'validated buyer buy-box from selected builder cockpit',
    market,
    state,
    marketState: state,
    recentBuilds: Number(row.recentBuilds || 0),
    maxPrice,
    closeSpeedDays: Number(String(buyBox.closeSpeed || '').match(/\d+/)?.[0] || 0) || undefined,
    repeatDemand: Number(String(buyBox.closeSpeed || '').match(/(\d+)\s*(?:lots?|parcels?)/i)?.[1] || 0) || 1,
    buyBoxCaptured: validation.sellerEligible || row.callStatus === 'validated_buy_box',
    validationStatus: row.callStatus === 'validated_buy_box' ? 'validated buy box' : row.callStatus || 'buyer validation',
    buyBox: `${buyBox.geography || market}; ${buyBox.lotSize || 'lot size pending'}; max ${formatMoney(maxPrice)}; close ${buyBox.closeSpeed || 'speed pending'}; package ${buyBox.packageRecipient || 'recipient pending'}; avoid ${asArray(buyBox.dealKillers).join(', ') || buyBox.dealKillers || 'deal killers pending'}`,
    exactBuyBox: {
      targetMarkets,
      lotSizeMin: lotRange.lotSizeMin,
      lotSizeMax: lotRange.lotSizeMax,
      maxPrice,
      requiredRoadAccess: true,
      requiredUtilities: /utility|utilities|sewer|water|electric/i.test(String(buyBox.utilitiesAccess || '')),
      avoidFloodZones: /flood/i.test(String(asArray(buyBox.dealKillers).join(' ') || buyBox.dealKillers || '')) ? ['AE', 'A'] : [],
      avoidWetlands: /wetland/i.test(String(asArray(buyBox.dealKillers).join(' ') || buyBox.dealKillers || '')),
      notes: row.callNotes || '',
    },
    acquisitionNotes: row.callNotes || '',
    validation: {
      buyBoxCaptured: validation.sellerEligible || row.callStatus === 'validated_buy_box',
      calls: row.outreach?.phone?.contacted ? 1 : 0,
      answered: row.callStatus === 'validated_buy_box' || row.callStatus === 'spoke_to_decision_maker' ? 1 : 0,
      proofOfFunds: false,
    },
    feedback: row.feedback || [],
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

function validatedBuilderBuyersForState(stateCode = selectedBuilderMarketState) {
  const activeRows = stateCode === selectedBuilderMarketState ? getActiveValidationRows() : getStateBuilderRows(stateCode);
  const center = buildBuyerValidationCommandCenter(activeRows, workspace.buyerValidations || []);
  return center.items.filter(item => item.validation?.sellerEligible).map(buyerFromValidationRow);
}

function upsertBuyerFromValidation(row = {}) {
  const buyer = buyerFromValidationRow(row);
  workspace = { ...workspace, buyers: [...asArray(workspace.buyers).filter(item => item.id !== buyer.id && item.builderId !== buyer.builderId), buyer] };
  return buyer;
}

function uniqueRowsById(rows = [], keyFn = item => item.id || item.buyerId || item.builderId || item.parcelId || item.name) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(keyFn(row) || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buyerPoolForState(stateCode = selectedBuilderMarketState) {
  const buyers = [
    ...validatedBuilderBuyersForState(stateCode),
    ...generatedCandidateBuyers(),
    ...enrichedBuilderContacts(),
    ...asArray(workspace.buyers),
  ];
  return uniqueRowsById(buyers).filter(row => !stateCode || String(row.state || row.marketState || row.market || '').toUpperCase().includes(stateCode));
}

function sellerPoolForState(stateCode = selectedBuilderMarketState) {
  const sellers = [...generatedCandidateParcels(), ...asArray(generatedLeads?.queues?.skipTrace), ...asArray(workspace.parcels)];
  return uniqueRowsById(sellers, item => item.id || item.parcelId || item.address).filter(row => !stateCode || String(row.state || row.marketState || row.market || row.address || '').toUpperCase().includes(stateCode));
}

function scoredParcels() {
  if (cachedScoredParcels) return cachedScoredParcels;
  // Deals must show source-backed seller records even before a browser-local
  // import. Workspace rows come first so enriched/skip-traced local records
  // override the generated public-record candidates with the same parcel id.
  const parcelRows = uniqueRowsById([
    ...asArray(workspace.parcels),
    ...keystoneHeightsCandidateParcels(),
    ...generatedCandidateParcels(),
    ...asArray(generatedLeads?.queues?.skipTrace),
  ], item => item.id || item.parcelId || item.address);
  cachedScoredParcels = parcelRows.map(parcel => scoreParcelDeal(parcel, getBuyer(parcel))).sort((a, b) => b.score - a.score);
  return cachedScoredParcels;
}

function parcelSelectionKey(parcel = {}) {
  return String(parcel.id || parcel.parcelId || parcel.apn || parcel.address || parcel.propertyAddress || '').trim();
}

function dealMarketText(row = {}) {
  return `${row.market || ''} ${row.marketKey || ''} ${row.sourceMarket || ''} ${row.address || ''} ${row.county || ''} ${row.state || ''}`.toLowerCase();
}

function parcelMatchesDealMarket(parcel = {}, market = null) {
  if (!market || market.key === 'all') return true;
  const state = rowState(parcel);
  const text = dealMarketText(parcel);
  const key = String(market.key || '').toLowerCase();
  const labelSeed = String(market.label || market.marketLabel || '').split('/')[0].trim().toLowerCase();
  const keyMatch = Boolean(key && text.includes(key));
  const labelMatch = Boolean(labelSeed && text.includes(labelSeed));
  const stateOnlyFallback = !keyMatch && !labelMatch && !key && !labelSeed && state === market.state;
  return keyMatch || labelMatch || stateOnlyFallback;
}

function dallasVirtualMarketEntry() {
  const summary = dallasProofSummary();
  const count = summary.completeCount || summary.sprintCount || dallasProofRows().length || 0;
  return {
    key: 'dallas-tx',
    stateCode: 'TX',
    state: 'TX',
    label: 'Dallas',
    marketLabel: 'Dallas proof sprint',
    builderCount: 0,
    dealCount: count,
    sourceStatusCopy: 'utility + plat proof sprint',
    dealStatusCopy: `${count} Dallas proof rows`,
    sourceState: 'thin',
    isDallasProofLane: true,
    isDealsActive: selectedDealsMarketKey === 'dallas-tx',
  };
}

function getSelectedDealsMarket() {
  if (selectedDealsMarketKey === 'all') return null;
  if (selectedDealsMarketKey === 'dallas-tx') return dallasVirtualMarketEntry();
  return builderMarketSwitchboardEntries().find(market => market.key === selectedDealsMarketKey) || builderMarketRegistryByKey.get(selectedDealsMarketKey) || null;
}

function getLandRowMarketKey(parcel = {}) {
  const text = dealMarketText(parcel);
  const direct = builderMarketSwitchboardEntries().find(market => parcelMatchesDealMarket(parcel, market));
  if (direct) return direct.key;
  return String(parcel.marketId || parcel.market || parcel.county || rowState(parcel) || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

const landStateToggleOrder = ['TN', 'FL', 'AZ', 'NC', 'TX', 'GA', 'SC', 'OH', 'ID', 'IN', 'PA'];
const landStateSelectorAbbreviations = {
  all: 'All',
  TN: 'Tenn.',
  FL: 'Fla.',
  AZ: 'Ariz.',
  NC: 'N.C.',
  TX: 'Tex.',
  GA: 'Ga.',
  SC: 'S.C.',
  OH: 'Ohio',
  ID: 'Idaho',
  IN: 'Ind.',
  PA: 'Pa.',
};

function getLandStateOptions() {
  if (cachedLandStateOptions) return cachedLandStateOptions;
  const registryStates = builderMarketRegistry.map(market => market.state).filter(Boolean);
  const parcelStates = scoredParcels().map(rowState).filter(Boolean);
  const states = new Set([...landStateToggleOrder, ...registryStates, ...parcelStates].filter(Boolean));
  const orderedStates = landStateToggleOrder.filter(state => states.has(state));
  const remainderStates = [...states].filter(state => !landStateToggleOrder.includes(state)).sort((a, b) => a.localeCompare(b));
  cachedLandStateOptions = ['all', ...orderedStates, ...remainderStates];
  return cachedLandStateOptions;
}

function landConfidenceScore(parcel = {}) {
  const raw = parcel.intakeConfidence ?? parcel.landConfidence ?? parcel.agentConfidence ?? parcel.skipTraceConfidence ?? parcel.contactConfidence ?? parcel.confidence ?? 0;
  const numeric = Number(String(raw).replace(/[^0-9.]+/g, ''));
  if (Number.isFinite(numeric) && numeric > 0) return Math.max(0, Math.min(100, numeric));
  if (/high|strong|verified/i.test(String(raw))) return 82;
  if (/medium|review/i.test(String(raw))) return 55;
  if (/low|weak|unknown|name[-\s]*only/i.test(String(raw))) return 22;
  return 0;
}

function landStageWeight(state = {}) {
  if (state.offerReady) return 1200;
  if (state.builderMatched && state.enriched) return 950;
  if (state.builderMatched) return 760;
  if (state.enriched) return 650;
  if (state.contactCandidate) return 480;
  if (state.sourceBacked) return 360;
  if (state.needsProof) return 160;
  if (state.rawFinding) return 60;
  return 0;
}

function landSortValue(parcel = {}, mode = selectedLandSort) {
  const state = parcel._listingState || parcelListingState(parcel);
  const confidence = landConfidenceScore(parcel);
  if (mode === 'state') return `${rowState(parcel)} ${getLandRowMarketKey(parcel)} ${parcel.address || parcel.parcelId || ''}`;
  if (mode === 'market') return `${getLandRowMarketKey(parcel)} ${rowState(parcel)} ${parcel.address || parcel.parcelId || ''}`;
  if (mode === 'enrichment') return -(Number(state.enriched) * 1000 + Number(state.contactCandidate) * 420 + Number(state.builderMatched) * 500 + Number(state.offerReady) * 250 + confidence + Number(parcel.score || 0));
  if (mode === 'builder-fit') return -(Number(state.builderMatched) * 1000 + Number(state.enriched) * 250 + confidence + Number(parcel.score || 0));
  return -(Number(parcel.selectedMarketMatch) * 2000 + landStageWeight(state) + confidence * 1.8 + Number(parcel.score || 0));
}

function getVisibleParcels() {
  const selectedMarket = getSelectedDealsMarket();
  // Phase 202: State is the primary IA decision. Market lanes are subordinate
  // filters; All states remains the only mode that shows the entire ledger.
  return scoredParcels().map(parcel => {
    const landMarketKey = getLandRowMarketKey(parcel);
    const listingState = parcelListingState(parcel);
    const enrichedParcel = {
      ...parcel,
      selectedMarketMatch: selectedMarket?.isDallasProofLane ? Boolean(dallasProofRowForParcel(parcel)) : parcelMatchesDealMarket(parcel, selectedMarket),
      selectedStateMatch: selectedLandStateFilter === 'all' || rowState(parcel) === selectedLandStateFilter,
      landMarketKey,
      _listingState: listingState,
    };
    return { ...enrichedParcel, _landSortValue: landSortValue(enrichedParcel) };
  }).filter(parcel => {
    if (selectedLandStateFilter !== 'all' && !parcel.selectedStateMatch) return false;
    if (selectedMarket && !parcel.selectedMarketMatch) return false;
    return true;
  }).sort((a, b) => {
    const av = a._landSortValue;
    const bv = b._landSortValue;
    if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv));
    return av - bv;
  });
}

function parcelListingState(parcel = {}) {
  const status = parcel.landLedgerStatus || parcel.agentIntakeStatus || '';
  const utilityPlatHold = parcel.phase4Status === 'hold-needs-utility-plat-proof' || parcel.crmStatus === 'Needs utility/plat verification';
  const sourceBacked = Boolean(parcel.publicSource || parcel.sourceUrl || parcel.publicProofStatus === 'verified-public-source') || ['source-backed', 'contact-candidate', 'contact-enriched', 'builder-fit', 'offer-ready'].includes(status);
  const needsProof = utilityPlatHold || status === 'needs-public-proof' || parcel.publicProofStatus === 'needs-public-proof';
  const rawFinding = status === 'raw-finding';
  const unverifiedContacts = Array.isArray(parcel.unverifiedContactCandidates) ? parcel.unverifiedContactCandidates : [];
  const contactCandidate = status === 'contact-candidate' || Boolean(unverifiedContacts.length || parcel.unverifiedOwnerPhone || parcel.unverifiedOwnerEmail);
  const enriched = Boolean(parcel.ownerPhone || parcel.ownerEmail || parcel.realContact || parcel.skipTraceImportedAt || parcel.skipTraceStatus === 'contact-enriched');
  const builderMatched = Boolean(
    parcel.reasons?.some?.(reason => /buyer|buy box|market fit/i.test(reason))
    || parcel.buyerId
    || Number(parcel.buyerMaxPrice || parcel.offer?.buyerPrice || 0) > 0
  );
  const offerReady = parcel.risk?.status === 'Pass' && builderMatched && enriched && Number(parcel.metrics?.spread || 0) > 0;
  const blocked = parcel.action === 'Kill' || parcel.crmStatus === 'Kill' || parcel.risk?.status === 'Kill';
  const confidence = landConfidenceScore(parcel);
  const stage = offerReady ? 'offer-ready'
    : builderMatched && enriched ? 'matched-enriched'
      : builderMatched ? 'builder-match'
        : enriched ? 'enriched'
          : contactCandidate ? 'contact-candidate'
            : sourceBacked ? 'visible-source'
              : needsProof ? 'needs-proof'
                : rawFinding ? 'raw-finding'
                  : blocked ? 'blocked'
                    : 'raw-finding';
  const label = offerReady ? 'Offer-ready'
    : builderMatched && enriched ? 'Matched + enriched'
      : builderMatched ? 'Builder match'
        : enriched ? 'Enriched contact'
          : contactCandidate ? 'Contact candidate'
            : sourceBacked ? 'Source-backed'
              : needsProof ? 'Needs public proof'
                : rawFinding ? 'Raw finding'
                  : blocked ? 'Blocked risk'
                    : 'Raw finding';
  const detail = offerReady
    ? 'Buyer fit, contact, and first-pass economics are present.'
    : builderMatched && enriched
      ? 'This owner has a reachable contact and buyer-fit signal.'
      : builderMatched
        ? 'Buyer-fit signal present; enrich owner contact next.'
        : enriched
          ? 'Reachable owner; still needs buyer-fit confirmation.'
          : contactCandidate
            ? 'Unverified contact evidence is visible, but not callable until enriched.'
            : sourceBacked
              ? 'Public source-backed land record; rank rises as confidence improves.'
              : needsProof
                ? 'Agent found something useful; attach public source proof before promotion.'
                : blocked
                  ? 'Keep visible for audit, but do not call.'
                  : 'Raw agent finding; retained so the operator can research and enrich it.';
  return { enriched, builderMatched, offerReady, blocked, sourceBacked, needsProof, rawFinding, contactCandidate, confidence, stage, label, detail };
}

function dealsMarketCoverageEntries() {
  const cacheKey = `${selectedLandStateFilter}|${selectedDealsMarketKey}`;
  if (cachedDealsMarketEntries?.key === cacheKey) return cachedDealsMarketEntries.entries;
  const allDeals = scoredParcels();
  const entries = builderMarketSwitchboardEntries().map(market => {
    const dealCount = allDeals.filter(parcel => parcelMatchesDealMarket(parcel, market)).length;
    const sourceState = market.isLive ? 'live' : market.isThin ? 'thin' : 'needs-work';
    return {
      ...market,
      dealCount,
      sourceState,
      dealStatusCopy: dealCount ? `${dealCount} seller records` : '0 seller records',
      sourceStatusCopy: market.statusCopy,
      isDealsActive: selectedDealsMarketKey === market.key,
    };
  });
  const dallasEntry = dallasVirtualMarketEntry();
  const entriesWithDallas = dallasEntry.dealCount ? [...entries, dallasEntry] : entries;
  const stateScopedEntries = selectedLandStateFilter === 'all'
    ? entriesWithDallas
    : entriesWithDallas.filter(market => (market.stateCode || market.state) === selectedLandStateFilter);
  const expansionStateCodes = new Set(['OH', 'ID', 'IN', 'PA', 'GA', 'SC']);
  const expansionEntries = stateScopedEntries.filter(market => expansionStateCodes.has(market.stateCode || market.state));
  const otherEntries = stateScopedEntries.filter(market => !expansionStateCodes.has(market.stateCode || market.state));
  const stateDealCount = selectedLandStateFilter === 'all' ? allDeals.length : allDeals.filter(parcel => rowState(parcel) === selectedLandStateFilter).length;
  const stateLabel = 'All';
  const aggregateEntry = {
    key: 'all',
    stateCode: selectedLandStateFilter === 'all' ? 'ALL' : selectedLandStateFilter,
    label: stateLabel,
    marketLabel: stateLabel,
    builderCount: stateScopedEntries.reduce((sum, market) => sum + Number(market.builderCount || 0), 0),
    dealCount: stateDealCount,
    sourceStatusCopy: `${stateScopedEntries.length} market lanes`,
    dealStatusCopy: `${stateDealCount} seller records`,
    sourceState: 'all',
    isDealsActive: selectedDealsMarketKey === 'all',
  };
  const result = [aggregateEntry, ...expansionEntries, ...otherEntries];
  cachedDealsMarketEntries = { key: cacheKey, entries: result };
  return result;
}

function renderLandControls() {
  const stateOptions = getLandStateOptions();
  const parcels = scoredParcels();
  const marketEntries = builderMarketSwitchboardEntries();
  const activeMarket = getSelectedDealsMarket();
  const stateSummaries = stateOptions.map(state => {
    const label = state === 'all' ? 'All' : state;
    const isAll = state === 'all';
    const markets = isAll ? marketEntries : marketEntries.filter(market => (market.stateCode || market.state) === state);
    const stateParcels = isAll ? parcels : parcels.filter(parcel => rowState(parcel) === state);
    const listingStates = stateParcels.map(parcelListingState);
    const sourceBacked = listingStates.filter(row => row.sourceBacked).length;
    const enriched = listingStates.filter(row => row.enriched).length;
    const offerReady = listingStates.filter(row => row.offerReady).length;
    const builderCount = markets.reduce((sum, market) => sum + Number(market.builderCount || 0), 0);
    const liveMarketCount = markets.filter(market => market.isLive || Number(market.builderCount || 0) > 0).length;
    const thinMarketCount = markets.filter(market => market.isThin || market.status === 'thin').length;
    const thesis = isAll
      ? { label: 'All states', thesis: 'State decision required', detail: 'Choose one state before lanes or seller rows get visual weight', note: 'All records remain retained; action starts after a state is explicit.' }
      : (builderStateTheses[state] || { label: state, thesis: `${state} source lane`, detail: `${state} state lane`, note: 'State-level market lane.' });
    const status = offerReady ? 'live' : sourceBacked || liveMarketCount ? 'thin' : thinMarketCount ? 'thin' : 'needs-work';
    const statusCopy = offerReady ? `${offerReady} offer-ready` : sourceBacked ? `${sourceBacked} source-backed` : `${stateParcels.length} retained records`;
    return {
      ...thesis,
      state,
      displayLabel: landStateSelectorAbbreviations[state] || thesis.short || thesis.label,
      stateCode: isAll ? 'ALL' : state,
      isAll,
      markets,
      countyCount: markets.length,
      builderCount,
      dealCount: stateParcels.length,
      sourceBacked,
      enriched,
      offerReady,
      liveMarketCount,
      status,
      statusCopy,
      isActive: selectedLandStateFilter === state,
    };
  });
  const activeState = stateSummaries.find(state => state.isActive) || stateSummaries[0];
  const stateSwitcher = stateSummaries.map((state) => `<div role="button" tabindex="0" class="state-market-toggle land-state-market-toggle market-status-${h(state.status)} ${state.isActive ? 'active is-active' : ''}" data-land-state="${h(state.state)}" aria-label="${h(`${state.label}. ${state.thesis}. ${state.countyCount} ${state.countyCount === 1 ? 'market lane' : 'market lanes'}. ${state.dealCount} records.`)}" aria-pressed="${state.isActive ? 'true' : 'false'}">
    <span class="state-market-code">${h(state.stateCode)}</span>
    <span class="state-market-copy"><strong><span class="state-market-name">${h(state.displayLabel)}</span><span class="state-market-thesis">${h(state.short || state.thesis)}</span></strong><small><span>${h(state.countyCount)} ${state.countyCount === 1 ? 'lane' : 'lanes'}</span><span>${h(state.statusCopy)}</span></small></span>
    <em><b>${h(state.dealCount)}</b><span>records</span></em>
  </div>`).join('');
  const visibleCount = parcels.filter(parcel => {
    if (selectedLandStateFilter !== 'all' && rowState(parcel) !== selectedLandStateFilter) return false;
    if (!activeMarket) return true;
    return activeMarket.isDallasProofLane ? Boolean(dallasProofRowForParcel(parcel)) : parcelMatchesDealMarket(parcel, activeMarket);
  }).length;
  const sortOptions = [
    ['priority', 'Priority'],
    ['state', 'State'],
    ['market', 'Market'],
    ['enrichment', 'Enriched'],
    ['builder-fit', 'Builder fit'],
  ];
  const sortButtons = sortOptions.map(([value, label]) => `<button type="button" class="land-sort-option ${selectedLandSort === value ? 'active' : ''}" data-land-sort="${h(value)}" aria-pressed="${selectedLandSort === value ? 'true' : 'false'}">${h(label)}</button>`).join('');
  const sortControl = selectedLandStateFilter === 'all'
    ? ''
    : `<div class="land-control-group sort land-refined-sort" aria-label="Sort land listings"><span>Sort</span><div>${sortButtons}</div></div>`;
  const stateNote = selectedLandStateFilter === 'all'
    ? `${parcels.length} retained records. Pick a state to reveal market lanes and parcels.`
    : `${visibleCount} visible in ${selectedLandStateFilter}. Market lane, sort, and queue follow this state.`;
  const marketSummary = `<div class="active-market-summary state-focus-summary land-state-focus-summary">
    <span>Selected land state</span>
    <strong>${h(activeState.label)}</strong>
    <p><b>${h(activeState.detail)}.</b> ${h(activeState.note)}</p>
    <ul>
      <li title="Retained seller/source records in this state."><b>${h(activeState.dealCount)}</b><span>records</span></li>
      <li title="Visible market lanes under this state decision."><b>${h(activeState.countyCount || 0)}</b><span>lanes</span></li>
      <li title="Source-backed rows safe for next evidence work."><b>${h(activeState.sourceBacked || 0)}</b><span>proofed</span></li>
      <li title="Rows with proof, contact, buyer fit, and money aligned."><b>${h(activeState.offerReady || 0)}</b><span>offer-ready</span></li>
    </ul>
    ${renderDealsMarketCoverage()}
    ${sortControl}
    <p class="land-control-note">${h(stateNote)}</p>
  </div>`;
  return `<section class="land-command-surface phase202-land-state-first phase207-top-control-cohesion phase211-one-state-switcher phase213-harmonized-command phase215-award-command phase218-builder-style-workbench phase219-calm-scan-hierarchy builders-phase83-workbench ${selectedLandStateFilter === 'all' ? 'is-all-states-command' : 'is-selected-state-command'}" aria-label="Land listings controls">
    <div class="builder-ops-title land-command-copy">
      <span class="eyebrow">Land · state workbench</span>
      <h3>Choose state.</h3>
      <p><b>State first.</b> State → lane → parcel. Market lanes stay as evidence; owner motion starts only after proof, contact, and buyer fit are clear.</p>
      <div class="primary-action-strip builders-primary-action land-primary-action"><b>Work clean parcel.</b><a href="#parcels">Open queue ${productIcon('arrow')}</a></div>
    </div>
    <div class="state-first-workbench state-data-workbench land-state-data-workbench" aria-label="Choose land operating state and read selected-state data">
      <div class="state-workbench-kicker">
        <span>Operating state</span>
        <strong>${h(activeState.label)}</strong>
        <em>${h(activeState.dealCount)} records · ${h(activeState.countyCount || 0)} market lanes</em>
      </div>
      <div class="state-workbench-layout">
        <div class="state-market-grid land-state-market-grid" data-land-state-selector>${stateSwitcher}</div>
        ${marketSummary}
      </div>
    </div>
  </section>`;
}

function renderLandAgentIntakeGate() {
  const parcels = scoredParcels();
  const counts = parcels.reduce((acc, parcel) => {
    const state = parcelListingState(parcel);
    acc.source += 1;
    if (state.rawFinding || state.needsProof) acc.needsProof += 1;
    if (state.contactCandidate) acc.contactCandidates += 1;
    if (!state.enriched) acc.needsContact += 1;
    if (state.builderMatched) acc.builderFit += 1;
    if (state.offerReady) acc.offerReady += 1;
    return acc;
  }, { source: 0, needsProof: 0, contactCandidates: 0, needsContact: 0, builderFit: 0, offerReady: 0 });
  const contractRows = [
    ['Raw finding', 'Visible', 'agent clues stay inspectable even when proof is incomplete'],
    ['Public proof', 'Promotes', 'county/GIS/tax/permit URL + collectedAt raises the row to source-backed'],
    ['Owner contact', 'Quarantined', 'weak phone/email is shown as candidate evidence, not a callable field'],
    ['Builder fit', 'Computed', 'buy-box/permit evidence must exist before seller-call priority rises'],
    ['Call status', 'Manual', 'subagents reference the webapp script; they do not perform outreach'],
  ].map(([label, state, copy]) => `<li><span>${h(label)}</span><b>${h(state)}</b><p>${h(copy)}</p></li>`).join('');
  return `<section class="land-agent-intake-gate" aria-label="Land agent intake contract">
    <div class="land-agent-copy">
      <span class="eyebrow">Proof rules</span>
      <h3>Visible is not callable.</h3>
      <p>Rows stay available for research, but seller motion only starts after public proof and a scored owner contact clear the gate.</p>
    </div>
    <div class="land-agent-ledger">
      <div class="land-agent-facts" aria-label="Current land proof state">
        <div><span>Visible findings</span><b>${h(counts.source)}</b></div>
        <div><span>Need proof</span><b>${h(counts.needsProof)}</b></div>
        <div><span>Contact candidates</span><b>${h(counts.contactCandidates)}</b></div>
        <div><span>Offer-ready</span><b>${h(counts.offerReady)}</b></div>
      </div>
      <ol>${contractRows}</ol>
    </div>
  </section>`;
}

function renderLandReconImportPath() {
  const sample = JSON.stringify({
    sellerRows: [{
      parcelId: 'KGIS-EXAMPLE-001',
      propertyAddress: '123 Public Proof Rd, Knoxville, TN',
      ownerName: 'Owner from assessor record',
      ownerMailingAddress: 'Mailing address from public record',
      sourceUrl: 'https://county.example/parcel/KGIS-EXAMPLE-001',
      sourceName: 'County assessor',
      sourceType: 'public parcel/owner record',
      collectedAt: new Date().toISOString().slice(0, 10),
      market: 'Knoxville / Knox County, TN',
      state: 'TN',
      buyerMatchReason: 'Builder fit pending; do not call.',
      provenanceNotes: 'Public source-backed only; contact enrichment remains gated.',
    }],
  }, null, 2);
  return `<section class="land-recon-import-path" aria-label="Land Recon artifact import path">
    <div class="land-recon-import-copy">
      <span class="eyebrow">Artifact import</span>
      <h3>Import a packet.</h3>
      <p>Paste JSON or CSV from Land Recon. Matching APN, address, owner+address, and source URLs merge into the existing ledger. Unverified contact stays candidate-only until scored.</p>
    </div>
    <div class="land-recon-import-panel">
      <textarea id="land-recon-packet-input" rows="8" spellcheck="false" placeholder="${h(sample)}"></textarea>
      <div class="land-recon-import-actions">
        <button type="button" id="import-land-recon-packet">Validate + append to Land</button>
        <span id="land-recon-import-status">${h(lastLandReconImportStatus || 'Waiting for a packet from a Land Recon subagent.')}</span>
      </div>
    </div>
  </section>`;
}

function landLaneAbbrev(market = {}) {
  if (market.key === 'all') return 'All';
  if (market.isDallasProofLane || market.key === 'dallas-tx') return 'DAL';
  const label = String(market.marketLabel || market.label || market.key || '').toLowerCase();
  if (label.includes('austin')) return 'AUS';
  if (label.includes('san antonio')) return 'SA';
  if (label.includes('plano') || label.includes('collin')) return 'PLN';
  if (label.includes('mcallen')) return 'MCA';
  if (label.includes('knoxville')) return 'KNX';
  if (label.includes('nashville')) return 'NSH';
  if (label.includes('chattanooga')) return 'CHA';
  if (label.includes('raleigh') || label.includes('wake')) return 'RDU';
  if (label.includes('phoenix') || label.includes('maricopa')) return 'PHX';
  return String(market.stateCode || market.state || 'LN').slice(0, 3).toUpperCase();
}

function renderDealsMarketCoverage() {
  const entries = dealsMarketCoverageEntries();
  const selected = entries.find(market => market.isDealsActive) || entries[0];
  const visibleEntries = entries.filter(market => market.key !== 'all');
  const liveCount = visibleEntries.filter(market => market.builderCount > 0).length;
  const marketButtons = selectedLandStateFilter === 'all' ? `<p class="land-market-empty-note">Pick a state to unlock market lanes.</p>` : entries.map(market => {
    const toneClass = market.sourceState === 'live' ? 'is-live' : market.sourceState === 'thin' ? 'is-thin' : market.sourceState === 'all' ? 'is-all' : 'needs-work';
    const laneAbbrev = landLaneAbbrev(market);
    return `<div role="button" tabindex="0" class="deals-market-card ${toneClass} ${market.isDealsActive ? 'active' : ''}" data-deals-market-key="${h(market.key)}" aria-label="${h(`${market.marketLabel || market.label}. ${market.dealCount} deals.`)}" aria-pressed="${market.isDealsActive ? 'true' : 'false'}">
      <small><kbd>${h(laneAbbrev)}</kbd><strong>${h(market.marketLabel || market.label)}</strong></small>
      <span><b>${h(market.dealCount)}</b> deals</span>
      <em>${h(market.sourceStatusCopy)} · ${h(market.dealStatusCopy)}</em>
    </div>`;
  }).join('');
  const scopeCopy = selectedLandStateFilter === 'all'
    ? 'State first. Lanes stay parked until geography is explicit.'
    : `${selectedLandStateFilter} lanes. Dallas proof stays in Dallas; low-signal markets stay visible but quiet.`;
  return `<section class="deals-market-coverage land-market-lane-selector ${selectedLandStateFilter === 'all' ? 'is-state-required' : ''}" aria-label="Deals market lane selector">
    <div class="deals-market-head">
      <span class="eyebrow">Lane</span>
      <h3>${h(selectedLandStateFilter === 'all' ? 'Parked.' : selected.key === 'all' ? 'All lanes.' : `${selected.marketLabel || selected.label}`)}</h3>
      <p>${h(selectedLandStateFilter === 'all' ? scopeCopy : selected.key === 'all' ? scopeCopy : `${selected.dealStatusCopy}. ${selected.sourceStatusCopy}.`)}</p>
    </div>
    <div class="deals-market-grid" role="listbox" aria-label="Select Deals market">${marketButtons}</div>
  </section>`;
}

function renderLandSupportDrawer(agentIntakeGate = '', dallasProofSurface = '', landReconImportPath = '') {
  const hasDallasProof = Boolean(dallasProofSurface);
  return `<details class="land-support-drawer phase213-support-drawer" aria-label="Land support tools">
    <summary><span><em class="eyebrow">Support tools</em><b>Proof rules, Dallas sprint, and packet import</b></span><strong>${hasDallasProof ? 'Lane proof ready' : 'Closed'}</strong></summary>
    <div class="land-support-drawer-body">
      ${agentIntakeGate}
      ${dallasProofSurface}
      ${landReconImportPath}
    </div>
  </details>`;
}

function renderDallasProofSprintSurface() {
  const summary = dallasProofSummary();
  const dallasLaneActive = selectedLandStateFilter === 'TX' && selectedDealsMarketKey === 'dallas-tx';
  if (!dallasLaneActive || (!summary.completeCount && !summary.sprintCount)) return '';
  const rows = dallasProofRows();
  const sprintRows = rows.slice(0, 12).map(row => {
    const tasks = asArray(row.proofTasks).slice(0, 2).map(task => `<li>${h(task)}</li>`).join('');
    const aggregate = dallasProofAggregateStatus(row);
    return `<article class="dallas-proof-row" data-dallas-proof-parcel="${h(row.parcelId)}">
      <div><span>${String(row.sprintRank || row.rank || '').padStart(2, '0')}</span><b>${h(row.propertyAddress || 'Dallas parcel')}</b><em>${h(row.zoning || 'zoning pending')} · ${h(Number(row.lotSqft || 0).toLocaleString())} sf · ${h(row.floodStatus || 'flood pending')}</em><mark class="dallas-proof-aggregate is-${h(aggregate.tone)}">${h(aggregate.label)}</mark></div>
      <div class="dallas-proof-row-middle">
        ${dallasProofGateStrip(row, 6)}
        <div class="dallas-proof-links">
          ${row.dcadAccountUrl ? safeLink(row.dcadAccountUrl, 'DCAD', 'proof-inline-link') : ''}
          ${row.cityParcelQueryUrl ? safeLink(row.cityParcelQueryUrl, 'City parcel API', 'proof-inline-link') : ''}
          ${row.dallasCountyPublicSearchUrl ? safeLink(row.dallasCountyPublicSearchUrl, 'Recorded plat search', 'proof-inline-link') : ''}
        </div>
      </div>
      <ul>${tasks}</ul>
    </article>`;
  }).join('');
  const statusRows = [
    ['Complete Dallas queue', summary.completeCount, 'all qualifying rows stay visible; Top-12 is only a sprint view'],
    ['Proof sprint', summary.sprintCount, 'highest-leverage rows ready for manual source attachment'],
    ['Held for proof', summary.heldCount, 'utility/tap + recorded plat + builder zoning acceptance required'],
    ['Offer-ready', summary.offerReady, 'must remain zero until every proof gate passes'],
  ].map(([label, value, copy]) => `<div><span>${h(label)}</span><b>${h(value)}</b><p>${h(copy)}</p></div>`).join('');
  return `<section class="dallas-proof-sprint-surface" aria-label="Dallas Phase 4.5 utility and recorded plat proof sprint">
    <div class="dallas-proof-head">
      <span class="eyebrow">Dallas Phase 4.5</span>
      <h3>Top-12 proof sprint surfaced inside Land.</h3>
      <p>Dallas rows are visible, prioritized, and locked. The operator attaches real utility/tap, electric/gas, recorded-plat, and builder-zoning proof here before owner enrichment can begin.</p>
      <small>Generated ${h(formatDateTime(summary.generatedAt))} · ${h(summary.status)}</small>
    </div>
    <div class="dallas-proof-metrics">${statusRows}</div>
    <details class="dallas-proof-disclosure">
      <summary><b>Top-12 proof ledger</b><span>Open only when attaching Dallas evidence</span></summary>
      <div class="dallas-proof-ledger">${sprintRows || '<p>Proof sprint artifact not loaded yet.</p>'}</div>
    </details>
  </section>`;
}

function getSelectedParcel(visible = getVisibleParcels()) {
  if (!visible.length) {
    selectedParcelId = '';
    return null;
  }
  const selected = visible.find(parcel => parcelSelectionKey(parcel) === selectedParcelId) || visible[0];
  selectedParcelId = parcelSelectionKey(selected);
  return selected;
}

function getNextAction(parcel) {
  if (!parcel) return 'Import seller records to begin.';
  if (parcel.action === 'Call now') return `Call ${parcel.ownerName || parcel.owner || 'the owner'} and anchor at ${formatMoney(parcel.offer.initialSellerOffer)}.`;
  if (parcel.risk.status === 'Kill') return 'Do not call. Keep as evidence for risk filter tuning.';
  if (!parcel.ownerPhone && !parcel.ownerEmail) return 'Find owner phone/email before this becomes callable.';
  if (parcel.risk.status === 'Review') return 'Clear buildability risk before making an offer.';
  return 'Keep warm: send mail first or add to follow-up queue.';
}

function downloadText(filename, text, type = 'text/csv') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderMarkets() {
  const rows = (workspace.markets || []).map((market) => {
    const score = scoreMarket(market);
    const tone = score.grade === 'A' ? 'good' : score.grade === 'B' ? 'warn' : 'bad';
    return `<article class="card market-card">
      <div class="card-top"><h3>${h(market.name)}</h3>${badge(`Grade ${score.grade} · ${score.total}`, tone)}</div>
      <p>${h(market.thesis || 'No thesis captured yet.')}</p>
      <div class="meter"><span style="width:${score.total}%"></span></div>
      <div class="mini-grid">
        <div><b>${h(market.newBuilds90d)}</b><span>new builds / 90d</span></div>
        <div><b>${h(market.activeBuilders)}</b><span>active builders</span></div>
        <div><b>${h(market.vacantLotSales90d)}</b><span>land sales / 90d</span></div>
        <div><b>${Number(market.offMarketVacantLots || 0).toLocaleString()}</b><span>off-market lots</span></div>
      </div>
      <div class="tags">${score.reasons.map(r => badge(r, 'good')).join('')}${score.flags.map(f => badge(f, 'bad')).join('')}</div>
    </article>`;
  }).join('');
  document.querySelector('#markets').innerHTML = rows;
}

function renderBuyers() {
  const ranked = rankBuyers(workspace.buyers || []);
  document.querySelector('#buyers').innerHTML = ranked.map((buyer) => `<article class="card buyer-card">
    <div class="card-top"><h3>${h(buyer.name)}</h3>${badge(`${buyer.score} buyer score`, buyer.score >= 70 ? 'good' : 'warn')}</div>
    <p>${h(buyer.type || 'Buyer')} · ${h(buyer.buyBox || 'No buy box captured yet.')}</p>
    <p><strong>${h(buyer.contactName || 'No contact')}</strong> · ${h(buyer.phone || 'phone missing')} · ${h(buyer.email || 'email missing')}</p>
    <div class="mini-grid four">
      <div><b>${h(buyer.recentBuilds || 0)}</b><span>recent builds</span></div>
      <div><b>${buyer.scatteredLots ? 'Yes' : 'No'}</b><span>scattered lots</span></div>
      <div><b>${h(buyer.closeSpeedDays || 30)}d</b><span>close speed</span></div>
      <div><b>${h(buyer.repeatDemand || 0)}/10</b><span>repeat demand</span></div>
    </div>
  </article>`).join('');
}

function crmControls(parcel) {
  return `<div class="crm-row" data-parcel-id="${h(parcel.id)}">
    <label>Status<select class="crm-status">${CRM_STATUSES.map(status => `<option value="${h(status)}" ${parcel.crmStatus === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label>Next follow-up<input class="crm-followup" type="date" value="${h(parcel.nextFollowUp || '')}"></label>
    <label>Negotiated range<input class="crm-negotiated-range" type="text" value="${h(parcel.negotiatedSellerRange || '')}" placeholder="$28k to $32k, or seller counter"></label>
    <label>Title packet<select class="crm-title-status">${['missing', 'draft', 'attorney-reviewed', 'title-opened', 'active'].map(status => `<option value="${h(status)}" ${(parcel.titlePacketStatus || 'missing') === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label>Buyer memo<select class="crm-buyer-memo-status">${['missing', 'drafted', 'sent', 'accepted'].map(status => `<option value="${h(status)}" ${(parcel.buyerMemoStatus || 'missing') === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label>Assignment<select class="crm-assignment-status">${['not-started', 'accepted', 'signed', 'deposited', 'closed'].map(status => `<option value="${h(status)}" ${(parcel.assignmentStatus || 'not-started') === status ? 'selected' : ''}>${h(status)}</option>`).join('')}</select></label>
    <label class="crm-notes-label">Notes<textarea class="crm-notes" rows="2" placeholder="Call notes, seller ask, buyer feedback...">${h(parcel.notes || '')}</textarea></label>
    <button class="save-crm" type="button">Save CRM</button>
  </div>`;
}

function renderOperatorChecklist(checklist, { compact = false, open = true } = {}) {
  const doneCount = checklist.steps.filter(step => step.done).length;
  return `<section class="operator-checklist land-timeline-card ${compact ? 'compact' : ''}" aria-label="Call-to-close checklist">
    <details ${open ? 'open' : ''}>
      <summary>
        <span><em class="eyebrow">Call → close</em><b>${h(checklist.next.label)}</b></span>
        <strong>${h(checklist.probability)}% <i>close probability</i></strong>
      </summary>
      <ol class="land-close-timeline" aria-label="Call-to-close timeline">
        ${checklist.steps.map((step, index) => `<li class="${step.done ? 'done' : 'todo'}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <b>${h(step.label)}</b>
          <p>${h(step.detail)}</p>
        </li>`).join('')}
      </ol>
      <p class="land-timeline-note">${h(doneCount)} of ${h(checklist.steps.length)} gates cleared. Keep proof, title, and buyer response visible; do not promote beyond the current gate.</p>
    </details>
  </section>`;
}

function statusTone(status) {
  if (['closed-funded', 'buyer-funded', 'clear-to-close', 'title-packet-ready', 'file-opened', 'hud-review'].includes(status)) return 'good';
  if (['blocked', 'assignment friendly-title-needed'].includes(status)) return 'bad';
  if (['missing-title-company', 'docs-out-for-signature', 'title-search'].includes(status)) return 'warn';
  return 'neutral';
}

function titleCompanyCandidateMarkets() {
  return asArray(titleCompanyMarkets?.markets).slice(0, 8);
}

function currentContractDraftInputs(parcel = {}) {
  const saved = workspace.contractDraft || {};
  return {
    effectiveDate: saved.effectiveDate || new Date().toISOString().slice(0, 10),
    buyerName: saved.buyerName || 'MarvelUs Intel LLC or assigns',
    sellerName: saved.sellerName || parcel.ownerName || parcel.owner || '',
    propertyAddress: saved.propertyAddress || parcel.address || '',
    city: saved.city || parcel.city || '',
    county: saved.county || parcel.county || '',
    propertyState: saved.propertyState || parcel.state || 'TN',
    zip: saved.zip || parcel.zip || '',
    parcelId: saved.parcelId || parcel.parcelId || parcel.id || '',
    legalDescription: saved.legalDescription || parcel.legalDescription || '',
    includedRights: saved.includedRights || 'all appurtenant rights stated in the state approved contract',
    purchasePrice: saved.purchasePrice || parcel.sellerAskingPrice || parcel.askingPrice || parcel.offer?.initialSellerOffer || '',
    earnestMoney: saved.earnestMoney || '10.00',
    earnestMoneyHolder: saved.earnestMoneyHolder || parcel.titleCompany?.name || '',
    closingAgent: saved.closingAgent || parcel.titleCompany?.name || '',
    feasibilityDeadline: saved.feasibilityDeadline || 'through closing unless state counsel changes this term',
    closingDate: saved.closingDate || parcel.closingDate || '',
    closingCostsPayer: saved.closingCostsPayer || 'Buyer unless title/attorney changes allocation',
    taxProration: saved.taxProration || 'prorated as of closing',
    deedType: saved.deedType || 'warranty, special warranty, or state appropriate deed approved by closing office',
    assignability: saved.assignability || 'assignable only after attorney/title approval',
    assignorName: saved.assignorName || 'MarvelUs Intel LLC',
    assigneeName: saved.assigneeName || parcel.buyerContactName || '',
    underlyingSellerName: saved.underlyingSellerName || parcel.ownerName || parcel.owner || '',
    originalPurchasePrice: saved.originalPurchasePrice || parcel.sellerAskingPrice || parcel.offer?.initialSellerOffer || '',
    assignmentFee: saved.assignmentFee || parcel.assignmentFee || parcel.offer?.targetSpread || '',
    assigneePurchasePrice: saved.assigneePurchasePrice || parcel.buyerPrice || parcel.offer?.buyerPrice || '',
    earnestMoneyDue: saved.earnestMoneyDue || '',
    earnestMoneyDeadline: saved.earnestMoneyDeadline || '',
    inspectionAcknowledgement: saved.inspectionAcknowledgement || 'assignee accepts buyer position subject to reviewed documents and title instructions',
    titleCompany: saved.titleCompany || parcel.titleCompany?.name || '',
    settlementStatementApproval: saved.settlementStatementApproval || 'assignment fee must appear on closing statement or written title instructions',
    additionalTerms: saved.additionalTerms || '',
    sellerSignature: saved.sellerSignature || '',
    buyerSignature: saved.buyerSignature || '',
    assignorSignature: saved.assignorSignature || '',
    assigneeSignature: saved.assigneeSignature || '',
    attorneyReviewer: saved.attorneyReviewer || '',
    attorneyReviewDate: saved.attorneyReviewDate || '',
  };
}

function renderContractComposer(parcel = {}) {
  const inputs = currentContractDraftInputs(parcel);
  const packet = buildContractPacketDraft(inputs);
  const contractStatus = workspace.contractStageStatus || {};
  const sellerStatus = contractStatus.sellerAgreement || inputs.sellerAgreementStatus || 'draft';
  const assignmentStatus = contractStatus.assignmentAgreement || inputs.assignmentAgreementStatus || 'locked';
  const titleStatus = contractStatus.titlePacket || inputs.titlePacketStatus || 'waiting';
  const sellerReady = ['ready','exported','seller-signed','title-opened'].includes(sellerStatus);
  const sellerSigned = ['seller-signed','title-opened'].includes(sellerStatus);
  const assignmentUnlocked = sellerSigned;
  const savedCount = asArray(workspace.contractPackets).length;
  const generatedDate = new Date().toISOString().slice(0, 10);
  const printValue = (value, fallback = '__________') => h(String(value || '').trim() || fallback);
  const preparedBy = inputs.preparedBy || inputs.buyerName || 'MarvelUs Intel LLC';
  const printMeta = (type) => `<div class="print-document-meta"><span>${h(type)}</span><b>${printValue(inputs.propertyAddress, 'Property address pending')}</b><em>Parcel ${printValue(inputs.parcelId, 'pending')} · ${printValue(inputs.county, 'county pending')}, ${printValue(inputs.propertyState, 'state')} · Prepared by ${printValue(preparedBy, 'operator pending')} · Generated ${h(generatedDate)}</em></div>`;
  const printFooter = `<footer class="print-legal-footer"><b>Drafting aid only.</b><span>Use for PDF preview and attorney/title review. Do not use for signature until reviewed by licensed counsel for the property state and accepted by the closing/title provider.</span></footer>`;
  const inline = (name, label, className = '') => `<label class="doc-fill ${className}" title="${h(label)}"><span>${h(label)}</span><input name="${h(name)}" value="${h(inputs[name] || '')}" placeholder="${h(label)}"><strong class="print-field-value" data-print-value-for="${h(name)}">${printValue(inputs[name], label)}</strong></label>`;
  const area = (name, label, className = '') => `<label class="doc-fill doc-fill-area ${className}" title="${h(label)}"><span>${h(label)}</span><textarea name="${h(name)}" rows="2" placeholder="${h(label)}">${h(inputs[name] || '')}</textarea><strong class="print-field-value" data-print-value-for="${h(name)}">${printValue(inputs[name], label)}</strong></label>`;
  const carryNames = ['city','county','zip','legalDescription','includedRights','earnestMoneyHolder','taxProration','deedType','underlyingSellerName','earnestMoneyDue','earnestMoneyDeadline','inspectionAcknowledgement','sellerSignature','buyerSignature','assignorSignature','assigneeSignature','feasibilityDeadline','preparedBy'];
  const hiddenCarry = carryNames.map(name => `<input type="hidden" name="${h(name)}" value="${h(inputs[name] || '')}">`).join('') + `<input type="hidden" name="sellerAgreementStatus" value="${h(sellerStatus)}"><input type="hidden" name="assignmentAgreementStatus" value="${h(assignmentStatus)}"><input type="hidden" name="titlePacketStatus" value="${h(titleStatus)}">`;
  const docStepper = (active) => ['Details','Prepare','Preview PDF'].map((label, index) => `<span class="contract-step ${label === active ? 'active' : index < ['Details','Prepare','Preview PDF'].indexOf(active) ? 'complete' : 'locked'}">${index + 1}<b>${h(label)}</b></span>`).join('<i></i>');
  const requiredSellerMissing = ['propertyAddress','sellerName','buyerName','purchasePrice','propertyState'].filter(name => !String(inputs[name] || '').trim());
  const requiredAssignmentMissing = ['assigneeName','assignmentFee','assigneePurchasePrice','titleCompany'].filter(name => !String(inputs[name] || '').trim());
  const titlePacketReady = sellerSigned && assignmentUnlocked && ['buyer-signed','assignment-ready','ready','exported','title-opened'].includes(assignmentStatus);
  const stageCards = [
    { id: 'seller', step: '01', verb: 'Control', title: 'Seller agreement', status: sellerStatus, active: true, detail: requiredSellerMissing.length ? `${requiredSellerMissing.length} fields left before seller PDF.` : 'Seller packet can be signed and controlled.' },
    { id: 'assignment', step: '02', verb: 'Assign', title: 'Assignment agreement', status: assignmentUnlocked ? assignmentStatus : 'seller signature needed', active: assignmentUnlocked, detail: assignmentUnlocked ? (requiredAssignmentMissing.length ? `${requiredAssignmentMissing.length} assignment fields left.` : 'Buyer assignment can be prepared.') : 'Quiet until the seller agreement is signed.' },
    { id: 'title', step: '03', verb: 'Close', title: 'Title packet', status: titlePacketReady ? titleStatus : 'waiting on prerequisites', active: titlePacketReady, detail: titlePacketReady ? 'Bundle is ready for title review.' : 'Secondary until control and assignment are real.' },
  ];
  const statusChip = (value, active) => `<span class="quiet-status-chip ${active ? 'ready' : 'waiting'}">${h(value)}</span>`;
  const pipeline = stageCards.map(card => `<article class="closing-ledger-row ${card.active ? 'active' : 'waiting'}" data-closing-ledger-row="${h(card.id)}"><span class="ledger-step">${h(card.step)}</span><div class="ledger-copy"><b>${h(card.verb)}</b><strong>${h(card.title)}</strong><p>${h(card.detail)}</p></div>${statusChip(card.status, card.active)}</article>`).join('');
  return `<section id="contract-composer" class="contract-composer-panel contract-flow-workspace phase40-closing-packet-ledger" aria-label="Closing legal packet pipeline">
    <div class="contract-flow-hero legal-packet-hero">
      <span class="eyebrow">Legal packet workflow</span>
      <h2>Control. Assign. Close.</h2>
      <p>One packet path. Seller control first, buyer assignment second, title bundle last.</p>
      <div class="contract-flow-actions legal-packet-actions"><button type="button" id="load-selected-contract-deal">Load selected deal</button><a href="#contract-composer" class="text-action" id="save-contract-packet" role="button">Save draft</a><a href="#contract-composer" class="text-action" id="print-contract-packet" data-print-contract-packet="packet" role="button">Preview packet</a></div>
    </div>
    <div class="closing-flow-pipeline closing-timeline-ledger" aria-label="Closing packet timeline ledger">${pipeline}</div>
    <form id="contract-packet-form" class="contract-send-form contract-separated-form">
      ${hiddenCarry}
      <div class="print-packet-cover print-only" aria-hidden="true">
        <span>LandFlip OS</span>
        <h1>Closing Contract Packet</h1>
        <p>Seller agreement, assignment agreement, and title review cover prepared for attorney/title validation before signature.</p>
        <dl><div><dt>Property</dt><dd>${printValue(inputs.propertyAddress, 'Property address pending')}</dd></div><div><dt>Parcel</dt><dd>${printValue(inputs.parcelId, 'pending')}</dd></div><div><dt>State</dt><dd>${printValue(inputs.propertyState, 'pending')}</dd></div><div><dt>Generated</dt><dd>${h(generatedDate)}</dd></div><div><dt>Prepared by</dt><dd>${printValue(preparedBy, 'operator pending')}</dd></div></dl>
      </div>
      <details id="seller-agreement-experience" class="contract-document-experience contract-disclosure-experience seller-experience" aria-label="Seller Agreement fill experience">
        <summary class="contract-disclosure-summary"><div class="contract-backline"><span aria-hidden="true">01</span><b>Seller Agreement</b><em title="Asterisk marks missing fields.">Step 1 - Control · ${requiredSellerMissing.length ? `${requiredSellerMissing.length} * left` : 'ready for seller PDF'}</em></div>${badge(sellerStatus, 'good')}<small class="disclosure-news-icon" title="Open document">${solidIndustryIcon('disclosure')}</small></summary>
        <div class="contract-stepper" aria-label="Seller agreement progress">${docStepper('Prepare')}</div>
        <div class="contract-review-strip"><span>Review & Fill Seller Agreement Fields</span><a href="#seller-agreement-experience">Land Sale Agreement</a></div>
        <div class="contract-document-shell">
          <div class="contract-document-head"><div><span>‹</span><b>${h(inputs.propertyAddress || 'Selected land deal')} - Land Sale Agreement</b><em title="Asterisk marks missing seller fields.">${requiredSellerMissing.length ? `${requiredSellerMissing.length} * left` : 'ready for seller PDF'}</em></div><button type="button" class="secondary" data-contract-status="seller-ready">Mark ready</button></div>
          <label class="recipient-select"><span class="recipient-dot"></span><select name="sellerRecipient"><option>${h(inputs.sellerName || 'Seller')}</option><option>${h(inputs.buyerName || 'Buyer / Assignor')}</option><option>Title / attorney review</option></select></label>
          <div class="contract-stage">
            <aside class="contract-page-rail" aria-label="Seller agreement pages"><button type="button" class="active">Seller<br>01</button><button type="button">Terms<br>02</button><button type="button">Sign<br>03</button></aside>
            <div class="contract-doc-scroll">
              <article class="contract-paper printable-paper seller-paper" data-print-doc="seller" aria-label="Fillable seller Land Sale Agreement">
                ${printMeta('Seller agreement')}
                <h3>Land Sale Agreement</h3>
                <p class="doc-line">This Contract dated ${inline('effectiveDate', 'MM/dd/yyyy', 'date-field')} in which Buyer: ${inline('buyerName', 'Buyer name', 'long-field')} and/or assigns, offers to purchase from Seller(s): ${inline('sellerName', 'Seller name', 'medium-field')} the following described vacant land, together with all appurtenant rights, located at:</p>
                ${inline('propertyAddress', 'Property address', 'address-field')}
                <p class="doc-line">County/state: ${inline('county', 'County', 'medium-field')} ${inline('propertyState', 'State', 'state-field')} · Parcel/PIN: ${inline('parcelId', 'Parcel ID', 'medium-field')}.</p>
                <p class="doc-kicker">Seller agrees:</p>
                <ol class="contract-clauses">
                  <li>The purchase price is $ ${inline('purchasePrice', 'Purchase price', 'money-field')} paid to seller at closing.</li>
                  <li>Property is sold in <b>AS IS</b> condition subject to buyer feasibility, title, survey, access, utilities and buildability review.</li>
                  <li>Buyer will open closing with ${inline('closingAgent', 'Closing agent', 'medium-field')} and deposit earnest money of $ ${inline('earnestMoney', 'Earnest money', 'money-field')} as approved by title/attorney.</li>
                  <li>Closing will occur on or before ${inline('closingDate', 'Closing date', 'date-field')} and closing costs will be paid by ${inline('closingCostsPayer', 'Closing costs payer', 'medium-field')}.</li>
                  <li>Assignability: ${inline('assignability', 'Assignability language', 'wide-inline')}.</li>
                </ol>
                ${area('additionalTerms', 'Additional seller terms / attorney edits', 'full-line')}
                <div class="signature-grid apple-signature-grid"><span><b>Seller signature</b><em>Date</em></span><span><b>Buyer / Assignor signature</b><em>Date</em></span></div>
                ${printFooter}
              </article>
            </div>
            <aside class="thumbnail-tab"><span>▣</span><b>Seller PDF</b></aside>
          </div>
          <div class="contract-fill-toolbar" aria-label="Seller field tools"><button type="button">Text</button><button type="button">Initial</button><button type="button">Signature</button><button type="button">Date</button><button type="button">Checkbox</button></div>
        </div>
        <div class="contract-send-footer"><span title="Asterisk marks missing seller gates.">Seller flow · ${requiredSellerMissing.length ? `${requiredSellerMissing.length} * left` : 'ready to export as PDF'}</span><div><button type="button" data-contract-status="seller-signed">Mark seller signed</button><button type="button" data-print-contract-packet="seller" class="secondary">Print seller only</button><button type="button" id="export-seller-contract" class="secondary">Export seller packet</button></div><strong id="contract-packet-status">${h(savedCount)} saved packet(s) · ${h(packet.status)}</strong></div>
      </details>

      <details id="assignment-agreement-experience" class="contract-document-experience contract-disclosure-experience assignment-experience ${assignmentUnlocked ? '' : 'locked-experience'}" aria-label="Assignment Agreement fill experience">
        <summary class="contract-disclosure-summary"><div class="contract-backline"><span aria-hidden="true">02</span><b>Assignment Agreement</b><em title="Asterisk marks missing buyer fields.">Step 2 - Assign · ${assignmentUnlocked ? (requiredAssignmentMissing.length ? `${requiredAssignmentMissing.length} * left` : 'ready for buyer PDF') : 'locked until seller signed'}</em></div>${badge(assignmentUnlocked ? assignmentStatus : 'locked', assignmentUnlocked ? 'good' : 'warn')}<small class="disclosure-news-icon" title="Open document">${solidIndustryIcon('disclosure')}</small></summary>
        ${assignmentUnlocked ? `<div class="contract-stepper" aria-label="Assignment agreement progress">${docStepper('Prepare')}</div>` : '<div class="assignment-lock-banner"><b>Assignment unlocks after seller agreement is marked signed.</b><p>Do not prepare buyer assignment paperwork before the deal is under seller control and title/closing can review assignment handling.</p></div>'}
        <div class="contract-review-strip"><span>Review & Fill Assignment Fields</span><a href="#assignment-agreement-experience">Assignment of Vacant Land Purchase Agreement</a></div>
        <div class="contract-document-shell">
          <div class="contract-document-head"><div><span>‹</span><b>${h(inputs.propertyAddress || 'Selected land deal')} - Assignment Agreement</b><em title="Asterisk marks missing buyer fields.">${assignmentUnlocked ? (requiredAssignmentMissing.length ? `${requiredAssignmentMissing.length} * left` : 'ready for buyer PDF') : 'locked until seller signed'}</em></div><button type="button" class="secondary" data-contract-status="assignment-ready" ${assignmentUnlocked ? '' : 'disabled'}>Mark ready</button></div>
          <label class="recipient-select"><span class="recipient-dot"></span><select name="assignmentRecipient" ${assignmentUnlocked ? '' : 'disabled'}><option>${h(inputs.assigneeName || 'Builder / Assignee')}</option><option>${h(inputs.assignorName || 'Assignor')}</option><option>Title / settlement desk</option></select></label>
          <div class="contract-stage">
            <aside class="contract-page-rail" aria-label="Assignment agreement pages"><button type="button" class="active">Assign<br>01</button><button type="button">Fee<br>02</button><button type="button">Sign<br>03</button></aside>
            <div class="contract-doc-scroll">
              <article class="contract-paper printable-paper buyer-paper" data-print-doc="assignment" aria-label="Fillable Assignment of Vacant Land Purchase Agreement">
                ${printMeta('Assignment agreement')}
                <h3>Assignment of Vacant Land Purchase Agreement</h3>
                <p class="doc-line">Assignor ${inline('assignorName', 'Assignor', 'medium-field')} assigns the buyer position under the seller agreement to Assignee ${inline('assigneeName', 'Builder / assignee', 'medium-field')} for parcel ${inline('parcelId', 'Parcel ID', 'medium-field')} in ${inline('propertyState', 'State', 'state-field')}.</p>
                <ol class="contract-clauses">
                  <li>Underlying seller: ${inline('underlyingSellerName', 'Underlying seller', 'medium-field')}.</li>
                  <li>Original seller contract price: $ ${inline('originalPurchasePrice', 'Original price', 'money-field')}.</li>
                  <li>Assignment fee: $ ${inline('assignmentFee', 'Assignment fee', 'money-field')} payable only through the closing statement unless counsel/title approves otherwise.</li>
                  <li>Assignee total purchase price: $ ${inline('assigneePurchasePrice', 'Assignee price', 'money-field')}.</li>
                  <li>Title company: ${inline('titleCompany', 'Title company', 'long-field')}.</li>
                  <li>Settlement statement rule: ${inline('settlementStatementApproval', 'Settlement rule', 'wide-inline')}.</li>
                </ol>
                <div class="attorney-gate-inline">${inline('attorneyReviewer', 'Attorney reviewer', 'medium-field')}${inline('attorneyReviewDate', 'Review date', 'date-field')}</div>
                <div class="signature-grid apple-signature-grid"><span><b>Assignor signature</b><em>Date</em></span><span><b>Assignee signature</b><em>Date</em></span></div>
                ${printFooter}
              </article>
            </div>
            <aside class="thumbnail-tab"><span>▣</span><b>Buyer PDF</b></aside>
          </div>
          <div class="contract-fill-toolbar" aria-label="Assignment field tools"><button type="button">Text</button><button type="button">Initial</button><button type="button">Signature</button><button type="button">Date</button><button type="button">Attach</button></div>
        </div>
        <div class="contract-send-footer"><span title="Asterisk marks missing buyer gates.">Assignment flow · ${assignmentUnlocked ? (requiredAssignmentMissing.length ? `${requiredAssignmentMissing.length} * left` : 'ready to export as PDF') : 'locked until seller signed'}</span><div><button type="button" data-contract-status="buyer-signed" ${assignmentUnlocked ? '' : 'disabled'}>Mark buyer signed</button><button type="button" data-print-contract-packet="assignment" class="secondary" ${assignmentUnlocked ? '' : 'disabled'}>Print assignment</button><button type="button" id="export-assignment-contract" class="secondary" ${assignmentUnlocked ? '' : 'disabled'}>Export assignment</button></div></div>
      </details>

      <section id="title-packet-experience" class="title-packet-experience ${titlePacketReady ? 'ready' : 'secondary'}" aria-label="Title packet export experience">
        <div><span class="eyebrow">03 Close</span><h3>Title packet bundle</h3><p>${titlePacketReady ? 'Seller control and buyer assignment are in place. Send one clean bundle to title.' : 'Secondary until seller control and buyer assignment are complete.'}</p></div>
        <div class="title-packet-actions"><button type="button" id="export-contract-packet" ${titlePacketReady ? '' : 'disabled'}>Export title packet</button><button type="button" data-print-contract-packet="title" class="text-action" ${titlePacketReady ? '' : 'disabled'}>Preview</button><button type="button" data-contract-status="title-opened" class="text-action" ${titlePacketReady ? '' : 'disabled'}>Mark opened</button></div>
      </section>
      <article class="contract-paper printable-paper title-review-paper print-only" data-print-doc="title-review" aria-hidden="true">
        ${printMeta('Attorney and title review')}
        <h3>Attorney And Title Review Letter</h3>
        <p>Please review the attached seller agreement and assignment agreement before any signature. Confirm state-specific wording, assignability, feasibility/title contingencies, earnest money timing, required addenda, closing/title instructions, and settlement statement treatment of the assignment fee.</p>
        <p><b>Title company:</b> ${printValue(inputs.titleCompany, 'title company pending')}</p>
        <p><b>Attorney reviewer:</b> ${printValue(inputs.attorneyReviewer, 'reviewer pending')} · <b>Review date:</b> ${printValue(inputs.attorneyReviewDate, 'date pending')}</p>
        <p><b>Prepared by:</b> ${printValue(preparedBy, 'operator pending')}</p>
        ${printFooter}
      </article>
    </form>
  </section>`;
}

function renderClosingDeskResearchDeck() {
  const process = titleCompanyProcess || {};
  const insights = asArray(process.closingDeskInsights || process.closingDeskInsights).slice(0, 5);
  const rules = asArray(process.operatorRules).slice(0, 4);
  const template = process.templates?.titlePacketEmail || {};
  const sellerChecklist = asArray(process.templates?.sellerPurchaseAgreementChecklist).slice(0, 6);
  const assignmentChecklist = asArray(process.templates?.buyerAssignmentAgreementChecklist).slice(0, 6);
  const markets = titleCompanyCandidateMarkets();
  const marketRows = markets.map(market => {
    const candidates = asArray(market.candidates).slice(0, 3);
    return `<article class="title-market-card">
      <div><span>${h(market.state)} · Priority ${h(market.priority)}</span><strong>${h(market.market)}</strong></div>
      <div class="candidate-stack">${candidates.map(candidate => `<a href="${h(candidate.url)}" target="_blank" rel="noopener noreferrer"><b>${h(candidate.name)}</b><small>${h(candidate.assignmentFriendly || 'unknown')} assignment status · ${h(asArray(candidate.serviceSignals).slice(0, 3).join(' / '))}</small></a>`).join('')}</div>
    </article>`;
  }).join('');
  return `<details class="closing-intelligence-deck closing-os-disclosure" aria-label="Closing desk operating system">
    <summary><span class="eyebrow">Operating system</span><b>Contracts, title, escrow, HUD</b><em>Reference notes</em></summary>
    <div class="closing-intel-hero">
      <span class="eyebrow">Closing desk operating system</span>
      <h2>Contracts, title, escrow, HUD. Paid cleanly.</h2>
      <p>Reference layer only. The active workflow stays above: control, assign, close.</p>
      <div class="badge-stack">${badge('closing model ready', 'good')}${badge('public title candidates', 'neutral')}${badge('assignment status must be verified', 'warn')}</div>
    </div>
    <div class="closing-intel-grid">
      <article class="closing-card operating-insight-card">
        <div class="card-kicker"><span>Operating insight</span><b>${h(process.source?.name || 'Closing Desk model')}</b></div>
        <ul>${insights.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
      <article class="closing-card closing-rule-card">
        <div class="card-kicker"><span>Non-negotiables</span><b>operator rules</b></div>
        <ul>${rules.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
    </div>
    <div class="contract-template-grid">
      <article class="closing-card contract-template-card">
        <div class="card-kicker"><span>Seller contract template</span><b>checklist</b></div>
        <h3>Vacant-land purchase agreement</h3>
        <p>Use a state-specific attorney/title-reviewed form. The app should track readiness, not generate fake legal documents.</p>
        <ul>${sellerChecklist.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
      <article class="closing-card contract-template-card">
        <div class="card-kicker"><span>Buyer contract template</span><b>assignment</b></div>
        <h3>Assignment / assignee agreement</h3>
        <p>Use when the builder takes over the buyer position. If title rejects assignment mechanics, escalate to double close/legal review.</p>
        <ul>${assignmentChecklist.map(item => `<li>${h(item)}</li>`).join('')}</ul>
      </article>
      <article class="closing-card closing-email-template-card">
        <div class="card-kicker"><span>Title packet email</span><b>copy framework</b></div>
        <h3>${h(template.subject || 'Assignment closing packet')}</h3>
        <pre>${h(template.body || 'Loading title packet email template…')}</pre>
        <button type="button" class="secondary copy-research-title-email" data-copy-research-title-email>Copy template framework</button><span class="research-closing-email-status"></span>
      </article>
    </div>
    <article class="closing-card closing-company-candidate-board">
      <div class="card-kicker"><span>Real title-company candidates</span><b>${h(markets.length)} markets</b></div>
      <h3>Start here, then verify assignments by call.</h3>
      <p>These are public web candidates in the priority geography. Public title/escrow service pages prove relevance, not assignment-friendliness.</p>
      <div class="title-market-grid">${marketRows || '<p>Title-company market candidates loading...</p>'}</div>
    </article>
  </details>`;
}

function renderTitleClosingDesk(parcel, buyer, options = {}) {
  const desk = buildTitleCompanyClosingDesk(parcel, buyer);
  const tone = statusTone(desk.status);
  const done = desk.items.filter(item => item.status === 'clear').length;
  const hudItems = [
    ['Seller cash', desk.math.sellerPrice, 'Promised net to owner'],
    ['Buyer cash', desk.math.buyerPrice, 'Builder/end-buyer wire amount'],
    ['Assignment fee', desk.math.assignmentFee, 'Operator spread line on HUD'],
    ['Closing costs est.', desk.math.closingCostsEstimate, `${desk.math.closingCostsPayer} pays`],
  ];
  const emailPreview = `${desk.email.subject}\n\n${desk.email.body}`;
  return `<section class="closing-desk ${options.compact ? 'compact-title-desk' : ''}" aria-label="Title company closing desk">
    <div class="closing-hero">
      <div class="closing-hero-copy">
        <span class="eyebrow">Title company closing desk</span>
        <h2>Neutral escrow. Clean title. Assignment fee protected.</h2>
        <p>The seller and buyer do not freestyle money movement. The title company holds escrow, clears title/taxes/liens, verifies notarized docs, and pays seller + assignor from the settlement statement.</p>
        <div class="badge-stack">${badge(desk.label, tone)}${badge(`${desk.readiness}% ready`, tone)}${badge(`${done}/${desk.items.length} gates clear`, tone)}</div>
      </div>
      <aside class="closing-command-card">
        <span>Next title action</span>
        <strong>${h(desk.nextAction)}</strong>
        <p>${h(desk.titleCompany.name || 'No title company selected yet. Search assignment friendly title companies near the property.')}</p>
      </aside>
    </div>

    <div class="closing-metric-strip">
      ${hudItems.map(([label, value, detail]) => `<article><span>${h(label)}</span><b>${formatMoney(value)}</b><em>${h(detail)}</em></article>`).join('')}
    </div>

    <div class="closing-desk-grid">
      <article class="closing-card checklist-card">
        <div class="card-kicker"><span>Packet gate</span><b>${h(desk.status)}</b></div>
        <div class="closing-checklist">
          ${desk.items.map(item => `<div class="closing-check ${h(item.status)}"><span>${item.status === 'clear' ? '✓' : item.status === 'review' ? '!' : '-'}</span><div><b>${h(item.label)}</b><p>${h(item.detail)}</p></div></div>`).join('')}
        </div>
      </article>
      <article class="closing-card timeline-card">
        <div class="card-kicker"><span>14-day close path</span><b>virtual-ready</b></div>
        <div class="closing-timeline">
          ${desk.timeline.map(step => `<div class="timeline-node"><span>${h(step.day)}</span><b>${h(step.label)}</b><p>${h(step.detail)}</p></div>`).join('')}
        </div>
      </article>
    </div>

    <div class="closing-desk-grid lower">
      <article class="closing-card email-card">
        <div class="card-kicker"><span>Title packet email</span><b>copy-ready</b></div>
        <div class="email-subject"><span>Subject</span><strong>${h(desk.email.subject)}</strong></div>
        <pre>${h(emailPreview)}</pre>
        <div class="button-row"><button type="button" class="secondary copy-title-email" data-copy-title-email>Copy title email</button><span class="closing-email-status"></span></div>
      </article>
      <article class="closing-card closing-principles-card">
        <div class="card-kicker"><span>Seller explanation</span><b>trust script</b></div>
        <blockquote>“The title company is the neutral closing company. They hold the buyer’s money in escrow, verify the paperwork, make sure title transfers legally, and then pay you at closing.”</blockquote>
        <ul>
          <li>Buyer wires title, not seller or assignor directly.</li>
          <li>HUD must show seller cash, buyer cash, closing costs, and assignment fee correctly.</li>
          <li>Wire instructions stay sensitive: secure channel + verbal verification.</li>
          <li>Closed means funded. Funds are disbursed. Signatures alone are not enough.</li>
        </ul>
      </article>
    </div>
  </section>`;
}


function getPermitBuilders() {
  const generated = buildPermitVerifiedBuilders(workspace.permitRecords?.length ? workspace.permitRecords : seedPermitRecords, { minimumPermits: 3 });
  const saved = new Map(asArray(workspace.permitBuilders).map(builder => [builder.builderId, builder]));
  return generated.map(builder => ({ ...builder, ...(saved.get(builder.builderId) || {}) }));
}

function sourceJurisdictionForPermit(permit = {}, source = {}) {
  return permit.city || permit.jurisdiction || permit.sourceReport || source.marketName || source.state || 'official permit source';
}

function normalizePermitEvidence(permit = {}, source = {}) {
  return {
    ...permit,
    permitNumber: permit.permitNumber || permit.recordId || permit.id || 'permit pending',
    permitStatus: permit.permitStatus || permit.status || 'issued',
    permitType: permit.permitType || permit.recordType || permit.workClass || 'Residential permit',
    siteAddress: permit.siteAddress || permit.address || permit.parcelNumber || 'address pending',
    issueDate: permit.issueDate || permit.issuedAt || permit.date || '',
    jurisdiction: sourceJurisdictionForPermit(permit, source),
    licenseNumber: permit.licenseNumber || permit.contractorLicense || permit.contractorName || '',
    sourceUrl: permit.sourceUrl || source.evidenceUrl || source.signalsUrl || '',
  };
}

function permitVerificationUrl(permit = {}) {
  const sourceUrl = permit.sourceUrl || '';
  const permitNumber = permit.permitNumber || permit.topPermit || permit.id || '';
  if (!sourceUrl || !permitNumber) return sourceUrl;
  if (/arcgis\/rest\/services\/.+\/FeatureServer\/\d+/i.test(sourceUrl)) {
    const [layerUrl] = sourceUrl.split('?');
    const params = new URLSearchParams({
      f: 'json',
      where: `PERMITNUMBER = '${String(permitNumber).replace(/'/g, "''")}'`,
      outFields: 'PERMITNUMBER,ADDRESS,DATEISSUED,CONTRACTOR,PARCELID,PERMITVALUE,PERMITTYPE',
      returnGeometry: 'false',
    });
    return `${layerUrl.replace(/\/$/, '')}/query?${params.toString()}`;
  }
  return sourceUrl;
}

function permitVerificationLink(permit = {}) {
  const url = permitVerificationUrl(permit);
  return url ? safeLink(url, 'Verify permit', 'proof-inline-link verify-permit-link') : '';
}

function normalizeBuilderSignal(row = {}, source = {}) {
  const permits = asArray(row.recentPermits).map(permit => normalizePermitEvidence(permit, source));
  const sourceJurisdictions = [...new Set(permits.map(permit => permit.jurisdiction).filter(Boolean))].slice(0, 3);
  const recentBuilds = Number(row.recentBuilds || permits.length || 0);
  const phone = row.phone || row.contactPhone || permits.find(permit => permit.contractorPhone)?.contractorPhone || '';
  const email = row.email || row.contactEmail || permits.find(permit => permit.contractorEmail)?.contractorEmail || '';
  const builderLabel = row.name || row.companyName || row.builderName || row.contractorName || '';
  const sourceUrl = row.sourceUrl || asArray(row.sourceUrls)[0] || permits.find(permit => permit.sourceUrl)?.sourceUrl || source.evidenceUrl || source.signalsUrl || '';
  const marketLabel = source.marketName || row.market || source.state || 'Permit market';
  const normalized = {
    ...row,
    builderId: row.builderId || row.id || `${source.key || 'builder'}-${slugify(builderLabel || 'unknown')}`,
    companyName: row.companyName || row.name || row.builderName || row.contractorName || 'Unnamed builder',
    name: builderLabel || 'Unnamed builder',
    marketName: marketLabel,
    state: row.state || source.state || '',
    phone,
    email,
    recentBuilds,
    qualifyingPermitCount: Number(row.qualifyingPermitCount || recentBuilds || permits.length || 0),
    recentPermits: permits,
    sourceJurisdictions,
    sourceUrl,
    sourceType: row.sourceType || source.marketName || 'Official permit source',
    topPermit: row.topPermit || permits[0]?.permitNumber || '',
    confidence: row.confidence ?? (permits.length ? 100 : 80),
    activityTier: row.activityTier || (recentBuilds >= 10 ? 'high velocity' : recentBuilds >= 3 ? 'active' : 'verified'),
    buyBoxStatus: row.buyBoxStatus || 'needs call',
    callable: row.callable ?? Boolean(phone || email),
    route: row.route || (phone || email ? 'buyerValidation' : 'humanReview'),
    contactStatus: row.contactStatus || (phone || email ? 'public contact loaded' : 'public contact unresolved'),
    sourceEvidence: row.sourceEvidence || row.publicSource || `${marketLabel} official permit-backed builder signal.`,
    demandSignal: row.demandSignal || `${recentBuilds} recent permit-backed build signals in ${marketLabel}.`,
    buyBoxCapture: row.buyBoxCapture || {
      geography: `Which ${marketLabel} submarkets, zip codes, subdivisions, or jurisdictions are you actively buying lots in?`,
      lotSize: 'What lot-size band, frontage, slope, utilities, road access, and finished-product constraints matter?',
      maxPrice: 'What is the maximum lot acquisition price before the deal no longer works?',
      closeSpeed: 'How fast can you close and how many lots can you absorb per month?',
      packageRecipient: 'Who should receive parcel packages and what exact fields must be included?',
      dealKillers: 'What instantly kills a lot for you: flood, slope, wetlands, no sewer, title, access, HOA, impact fees?',
    },
    buyBox: typeof row.buyBox === 'object' ? row.buyBox : {
      geography: '',
      lotSize: '',
      maxPrice: row.maxPrice || '',
      closeSpeed: row.closeSpeedDays || '',
      packageRecipient: '',
      utilitiesAccess: '',
      productType: '',
      dealKillers: [],
      zipCodes: [],
      lotSizeRange: '',
      closeSpeedDays: row.closeSpeedDays || '',
      submissionMethod: '',
    },
  };
  return {
    ...normalized,
    emailDraft: generateBuilderEmail(normalized),
  };
}

function getLoadedBuilderMarkets() {
  const markets = Object.fromEntries(Object.entries(builderMarketData.markets || {}).map(([key, data]) => {
    const source = builderMarketSourceByKey.get(key) || {};
    return [key, {
      ...source,
      ...data,
      rows: asArray(Array.isArray(data) ? data : data.rows).map(row => normalizeBuilderSignal(row, source)),
    }];
  }));
  if (knoxvilleBuyerCallSheet?.rows?.length) {
    delete markets.knoxville;
    const source = builderMarketSourceByKey.get('knoxville') || {};
    markets.knoxvilleCallSheet = {
      ...source,
      key: 'knoxvilleCallSheet',
      state: 'TN',
      marketName: 'Knoxville / Knox County, TN',
      csvUrl: 'data/real/knoxville/buyer_call_sheet.csv',
      evidence: knoxvilleBuyerCallSheet,
      rows: asArray(knoxvilleBuyerCallSheet.rows).map(row => normalizeBuilderSignal({ ...row, id: row.builderId || row.id, name: row.name || row.companyName }, source)),
    };
  }
  return markets;
}

function loadedBuilderMarketKey(market = {}) {
  if (market.key && builderMarketSourceByKey.has(market.key)) return market.key;
  if (market.key === 'knoxvilleCallSheet') return 'knoxville';
  const match = [...builderMarketSourceByKey.entries()].find(([, source]) => source.marketName === market.marketName || (source.state === market.state && source.signalsUrl === market.signalsUrl));
  return match?.[0] || market.key || '';
}

function rowsForBuilderMarketKey(marketKey) {
  return Object.values(getLoadedBuilderMarkets())
    .filter(market => loadedBuilderMarketKey(market) === marketKey)
    .flatMap(market => asArray(market.rows).map(row => ({ ...row, marketKey, marketName: market.marketName, csvUrl: market.csvUrl })))
    .sort((a, b) => Number(b.recentBuilds || 0) - Number(a.recentBuilds || 0));
}

function getBuilderMarketEntriesForState(stateCode) {
  const markets = getLoadedBuilderMarkets();
  return Object.values(markets).filter(market => market.state === stateCode && asArray(market.rows).length);
}

function getStateBuilderRows(stateCode) {
  return getBuilderMarketEntriesForState(stateCode)
    .flatMap(market => {
      const marketKey = loadedBuilderMarketKey(market);
      return asArray(market.rows).map(row => ({ ...row, marketKey, marketName: market.marketName, csvUrl: market.csvUrl }));
    })
    .sort((a, b) => Number(b.recentBuilds || 0) - Number(a.recentBuilds || 0));
}

function getActiveValidationRows() {
  return selectedBuilderMarketKey ? rowsForBuilderMarketKey(selectedBuilderMarketKey) : getStateBuilderRows(selectedBuilderMarketState);
}

function findLoadedBuilderRow(builderId) {
  return Object.values(getLoadedBuilderMarkets())
    .flatMap(market => asArray(market.rows).map(row => ({ ...row, marketKey: market.key, marketName: market.marketName, csvUrl: market.csvUrl })))
    .find(row => row.builderId === builderId) || {};
}

function getStateBuilderSummary(stateCode) {
  const entries = getBuilderMarketEntriesForState(stateCode);
  const rows = getStateBuilderRows(stateCode);
  const totalRecentBuildSignals = rows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0);
  const callable = rows.filter(row => row.phone || row.email).length;
  const minimums = entries.map(entry => Number(entry.evidence?.summary?.minimumUniqueBuilders || entry.evidence?.minimumUniqueBuilders || 20)).filter(Boolean);
  return {
    entries,
    rows,
    uniqueBuilders: rows.length,
    totalRecentBuildSignals,
    callable,
    minimumUniqueBuilders: minimums.length ? Math.min(...minimums) : 20,
  };
}

function marketSummaryForRows(rows = [], minimumUniqueBuilders = 20) {
  const totalRecentBuildSignals = rows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0);
  return {
    entries: [],
    rows,
    uniqueBuilders: rows.length,
    totalRecentBuildSignals,
    callable: rows.filter(row => row.phone || row.email).length,
    minimumUniqueBuilders,
  };
}

function builderMarketSwitchboardEntries(permitLandscape = getPermitPortalLandscape()) {
  if (cachedBuilderSwitchboardEntries) return cachedBuilderSwitchboardEntries;
  const loaded = getLoadedBuilderMarkets();
  const liveByKey = new Map(Object.values(loaded).map(market => [loadedBuilderMarketKey(market), market]));
  const expansionStateCodes = new Set(['OH', 'ID', 'IN', 'PA', 'GA', 'SC']);
  const orderedRegistry = [
    ...builderMarketRegistry.filter(registry => expansionStateCodes.has(registry.state)),
    ...builderMarketRegistry.filter(registry => !expansionStateCodes.has(registry.state)),
  ];
  cachedBuilderSwitchboardEntries = orderedRegistry.map(registry => {
    const live = liveByKey.get(registry.key) || {};
    const rows = rowsForBuilderMarketKey(registry.key);
    const stateMeta = asArray(permitLandscape.states).find(item => item.id === String(registry.state || '').toLowerCase()) || {};
    const landscapeMarket = asArray(permitLandscape.leadingMarkets).find(item => item.state === registry.state && String(item.market || '').toLowerCase().includes(String(registry.label || '').split('/')[0].trim().toLowerCase())) || null;
    const minimumUniqueBuilders = Number(live.evidence?.summary?.minimumUniqueBuilders || live.evidence?.minimumUniqueBuilders || 20);
    const status = rows.length >= minimumUniqueBuilders ? 'live' : rows.length > 0 ? 'thin' : 'needs-work';
    const isActive = registry.key === selectedBuilderMarketKey;
    return {
      ...registry,
      stateCode: registry.state,
      key: registry.key,
      label: registry.label,
      marketLabel: live.marketName || registry.label,
      stateMeta,
      landscapeMarket,
      rows,
      summary: marketSummaryForRows(rows, minimumUniqueBuilders),
      builderCount: rows.length,
      contactLedger: builderContactLedgerForRows(rows),
      minimumUniqueBuilders,
      status,
      isLive: rows.length >= minimumUniqueBuilders,
      isThin: rows.length > 0 && rows.length < minimumUniqueBuilders,
      isActive,
      sequence: stateMeta.sequence || {},
      markets: landscapeMarket ? [landscapeMarket] : [],
      statusCopy: rows.length >= minimumUniqueBuilders ? `${rows.length} live builders` : rows.length > 0 ? `${rows.length}/${minimumUniqueBuilders} builders · needs more work` : '0 builders · needs source work',
    };
  });
  return cachedBuilderSwitchboardEntries;
}


const builderStateTheses = {
  GA: { label: 'Georgia', thesis: 'Atlanta growth lanes', short: 'Atlanta growth', detail: 'Atlanta data-center commuter lane', note: 'Forsyth / Hall / Jackson / Douglas stay grouped as one source thesis until builders are verified.' },
  SC: { label: 'South Carolina', thesis: 'Charleston + Upstate expansion', short: 'Charleston + Upstate', detail: 'Charleston coastal edge + Upstate growth', note: 'Dorchester carries live builder demand; Berkeley and Greenville remain supporting source lanes.' },
  TN: { label: 'Tennessee', thesis: 'Knoxville core lane', short: 'Knoxville core', detail: 'Core Tennessee builder-demand lane', note: 'Keep this as the proven operating lane while expansion lanes mature.' },
  FL: { label: 'Florida', thesis: 'Inland growth lane', short: 'Inland growth', detail: 'Inland permit-growth lane', note: 'Use this when buyer demand and permit proof justify seller sourcing.' },
  AZ: { label: 'Arizona', thesis: 'Phoenix edge lane', short: 'Phoenix edge', detail: 'Phoenix / Maricopa edge growth', note: 'Treat as a state-level lane; county detail belongs in source proof, not the top selector.' },
  NC: { label: 'North Carolina', thesis: 'Raleigh / Wake lane', short: 'Raleigh / Wake', detail: 'Triangle permit-growth lane', note: 'Keep county/source depth behind the selected state workbench.' },
  TX: { label: 'Texas', thesis: 'Austin + San Antonio lanes', short: 'Austin + San Antonio', detail: 'Central / south Texas growth lanes', note: 'Austin and San Antonio stay under one Texas decision until a specific buyer call requires splitting.' },
  PA: { label: 'Pennsylvania', thesis: 'Philadelphia + Pittsburgh permit lanes', short: 'Philly + Pittsburgh live', detail: 'Philadelphia L&I plus Pittsburgh permit-builder lanes', note: 'Philadelphia adds a deep permit-backed builder list; Pittsburgh remains a supporting western PA lane.' },
  OH: { label: 'Ohio', thesis: 'Columbus permit lane', short: 'Columbus live', detail: 'Columbus public ArcGIS permit lane', note: 'Columbus now carries source-backed permit applicants; call-confirm buy boxes before seller sourcing.' },
  ID: { label: 'Idaho', thesis: 'Boise / Treasure Valley builder lane', short: 'Boise directory live', detail: 'Boise public-builder candidate lane', note: 'Boise now carries BCA SW Idaho public-builder directory rows; contractor-bearing permit proof is the next enrichment layer.' },
  IN: { label: 'Indiana', thesis: 'Evansville official-permit lane', short: 'Evansville live', detail: 'Evansville / Vanderburgh official ArcGIS permit lane', note: 'Evansville now carries public permit-backed contractor principals; company DBA/contact enrichment comes before outreach.' },
};

function builderStateSummaryEntries(marketEntries = builderMarketSwitchboardEntries(), permitLandscape = getPermitPortalLandscape()) {
  const order = ['OH', 'ID', 'IN', 'PA', 'GA', 'SC', 'TN', 'FL', 'AZ', 'NC', 'TX'];
  return order.map(stateCode => {
    const markets = marketEntries.filter(market => market.stateCode === stateCode || market.state === stateCode);
    if (!markets.length) return null;
    const rows = markets.flatMap(market => asArray(market.rows));
    const stateMeta = asArray(permitLandscape.states).find(item => item.id === String(stateCode).toLowerCase()) || markets[0]?.stateMeta || {};
    const minimumUniqueBuilders = markets.reduce((sum, market) => sum + Number(market.minimumUniqueBuilders || 20), 0) || 20;
    const builderCount = rows.length;
    const callable = rows.filter(row => row.phone || row.email).length;
    const totalRecentBuildSignals = rows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0);
    const liveMarketCount = markets.filter(market => market.isLive).length;
    const thinMarketCount = markets.filter(market => market.isThin).length;
    const status = liveMarketCount ? 'live' : thinMarketCount ? 'thin' : 'needs-work';
    const thesis = builderStateTheses[stateCode] || { label: stateCode, thesis: `${stateCode} market lane`, short: `${stateCode} lane`, detail: `${stateCode} source lane`, note: 'State-level market lane.' };
    const summary = {
      entries: markets.flatMap(market => asArray(market.summary?.entries)),
      rows,
      uniqueBuilders: builderCount,
      totalRecentBuildSignals,
      callable,
      minimumUniqueBuilders,
    };
    return {
      ...thesis,
      key: `state-${String(stateCode).toLowerCase()}`,
      stateCode,
      state: stateCode,
      label: thesis.label,
      marketLabel: thesis.thesis,
      rows,
      markets,
      stateMeta,
      summary,
      builderCount,
      callable,
      totalRecentBuildSignals,
      minimumUniqueBuilders,
      countyCount: markets.length,
      liveMarketCount,
      thinMarketCount,
      isLive: liveMarketCount > 0,
      isThin: liveMarketCount === 0 && thinMarketCount > 0,
      status,
      sequence: stateMeta.sequence || {},
      isActive: selectedBuilderMarketState === stateCode,
      statusCopy: builderCount ? `${builderCount} live builders` : 'source work needed',
      countyCopy: markets.map(market => market.label).join(' · '),
    };
  }).filter(Boolean);
}

function renderBuilderCountyLedger(activeState = {}) {
  const rows = asArray(activeState.markets).map(market => `<li role="button" tabindex="0" class="state-county-row market-status-${h(market.status)} ${market.key === selectedBuilderMarketKey ? 'active is-active' : ''}" data-builder-market-key="${h(market.key)}" aria-pressed="${market.key === selectedBuilderMarketKey ? 'true' : 'false'}">
    <span><b>${h(market.label)}</b><small>${h(market.note || 'source lane')}</small></span>
    <em>${h(market.statusCopy)}</em>
  </li>`).join('');
  return `<details class="state-county-ledger">
    <summary><span>Counties included</span><b>${h(activeState.countyCount || 0)} lanes</b></summary>
    <ul>${rows}</ul>
  </details>`;
}

function builderContactLedgerForRows(rows = []) {
  const center = buildBuyerValidationCommandCenter(rows, workspace.buyerValidations || []);
  const total = center.items.length;
  const reached = center.items.filter(row => {
    const outreach = validationOutreach(row);
    const status = String(row.callStatus || '').toLowerCase();
    return Boolean(outreach.phone || outreach.email || row.lastContacted || (status && status !== 'not_called'));
  }).length;
  const open = Math.max(0, total - reached);
  const percent = total ? Math.round((reached / total) * 100) : 0;
  return { total, reached, open, percent };
}

function getSelectedBuilder(builders = getPermitBuilders()) {
  if (selectedBuilderId) {
    const found = builders.find(builder => builder.builderId === selectedBuilderId);
    if (found) return found;
  }
  const fallback = builders[0];
  selectedBuilderId = fallback?.builderId || '';
  return fallback;
}


function callStatusLabel(status) {
  return String(status || 'not_called').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function parseListInput(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const ACTIVITY_CHANNELS = ['phone', 'email', 'mail'];

function channelDoneCopy(channel) {
  if (channel === 'phone') return 'Called';
  if (channel === 'mail') return 'Mail sent';
  return 'Email sent';
}

function channelTodoCopy(channel) {
  if (channel === 'phone') return 'Call open';
  if (channel === 'mail') return 'Mail open';
  return 'Email open';
}

function activityStore(scope = 'land') {
  const activity = workspace.activity || {};
  return activity[scope] || {};
}

function itemActivity(scope = 'land', itemId = '') {
  return activityStore(scope)[itemId] || {};
}

function activityChannelState(scope = 'land', itemId = '', channel = 'phone') {
  const entry = itemActivity(scope, itemId)[channel] || {};
  return { done: Boolean(entry.done || entry.contacted), at: entry.at || '' };
}

function setActivityChannel(scope = 'land', itemId = '', channel = 'phone', done = false, at = '') {
  const currentScope = activityStore(scope);
  const currentItem = currentScope[itemId] || {};
  workspace = {
    ...workspace,
    activity: {
      ...(workspace.activity || {}),
      [scope]: {
        ...currentScope,
        [itemId]: {
          ...currentItem,
          [channel]: { done, at: done ? at : '' },
        },
      },
    },
  };
}

function validationOutreach(row = {}) {
  const outreach = row.outreach || {};
  return {
    phone: Boolean(outreach.phone?.contacted || row.contactedByPhone),
    email: Boolean(outreach.email?.contacted || row.contactedByEmail),
    mail: Boolean(outreach.mail?.contacted || row.contactedByMail),
    phoneAt: outreach.phone?.at || '',
    emailAt: outreach.email?.at || '',
    mailAt: outreach.mail?.at || '',
  };
}

function validationOutreachLabel(row = {}) {
  const state = validationOutreach(row);
  const count = [state.phone, state.email, state.mail].filter(Boolean).length;
  if (count >= 2) return `${count}/3 touched`;
  if (state.phone) return 'Called';
  if (state.email) return 'Emailed';
  if (state.mail) return 'Mailed';
  return 'Not contacted';
}

function outreachToggleLabel(channel, active, at = '') {
  return active ? `${channelDoneCopy(channel)}${at ? ` ${at}` : ''}` : channelTodoCopy(channel);
}

function activityToggleButton({ scope = 'land', itemId = '', channel = 'phone', name = '', state = {}, className = 'activity-toggle' } = {}) {
  const icon = channel === 'phone' ? 'phone' : channel === 'mail' ? 'mail' : 'email';
  const active = Boolean(state.done || state.contacted);
  const label = `${active ? channelDoneCopy(channel) : channelTodoCopy(channel)}: ${name || 'item'}`;
  return `<button type="button" class="${h(className)} activity-${h(channel)} ${active ? 'is-on' : ''}" data-toggle-${h(scope)}-activity="${h(channel)}" data-activity-id="${h(itemId)}" aria-pressed="${active ? 'true' : 'false'}" aria-label="${h(label)}" title="${h(label)}"><span aria-hidden="true">${solidIndustryIcon(icon)}</span><em>${h(channel === 'phone' ? 'Call' : channel === 'mail' ? 'Mail' : 'Email')}</em></button>`;
}

function outreachIcon(channel) {
  if (channel === 'phone') {
    return `<svg class="outreach-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.5 4.5A3 3 0 0 1 4.5 1.5h1.37c.86 0 1.61.58 1.82 1.41l.72 2.88a3 3 0 0 1-.8 2.82l-.74.74a14.25 14.25 0 0 0 7.78 7.78l.74-.74a3 3 0 0 1 2.82-.8l2.88.72a1.88 1.88 0 0 1 1.41 1.82v1.37a3 3 0 0 1-3 3h-1.13C9.05 22.5 1.5 14.95 1.5 5.63V4.5Z"/></svg>`;
  }
  return `<svg class="outreach-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.93 5.5a3 3 0 0 1-3.14 0L1.5 8.67Z"/><path fill="currentColor" d="M22.5 6.91V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.16l9.71 5.98a1.5 1.5 0 0 0 1.58 0l9.71-5.98Z"/></svg>`;
}

function solidIndustryIcon(kind) {
  const paths = {
    phone: '<path fill="currentColor" d="M6.42 2.75c.98-.3 2.02.22 2.4 1.17l1.1 2.75c.31.78.09 1.67-.55 2.2l-.86.72a12.85 12.85 0 0 0 5.9 5.9l.72-.86c.53-.64 1.42-.86 2.2-.55l2.75 1.1c.95.38 1.47 1.42 1.17 2.4l-.52 1.69A2.55 2.55 0 0 1 18.3 21H17C9.27 21 3 14.73 3 7V5.7c0-1.12.72-2.1 1.79-2.43l1.63-.52Z"/>',
    email: '<path fill="currentColor" d="M4.75 5h14.5A2.75 2.75 0 0 1 22 7.75v8.5A2.75 2.75 0 0 1 19.25 19H4.75A2.75 2.75 0 0 1 2 16.25v-8.5A2.75 2.75 0 0 1 4.75 5Zm.02 2.2 6.15 4.02c.66.43 1.5.43 2.16 0l6.15-4.02H4.77Z"/>',
    mail: '<path fill="currentColor" d="M5 3.75h10.25A3.75 3.75 0 0 1 19 7.5V9h.75A2.25 2.25 0 0 1 22 11.25v6A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25v-9.5A4 4 0 0 1 6 3.75H5Zm2.5 2.5A1.5 1.5 0 0 0 6 7.75v2.5h10.5V7.5a1.25 1.25 0 0 0-1.25-1.25H7.5Zm-3 6.5v4.5c0 .14.11.25.25.25h14.5c.14 0 .25-.11.25-.25v-5.75H4.5v1.25Zm3 1.25h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2Z"/>',
    score: '<path fill="currentColor" d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 3.25a1.15 1.15 0 0 1 1.15 1.15v5.3a1.15 1.15 0 1 1-2.3 0V6.9A1.15 1.15 0 0 1 12 5.75Zm0 10.1a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7Z"/>',
    chevron: '<path fill="currentColor" d="M12 15.8c-.38 0-.74-.15-1.01-.42L5.8 10.2a1.43 1.43 0 0 1 2.02-2.02L12 12.36l4.18-4.18a1.43 1.43 0 0 1 2.02 2.02l-5.19 5.18c-.27.27-.63.42-1.01.42Z"/>',
    proof: '<path fill="currentColor" d="M6.75 2.75h7.4c.6 0 1.18.24 1.6.66l2.84 2.84c.42.42.66 1 .66 1.6v9.4A4.25 4.25 0 0 1 15 21.5H6.75a4.25 4.25 0 0 1-4.25-4.25V7a4.25 4.25 0 0 1 4.25-4.25Zm6.5 1.95v3.05c0 .55.45 1 1 1h3.05l-4.05-4.05ZM7 11.25a1 1 0 1 0 0 2h8.5a1 1 0 1 0 0-2H7Zm0 4a1 1 0 1 0 0 2h5.25a1 1 0 1 0 0-2H7Z"/>',
    disclosure: '<path fill="currentColor" d="M6.75 2.75h7.7c.5 0 .98.2 1.33.55l2.92 2.92c.35.35.55.83.55 1.33v9.7a4 4 0 0 1-4 4h-8.5a4 4 0 0 1-4-4V6.75a4 4 0 0 1 4-4Zm7.25 2.2V7.5c0 .55.45 1 1 1h2.55L14 4.95ZM7.2 11.2a1 1 0 0 0 0 2h9.1a1 1 0 0 0 0-2H7.2Zm0 4a1 1 0 1 0 0 2h6.1a1 1 0 1 0 0-2H7.2Z"/>',
    empty: '<path fill="currentColor" d="M5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V6.75A2.75 2.75 0 0 1 5.75 4Zm0 2.5a.25.25 0 0 0-.25.25v10.5c0 .14.11.25.25.25h12.5c.14 0 .25-.11.25-.25V6.75a.25.25 0 0 0-.25-.25H5.75Zm2.5 2.75h7.5a1 1 0 1 1 0 2h-7.5a1 1 0 1 1 0-2Zm0 3.75h4.5a1 1 0 1 1 0 2h-4.5a1 1 0 1 1 0-2Z"/>',
    check: '<path fill="currentColor" d="M9.55 16.55 4.9 11.9a1.55 1.55 0 0 1 2.2-2.2l2.45 2.45 7.35-7.35a1.55 1.55 0 1 1 2.2 2.2l-9.55 9.55Z"/>',
    pending: '<path fill="currentColor" d="M12 3.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Zm0 2.5a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5Zm-.1 2.7a1.1 1.1 0 0 1 1.1 1.1V12l2.05 1.2a1.1 1.1 0 1 1-1.1 1.9l-2.6-1.52a1.1 1.1 0 0 1-.55-.95V9.55a1.1 1.1 0 0 1 1.1-1.1Z"/>',
    lock: '<path fill="currentColor" d="M7 10V7.8A5 5 0 0 1 12 2.8a5 5 0 0 1 5 5V10h.25A2.75 2.75 0 0 1 20 12.75v5.5A2.75 2.75 0 0 1 17.25 21H6.75A2.75 2.75 0 0 1 4 18.25v-5.5A2.75 2.75 0 0 1 6.75 10H7Zm2.5 0h5V7.8a2.5 2.5 0 0 0-5 0V10Zm2.5 4a1.25 1.25 0 0 0-.75 2.25v1a.75.75 0 0 0 1.5 0v-1A1.25 1.25 0 0 0 12 14Z"/>',
  };
  return `<svg class="solid-industry-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[kind] || paths.proof}</svg>`;
}

function productIcon(kind) {
  const paths = {
    target: '<circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="2"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>',
    phone: '<path d="M6.6 3.8 9 3.2l1.7 4.2-1.5 1.1c.9 2 2.4 3.5 4.3 4.3l1.1-1.5 4.2 1.7-.6 2.4c-.2.9-1 1.6-2 1.6C10 17 7 14 7 8c0-1 .7-1.8 1.6-2.2Z"></path>',
    source: '<path d="M5 5h14M5 12h14M5 19h14"></path><path d="M7 3v4M17 10v4M11 17v4"></path>',
    close: '<path d="M7 4h7l3 3v13H7z"></path><path d="M14 4v4h4M9 13h6M9 17h4"></path>',
    arrow: '<path d="M5 12h13"></path><path d="m14 7 5 5-5 5"></path>',
    loop: '<path d="M5 8.5A7 7 0 0 1 17.4 5.2L19 7"></path><path d="M19 3.8V7h-3.2"></path><path d="M19 15.5A7 7 0 0 1 6.6 18.8L5 17"></path><path d="M5 20.2V17h3.2"></path>',
  };
  return `<svg class="product-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[kind] || paths.arrow}</svg>`;
}

function actionIcon(kind) {
  if (kind === 'copy') {
    return `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8.25 3A3.25 3.25 0 0 1 11.5-.25h6A3.25 3.25 0 0 1 20.75 3v9A3.25 3.25 0 0 1 17.5 15.25h-6A3.25 3.25 0 0 1 8.25 12V3Zm3.25-.75a.75.75 0 0 0-.75.75v9c0 .41.34.75.75.75h6c.41 0 .75-.34.75-.75V3a.75.75 0 0 0-.75-.75h-6Z" transform="translate(0 1)"/><path fill="currentColor" d="M3.25 8A3.25 3.25 0 0 1 6.5 4.75h.75v2.5H6.5a.75.75 0 0 0-.75.75v9c0 .41.34.75.75.75h6c.41 0 .75-.34.75-.75v-.75h2.5V17A3.25 3.25 0 0 1 12.5 20.25h-6A3.25 3.25 0 0 1 3.25 17V8Z" transform="translate(0 1)"/></svg>`;
  }
  if (kind === 'website') {
    return `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm6.93 8.5h-3.06a15.1 15.1 0 0 0-1.18-5.04 7.28 7.28 0 0 1 4.24 5.04Zm-6.93-6c.52.74 1.16 2.55 1.37 6h-2.74c.21-3.45.85-5.26 1.37-6Zm-2.69.96a15.1 15.1 0 0 0-1.18 5.04H5.07a7.28 7.28 0 0 1 4.24-5.04Zm-4.24 7.54h3.06c.16 2.12.58 3.84 1.18 5.04a7.28 7.28 0 0 1-4.24-5.04Zm6.93 6c-.52-.74-1.16-2.55-1.37-6h2.74c-.21 3.45-.85 5.26-1.37 6Zm2.69-.96c.6-1.2 1.02-2.92 1.18-5.04h3.06a7.28 7.28 0 0 1-4.24 5.04Z"/></svg>`;
  }
  return outreachIcon(kind);
}

function scoreBreakdownText(row = {}) {
  return asArray(row.validation?.breakdown)
    .map(item => `${item.label}: ${item.value >= 0 ? '+' : ''}${item.value} - ${item.detail}`)
    .join('\n');
}

function scoreBreakdownRows(row = {}) {
  return asArray(row.validation?.breakdown)
    .map(item => `<div><span>${h(item.label)}</span><b>${item.value >= 0 ? '+' : ''}${h(item.value)}</b><em>${h(item.detail)}</em></div>`)
    .join('');
}


const BUYBOX_UNLOCK_FIELDS = [
  { key: 'geography', label: 'Geography', selector: '.validation-geography', question: 'Which submarkets are you actively buying in?' },
  { key: 'lotSize', label: 'Lot size', selector: '.validation-lot', question: 'What lot-size band is worth reviewing?' },
  { key: 'maxPrice', label: 'Max price', selector: '.validation-price', question: 'What is your maximum acquisition price before feasibility?' },
  { key: 'closeSpeed', label: 'Close speed', selector: '.validation-speed', question: 'How quickly can you close, and how many lots per month can you absorb?' },
  { key: 'packageRecipient', label: 'Recipient', selector: '.validation-recipient', question: 'Who should receive parcel packages and at what direct email?' },
  { key: 'dealKillers', label: 'Deal killers', selector: '.validation-killers', question: 'What kills a parcel immediately: slope, flood, wetlands, frontage, utilities, title?' },
];

function buyBoxFieldValue(buyBox = {}, key = '') {
  const value = buyBox?.[key];
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return value ?? '';
}

function isBuyBoxFieldComplete(buyBox = {}, key = '') {
  const value = buyBoxFieldValue(buyBox, key);
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return String(value || '').trim().length > 0;
}

function buyBoxCompletion(row = {}) {
  const buyBox = row.buyBox || {};
  const fields = BUYBOX_UNLOCK_FIELDS.map(field => ({ ...field, complete: isBuyBoxFieldComplete(buyBox, field.key) }));
  const complete = fields.filter(field => field.complete).length;
  const missing = fields.filter(field => !field.complete);
  return { fields, complete, total: fields.length, percent: fields.length ? Math.round((complete / fields.length) * 100) : 0, missing, next: missing[0] || fields[0] };
}

function renderBuyBoxCompletion(row = {}) {
  const state = buyBoxCompletion(row);
  const chips = state.fields.map(field => `<span class="completion-chip ${field.complete ? 'done' : 'missing'}"><span aria-hidden="true">${field.complete ? solidIndustryIcon('check') : solidIndustryIcon('pending')}</span>${h(field.label)}</span>`).join('');
  return `<section class="buybox-completion" aria-label="Buy box completion">
    <div class="completion-head"><span>Buy box completion</span><strong>${h(state.complete)}/${h(state.total)}</strong></div>
    <div class="completion-rail" aria-hidden="true"><span style="width:${h(state.percent)}%"></span></div>
    <div class="completion-chips">${chips}</div>
  </section>`;
}

function fieldStateClass(row = {}, key = '') {
  return isBuyBoxFieldComplete(row.buyBox || {}, key) ? 'is-complete' : 'is-required';
}

function fieldLabel(label, row = {}, key = '') {
  return `<span class="field-label-text"><span>${h(label)}</span><em aria-hidden="true" title="Required">*</em></span>`;
}

function renderAskNext(row = {}) {
  const state = buyBoxCompletion(row);
  const next = state.next || BUYBOX_UNLOCK_FIELDS[0];
  return `<aside class="ask-next-card" aria-label="Next buy-box question">
    <span>Ask this next</span>
    <strong>${h(next.question)}</strong>
    <small>${state.complete}/${state.total} captured · seller search unlocks when the buying rules are specific enough to protect outreach.</small>
  </aside>`;
}

function renderEvidenceStack(row = {}) {
  const permits = asArray(row.permitEvidence || row.recentPermits).slice(0, 3);
  const proofRows = permits.map((permit, index) => `<li>
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(permit.permitNumber || 'permit')}</b><small>${h(permit.address || permit.siteAddress || 'address pending')} · ${h(permit.issuedAt || permit.issueDate || 'date pending')} · ${formatMoney(permit.permitValue || permit.valuation || 0)}</small></div>
    ${permitVerificationLink(permit)}
  </li>`).join('');
  return `<section class="evidence-stack" aria-label="Top permit evidence">
    <div class="evidence-stack-head"><span>Top permit evidence</span><b>${h(permits.length || row.recentBuilds || 0)} proofs</b></div>
    <ul>${proofRows || '<li><div><b>No permit proof rows loaded.</b><small>Open the source drawer for public evidence context.</small></div></li>'}</ul>
  </section>`;
}

function renderSelectedBuilderDock(row = {}) {
  if (!row.builderId) return '';
  const completion = buyBoxCompletion(row);
  return `<button type="button" class="selected-builder-dock" data-scroll-selected-builder aria-label="View selected builder ${h(row.name || '')}">
    <span><small>Selected</small><strong>${h(row.name || 'Builder')}</strong></span>
    <em>${h(completion.complete)}/${h(completion.total)} buy box</em>
  </button>`;
}

function mergeBuyerValidationPatch(builderId, patch = {}) {
  const sourceRow = findLoadedBuilderRow(builderId);
  const existing = asArray(workspace.buyerValidations).find(item => item.builderId === builderId) || {};
  return {
    ...existing,
    builderId,
    name: sourceRow.name || existing.name || '',
    phone: sourceRow.phone || existing.phone || '',
    email: sourceRow.email || existing.email || '',
    callable: sourceRow.callable ?? existing.callable ?? false,
    route: sourceRow.route || existing.route || 'buyerValidation',
    recentBuilds: sourceRow.recentBuilds || existing.recentBuilds || 0,
    callStatus: existing.callStatus || sourceRow.callStatus || 'not_called',
    lastContacted: existing.lastContacted || sourceRow.lastContacted || '',
    callbackDate: existing.callbackDate || sourceRow.callbackDate || '',
    callNotes: existing.callNotes || sourceRow.callNotes || '',
    buyBox: { ...(sourceRow.buyBox || {}), ...(existing.buyBox || {}) },
    outreach: { ...(sourceRow.outreach || {}), ...(existing.outreach || {}) },
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

function upsertBuyerValidation(row) {
  workspace = { ...workspace, buyerValidations: [...asArray(workspace.buyerValidations).filter(item => item.builderId !== row.builderId), row] };
}

function renderBuyerValidationCommandCenter(activeState = { stateCode: 'TN', label: 'Tennessee', isLive: true, markets: [], stateMeta: {} }, rows = [], summary = {}) {
  if (!rows.length) {
    const portals = asArray(activeState.stateMeta?.portals).slice(0, 3).map(portal => `<li><b>${h(portal.market)}</b><span>${h(portal.system)} · ${h(portal.jurisdiction)}</span></li>`).join('');
    return `<section id="buyer-validation-command" class="validation-command builder-empty-command phase85-builder-ledger" aria-label="Builder queue empty for ${h(activeState.label)}">
      <div class="builder-empty-state builder-queue-ledger-empty">
        <div class="builder-empty-copy">
          <span class="eyebrow">${h(activeState.label)} builder queue</span>
          <h3>Queue pending verified proof.</h3>
          <p>This state lane stays blank until public permit activity is collected, companies are deduped, and public business contact provenance is verified.</p>
          <div class="empty-state-actions">
            <a href="#market-state-${h(activeState.stateCode.toLowerCase())}">Open ${h(activeState.stateCode)} source pipeline</a>
            <span>${h(asArray(activeState.stateMeta?.pipeline).length)} source steps ready</span>
          </div>
        </div>
        <div class="builder-empty-proof" aria-label="Source readiness for ${h(activeState.label)}">
          <span>Source readiness</span>
          <ul class="empty-source-list">${portals || '<li><b>Portal list pending</b><span>Add direct county/city sources before loading builders.</span></li>'}</ul>
        </div>
      </div>
    </section>`;
  }
  const center = buildBuyerValidationCommandCenter(rows, workspace.buyerValidations || []);
  const selected = center.items.find(item => item.builderId === selectedValidationBuilderId) || center.next || center.items[0] || {};
  selectedValidationBuilderId = selected.builderId || selectedValidationBuilderId;
  const completion = buyBoxCompletion(selected);
  const missingList = completion.missing.map(field => `<li><span aria-hidden="true">○</span>${h(field.label)}</li>`).join('');
  const unlockedList = BUYBOX_UNLOCK_FIELDS.map(field => `<li><span aria-hidden="true">✓</span>${h(field.label)}</li>`).join('');
  const sellerCriteria = selected.sellerSearch?.eligible
    ? (selected.sellerSearch.criteria.map(item => `<li><span aria-hidden="true">✓</span>${h(item)}</li>`).join('') || unlockedList)
    : (missingList || '<li><span aria-hidden="true">○</span>Complete buy-box fields to unlock seller search.</li>');
  const statusOptions = BUYER_VALIDATION_STATUSES.map(status => `<option value="${h(status)}" ${selected.callStatus === status ? 'selected' : ''}>${h(callStatusLabel(status))}</option>`).join('');
  const queue = center.items.map((item, index) => {
    const active = item.builderId === selected.builderId;
    const itemCompletion = buyBoxCompletion(item);
    const tone = item.validation.sellerEligible ? 'good' : item.route === 'humanReview' ? 'warn' : itemCompletion.percent >= 67 ? 'warn' : 'neutral';
    const outreach = validationOutreach(item);
    const scoreTitle = scoreBreakdownText(item);
    const completionStateClass = [
      active ? 'active' : '',
      outreach.email ? 'is-emailed' : 'needs-email',
      outreach.phone ? 'is-called' : 'needs-call',
      outreach.mail ? 'is-mailed' : 'needs-mail',
      item.validation.sellerEligible ? 'is-done' : 'needs-buybox',
    ].filter(Boolean).join(' ');
    return `<article class="validation-queue-item ${completionStateClass}" data-validation-row="${h(item.builderId)}" data-email-state="${outreach.email ? 'done' : 'todo'}" data-call-state="${outreach.phone ? 'done' : 'todo'}" data-mail-state="${outreach.mail ? 'done' : 'todo'}">
      <button type="button" class="validation-row-main" data-select-validation-builder="${h(item.builderId)}" aria-label="Select ${h(item.name)}" aria-pressed="${active ? 'true' : 'false'}">
        <span class="queue-copy"><b>${h(item.name)}</b><small>${h(validationOutreachLabel(item))} · ${h(item.recentBuilds)} permits · ${h(itemCompletion.complete)}/${h(itemCompletion.total)} buy box</small></span>
        <span class="queue-score" title="${h(scoreTitle)}" aria-label="Validation score ${h(item.validation.score)}">${solidIndustryIcon('score')}<b>${h(item.validation.score)}</b></span>
      </button>
      <div class="queue-state-row" aria-label="Outreach state for ${h(item.name)}">
        <button type="button" class="contact-icon-toggle contact-call ${outreach.phone ? 'is-on' : ''}" data-toggle-validation-contact="phone" data-builder-id="${h(item.builderId)}" aria-pressed="${outreach.phone ? 'true' : 'false'}" aria-label="${outreach.phone ? 'Called' : 'Call not logged'}: ${h(item.name)}" title="${outreach.phone ? `Called ${h(outreach.phoneAt || '')}` : 'Tap to mark called'}"><span aria-hidden="true">${solidIndustryIcon('phone')}</span></button>
        <button type="button" class="contact-icon-toggle contact-email ${outreach.email ? 'is-on' : ''}" data-toggle-validation-contact="email" data-builder-id="${h(item.builderId)}" aria-pressed="${outreach.email ? 'true' : 'false'}" aria-label="${outreach.email ? 'Email sent' : 'Email open'}: ${h(item.name)}" title="${outreach.email ? `Email sent ${h(outreach.emailAt || '')}` : 'Tap to mark emailed'}"><span aria-hidden="true">${solidIndustryIcon('email')}</span></button>
        <button type="button" class="contact-icon-toggle contact-mail ${outreach.mail ? 'is-on' : ''}" data-toggle-validation-contact="mail" data-builder-id="${h(item.builderId)}" aria-pressed="${outreach.mail ? 'true' : 'false'}" aria-label="${outreach.mail ? 'Mail sent' : 'Mail open'}: ${h(item.name)}" title="${outreach.mail ? `Mail sent ${h(outreach.mailAt || '')}` : 'Tap to mark mailed'}"><span aria-hidden="true">${solidIndustryIcon('mail')}</span></button>
        ${badge(item.validation.sellerEligible ? 'seller search unlocked' : 'needs buy box', tone)}
      </div>
    </article>`;
  }).join('');
  const contactParts = [
    selected.phone ? h(selected.phone) : '',
    selected.email ? `<a href="#" class="copy-builder-email-address" data-copy-builder-email-address="${h(selected.email)}" title="Copy ${h(selected.email)}">${h(selected.email)}</a>` : '',
  ].filter(Boolean);
  const contact = contactParts.join(' · ') || 'Public business contact unresolved';
  const selectedOutreach = validationOutreach(selected);
  const selectedScoreTitle = scoreBreakdownText(selected);
  const selectedScoreRows = scoreBreakdownRows(selected);
  const scriptQuestions = Object.values(selected.buyBoxCapture || {}).map(item => `<li>${h(item)}</li>`).join('');
  const selectedPermitProof = asArray(selected.permitEvidence || selected.recentPermits).slice(0, 3).map(permit => `<li><b>${h(permit.permitNumber || 'permit')}</b><span>${h(permit.address || permit.siteAddress || 'address pending')} · ${h(permit.issuedAt || permit.issueDate || 'date pending')} · ${formatMoney(permit.permitValue || permit.valuation || 0)}</span>${permitVerificationLink(permit)}</li>`).join('');
  const contactProofLink = selected.contactUrl || selected.website || '';
  const sourceProof = `<div class="validation-source-proof" aria-label="Builder source proof">
    <div><span>Source</span><strong>${selected.sourceUrl ? safeLink(selected.sourceUrl, selected.sourceType || 'Official source') : h(selected.sourceType || 'source pending')}</strong></div>
    <div><span>Contact path</span><strong>${contactProofLink ? safeLink(contactProofLink, selected.contactRole || 'Public business contact') : h(selected.contactStatus || 'contact pending')}</strong></div>
    <div><span>Contact status</span><strong>${h(selected.contactStatus || 'contact pending')}</strong></div>
    <div><span>Confidence</span><strong>${h(selected.contactConfidence || selected.confidence || '-')}</strong></div>
    <div><span>Top permit</span><strong>${h(selected.topPermit || '-')}</strong></div>
  </div>`;
  const phoneHref = selected.phone ? `tel:${h(String(selected.phone).replace(/[^0-9+]/g, ''))}` : '#';
  const marketLabel = selected.marketName || activeState.marketLabel || activeState.label || 'your market';
  const marketingEmail = generateBuilderMarketingEmailTemplate(selected);
  const validationEmail = selected.emailDraft || {};
  const fallbackEmail = generateBuilderEmail(selected);
  const validationEmailSubject = validationEmail.subject || fallbackEmail.subject;
  const validationEmailBody = fallbackEmail.body;
  const mailHref = selected.email ? `mailto:${h(selected.email)}?subject=${encodeURIComponent(validationEmailSubject)}&body=${encodeURIComponent(validationEmailBody)}` : '#';
  const nextActionCopy = selected.sellerSearch?.eligible
    ? 'Buy box captured. Find parcels matching this builder before seller outreach starts.'
    : `Call once. Capture the exact buy box. Next missing field: ${completion.next ? completion.next.label : 'buy box proof'}.`;
  return `<section id="buyer-validation-command" class="validation-command phase85-builder-ledger" aria-label="Buyer Validation Command Center">
    <div class="operator-flow-pulse" aria-label="Builder validation flow"><span class="done">Market</span><span class="done">Builder</span><span class="${completion.complete ? 'active' : ''}">Buy box</span><span class="${selected.sellerSearch?.eligible ? 'done' : ''}">Seller search</span><span>Offer</span></div>
    <div class="completion-state-legend" aria-label="Operational state legend"><span class="legend-done">Done</span><span class="legend-working">In progress</span><span class="legend-todo">Todo</span></div>
    <div class="validation-grid-main">
      <aside class="validation-queue"><div class="panel-kicker"><span>Queue <button type="button" class="info-dot" aria-label="Why this queue order?" title="Ranked by permit proof, callable public contact, buy-box capture, decision-maker progress, outreach logged, and review holds.">?</button></span><b title="Source URLs, permit counts, confidence, and score detail sit in row tooltips to keep scanning calm.">Proof</b>${activeState.summary?.entries?.[0]?.csvUrl ? `<a class="queue-csv-link" href="${h(activeState.summary.entries[0].csvUrl)}">CSV</a>` : ''}</div><div class="queue-filter-row" aria-label="Queue filters"><button type="button" disabled>Callable</button><button type="button" disabled>Buy box</button><button type="button" disabled>Permits</button></div>${queue}</aside>
      <article class="validation-focus-card" id="selected-builder-card">
        <div class="validation-focus-head">
          <div><span class="eyebrow">Builder</span><h3>${h(selected.name || 'Select builder')}</h3><p title="Regional headquarters and operating-market contact paths may differ; verify the public business path before marking outreach done."><b>${h(marketLabel)}.</b> ${h(selected.recentBuilds || 0)} permit proofs. ${contact}</p></div>
          <details class="validation-score" title="${h(selectedScoreTitle)}">
            <summary>${solidIndustryIcon('score')}<strong>${h(selected.validation?.score || 0)}</strong><span>score detail</span></summary>
            <div class="score-breakdown">${selectedScoreRows}</div>
          </details>
        </div>
        <div class="next-best-action"><span>Next</span><strong>${h(nextActionCopy)}</strong></div>
        ${sourceProof}
        ${renderEvidenceStack(selected)}
        <div class="selected-outreach-state" aria-label="Builder outreach state">
          <button type="button" class="contact-state-toggle ${selectedOutreach.phone ? 'is-on' : ''}" data-toggle-validation-contact="phone" data-builder-id="${h(selected.builderId || '')}" aria-pressed="${selectedOutreach.phone ? 'true' : 'false'}" aria-label="${h(outreachToggleLabel('phone', selectedOutreach.phone, selectedOutreach.phoneAt))}" title="${h(outreachToggleLabel('phone', selectedOutreach.phone, selectedOutreach.phoneAt))}"><span aria-hidden="true">${solidIndustryIcon('phone')}</span></button>
          <button type="button" class="contact-state-toggle ${selectedOutreach.email ? 'is-on' : ''}" data-toggle-validation-contact="email" data-builder-id="${h(selected.builderId || '')}" aria-pressed="${selectedOutreach.email ? 'true' : 'false'}" aria-label="${h(outreachToggleLabel('email', selectedOutreach.email, selectedOutreach.emailAt))}" title="${h(outreachToggleLabel('email', selectedOutreach.email, selectedOutreach.emailAt))}"><span aria-hidden="true">${solidIndustryIcon('email')}</span></button>
          <button type="button" class="contact-state-toggle ${selectedOutreach.mail ? 'is-on' : ''}" data-toggle-validation-contact="mail" data-builder-id="${h(selected.builderId || '')}" aria-pressed="${selectedOutreach.mail ? 'true' : 'false'}" aria-label="${h(outreachToggleLabel('mail', selectedOutreach.mail, selectedOutreach.mailAt))}" title="${h(outreachToggleLabel('mail', selectedOutreach.mail, selectedOutreach.mailAt))}"><span aria-hidden="true">${solidIndustryIcon('mail')}</span></button>
        </div>
        <div class="validation-actions">
          <a class="validation-call-button ${selected.phone ? '' : 'disabled'}" href="${phoneHref}">${actionIcon('phone')}<span>Call</span></a>
          <a class="validation-call-button icon-only ${selected.email ? '' : 'disabled'}" href="${mailHref}" aria-label="Draft email" title="Draft email">${actionIcon('email')}</a>
          <button type="button" class="validation-call-button secondary copy-email-button" data-copy-validation-email>${actionIcon('copy')}<span>Draft</span></button>
          ${contactProofLink ? `<a class="validation-call-button secondary website-link" href="${h(contactProofLink)}" target="_blank" rel="noopener noreferrer">${actionIcon('website')}<span>Website</span></a>` : ''}
          <span class="validation-email-status" aria-live="polite"></span>
        </div>
        ${renderBuyBoxCompletion(selected)}
        ${renderAskNext(selected)}
        <div class="validation-form validation-buybox-grid" data-validation-form="${h(selected.builderId || '')}">
          <label class="form-field field-status">Status <select class="validation-status">${statusOptions}</select></label>
          <label class="form-field field-last">Last touch <input type="date" class="validation-last" value="${h(selected.lastContacted || '')}" /></label>
          <label class="form-field field-callback">Callback <input type="date" class="validation-callback" value="${h(selected.callbackDate || '')}" /></label>
          <label class="form-field field-geography ${fieldStateClass(selected, 'geography')}">${fieldLabel('Geography', selected, 'geography')}<input class="validation-geography" value="${h(selected.buyBox?.geography || '')}" placeholder="West Knoxville, Karns, Hardin Valley..." /></label>
          <label class="form-field field-lot ${fieldStateClass(selected, 'lotSize')}">${fieldLabel('Lot band', selected, 'lotSize')}<input class="validation-lot" value="${h(selected.buyBox?.lotSize || '')}" placeholder="0.25-1.0 ac, infill/subdivision lots" /></label>
          <label class="form-field field-price ${fieldStateClass(selected, 'maxPrice')}">${fieldLabel('Max price', selected, 'maxPrice')}<input class="validation-price" inputmode="numeric" value="${h(selected.buyBox?.maxPrice || '')}" placeholder="65000" /></label>
          <label class="form-field field-speed ${fieldStateClass(selected, 'closeSpeed')}">${fieldLabel('Speed / appetite', selected, 'closeSpeed')}<input class="validation-speed" value="${h(selected.buyBox?.closeSpeed || '')}" placeholder="14-30 days / 2 lots per month" /></label>
          <label class="form-field field-recipient ${fieldStateClass(selected, 'packageRecipient')}">${fieldLabel('Recipient', selected, 'packageRecipient')}<input class="validation-recipient" value="${h(selected.buyBox?.packageRecipient || '')}" placeholder="Name + direct email for parcel packages" /></label>
          <label class="form-field field-utilities">Utilities <input class="validation-utilities" value="${h(selected.buyBox?.utilitiesAccess || '')}" placeholder="paved road, sewer nearby, water/electric at street" /></label>
          <label class="form-field field-product">Product <input class="validation-product" value="${h(selected.buyBox?.productType || '')}" placeholder="entry-level SFR, infill spec, move-up homes" /></label>
          <label class="form-field field-killers ${fieldStateClass(selected, 'dealKillers')}">${fieldLabel('Killers', selected, 'dealKillers')}<input class="validation-killers" value="${h(asArray(selected.buyBox?.dealKillers).join(', ') || selected.buyBox?.dealKillers || '')}" placeholder="steep slope, flood, wetlands, no frontage, title issue" /></label>
          <label class="form-field field-notes wide">Exact language <textarea class="validation-notes" placeholder="Paste what they said. No interpretation.">${h(selected.callNotes || '')}</textarea></label>
          <div class="validation-save-row"><button type="button" data-save-buyer-validation>Save validation</button><span class="validation-save-status" aria-live="polite"></span></div>
        </div>
      </article>
      <aside class="seller-unlock-card ${selected.sellerSearch?.eligible ? 'unlocked' : ''}">
        <div class="panel-kicker"><span>Seller gate</span><b>${selected.sellerSearch?.eligible ? 'open' : `${completion.complete}/${completion.total}`}</b></div>
        <h4>${selected.sellerSearch?.eligible ? h(selected.sellerSearch?.headline || 'Seller search open.') : `<span class="seller-gate-lock" aria-label="Seller search locked until buy box is specific" title="Seller search locked until buy box is specific">${solidIndustryIcon('lock')}</span>Specific buy box required.`}</h4>
        <ul>${sellerCriteria}</ul>
        ${selected.sellerSearch?.eligible ? `<div class="unlock-price"><span>Offer ceiling</span><strong>${formatMoney(selected.sellerSearch.offerCeiling)}</strong></div><p>${h(selected.sellerSearch.sellerAngle)}</p><a class="seller-unlock-cta" href="#top-calls">Find parcels</a>` : '<p title="Permit proof shows demand, but buyer criteria protect the seller call.">Capture the buy box first; seller calls must match real demand.</p>'}
      </aside>
    </div>
    ${renderSelectedBuilderDock(selected)}
    <details class="validation-script-drawer">
      <summary><span>Questions + script</span>${solidIndustryIcon('chevron')}</summary>
      <div class="script-grid"><div><h5>Public proof</h5><p>${h(selected.sourceEvidence || '')}</p><p>${h(selected.demandSignal || '')}</p><ul class="selected-permit-proof">${selectedPermitProof || '<li><span>No permit proof rows loaded.</span></li>'}</ul></div><div><h5>Buy-box questions</h5><ul>${scriptQuestions}</ul></div></div>
      <pre>${h(selected.callScript || '')}</pre>
    </details>
    <details class="validation-script-drawer marketing-drawer">
      <summary><span>Intro email</span>${solidIndustryIcon('chevron')}</summary>
      <div class="email-subject"><span>Subject</span><strong>${h(marketingEmail.subject)}</strong></div>
      <pre>${h(marketingEmail.body)}</pre>
      <div class="button-row"><button type="button" class="secondary" data-copy-builder-marketing-email>Copy marketing template</button><span class="builder-marketing-email-status"></span></div>
    </details>
  </section>`;
}

function renderBuilderListEnginePanel(options = {}) {
  const target = document.querySelector('#builder-list-panel');
  if (!target) return;
  const preservedViewport = options.preserveViewport ? captureBuilderInteractionViewport() : null;
  const callSheetRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const callSheetSummary = knoxvilleBuyerCallSheet?.summary || {};
  const permitLandscape = getPermitPortalLandscape();
  const publicSkipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const marketSummaries = builderMarketSwitchboardEntries(permitLandscape);
  let stateSummaries = builderStateSummaryEntries(marketSummaries, permitLandscape);
  if (!stateSummaries.some(state => state.stateCode === selectedBuilderMarketState)) selectedBuilderMarketState = stateSummaries[0]?.stateCode || 'GA';
  let activeState = stateSummaries.find(state => state.stateCode === selectedBuilderMarketState) || stateSummaries[0];
  const activeMarketKeys = new Set(asArray(activeState?.markets).map(market => market.key));
  if (selectedBuilderMarketKey && !activeMarketKeys.has(selectedBuilderMarketKey)) selectedBuilderMarketKey = '';
  stateSummaries = stateSummaries.map(state => ({ ...state, isActive: state.stateCode === selectedBuilderMarketState }));
  activeState = stateSummaries.find(state => state.stateCode === selectedBuilderMarketState) || stateSummaries[0];
  const stateSwitcher = stateSummaries.map((state) => `<div role="button" tabindex="0" class="state-market-toggle market-status-${h(state.status)} ${state.isActive ? 'active is-active' : ''}" data-builder-market-state="${h(state.stateCode)}" aria-pressed="${state.isActive ? 'true' : 'false'}">
    <span class="state-market-code">${h(state.stateCode)}</span>
    <span class="state-market-copy"><strong><span class="state-market-name">${h(state.label)}</span><span class="state-market-thesis">${h(state.thesis)}</span></strong><small><span>${h(state.countyCount)} ${state.countyCount === 1 ? 'county lane' : 'county lanes'}</span><span>${h(state.statusCopy)}</span></small></span>
    <em><b>${h(state.builderCount)}</b><span>builders</span></em>
  </div>`).join('');
  const selectedMarket = selectedBuilderMarketKey ? asArray(activeState.markets).find(market => market.key === selectedBuilderMarketKey) : null;
  const activeBuilders = selectedMarket ? asArray(selectedMarket.rows) : asArray(activeState.rows);
  const activeSummary = selectedMarket?.summary || activeState.summary || marketSummaryForRows(activeBuilders, activeState.minimumUniqueBuilders || 20);
  const activeLaneLabel = selectedMarket ? selectedMarket.label : activeState.label;
  const marketSummary = `<div class="active-market-summary state-focus-summary">
    <span>${selectedMarket ? 'Selected market lane' : 'Selected market state'}</span>
    <strong>${h(activeLaneLabel)}</strong>
    <p><b>${h(selectedMarket?.marketName || activeState.detail || activeState.thesis)}.</b> ${h(selectedMarket?.note || activeState.note || '')}</p>
    <ul>
      <li title="Permit-backed builder rows under this state."><b>${h(activeBuilders.length)}</b><span>builders</span></li>
      <li title="County/source lanes grouped under the state decision."><b>${h(activeState.countyCount || 0)}</b><span>counties</span></li>
      <li title="Rows with public phone/email/contact path ready for operator outreach."><b>${h(activeSummary.callable ?? 0)}</b><span>callable</span></li>
      <li title="Recent permit rows attached as public proof."><b>${h(activeSummary.totalRecentBuildSignals ?? 0)}</b><span>proofs</span></li>
    </ul>
    ${renderBuilderCountyLedger(activeState)}
  </div>`;
  const adapterRows = getSourceAdapterChecklist().map(adapter => `<article class="adapter-card">
    <span>${h(adapter.name)}</span>
    <p>${h(adapter.use)}</p>
    <small>${adapter.fields.map(field => h(field)).join(' · ')}</small>
  </article>`).join('');
  const statePortalRows = [activeState].map(state => {
    const stateMeta = state.stateMeta || {};
    const markets = asArray(state.markets).map(item => `<li><b>${h(item.label || item.market || 'County lane')}</b><span>${h(item.statusCopy || item.reason || item.note || 'Source lane')}</span>${item.zillowUrl ? `<a class="zillow-market-link" href="${h(item.zillowUrl)}" target="_blank" rel="noopener noreferrer">Zillow market view</a>` : ''}</li>`).join('');
    const portals = asArray(stateMeta.portals).map(portal => `<a href="${h(portal.url)}" target="_blank" rel="noopener noreferrer">
        <b>${h(portal.market)}</b>
        <span>${h(portal.jurisdiction)}</span>
        <small>${h(portal.system)}</small>
      </a>`).join('');
    const pipeline = asArray(stateMeta.pipeline).map(step => `<li>
      <span>${h(step.step)}</span>
      <div>
        <b>${h(step.title)}</b>
        <small>${h(step.source)}</small>
        <p>${h(step.action)}</p>
        <em>${h(step.output)}</em>
      </div>
    </li>`).join('');
    return `<article id="market-state-${h(state.stateCode.toLowerCase())}" class="permit-state-card target-market-lane ${state.isActive ? 'active' : ''} ${h(state.sequence.status || 'staged')}">
      <div class="permit-state-head">
        <div><span>${h(state.label)}</span><p>${h(stateMeta.reality || 'Source lane pending.')}</p></div>
        <strong>${h(state.statusCopy || state.status)}</strong>
      </div>
      <div class="pipeline-unlock"><b>${h(state.sequence.label || 'Pipeline')}</b><span>${h(state.sequence.unlock || 'Collect permit-source priority before pulling builders.')}</span></div>
      <ul class="state-market-list">${markets || '<li><b>Market list pending</b><span>Collect permit-source priority before pulling builders.</span></li>'}</ul>
      <div class="permit-platform-tags">${asArray(stateMeta.platforms).map(platform => `<em>${h(platform)}</em>`).join('')}</div>
      <h5>Permit-builder pipeline</h5>
      <ol class="state-pipeline-list">${pipeline}</ol>
      <div class="portal-link-list">${portals}</div>
      <p class="permit-strategy">${h(stateMeta.strategy || '')}</p>
    </article>`;
  }).join('');
  const tierRows = permitLandscape.tiers.map(tier => `<article class="normalization-tier">
    <h4>${h(tier.name)}</h4>
    ${tier.items.map(item => `<p>${safeLink(item.url, item.label)} <span>${h(item.note)}</span></p>`).join('')}
  </article>`).join('');
  target.innerHTML = `<div class="builder-engine-shell">
    <section class="state-first-ops-header builders-phase83-workbench" aria-label="Builder state workbench">
      <div class="builder-ops-title">
        <span class="eyebrow">Builders · state workbench</span>
        <h3>Choose state.</h3>
        <p><b>State first.</b> Counties stay as evidence; the queue starts after builder proof is clear.</p>
        <div class="primary-action-strip builders-primary-action"><b>Call top builder.</b><a href="#buyer-validation-command">Open queue ${productIcon('arrow')}</a></div>
      </div>
      <div class="state-first-workbench state-data-workbench" aria-label="Choose operating state and read selected-state data">
        <div class="state-workbench-kicker">
          <span>Operating state</span>
          <strong>${h(activeState.label)}</strong>
          <em>${h(activeSummary.totalBuilders || activeState.builderCount || activeBuilders.length || 0)} builders · ${h(activeState.countyCount || 0)} county lanes</em>
        </div>
        <div class="state-workbench-layout">
          <div class="state-market-grid" data-state-market-selector>${stateSwitcher}</div>
          ${marketSummary}
        </div>
      </div>
      <nav class="builder-ops-jump" aria-label="Builder page sections">
        <a href="#buyer-validation-command">Builder queue</a>
        <a href="#permit-sources">Permit sources</a>
      </nav>
    </section>

    ${renderBuyerValidationCommandCenter(activeState, activeBuilders, activeSummary)}

    <section class="builder-two-col">
      <article id="permit-landscape" class="builder-adapter-panel wide-permit-panel">
        <div class="panel-kicker"><span>Permit portal landscape</span><b>market switchboard · buyer-first lanes</b></div>
        <p class="permit-landscape-summary">${h(permitLandscape.summary)}</p>
        <h4>Target-state lanes</h4>
        <div class="permit-state-grid market-lane-grid">${statePortalRows}</div>
        <h4>Source adapter checklist</h4>
        <div class="adapter-grid">${adapterRows}</div>
        <h4>Normalization playbook</h4>
        <div class="normalization-grid">${tierRows}</div>
      </article>
    </section>
  </div>`;
  if (preservedViewport) restoreBuilderInteractionViewport(preservedViewport);
}

function renderSellerSearchControlLayer(control = {}) {
  const stageRows = asArray(control.stageRows).map(stage => {
    const statusText = String(stage.status || 'pending');
    const locked = /locked/i.test(statusText);
    const statusMark = locked ? `<span class="lock-state-icon" title="${h(statusText)}" aria-label="${h(statusText)}">${solidIndustryIcon('lock')}</span>` : h(statusText);
    return `<article class="seller-control-stage ${h(statusText)}"><span>${h(stage.label)}</span><b>${statusMark}</b><p>${h(stage.detail)}</p></article>`;
  }).join('');
  const buyerRows = asArray(control.buyerRows).map((buyer, index) => `<div class="seller-control-row buyer-gate-row">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(buyer.name)}</b><small>${h(buyer.market || 'market pending')} · ${h(buyer.recentBuilds)} permit proofs · ${h(buyer.contact || 'contact to find')}</small></div>
    <em>${buyer.gate?.unlocked ? 'unlocked' : `missing ${h(asArray(buyer.gate?.missing).slice(0, 2).join(' + ') || 'buy-box field')}`}</em>
  </div>`).join('');
  const sellerRows = asArray(control.sellerRows).map((seller, index) => `<div class="seller-control-row seller-gate-row ${seller.locked ? 'locked' : 'ready'}">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(seller.address)}</b><small>${h(seller.ownerName)} · ${h(seller.market || control.state)} · ${h(seller.motivation?.temperature || 'Watch')} seller motivation</small></div>
    <em>${h(seller.nextAction)}</em>
  </div>`).join('');
  return `<section id="seller-search-control" class="seller-control-panel" aria-label="Buyer-first seller search control layer">
    <div class="seller-control-hero">
      <span class="eyebrow">Seller search control layer · ${h(control.state || 'TN')}</span>
      <h3>Six buyer gates before seller work.</h3>
      <p>${h(control.nextAction || 'Validate buyer demand first, then unlock skip trace, seller calls, contract/title, buyer memo and feedback loop in order.')}</p>
      <div class="seller-control-metrics">
        <div><b>${h(control.stats?.buyers || 0)}</b><span>buyer candidates</span></div>
        <div><b>${h(control.stats?.unlockedBuyers || 0)}</b><span>buy boxes unlocked</span></div>
        <div><b>${h(control.stats?.sellerCandidates || 0)}</b><span>public seller records</span></div>
        <div><b>${h(control.stats?.callReady || 0)}</b><span>seller-call ready</span></div>
      </div>
    </div>
    <div class="seller-control-stages">${stageRows}</div>
    <div class="seller-control-grid">
      <article><div class="panel-kicker"><span>Buyer gates</span><b>capture before seller search</b></div>${buyerRows || '<p>No buyer candidates for this state yet. Pull permit-active builders first.</p>'}</article>
      <article><div class="panel-kicker"><span>Seller gates</span><b>public records stay held back until enriched</b></div>${sellerRows || '<p>No seller candidates for this state yet. Pull owner parcels only after buyer proof.</p>'}</article>
    </div>
  </section>`;
}

function renderSellerCallReference() {
  return `<article id="seller-call-reference" class="execution-call-reference" aria-label="Seller call reference">
    <div class="panel-kicker"><span>Seller call reference</span><b>manual operator script</b></div>
    <p>Use this only after a buyer-backed parcel has a verified owner contact. The webapp stores the script; subagents should reference it, not perform outreach.</p>
    <blockquote>Hi, this is Okeito. I’m calling about your lot at [property address]. My partners and I buy land in [market], usually cash, and we can move quickly if the property fits. Would you consider selling it?</blockquote>
    <div class="seller-script-grid">
      <div><b>If yes</b><span>Do you already have a number in mind?</span></div>
      <div><b>Capture</b><span>Ask, reason, timeline, title/ownership issues, road, utilities, flood/wetland/zoning, permission to follow up.</span></div>
      <div><b>Do not promise</b><span>Offer, close date, or buyer package waits until the buildability/title gate is checked.</span></div>
    </div>
  </article>`;
}

function renderExecutionConveyor(conveyor = {}) {
  const stages = asArray(conveyor.stageRows).map(stage => `<article class="execution-stage ${h(stage.status)}"><span>${h(stage.label)}</span><b>${h(stage.status)}</b><p>${h(stage.detail)}</p></article>`).join('');
  const batchRows = asArray(conveyor.matchedSellerBatch).slice(0, 5).map((row, index) => `<div class="execution-row">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <div><b>${h(row.address || row.parcelId)}</b><small>${h(row.buyerName)} · ${h(row.ownerName || 'public owner')} · ${h(row.lotSize || 'lot size pending')}</small></div>
    <em>${h(row.nextAction || 'skip trace')}</em>
  </div>`).join('');
  const callRows = asArray(conveyor.callReadySellers).slice(0, 4).map((row, index) => {
    const parcelKey = h(row.id || row.parcelId || '');
    const outcomeOptions = [
      ['seller_interested', 'Interested'], ['seller_maybe', 'Maybe'], ['seller_rejected', 'No'], ['bad_number', 'Bad number'],
      ['wrong_owner', 'Wrong owner'], ['price_too_high', 'Price too high'], ['title_issue', 'Title issue'], ['needs_callback', 'Needs callback'],
    ];
    const outcomeButtons = outcomeOptions.map(([key, label]) => `<button type="button" class="execution-outcome ${row.callOutcome === key ? 'active' : ''}" data-execution-call-outcome="${key}" data-parcel-id="${parcelKey}">${label}</button>`).join('');
    return `<article class="execution-call-card ${row.readyForSellerCall ? 'ready' : 'blocked'}" data-phase7-seller-card="${parcelKey}">
      <div class="execution-card-top"><span>${String(index + 1).padStart(2, '0')} seller cockpit</span><b>${h(row.ownerName || 'owner')} · ${h(row.address || row.parcelId)}</b><p>${h(row.nextAction)}</p></div>
      <div class="execution-outcomes" aria-label="Seller call outcomes">${outcomeButtons}</div>
      <div class="phase7-capture-grid" data-execution-capture="${parcelKey}">
        <label>Seller ask<input class="phase7-ask" value="${h(row.sellerAskingPrice || row.askingPrice || '')}" placeholder="$42,000 or counter"></label>
        <label>Timeline<input class="phase7-timeline" value="${h(row.sellerTimeline || '')}" placeholder="now / 30 days / after probate"></label>
        <label>Callback date<input class="phase7-callback" type="date" value="${h(row.nextFollowUp || '')}"></label>
        <label>Motivation<textarea class="phase7-motivation" rows="2" placeholder="tax fatigue, unused lot, inherited, moving...">${h(row.sellerMotivation || row.sellerCallCapture?.motivation || '')}</textarea></label>
        <label>Access + buildability<textarea class="phase7-access" rows="2" placeholder="road, utilities, slope, wetland language from seller">${h(row.accessBuildabilityNotes || row.sellerCallCapture?.accessBuildability || '')}</textarea></label>
        <label>Exact seller language<textarea class="phase7-language" rows="2" placeholder="quote the owner; do not invent">${h(row.exactSellerLanguage || row.sellerCallCapture?.exactLanguage || '')}</textarea></label>
      </div>
      <div class="phase7-gate-rail">
        <div><span>Contract/title gate</span><b>${h(row.contract?.label || 'not ready')}</b><small>${h(row.contract?.blockers?.join(' · ') || 'owner/contact/source/buyer fit/title path clear enough to prepare packet')}</small></div>
        <div><span>Buyer memo</span><b>${h(row.memo?.subject || 'memo waits')}</b><small>${h(row.memo?.ask || 'Capture seller outcome and price before sending buyer packet.')}</small></div>
        <div><span>Close probability</span><b>${h(row.checklist?.probability || 0)}%</b><small>${h(row.checklist?.next?.label || 'clear next gate')}</small></div>
      </div>
      <div class="phase7-actions"><button type="button" class="secondary compact-action" data-download-execution-memo="${parcelKey}">Download buyer memo</button><span class="phase7-save-status">${h(row.callOutcome ? `Saved: ${row.sellerCallOutcome || row.callOutcome}` : 'Outcome not captured yet')}</span></div>
      <ul>
        <li><b>Opener</b><span>${h(row.ownerCallScript?.opener || row.ownerCallScript?.summary || 'Confirm interest and seller timeline.')}</span></li>
        <li><b>Net offer</b><span>${h(row.sellerNetOfferScript?.headline || row.sellerNetOfferScript?.summary || 'Calculate seller net before promise.')}</span></li>
        <li><b>Title</b><span>${h(row.contract?.label || 'contract/title gate pending')}</span></li>
      </ul>
    </article>`;
  }).join('');
  const feedbackRows = asArray(conveyor.feedbackRecommendations).slice(0, 3).map(row => `<div class="execution-row quiet">
    <span>${productIcon('loop')}</span><div><b>${h(row.address || row.parcelId)}</b><small>${h(row.nextCallReason || 'No feedback penalty yet.')}</small></div><em>${h(row.adjustedScore || row.score || 0)}/100</em>
  </div>`).join('');
  const firstSkipTraceRow = asArray(conveyor.matchedSellerBatch)[0] || asArray(conveyor.board?.sellerMatches).find(row => !(row.ownerPhone || row.ownerEmail || row.realContact)) || {};
  const enrichedCount = asArray(conveyor.callReadySellers).length;
  const skipTraceGateCopy = enrichedCount
    ? `${enrichedCount} skip-traced/enriched owner contacts are now flowing into seller cockpit review. Keep title/contract gates honest before promising terms.`
    : 'Paste the provider skip-trace return or successful owner-enrichment result here after exporting the matched seller CSV. Verified phone/email promotes the row; missing, low-confidence, DNC, or opt-out contact stays in needs-skip-trace.';
  const importStatus = lastBuilderSkipTraceImportStatus || (firstSkipTraceRow.parcelId ? 'Waiting for skip-trace return CSV from the matched seller batch.' : 'No matched seller rows available to enrich yet.');
  return `<section id="execution-conveyor" class="execution-conveyor-panel" aria-label="Buyer to seller execution conveyor">
    <div class="execution-conveyor-head">
      <span class="eyebrow">Phase 7 · call-to-close control loop</span>
      <h3>Turn imported seller contact into outcome, title gate, buyer memo, and feedback in one luminous cockpit.</h3>
      <p>${h(conveyor.nextAction || 'Capture a complete buyer call before creating seller motion.')} The chain is now one surface: saved builder buy box → matched seller CSV → inline skip-trace return → seller-call outcome → contract/title gate → buyer-send memo → buyer feedback rewrite.</p>
      <div class="execution-metrics">
        <div><b>${h(conveyor.stats?.validatedBuyers || 0)}</b><span>validated buyers</span></div>
        <div><b>${h(conveyor.stats?.matchedSellerBatch || 0)}</b><span>matched seller export</span></div>
        <div><b>${h(conveyor.stats?.promotedSellerCalls || 0)}</b><span>seller call cockpit</span></div>
        <div><b>${h(conveyor.stats?.memoReady || 0)}</b><span>memo/title ready</span></div>
      </div>
    </div>
    <div class="execution-stages">${stages}</div>
    <div class="execution-grid">
      <article><div class="panel-kicker"><span>Matched seller batch</span><b>export before skip trace</b></div>${batchRows || '<p>No buyer-box-matched seller batch yet. Buyer proof still leads.</p>'}<button id="export-matched-seller-batch" class="secondary compact-action" type="button">Download matched seller CSV</button><span id="matched-seller-export-status"></span></article>
      <article class="skiptrace-return-card"><div class="panel-kicker"><span>Skip-trace / enrichment return gate</span><b>verified phone/email promotes, never fabricates</b></div><p>${h(skipTraceGateCopy)}</p><pre class="skiptrace-format">parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis\n${h(firstSkipTraceRow.parcelId || 'parcel-id')},${h(firstSkipTraceRow.ownerName || 'Public Owner')},865-555-0198,owner@example.com,high,manual lookup,same owner + mailing city</pre><textarea id="builder-skip-trace-csv" rows="5" placeholder="parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis"></textarea><div class="skiptrace-actions"><button id="builder-load-skiptrace-template" class="secondary compact-action" type="button">Use first matched row</button><button id="builder-import-skiptrace" class="compact-action" type="button">Import return + recompute cockpit</button></div><span id="builder-skiptrace-status">${h(importStatus)}</span></article>
    </div>
    ${renderSellerCallReference()}
    <div class="execution-call-grid">${callRows || '<article class="execution-call-card blocked"><b>No seller call cockpit is armed.</b><p>Public records stay held for skip trace until real phone/email and title/contract readiness exist.</p></article>'}</div>
    <article class="execution-feedback-card"><div class="panel-kicker"><span>Feedback rewrite</span><b>${h(conveyor.feedbackLoop?.totalFeedback || 0)} buyer answers captured</b></div><p>${h(conveyor.feedbackLoop?.tightening || 'Buyer yes/no/maybe will rewrite tomorrow’s seller-call order.')}</p>${feedbackRows}</article>
  </section>`;
}

function renderClosingDeskPanel() {
  const target = document.querySelector('#title-closing-panel');
  if (!target) return;
  const visible = getVisibleParcels();
  const selected = getSelectedParcel(visible);
  if (!selected) {
    target.innerHTML = `<div class="closing-page-stack"><div class="primary-action-strip closing-primary-action"><span>Next action</span><b>Select one buyer-backed deal before escrow or title work.</b><a href="#deals" data-view="deals">Open deals ${productIcon('arrow')}</a></div>${renderContractComposer()}${renderClosingDeskResearchDeck()}<article class="closing-empty-state designed-empty-state" aria-label="Closing desk empty state"><div class="empty-state-icon">${solidIndustryIcon('empty')}</div><span class="eyebrow">Closing waits for a real file</span><h3>Select a buyer-backed deal to open escrow work.</h3><p>The desk stays intentionally quiet until a seller record has buyer demand, public provenance, and contract/title readiness.</p><a href="#deals" data-view="deals">Open deals ${productIcon('arrow')}</a></article></div>`;
    return;
  }
  const buyer = getBuyer(selected);
  const alternatives = scoredParcels().slice(0, 5).map((parcel, index) => {
    const desk = buildTitleCompanyClosingDesk(parcel, getBuyer(parcel));
    const parcelKey = parcelSelectionKey(parcel);
    return `<button type="button" class="queue-item ${parcelKey === parcelSelectionKey(selected) ? 'active' : ''}" data-select-parcel="${h(parcelKey)}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(parcel.address || parcel.parcelId || 'Untitled parcel')}</b>
      <small>${h(desk.titleCompany.name || 'title company missing')} · ${h(desk.status)}</small>
      <em>${formatMoney(desk.math.assignmentFee)} assignment fee · ${desk.readiness}% ready</em>
      ${badge(desk.label, statusTone(desk.status))}
    </button>`;
  }).join('');
  target.innerHTML = `<div class="closing-page-stack">
    <div class="primary-action-strip closing-primary-action"><span>Next action</span><b>Clear the title packet for ${h(selected.address || selected.parcelId || 'the selected deal')}.</b><a href="#contract-document-live">Review packet ${productIcon('arrow')}</a></div>
    ${renderContractComposer(selected)}
    ${renderClosingDeskResearchDeck()}
    <div class="closing-layout">
      <aside class="deal-queue closing-queue" aria-label="Closing file queue">
        <div class="queue-header"><span class="eyebrow">Closing files</span><strong>${h(scoredParcels().length)} deals</strong></div>
        <div class="queue-list">${alternatives}</div>
      </aside>
      <div>${renderTitleClosingDesk(selected, buyer)}</div>
    </div>
  </div>`;
}

function renderLandQueue(visible = [], selected = null) {
  const selectedKey = selected ? parcelSelectionKey(selected) : '';
  return `<aside class="deal-queue land-ledger-queue phase215-queue-rail" aria-label="Land parcel queue">
    <div class="queue-header"><span class="eyebrow">Queue</span><strong>${visible.length} parcels</strong></div>
    <div class="land-ledger-legend" aria-label="Land listing state legend"><span class="state-offer-ready">offer-ready</span><span class="state-matched-enriched">matched + enriched</span><span class="state-builder-match">builder match</span><span class="state-enriched">enriched</span><span class="state-contact-candidate">contact candidate</span><span class="state-visible-source">source</span><span class="state-needs-proof">needs proof</span><span class="state-raw-finding">raw</span></div>
    <div class="queue-list">${visible.map((parcel, index) => {
      const parcelKey = parcelSelectionKey(parcel);
      const isActive = parcelKey === selectedKey;
      const listingState = parcel._listingState || parcelListingState(parcel);
      const dallasProofRow = dallasProofRowForParcel(parcel);
      const dallasAggregate = dallasProofRow ? dallasProofAggregateStatus(dallasProofRow) : null;
      const dallasSprintChip = dallasProofRow ? `<mark class="dallas-sprint-chip">Sprint #${h(dallasProofRow.sprintRank || dallasProofRow.rank)}</mark><mark class="dallas-proof-row-chip is-${h(dallasAggregate.tone)}">${h(dallasAggregate.label)}</mark>` : '';
      const tone = parcel.action === 'Call now' ? 'good' : parcel.action === 'Kill' ? 'bad' : parcel.risk.status === 'Review' ? 'warn' : 'neutral';
      const queueReason = listingState.needsProof || listingState.rawFinding
        ? 'Public proof needed'
        : !listingState.enriched
          ? 'Verified contact needed'
          : !listingState.builderMatched
            ? 'Buyer fit needed'
            : listingState.offerReady ? 'Offer review ready' : 'Review seller action';
      const queueActionCode = listingState.needsProof || listingState.rawFinding
        ? 'Proof'
        : !listingState.enriched
          ? listingState.sourceBacked ? 'Trace' : 'Call'
          : !listingState.builderMatched
            ? 'Fit'
            : listingState.offerReady ? 'Offer' : 'Next';
      const queueActionClass = queueActionCode.toLowerCase();
      const queueMarketLabel = `${rowState(parcel) || 'state unknown'} · ${parcel.landMarketKey || 'market unknown'}`;
      const queueStateScent = parcel.selectedMarketMatch ? 'In lane' : 'Adjacent';
      const proofState = listingState.sourceBacked ? 'ready' : listingState.needsProof ? 'needed' : 'raw';
      const contactState = listingState.enriched ? 'ready' : listingState.contactCandidate ? 'candidate' : 'needed';
      const fitState = listingState.builderMatched ? 'ready' : 'needed';
      const landActivity = itemActivity('land', parcelKey);
      const itemName = parcel.address || parcel.parcelId || 'land item';
      const activityButtons = ACTIVITY_CHANNELS.map(channel => activityToggleButton({
        scope: 'land',
        itemId: parcelKey,
        channel,
        name: itemName,
        state: landActivity[channel] || {},
        className: 'land-activity-toggle',
      })).join('');
      return `<article class="queue-item land-listing-row phase209-scan-rail-row phase225-action-rail-row action-${h(queueActionClass)} ${isActive ? 'active' : ''} listing-${h(listingState.stage)} ${dallasProofRow ? 'in-dallas-proof-sprint' : ''} ${parcel.selectedMarketMatch ? 'in-selected-market' : 'outside-selected-market'} ${parcel.selectedStateMatch ? 'in-selected-state' : 'outside-selected-state'}" title="${h(listingState.detail)}" data-land-activity-row="${h(parcelKey)}">
        <button type="button" class="land-row-select" data-select-parcel="${h(parcelKey)}" aria-label="Select ${h(itemName)} - ${h(queueReason)}">
          <span class="land-row-action-rail"><b>${h(queueActionCode)}</b><i>${String(index + 1).padStart(2, '0')}</i></span>
          <b>${h(itemName)}</b>
          <small><strong>${h(queueStateScent)}</strong><i>${h(queueMarketLabel)}</i></small>
          <em><strong>${h(queueReason)}</strong><i>${h(listingState.confidence)} conf · ${h(parcel.score)} score</i></em>
          <div class="land-row-signals phase209-proof-contact-fit" aria-label="Proof contact buyer-fit state">
            <mark class="proof-${h(proofState)}">${proofState === 'ready' ? 'Proof' : proofState === 'needed' ? 'Proof needed' : 'Raw'}</mark>
            <mark class="contact-${h(contactState)}">${contactState === 'ready' ? 'Contact' : contactState === 'candidate' ? 'Candidate' : 'Contact needed'}</mark>
            <mark class="fit-${h(fitState)}">${fitState === 'ready' ? 'Buyer fit' : 'Fit needed'}</mark>
            ${dallasSprintChip}
            <mark class="risk-${h(tone)}">${h(parcel.risk.status)}</mark>
          </div>
        </button>
        <div class="land-activity-row" aria-label="Activity tracking for ${h(itemName)}">${activityButtons}</div>
      </article>`;
    }).join('')}</div>
  </aside>`;
}

function renderParcels() {
  const visible = getVisibleParcels();
  const selected = selectedParcelId ? getSelectedParcel(visible) : null;
  const target = document.querySelector('#parcels');
  if (!target) return;
  const landControls = renderLandControls();
  const agentIntakeGate = renderLandAgentIntakeGate();
  const landReconImportPath = renderLandReconImportPath();
  const dallasProofSurface = renderDallasProofSprintSurface();
  const landSupportDrawer = renderLandSupportDrawer(agentIntakeGate, dallasProofSurface, landReconImportPath);

  if (selectedLandStateFilter === 'all') {
    selectedParcelId = '';
    target.innerHTML = `${landControls}${landSupportDrawer}`;
    return;
  }

  if (!selected) {
    const selectedMarket = getSelectedDealsMarket();
    if (visible.length) {
      target.innerHTML = `${landControls}<div class="deal-workbench phase206-selected-state-workbench phase210-lightweight-selection">
        ${renderLandQueue(visible, null)}
        <article class="deals-empty-state phase38-deals-empty phase210-select-parcel-prompt phase215-inspector-prompt" aria-label="Select parcel prompt">
          <span class="eyebrow">Inspector</span>
          <h3>Choose a parcel.</h3>
          <p class="deals-empty-why">The sheet opens only when you ask for it. Until then, the queue stays fast and scan-first.</p>
          <p class="deals-empty-next">${h(visible.length)} ${h(selectedLandStateFilter)} records · next: proof, contact, or buyer fit.</p>
        </article>
      </div>${landSupportDrawer}`;
      return;
    }
    target.innerHTML = `${landControls}${landSupportDrawer}<article class="deals-empty-state phase38-deals-empty" aria-label="Deals empty state">
      <span class="eyebrow">No ready deals</span>
      <h3>${h(selectedMarket ? `${selectedMarket.marketLabel || selectedMarket.label} is intentionally quiet.` : 'This lane is intentionally quiet.')}</h3>
      <p class="deals-empty-why"><b>Why empty:</b> ${h(selectedMarket ? 'this market is visible, but no public seller record currently clears buyer demand, reachable owner contact, and offer readiness.' : 'no public seller record currently has buyer demand, reachable owner contact, and offer readiness at the same time.')}</p>
      <a class="deals-empty-next" href="#builders" data-view="builders">Validate one buyer first ${productIcon('arrow')}</a>
    </article>`;
    return;
  }

  const buyer = getBuyer(selected);
  const buyBox = calculateBuyBoxCompleteness(buyer);
  const motivation = calculateSellerMotivation(selected);
  const contractGate = calculateContractReadiness(selected, buyer);
  const sellerNet = generateSellerNetOfferScript(selected, buyer);
  const neighborPrompt = generateNeighborPrompt(selected);
  const operatorChecklist = buildOperatorChecklist(selected, buyer);
  const buyerMemo = generateBuyerSendMemo(selected, buyer, generateOfferPacket(selected, buyer));
  const selectedListingState = parcelListingState(selected);
  const selectedDallasProofRow = dallasProofRowForParcel(selected);
  const selectedDallasProofAggregate = selectedDallasProofRow ? dallasProofAggregateStatus(selectedDallasProofRow) : null;
  const selectedDallasProofPanel = selectedDallasProofRow ? `<details class="selected-dallas-proof-panel phase212-proof-depth" aria-label="Selected Dallas proof sprint detail">
    <summary><span><em class="eyebrow">Dallas proof sprint #${h(selectedDallasProofRow.sprintRank || selectedDallasProofRow.rank)}</em><b>Utility + recorded plat gate.</b></span><strong>${h(selectedDallasProofAggregate.label)}</strong></summary>
    <div class="selected-dallas-proof-body"><div><p>${h(selectedDallasProofRow.operatorNextAction || 'Verify utilities/taps and recorded plat before owner enrichment.')}</p><mark class="dallas-proof-aggregate is-${h(selectedDallasProofAggregate.tone)}">${h(selectedDallasProofAggregate.label)}</mark></div>
    ${dallasProofGateStrip(selectedDallasProofRow)}
    <div class="selected-dallas-proof-links">
      ${selectedDallasProofRow.dcadAccountUrl ? safeLink(selectedDallasProofRow.dcadAccountUrl, 'Open DCAD account', 'proof-inline-link') : ''}
      ${selectedDallasProofRow.cityParcelQueryUrl ? safeLink(selectedDallasProofRow.cityParcelQueryUrl, 'Open City parcel API', 'proof-inline-link') : ''}
      ${selectedDallasProofRow.dallasCountyPublicSearchUrl ? safeLink(selectedDallasProofRow.dallasCountyPublicSearchUrl, 'Open recorded plat search', 'proof-inline-link') : ''}
      ${selectedDallasProofRow.dallasWaterUtilitiesUrl ? safeLink(selectedDallasProofRow.dallasWaterUtilitiesUrl, 'Dallas Water Utilities', 'proof-inline-link') : ''}
      ${selectedDallasProofRow.oncorServiceUrl ? safeLink(selectedDallasProofRow.oncorServiceUrl, 'Oncor', 'proof-inline-link') : ''}
      ${selectedDallasProofRow.atmosServiceUrl ? safeLink(selectedDallasProofRow.atmosServiceUrl, 'Atmos', 'proof-inline-link') : ''}
    </div>
    <dl>
      <div><dt>Water/sewer</dt><dd>${h(selectedDallasProofRow.waterSewerProofStatus || 'needs-proof')}</dd></div>
      <div><dt>Electric/gas</dt><dd>${h(selectedDallasProofRow.electricGasProofStatus || 'needs-proof')}</dd></div>
      <div><dt>Recorded plat</dt><dd>${h(selectedDallasProofRow.recordedPlatProofStatus || 'needs-proof')}</dd></div>
      <div><dt>Builder zoning</dt><dd>${h(selectedDallasProofRow.zoningBuilderAcceptedStatus || 'unknown')}</dd></div>
    </dl>
    <p class="selected-dallas-search-terms"><b>County search terms:</b> ${h(selectedDallasProofRow.dallasCountySearchTerms || 'search terms pending')}</p></div>
  </details>` : '';
  const riskTone = selected.risk.status === 'Pass' ? 'good' : selected.risk.status === 'Review' ? 'warn' : 'bad';
  const actionTone = selected.action === 'Call now' ? 'good' : selected.action === 'Mail first' ? 'warn' : selected.action === 'Kill' ? 'bad' : 'neutral';
  const selectedCallable = selected.action === 'Call now' && Boolean(selected.ownerPhone || selected.ownerEmail) && !selectedListingState.needsProof && !selectedListingState.rawFinding;
  const selectedPrimaryAction = selectedCallable ? 'Call selected' : selectedListingState.needsProof || selectedListingState.rawFinding ? 'Attach proof' : selectedListingState.contactCandidate ? 'Verify contact' : 'Review selected';
  const selectedMoneyReady = Boolean(selectedListingState.offerReady);
  const selectedMoneyGateCopy = selectedMoneyReady
    ? 'Money is ready to inspect because proof, contact, buyer fit, and spread are aligned.'
    : 'Money stays parked until proof, contact, and buyer fit are clean.';
  const selectedNeighborhoodLinks = [
    selected.zillowNeighborhoodUrl ? safeLink(selected.zillowNeighborhoodUrl, selected.zillowNeighborhoodLabel || 'Zillow neighborhood view', 'zillow-market-link parcel-context-link') : '',
    selected.zillowZipMarketUrl ? safeLink(selected.zillowZipMarketUrl, 'Zillow ZIP view', 'zillow-market-link parcel-context-link') : '',
  ].filter(Boolean).join('');
  const selectedNeighborhoodContext = selectedNeighborhoodLinks ? `<section class="parcel-context-links" aria-label="Neighborhood context links"><span>Neighborhood context</span><p>${h(selected.zillowNeighborhoodQuery || `${selected.propertyAddress || selected.address || ''} ${selected.propertyZip || ''}`.trim())}</p><div>${selectedNeighborhoodLinks}</div></section>` : '';
  const selectedSheetStage = selectedListingState.sourceBacked
    ? selectedListingState.enriched
      ? selectedListingState.builderMatched
        ? selectedListingState.offerReady ? 'Offer review' : 'Action review'
        : 'Buyer fit next'
      : 'Contact next'
    : 'Proof first';
  const selectedProofReady = Boolean(selectedListingState.sourceBacked && !selectedListingState.needsProof && !selectedListingState.rawFinding);
  const selectedContactReady = Boolean(selectedListingState.enriched);
  const selectedBuyerReady = Boolean(selectedListingState.builderMatched);
  const selectedGateSummary = `<section class="land-proof-action-gates phase212-progressive-detail" aria-label="Selected parcel proof contact buyer gates">
    <div class="phase212-proof-summary ${selectedProofReady ? 'is-complete' : 'is-next'}"><span>Proof summary</span><b>${selectedProofReady ? 'Source-backed' : 'Attach public proof'}</b><p>${h(selected.sourceUrl || selected.publicSource || selected.intakeMissing?.join(' · ') || 'Attach public source URL and timestamp before contact or pricing.')}</p></div>
    <div class="phase212-next-action"><span>One next action</span><b>${h(selectedListingState.needsProof || selectedListingState.rawFinding ? 'Attach public proof before contact or money review.' : selectedListingState.contactCandidate ? 'Verify one contact, then reopen seller action.' : selectedListingState.enriched && !selectedListingState.builderMatched ? 'Match this owner to a buyer before pricing.' : getNextAction(selected))}</b><a class="${selectedCallable ? '' : 'is-disabled'}" aria-disabled="${selectedCallable ? 'false' : 'true'}" href="${selectedCallable && selected.ownerPhone ? `tel:${h(selected.ownerPhone)}` : '#'}">${h(selectedPrimaryAction)} ${productIcon('arrow')}</a></div>
    <div class="phase212-gate-row ${selectedContactReady ? 'is-complete' : 'is-parked'}"><span>Contact gate</span><b>${selectedContactReady ? 'Verified contact' : selectedListingState.contactCandidate ? 'Candidate only' : 'Locked'}</b><p>${h(selected.ownerPhone || selected.ownerEmail || selected.unverifiedOwnerPhone || selected.unverifiedOwnerEmail || 'No verified phone/email yet.')}</p></div>
    <div class="phase212-gate-row ${selectedBuyerReady ? 'is-complete' : 'is-parked'}"><span>Buyer-fit gate</span><b>${selectedBuyerReady ? 'Matched' : 'Parked'}</b><p>${h(buyer.name || selected.buyerId || 'No buyer criterion attached.')}</p></div>
    <div class="phase212-gate-row ${selectedMoneyReady ? 'is-complete' : 'is-parked'}"><span>Money gate</span><b>${selectedMoneyReady ? 'Ready' : 'Parked'}</b><p>${h(selectedMoneyGateCopy)}</p></div>
  </section>`;
  const duplicateNotice = Number(selected.duplicateMergedCount || 0) > 0 ? `<p class="duplicate-merge-note">Duplicate-safe merge: ${h(selected.duplicateMergedCount)} repeated intake${Number(selected.duplicateMergedCount) === 1 ? '' : 's'} collapsed into this row.</p>` : '';
  const fitRows = [
    ['Buyer fit', buyer.name || 'No matched buyer', `${buyer.score || 0}/100 · ${buyer.buyBox || 'buy box missing'}`],
    ['Seller contact', selected.ownerName || selected.owner || 'Owner unknown', selected.ownerPhone || selected.ownerEmail || 'Needs skip trace'],
    ['Buildability', selected.risk.status, selected.flags.length ? selected.flags.join(', ') : 'clean first pass'],
    ['Next action', selected.action, getNextAction(selected)],
  ];
  const stateListingStates = visible.map(parcelListingState);
  const stateSourceBackedCount = stateListingStates.filter(row => row.sourceBacked).length;
  const stateEnrichedCount = stateListingStates.filter(row => row.enriched).length;
  const stateBuilderFitCount = stateListingStates.filter(row => row.builderMatched).length;
  const stateOfferReadyCount = stateListingStates.filter(row => row.offerReady).length;
  const stateNextAction = stateOfferReadyCount > 0
    ? 'Work the offer-ready row before opening more research.'
    : stateEnrichedCount > 0
      ? 'Match enriched owners to a buyer before drafting offers.'
      : stateSourceBackedCount > 0
        ? 'Enrich one source-backed owner contact.'
        : 'Attach public proof before contact work.';
  const stateWorkbenchBrief = `<section class="land-state-workbench-brief phase206-land-state-workbench" aria-label="Selected state operating brief">
    <div class="land-state-brief-copy"><span class="eyebrow">${h(selectedLandStateFilter)} lane</span><h3>Work one clean next action.</h3><p>${h(stateNextAction)} Keep proof, contact, buyer fit, and offer readiness in one scan line.</p></div>
    <div class="land-state-brief-ledger">
      <div><span>Retained</span><b>${h(visible.length)}</b></div>
      <div><span>Source-backed</span><b>${h(stateSourceBackedCount)}</b></div>
      <div><span>Owner enriched</span><b>${h(stateEnrichedCount)}</b></div>
      <div><span>Buyer-fit</span><b>${h(stateBuilderFitCount)}</b></div>
      <div><span>Offer-ready</span><b>${h(stateOfferReadyCount)}</b></div>
    </div>
  </section>`;

  target.innerHTML = `${landControls}${stateWorkbenchBrief}<div class="deal-workbench phase206-selected-state-workbench">
    <div class="primary-action-strip deals-primary-action phase208-operator-action"><span>Next action</span><b>${h(selectedListingState.needsProof || selectedListingState.rawFinding ? 'Attach public proof before contact or money review.' : selectedListingState.contactCandidate ? 'Verify one contact, then reopen seller action.' : selectedListingState.enriched && !selectedListingState.builderMatched ? 'Match this owner to a buyer before pricing.' : getNextAction(selected))}</b><a class="${selectedCallable ? '' : 'is-disabled'}" aria-disabled="${selectedCallable ? 'false' : 'true'}" href="${selectedCallable && selected.ownerPhone ? `tel:${h(selected.ownerPhone)}` : '#'}">${h(selectedPrimaryAction)} ${productIcon('arrow')}</a></div>
    ${renderLandQueue(visible, selected)}

    <article class="deal-detail land-calm-operator-sheet phase208-calm-operator-sheet ${selectedMoneyReady ? 'is-money-ready' : 'is-money-parked'}" aria-label="Selected parcel calm operator sheet">
      <div class="detail-hero">
        <span class="eyebrow">Selected land listing · ${h(selectedListingState.label)}</span>
        <h2>${h(selected.address || selected.parcelId || 'Untitled parcel')}</h2>
        <p>${h(selectedListingState.detail)} ${h(selected.lotSize || 'lot size unknown')} · held ${h(selected.heldYears || 0)} yrs · paid ${formatMoney(Number(selected.paid || 0))}</p>
        ${duplicateNotice}
        <div class="badge-stack">${badge(`${selected.score} deal score`, actionTone)}${badge(selected.action, actionTone)}${badge(selected.risk.status, riskTone)}</div>
      </div>
      ${selectedNeighborhoodContext}
      ${selectedGateSummary}
      ${selectedDallasProofPanel}
      <section class="land-action-sheet phase212-action-depth" aria-label="Selected parcel action sheet">
        <details class="seller-net-script-card phase212-seller-script">
          <summary><span><em class="eyebrow">Seller action script</em><b>${h(sellerNet.headline)}</b></span><strong>Script</strong></summary>
          <p>${h(sellerNet.netLine)}</p>
          <p><strong>Ask:</strong> ${h(sellerNet.ask)}</p>
          <p><strong>Neighbor alpha:</strong> ${h(neighborPrompt)}</p>
        </details>
        ${renderOperatorChecklist(operatorChecklist, { compact: true, open: false })}
      </section>
      <details class="land-money-sheet phase208-money-last" ${selectedMoneyReady ? 'open' : ''} aria-label="Selected parcel money review">
        <summary><span><em class="eyebrow">Money review</em><b>${h(selectedMoneyGateCopy)}</b></span><strong>${selectedMoneyReady ? 'Ready' : 'Parked'}</strong></summary>
        <div class="deal-strip five">
          <div><span>Buyer price</span><b>${formatMoney(selected.offer.buyerPrice)}</b></div>
          <div><span>Seller ask</span><b>${formatMoney(selected.metrics.askingPrice)}</b></div>
          <div><span>Initial offer</span><b>${formatMoney(selected.offer.initialSellerOffer)}</b></div>
          <div><span>Max offer</span><b>${formatMoney(selected.offer.maxSellerOffer)}</b></div>
          <div><span>Spread</span><b>${formatMoney(selected.metrics.spread)}</b></div>
        </div>
        <div class="phase-one-detail-grid">
          <article class="phase-detail-card"><span>Buy box completeness</span><b>${h(buyBox.percent)}%</b><p>${h(buyBox.missing.slice(0, 2).join(' · ') || 'Buyer criteria complete enough for seller matching.')}</p></article>
          <article class="phase-detail-card"><span>Seller motivation</span><b>${h(motivation.score)} · ${h(motivation.temperature)}</b><p>${h(motivation.signals.slice(0, 3).join(' · ') || 'No strong motivation signal yet.')}</p></article>
          <article class="phase-detail-card"><span>Contract gate</span><b>${h(contractGate.score)}%</b><p>${h(contractGate.blockers.slice(0, 2).join(' · ') || contractGate.label)}</p></article>
        </div>
      </details>
      <section class="land-settings-sheet" aria-label="Buyer memo and feedback settings">
        ${renderBuyerSendMemoCard(buyerMemo, { compact: true, open: false })}
        ${renderBuyerFeedbackCapture(selected, buyer)}
      </section>
      <details class="land-raw-depth" aria-label="Owner source and intake detail">
        <summary><span><em class="eyebrow">Raw depth</em><b>Owner, buyer, risk, source, and intake fields.</b></span><strong>Open only when editing evidence</strong></summary>
        <div class="detail-grid">
          <div><span>Owner</span><b>${h(selected.ownerName || selected.owner || 'unknown')}</b><p>${h(selected.ownerPhone || selected.ownerEmail || selected.unverifiedOwnerPhone || selected.unverifiedOwnerEmail || 'contact missing')}</p></div>
          <div><span>Buyer</span><b>${h(selected.buyerContactName || buyer.contactName || buyer.name || 'missing')}</b><p>${h(selected.buyerPhone || buyer.phone || '')} ${h(selected.buyerEmail || buyer.email || '')}</p></div>
          <div><span>Risk notes</span><b>${h(selected.risk.status)}</b><p>${h(selected.flags.join(', ') || 'No first-pass risk flags.')}</p></div>
          <div><span>Source notes</span><b>${h(selected.parcelId || selected.id)}</b><p>${h(selected.acquisitionNotes || selected.notes || 'No notes yet.')}</p></div>
          <div><span>Intake confidence</span><b>${h(selectedListingState.confidence)} / 100</b><p>${h(selected.intakeMissing?.join(' · ') || selected.agentIntakeStatus || 'No missing intake fields recorded.')}</p></div>
        </div>
      </details>
      <details class="detail-disclosure"><summary>Show CRM fields</summary>${crmControls(selected)}</details>
    </article>

    <aside class="deal-action" aria-label="Buyer fit and next action">
      <div class="next-action-card">
        <span class="eyebrow">Next</span>
        <h3>${h(selectedListingState.needsProof || selectedListingState.rawFinding ? 'Research proof before promotion.' : getNextAction(selected))}</h3>
        <div class="button-row"><a class="button-link ${selectedCallable ? '' : 'is-disabled'}" aria-disabled="${selectedCallable ? 'false' : 'true'}" href="${selectedCallable && selected.ownerPhone ? `tel:${h(selected.ownerPhone)}` : '#'}">${selectedCallable ? 'Call owner' : 'Call locked'}</a><button type="button" class="secondary" data-view="machine">${selectedListingState.offerReady ? 'Open offer packet' : 'Review proof gate'}</button></div>
      </div>
      <div class="fit-stack">${fitRows.map(([label, title, detail]) => `<div class="fit-card"><span>${h(label)}</span><b>${h(title)}</b><p>${h(detail)}</p></div>`).join('')}</div>
      <div class="tags">${selected.reasons.map(r => badge(r, 'good')).join('')}${selected.flags.length ? selected.flags.map(f => badge(f, riskTone)).join('') : badge('clean first pass', 'good')}</div>
    </aside>
  </div>${landSupportDrawer}`;
}

function renderFreeGovOwnerSourceBoard() {
  if (!freeGovOwnerSources) return '<section class="free-gov-owner-board"><p>Loading free-government owner source matrix…</p></section>';
  if (freeGovOwnerSources.error) return `<section class="free-gov-owner-board"><p>Free-government owner source matrix not loaded: ${h(freeGovOwnerSources.error)}.</p></section>`;
  const summary = freeGovOwnerSources.summary || {};
  const markets = asArray(freeGovOwnerSources.markets);
  const agents = asArray(freeGovOwnerSources.agents);
  const activeMarkets = markets.filter(market => Number(market.publicOwnerRecords || 0) > 0).sort((a, b) => Number(b.publicOwnerRecords || 0) - Number(a.publicOwnerRecords || 0));
  const zeroMarkets = markets.filter(market => !Number(market.publicOwnerRecords || 0)).slice(0, 12);
  const activeRows = activeMarkets.map(market => {
    const marketAgents = agents.filter(agent => agent.marketKey === market.key && agent.status === 'ready');
    const sourceLinks = asArray(market.sourceUrls).slice(0, 2).map((url, index) => safeLink(url, index === 0 ? 'Owner record' : 'Public record', 'owner-source-link')).join('');
    return `<article class="owner-source-market is-active">
      <div><span>${h(market.state)} · ${h(market.status)}</span><b>${h(market.market)}</b><p>${h(market.agentNextAction)}</p>${sourceLinks ? `<div class="owner-source-links">${sourceLinks}</div>` : ''}</div>
      <dl><div><dt>Public records</dt><dd>${h(market.publicOwnerRecords)}</dd></div><div><dt>Human anchors</dt><dd>${h(market.humanOwnerAnchors)}</dd></div><div><dt>Verified calls</dt><dd>${h(market.verifiedPhoneEmailContacts)}</dd></div><div><dt>Agents</dt><dd>${h(marketAgents.length)}/5 ready</dd></div></dl>
    </article>`;
  }).join('');
  const zeroRows = zeroMarkets.map(market => `<article class="owner-source-zero"><span>${h(market.state)}</span><b>${h(market.market)}</b><em>${h(market.primaryPublicSource || market.builderPlatform || 'source adapter ready')}</em></article>`).join('');
  const agentRows = agents.filter(agent => agent.status === 'ready').slice(0, 15).map(agent => `<li><span>${h(agent.type)}</span><b>${h(agent.market)}</b><em>${h(agent.instruction)}</em></li>`).join('');
  return `<section class="free-gov-owner-board" aria-label="Free government owner source matrix">
    <div class="free-gov-owner-head">
      <span class="eyebrow">Free gov owner-source agents · zero fabrication</span>
      <h3>Every market is stored. Real land-lot markets get execution agents.</h3>
      <p>County/city owner records become APN + owner + mailing-address anchors. Phone/email remains locked until lawful enrichment; zero-count markets stay visible as source-ready lanes instead of fake queues.</p>
    </div>
    <div class="deal-strip five owner-source-metrics"><div><span>Markets stored</span><strong>${h(summary.marketCount || markets.length)}</strong></div><div><span>With owner rows</span><strong>${h(summary.marketsWithPublicOwnerRecords || activeMarkets.length)}</strong></div><div><span>Zero-count ready</span><strong>${h(summary.zeroCountMarketsReady || 0)}</strong></div><div><span>Owner records</span><strong>${h(summary.publicOwnerRecords || 0)}</strong></div><div><span>Fabricated contacts</span><strong>${h(summary.contactsFabricated ?? 0)}</strong></div></div>
    <div class="free-gov-owner-grid">
      <div class="owner-source-active"><h4>Executing now: listed land lots</h4>${activeRows || '<p>No public owner rows loaded yet.</p>'}</div>
      <div class="owner-source-agents"><h4>Agent work orders</h4><ul>${agentRows || '<li><span>Waiting</span><b>No active agents</b><em>Load source matrix first.</em></li>'}</ul></div>
      <details class="owner-source-zero-lanes" open><summary><span>Zero-count markets remain ready</span><b>${h(summary.zeroCountMarketsReady || zeroMarkets.length)} lanes</b></summary><div>${zeroRows}</div></details>
    </div>
  </section>`;
}

function renderSourcePriorityBoard() {
  const target = document.querySelector('#source-priority-board');
  if (!target) return;
  const landscape = getPermitPortalLandscape();
  const leading = asArray(landscape.leadingMarkets).slice(0, 8);
  const tnMarkets = leading.filter(item => item.state === 'TN');
  const nextMarkets = leading.filter(item => item.state !== 'TN');
  const tierRows = asArray(landscape.tiers).slice(0, 2).map(tier => `<article><span>${h(tier.name.replace(/^Tier \d+ - /, ''))}</span>${asArray(tier.items).slice(0, 3).map(item => safeLink(item.url, item.label, 'priority-source-link')).join('')}</article>`).join('');
  const stackOrder = [
    { code: 'TN', label: 'Tennessee', stance: 'live first', platform: 'Buildchek + direct portals' },
    { code: 'FL', label: 'Inland Florida', stance: 'queued resource lane', platform: 'Accela / EnerGov / Civic Access' },
    { code: 'AZ', label: 'Arizona', stance: 'queued velocity lane', platform: 'Maricopa weekly + Accela cities' },
    { code: 'NC', label: 'North Carolina', stance: 'Piedmont lane', platform: 'Buildchek + Mecklenburg/Wake direct data' },
    { code: 'TX', label: 'Texas', stance: 'fragmented high-volume lane', platform: 'PermitVector + Austin/San Antonio open data' },
    { code: 'GA', label: 'Georgia', stance: 'secondary data-center lane', platform: 'Forsyth/Hall/Jackson/Douglas permit lanes' },
    { code: 'SC', label: 'South Carolina', stance: 'secondary coastal lane', platform: 'Dorchester live + Berkeley watchlist' },
  ];
  const stackRows = stackOrder.map((item, index) => `<article class="priority-stack-step ${index === 0 ? 'active' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><b>${h(item.code)} · ${h(item.label)}</b><small>${h(item.stance)} · ${h(item.platform)}</small></article>`).join('');
  const marketCard = item => `<article class="priority-market ${item.state === 'TN' ? 'is-primary' : ''}">
    <span>${String(item.rank).padStart(2, '0')} · ${h(item.state)}</span>
    <b>${h(item.market)}</b>
    <p>${h(item.reason)}</p>
  </article>`;
  target.innerHTML = `<section class="source-market-priority" aria-label="Priority permit portal markets">
    <div class="source-priority-head">
      <span class="eyebrow">Permit-source priority</span>
      <h3>TN first. Then inland FL, AZ, NC, TX. GA/SC secondary.</h3>
      <p>Priority order stays simple: Tennessee now; inland Florida, Arizona, North Carolina, and Texas as independent lanes. Georgia and South Carolina sit behind them as secondary Southeast expansion lanes.</p>
      <div class="primary-action-strip sources-primary-action"><span>Next action</span><b>Verify the Tennessee source lane before promoting any seller lead.</b><a href="#permit-landscape" data-view="builders">Open lane ${productIcon('arrow')}</a></div>
    </div>
    <div class="source-stack-rail" aria-label="Target-state priority order">${stackRows}</div>
    <div class="source-guardrail"><b>Kentucky guardrail</b><span>If Kentucky records appear, treat them as target-state/HQ leakage unless they carry verified Tennessee permit evidence.</span></div>
    <div class="source-priority-grid">
      <div class="priority-lane primary"><span>Now</span>${tnMarkets.map(marketCard).join('')}</div>
      <div class="priority-lane"><span>Queued lanes</span>${nextMarkets.map(marketCard).join('')}</div>
    </div>
    <details class="priority-stack">
      <summary>Normalize with source adapters</summary>
      <div class="priority-stack-content">${tierRows}</div>
    </details>
  </section>${renderFreeGovOwnerSourceBoard()}`;
}

function renderPipeline() {
  const target = document.querySelector('#pipeline');
  if (!target) return;
  target.innerHTML = stages.map((stage, i) => `<article class="stage">
    <span>${String(i + 1).padStart(2, '0')}</span>
    <strong>${h(stage.name)}</strong>
    <p>${h(stage.desc)}</p>
    ${sourceDisclosure(stage.sourceType)}
  </article>`).join('');
}


function renderOperatorVisionHero({ leadBuyer, boxMeter, moneyQueue, publicSkipTrace, buyerContactQueue, heroMotivation, netScript }) {
  const permitLandscape = getPermitPortalLandscape();
  const leading = asArray(permitLandscape.leadingMarkets).slice(0, 5);
  const builderRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const totalBuilderSignals = knoxvilleBuyerCallSheet?.summary?.totalRecentBuildSignals || builderRows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0);
  const callableBuilders = knoxvilleBuyerCallSheet?.summary?.callablePublicBusinessContacts || builderRows.filter(row => row.phone || row.email).length;
  const missionRows = leading.map((market, index) => `<button type="button" class="mission-market ${index === 0 ? 'active' : ''}" data-view="builders">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(market.market)}</b>
      <small>${h(market.state)} · ${h(market.reason)}</small>
    </button>`).join('');
  const nextActions = [
    { label: 'Call buyer', value: leadBuyer?.name || 'Select permit-active builder', detail: leadBuyer?.phone || leadBuyer?.email || 'Capture max price, geography, close speed, deal killers.' },
    { label: 'Protect seller queue', value: `${publicSkipTrace.length} skip-trace records`, detail: 'Public records stay out of call-ready until a real phone/email is enriched.' },
    { label: 'Open title gate', value: netScript?.headline || 'Contract/title after buyer proof', detail: 'Seller call → net range → title packet → buyer-send memo.' },
  ].map(item => `<article><span>${h(item.label)}</span><b>${h(item.value)}</b><p>${h(item.detail)}</p></article>`).join('');

  return `<section class="vision-hero" aria-label="Land Dealflow operating vision">
    <div class="vision-copy">
      <span class="eyebrow">LandFlip OS · clear path to more deals</span>
      <h1>Turn land deals into a simple daily flow.</h1>
      <p>A light operating system for an old industry: permit evidence finds active builders, builder buy boxes focus the seller search, and every screen points to the next deal-making action.</p>
      <div class="vision-actions">
        <a class="button-link" href="#builders" data-view="builders">Find active buyers</a>
        <a class="button-link secondary" href="#daily-calls">See today’s money flow</a>
      </div>
      <div class="vision-proof-strip">
        <div><span>Permit market</span><strong>Knoxville, TN</strong><em>HQ/contact may be regional</em></div>
        <div><span>Builder signals</span><strong>${h(totalBuilderSignals)}</strong><em>${h(callableBuilders)} callable contacts</em></div>
        <div><span>Buy box</span><strong>${h(boxMeter.percent)}%</strong><em>${h(boxMeter.grade)} confidence</em></div>
        <div><span>Call-ready</span><strong>${h(moneyQueue.stats.callReady)}</strong><em>${h(buyerContactQueue.length)} buyer contacts</em></div>
      </div>
    </div>
    <aside class="mission-console" aria-label="Market mission console">
      <div class="mission-topbar"><span></span><span></span><span></span><b>DEAL FLOW</b></div>
      <div class="mission-map">
        <div class="map-glow"></div>
        <div class="map-route r1"></div><div class="map-route r2"></div><div class="map-route r3"></div>
        <button class="map-pin hot" data-view="builders" style="--x:63%;--y:37%"><b>TN</b><em>Knoxville</em></button>
        <button class="map-pin" data-view="builders" style="--x:52%;--y:51%"><b>TN</b><em>Rutherford</em></button>
        <button class="map-pin" data-view="builders" style="--x:45%;--y:30%"><b>NC</b><em>Piedmont</em></button>
        <button class="map-pin" data-view="builders" style="--x:25%;--y:66%"><b>TX</b><em>Open data</em></button>
      </div>
      <div class="mission-grid">
        <div class="mission-column"><span class="eyebrow">Priority markets</span>${missionRows}</div>
        <div class="mission-next"><span class="eyebrow">Next money actions</span>${nextActions}</div>
      </div>
    </aside>
  </section>`;
}

function renderOperatorSessionMode(session = {}) {
  const metricRows = [
    ['Validated buyers', session.metrics?.buyers || 0, 'demand proof'],
    ['Matched sellers', session.metrics?.sellers || 0, 'buyer-box export'],
    ['Enriched contacts', session.metrics?.contacts || 0, 'call unlocked'],
    ['Packet ready', session.metrics?.packetReady || 0, 'sendable now'],
  ].map(([label, value, detail]) => `<article class="os8-metric"><span>${h(label)}</span><b>${h(value)}</b><em>${h(detail)}</em></article>`).join('');
  const stepRows = asArray(session.sprintSteps).map((step) => `<a class="os8-step ${h(step.status)}" href="${h(step.href || '#builders')}" data-view="builders">
    <span>${h(step.label)}</span>
    <div><b>${h(step.title)}</b><strong>${h(step.action)}</strong><p>${h(step.detail)}</p></div>
    <em>${h(step.status)}</em>
  </a>`).join('');
  const gateRows = asArray(session.packetGate).map(gate => `<div class="os8-gate ${h(gate.status)}"><span></span><div><b>${h(gate.label)}</b><p>${h(gate.detail)}</p></div><em>${h(gate.status)}</em></div>`).join('');
  return `<section id="operator-session-mode" class="os8-session wk-reveal" aria-label="Operator session mode">
    <div class="os8-ambient" aria-hidden="true"></div>
    <div class="os8-hero">
      <span class="wk-kicker">Operator session</span>
      <h2>${h(session.title || 'Today’s Call Sprint')}</h2>
      <p>${h(session.subtitle || 'One complete operator session from buyer proof to feedback rewrite.')}</p>
      <div class="os8-next-card">
        <small>Next defensible action</small>
        <b>${h(session.activeStep?.action || 'Open the builder queue')}</b>
        <span>${h(session.activeStep?.detail || 'Do not advance sellers until the next gate is true.')}</span>
      </div>
    </div>
    <div class="os8-metrics">${metricRows}</div>
    <div class="os8-flow">
      <article class="os8-sprint-card"><div class="os8-card-head"><span>Guided sprint</span><b>not browsing, executing</b></div>${stepRows}</article>
      <article class="os8-packet-card"><div class="os8-card-head"><span>Deal packet assembly gate</span><b>${session.dealPacketReady ? 'sendable' : 'guarded'}</b></div>${gateRows}<div class="os8-packet-note"><b>Packet promise</b><p>Every buyer-send package must carry parcel facts, buyer fit, seller range, assignment math, risk notes, title gate, deadline, and exact language. No missing context, no fabricated certainty.</p></div></article>
    </div>
  </section>`;
}

function renderCommandCenter() {
  const bestMarket = (workspace.markets || []).map(m => ({ ...m, score: scoreMarket(m) })).sort((a, b) => b.score.total - a.score.total)[0] || { name: 'Knoxville, TN', score: { total: 0 } };
  const topBuyer = rankBuyers(workspace.buyers || [])[0] || { name: 'Permit-active builder', score: 0 };
  const publicSkipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const buyerContactQueue = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()]);
  const buyerFirst = buildBuyerFirstBoard({ buyers: [...generatedCandidateBuyers(), ...enrichedBuilderContacts(), ...(workspace.buyers || [])], sellerCandidates: [...publicSkipTrace, ...(workspace.parcels || [])], limit: 25 });
  const leadBuyer = buyerFirst.validatedBuyers[0] || buyerContactQueue[0] || topBuyer;
  const moneyQueue = buildDailyMoneyQueue({ parcels: workspace.parcels || [], buyers: workspace.buyers || [], limit: 5, requireRealContact: true });
  const operatorExecutionConveyor = buildExecutionConveyor({ buyers: buyerPoolForState('TN'), sellerCandidates: sellerPoolForState('TN'), limit: 8 });
  const operatorSession = buildOperatorSessionMode({ buyerContactQueue, executionConveyor: operatorExecutionConveyor, moneyQueue });
  const moneyCalls = [...moneyQueue.followUps, ...moneyQueue.today];
  const heroCall = moneyCalls.find(call => call.id === selectedMoneyCallId) || moneyCalls[0] || {};
  selectedMoneyCallId = heroCall.id || '';
  const boxMeter = calculateBuyBoxCompleteness(leadBuyer || {});
  const heroMotivation = heroCall.id ? calculateSellerMotivation(heroCall) : { score: 0, temperature: 'Cold', signals: [] };
  const netScript = heroCall.id ? generateSellerNetOfferScript(heroCall, getBuyer(heroCall)) : null;
  const permitLandscape = getPermitPortalLandscape();
  const leadingMarkets = asArray(permitLandscape.leadingMarkets).slice(0, 5);
  const tnMarket = leadingMarkets.find(market => market.state === 'TN') || leadingMarkets[0] || { market: 'Knoxville / Knox County', state: 'TN', reason: 'Live-first permit source.' };
  const builderRows = asArray(knoxvilleBuyerCallSheet?.rows);
  const totalBuilderSignals = knoxvilleBuyerCallSheet?.summary?.totalRecentBuildSignals || builderRows.reduce((sum, row) => sum + Number(row.recentBuilds || 0), 0) || 0;
  const callableBuilders = knoxvilleBuyerCallSheet?.summary?.callablePublicBusinessContacts || builderRows.filter(row => row.phone || row.email).length || buyerContactQueue.length || 'pending';
  const callRows = moneyCalls.length ? moneyCalls.map((call, index) => `<button type="button" class="wk-call-row phase24-queue-row ${call.id === selectedMoneyCallId ? 'active' : ''}" data-select-money-call="${h(call.id)}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${h(call.ownerName || call.owner || 'owner unknown')}</b>
      <small>${h(call.address || 'No address')} · ${h(call.moneyStage)} · ${formatMoney(call.projectedSpread)} spread</small>
    </button>`).join('') : '<article class="wk-empty phase24-empty"><b>No seller call earns attention yet.</b><span>Buyer proof comes first. Public owner records stay in skip-trace until real phone/email enrichment.</span></article>';
  const marketRows = leadingMarkets.map((market, index) => `<a class="wk-market-node phase24-market-row ${market.state === 'TN' ? 'hot' : ''}" href="#builders" data-view="builders" style="--i:${index}">
      <span>${String(index + 1).padStart(2, '0')} · ${h(market.state)}</span>
      <b>${h(market.market)}</b>
      <em>${h(market.reason)}</em>
    </a>`).join('');
  const proofRows = [
    ['Active market', tnMarket.market, 'Build evidence is treated by jurisdiction, not corporate headquarters.'],
    ['Builder proof', `${totalBuilderSignals}`, `${callableBuilders} callable public business contacts.`],
    ['Buy-box certainty', `${boxMeter.percent}%`, `${boxMeter.grade} confidence until acquisition criteria are captured.`],
    ['Seller calls', `${moneyQueue.stats.callReady}`, `${publicSkipTrace.length} public records held back for enrichment.`],
  ].map(([label, value, detail]) => `<article class="wk-proof-card phase24-proof-card"><span>${h(label)}</span><strong>${h(value)}</strong><p>${h(detail)}</p></article>`).join('');
  const protocolRows = [
    ['01', 'Prove demand', 'Call permit-active builders and capture price, geography, close speed, and kill criteria.'],
    ['02', 'Constrain supply', 'Only seller parcels matching verified buy boxes enter the money queue.'],
    ['03', 'Protect closing', 'Contract/title gates surface before the buyer-send memo, not after optimism.'],
  ].map(([num, title, detail]) => `<article class="wk-protocol-card phase24-protocol-card"><span>${h(num)}</span><h3>${h(title)}</h3><p>${h(detail)}</p></article>`).join('');
  const operatingRows = [
    ['Buyer proof', 'Permit-backed builder demand', 'Start with builders already pulling permits in the target market.'],
    ['Jurisdiction', 'Market evidence beats office address', 'Tennessee evidence stays Tennessee even when a regional office sits elsewhere.'],
    ['Truth gate', 'No fabricated money rows', 'Public owner records remain skip-trace until phone or email is actually enriched.'],
    ['Next action', 'One defensible move', 'Every path resolves to builder validation, seller call, source proof, or closing control.'],
  ].map(([verb, title, detail]) => `<li><span>${h(verb)}</span><b>${h(title)}</b><em>${h(detail)}</em></li>`).join('');

  document.querySelector('#command').innerHTML = `
    <section id="wk-brief" class="wk-hero phase24-today-hero wk-reveal" aria-label="Today buyer-first operating view">
      <div class="wk-hero-copy phase24-hero-copy">
        <span class="wk-kicker">Today / buyer-first operating view</span>
        <h1>Make the clearest next move.</h1>
        <p>A calm, high-confidence surface for proving demand, protecting seller attention, and moving only the deals that deserve a call.</p>
        <div class="wk-actions phase24-actions">
          <a class="primary-command" href="#builders" data-view="builders">${productIcon('phone')} Call builder queue</a>
          <a href="#wk-work">Review today’s action</a>
        </div>
      </div>
      <aside class="phase24-snapshot" aria-label="Today proof snapshot">
        <div><span>Active market</span><b>${h(tnMarket.market)}</b><em>${h(tnMarket.state || 'TN')}</em></div>
        <div><span>Builder proof</span><b>${h(totalBuilderSignals)}</b><em>permit-backed rows</em></div>
        <div><span>Buy-box clarity</span><b>${h(boxMeter.percent)}%</b><em>${h(boxMeter.grade)} confidence</em></div>
        <div><span>Seller calls</span><b>${h(moneyQueue.stats.callReady)}</b><em>with reachable contact</em></div>
      </aside>
    </section>
    ${renderOperatorSessionMode(operatorSession)}
    <section class="wk-audit phase24-operating-rules wk-reveal" aria-label="Operating principles">
      <div><span class="wk-kicker">Clarity system</span><h2>A calm queue beats a crowded dashboard.</h2></div>
      <ul>${operatingRows}</ul>
    </section>
    <section id="wk-map" class="wk-market-map phase24-market-board wk-reveal" aria-label="Priority permit markets">
      <div class="wk-section-head"><span class="wk-kicker">Market readiness</span><h2>Tennessee is active. Other states stay queued until buyer proof improves.</h2><p>Show the source of evidence, the next validation path, and the reason to act - nothing decorative.</p></div>
      <div class="wk-node-grid phase24-market-list">${marketRows}</div>
    </section>
    <section id="wk-work" class="wk-workbench phase24-work-surface wk-reveal" aria-label="Daily money workbench">
      <div class="wk-section-head"><span class="wk-kicker">One job today</span><h2>Choose the next defensible action.</h2><div class="primary-action-strip today-primary-action"><span>Next action</span><b>Validate the current buyer before touching a seller record.</b><a href="#builders" data-view="builders">Validate buyer ${productIcon('arrow')}</a></div></div>
      <div class="wk-proof-grid phase24-proof-grid">${proofRows}</div>
      <div class="wk-work-grid phase24-work-grid">
        <article class="wk-focus-card phase24-focus-card"><span class="wk-kicker">Current buyer target</span><h3>${h(leadBuyer?.name || 'Permit-active builder')}</h3><p>${h(leadBuyer?.buyBox || leadBuyer?.acquisitionNotes || leadBuyer?.task || 'Capture price, area, lot size, utilities, roads, wetlands/flood kills and close speed.')}</p><a href="#builders" data-view="builders">Validate buy box</a></article>
        <div class="wk-call-stack phase24-call-stack"><span class="wk-kicker">Seller queue</span>${callRows}</div>
        <article class="wk-script-card phase24-script-card"><span class="wk-kicker">If a seller earns the call</span><h3>${h(netScript?.opening || 'Lead with net cash, not a pitch.')}</h3><p>${h(netScript?.netLine || heroMotivation.signals.slice(0, 2).join(' · ') || 'No seller call is promoted until buyer proof and reachable contact data exist.')}</p></article>
      </div>
    </section>
    <section id="wk-gates" class="wk-protocol phase24-protocol wk-reveal" aria-label="Conversion protocol">
      <div class="wk-section-head"><span class="wk-kicker">Conversion architecture</span><h2>Gate the deal. Do not decorate the dashboard.</h2></div>
      <div class="wk-protocol-grid phase24-protocol-grid">${protocolRows}</div>
    </section>`;
  initializeEditorialMotion();
}

function initializeEditorialMotion() {
  const root = document.querySelector('#command');
  if (!root) return;
  const progress = root.querySelector('.wk-progress span');
  const revealables = [...root.querySelectorAll('.wk-reveal')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.18 });
    revealables.forEach(node => observer.observe(node));
  } else {
    revealables.forEach(node => node.classList.add('is-visible'));
  }
  const update = () => {
    if (!progress) return;
    const rect = root.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight);
    const amount = Math.min(1, Math.max(0, -rect.top / distance));
    progress.style.transform = `scaleX(${amount})`;
  };
  window.removeEventListener('scroll', window.__landDealflowProgress || (() => {}));
  window.__landDealflowProgress = update;
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function machineOpenAttr(panelId) {
  return openMachinePanel === panelId ? ' open' : '';
}

function renderWorkspaceTools() {
  const existing = document.querySelector('#workspace');
  if (!existing) return;
  existing.innerHTML = `<div class="section-heading compact-heading machine-heading">
      <span class="eyebrow">Machine room</span>
      <h2>Hidden operational controls.</h2>
      <p>The conveyor stays quiet by default. Open one tool, run it, then tuck it back away.</p>
    </div>
    <div class="machine-stack" aria-label="Machine operational tools">
      <details class="machine-panel" data-machine-panel="lead-output"${machineOpenAttr('lead-output')}>
        <summary><span>01</span><strong>Generated lead output</strong><em>Health check</em></summary>
        <div class="machine-tool-body" id="lead-engine-panel"></div>
      </details>
      <details class="machine-panel" data-machine-panel="buyer-contact"${machineOpenAttr('buyer-contact')}>
        <summary><span>02</span><strong>Buyer-first buy box validation</strong><em>Import buyer proof</em></summary>
        <div class="machine-tool-body" id="buyer-contact-intake-panel"></div>
      </details>
      <details class="machine-panel" data-machine-panel="skip-trace"${machineOpenAttr('skip-trace')}>
        <summary><span>03</span><strong>Skip trace intake</strong><em>Import seller contact</em></summary>
        <div class="machine-tool-body" id="skip-trace-intake-panel"></div>
      </details>
      <details class="machine-panel" data-machine-panel="parcel-import"${machineOpenAttr('parcel-import')}>
        <summary><span>04</span><strong>Import parcel data</strong><em>Compact CSV module</em></summary>
        <div class="machine-tool-body compact-import-module">
          <div class="machine-tool-intro"><p>Paste only when refreshing the local workspace. Headers normalize into one parcel model.</p><code>address,market,buyerMaxPrice,roadAccess</code></div>
          <details class="mini-disclosure"><summary>Supported CSV fields</summary><p>address, market, buyerId, parcelId, lotSize, ownerName, ownerPhone, ownerEmail, ownerMailingAddress, skipTraceConfidence, buyerContactName, buyerPhone, buyerEmail, buyerWebsite, acquisitionNotes, buyerMaxPrice, lowestActiveListing, askingPrice, heldYears, paid, wetlands, floodZone, roadAccess, utilities, slope, wildlifeFlag, crmStatus, nextFollowUp, notes.</p></details>
          <div class="machine-import-row"><label class="preset-row">Source preset<select id="source-preset"><option value="land-dealflow">Land Dealflow template</option><option value="lee-county">Lee County property export</option><option value="propstream">PropStream export</option><option value="landglide">LandGlide export</option></select></label><textarea id="csv-input" rows="3" placeholder="address,market,buyerMaxPrice,roadAccess\n123 Grant Blvd,lehigh,42000,true"></textarea></div>
          <div class="button-row"><button id="load-lehigh-template" class="secondary" type="button">Load preview</button><button id="import-csv" type="button">Import parcel rows</button><span id="import-status"></span></div>
        </div>
      </details>
      <details class="machine-panel" data-machine-panel="workspace-backup"${machineOpenAttr('workspace-backup')}>
        <summary><span>05</span><strong>Workspace backup</strong><em>Restore / export</em></summary>
        <div class="machine-tool-body compact-import-module"><div class="machine-tool-intro"><p>Restore only when moving local state between browsers.</p><code>{ "markets": [], "buyers": [], "parcels": [] }</code></div><textarea id="json-input" rows="3" placeholder="Paste exported workspace JSON here"></textarea><div class="button-row"><button id="import-json" type="button">Restore JSON</button><button id="export-json" class="secondary" type="button">Download backup</button><button id="reset-workspace" class="danger" type="button">Reset seed</button></div></div>
      </details>
      <details class="machine-panel" data-machine-panel="exports"${machineOpenAttr('exports')}>
        <summary><span>06</span><strong>Exports for action</strong><em>Files out</em></summary>
        <div class="machine-tool-body compact-import-module"><div class="machine-tool-intro"><p>Exports respect the active deal filter. Use call-list when ready to execute.</p><code>top20.csv · filtered.csv · mailmerge.csv</code></div><div class="button-row"><button id="export-top20-csv" type="button">Top 20 calls</button><button id="export-filtered-csv" class="secondary" type="button">Current view</button><button id="export-mailmerge-csv" class="secondary" type="button">Mail merge</button></div><div id="top-call-list" class="call-list compact-call-list"></div></div>
      </details>
      <details class="machine-panel" data-machine-panel="quality"${machineOpenAttr('quality')}>
        <summary><span>07</span><strong>Data quality gate</strong><em>Blockers</em></summary>
        <div class="machine-tool-body" id="quality-gate"></div>
      </details>
      <details class="machine-panel" data-machine-panel="buyer-validation"${machineOpenAttr('buyer-validation')}>
        <summary><span>08</span><strong>Buyer validation</strong><em>Proof / lessons</em></summary>
        <div class="machine-tool-body"><div class="button-row"><button id="capture-sample-buybox" type="button">Capture sample buy box</button><button id="add-sample-buyer-note" class="secondary" type="button">Add sample note</button><span id="buyer-validation-status"></span></div><div id="buyer-validation-panel"></div></div>
      </details>
      <details class="machine-panel" data-machine-panel="outreach"${machineOpenAttr('outreach')}>
        <summary><span>09</span><strong>Outreach execution</strong><em>Follow-ups</em></summary>
        <div class="machine-tool-body"><div class="button-row"><button id="bulk-contact-callnow" type="button">Mark “Call now” contacted</button><span id="outreach-status"></span></div><div id="outreach-panel"></div></div>
      </details>
      <details class="machine-panel" data-machine-panel="offer-packet"${machineOpenAttr('offer-packet')}>
        <summary><span>10</span><strong>Offer packet + buyer memo</strong><em>Packet out</em></summary>
        <div class="machine-tool-body"><div class="button-row"><button id="export-deal-memo" type="button">Deal memo</button><button id="download-buyer-send-memo" class="secondary" type="button">Buyer memo</button><button id="copy-buyer-send-memo" class="secondary" type="button">Copy memo</button><span id="deal-memo-status"></span><span id="buyer-send-memo-status"></span></div><div id="offer-packet-panel"></div></div>
      </details>
    </div>`;
}

function renderTopCallList() {
  const target = document.querySelector('#top-call-list');
  if (!target) return;
  const calls = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 20 });
  target.innerHTML = calls.length ? calls.slice(0, 5).map(call => `<div class="call-row">
    <b>#${call.callPriority} · ${h(call.address)}</b>
    <span>${h(call.ownerName || call.owner || 'Owner unknown')} · ${h(call.ownerPhone || call.ownerEmail)} · score ${call.score}</span>
    <em>Buyer: ${h(call.buyerContactName || 'contact missing')} ${h(call.buyerPhone || call.buyerEmail || '')}</em>
  </div>`).join('') : '<p>No callable parcels yet. Import contacts or improve scoring.</p>';
}

function renderSkipTraceIntakePanel() {
  const target = document.querySelector('#skip-trace-intake-panel');
  if (!target) return;
  const skipTrace = asArray(generatedLeads?.queues?.skipTrace);
  const sample = skipTrace[0];
  const matchedCount = asArray(workspace.parcels).filter(parcel => parcel.skipTraceImportedAt || parcel.realContact).length;
  target.innerHTML = `<div class="machine-import-shell">
    <section class="machine-tool-intro"><span class="eyebrow">Seller enrichment</span><h3>Paste skip-trace or enrichment positives only after buyer fit.</h3><p>Match by parcelId first, then owner name, then address. Successful owner enrichment is treated as skip tracing; low-confidence/DNC/opt-out rows stay held.</p><div class="machine-micro-stats"><b>${h(skipTrace.length)}</b><span>waiting</span><b>${h(matchedCount)}</b><span>matched</span><b>${h(sample ? 'ready' : 'none')}</b><span>example</span></div></section>
    <section class="machine-import-card"><div class="code-preview"><span>CSV preview</span><code>parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis</code><code>${h(sample?.parcelId || '274527L4110560090')},${h(sample?.ownerName || 'MONTEAN PETER & WENDY')},239-555-7722,owner@example.com,high,manual lookup,same owner + mailing city</code></div><textarea id="skip-trace-csv" rows="3" placeholder="Paste skip-trace or owner-enrichment CSV here"></textarea><div class="button-row"><button id="load-skiptrace-template" class="secondary" type="button">Load first lead</button><button id="import-skiptrace" type="button">Import enrichment</button><span id="skiptrace-status"></span></div></section>
    <section class="machine-queue-preview"><h4>Next owners</h4>${skipTrace.slice(0, 3).map((item, index) => `<div class="engine-row"><b>${index + 1}. ${h(item.ownerName)}</b><span>${h(item.address)} · confidence ${h(item.confidence)}</span></div>`).join('') || '<p>No generated skip-trace queue found yet.</p>'}</section>
  </div>`;
}

function renderBuyerContactIntakePanel() {
  const target = document.querySelector('#buyer-contact-intake-panel');
  if (!target) return;
  const buyerQueue = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()]);
  const sample = buyerQueue[0];
  const marketLabel = sample?.market ? sample.market.split('-').map(part => part.length === 2 ? part.toUpperCase() : `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ') : 'Lehigh';
  target.innerHTML = `<div class="machine-import-shell">
    <section class="machine-tool-intro"><span class="eyebrow">Buyer-first validation</span><h3>Call builders. Capture the buy box. Then touch sellers.</h3><p>Find a real acquisition contact, ask max price and kill criteria, then store only confirmed demand.</p><div class="machine-micro-stats"><b>${h(buyerQueue.length)}</b><span>contacts</span><b>${h(sample?.recentBuilds || 0)}</b><span>top signal</span><b>${h(marketLabel)}</b><span>market</span></div></section>
    <section class="machine-import-card"><div class="code-preview"><span>CSV preview</span><code>buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice</code><code>${h(sample?.buyerId || 'lehigh-builder-career-financial-corp')},${h(sample?.name || 'CAREER FINANCIAL CORP')},Acquisitions,239-555-8822,deals@example.com,https://example.com,"Lehigh quarter-acre lots under $42k",42000</code></div><textarea id="buyer-contact-csv" rows="3" placeholder="Paste buyer-contact CSV here"></textarea><div class="button-row"><button id="load-buyer-contact-template" class="secondary" type="button">Load top signal</button><button id="import-buyer-contact" type="button">Import buyer contact</button><span id="buyer-contact-status"></span></div></section>
    <section class="machine-queue-preview"><h4>Top signals</h4>${buyerQueue.slice(0, 3).map((item, index) => `<div class="engine-row"><b>${index + 1}. ${h(item.name)}</b><span>${h(item.recentBuilds)} builds/signals · ${h(item.phone || item.website || 'find contact')}</span></div>`).join('') || '<p>All buyer contacts enriched.</p>'}</section>
  </div>`;
}

function skipTraceTemplateRow() {
  const item = asArray(generatedLeads?.queues?.skipTrace)[0] || {};
  return `parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis\n${item.parcelId || '274527L4110560090'},${item.ownerName || 'MONTEAN PETER & WENDY'},239-555-7722,owner@example.com,high,manual lookup,same owner + mailing city`;
}

function builderSkipTraceTemplateRow(stateCode = selectedBuilderMarketState) {
  const conveyor = buildExecutionConveyor({ buyers: buyerPoolForState(stateCode || 'TN'), sellerCandidates: sellerPoolForState(stateCode || 'TN'), limit: 50 });
  const item = asArray(conveyor.matchedSellerBatch)[0] || asArray(conveyor.board?.sellerMatches).find(row => !(row.ownerPhone || row.ownerEmail || row.realContact)) || {};
  return `parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis\n${item.parcelId || item.id || 'parcel-id'},${item.ownerName || item.owner || 'Public Owner'},865-555-0198,owner@example.com,high,manual lookup,same owner + mailing city`;
}

function buyerContactTemplateRow() {
  const item = buildBuyerContactQueue([...generatedCandidateBuyers(), ...enrichedBuilderContacts()])[0] || {};
  return `buyerId,name,buyerContactName,buyerPhone,buyerEmail,buyerWebsite,buyBox,maxPrice\n${item.buyerId || 'lehigh-builder-career-financial-corp'},${item.name || 'CAREER FINANCIAL CORP'},Acquisitions,239-555-8822,deals@example.com,https://example.com,"Lehigh quarter-acre lots under $42k",42000`;
}

async function loadGeneratedLeads() {
  try {
    const response = await fetch('data/generated/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`lead engine ${response.status}`);
    generatedLeads = await response.json();
    invalidateLandPerformanceCaches();
  } catch (error) {
    generatedLeads = { error: error.message };
  }
}

async function loadDallasProofSprint() {
  try {
    const response = await fetch('data/real/dallas-buyer-752xx/phase45_top12_proof_sprint.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`dallas proof sprint ${response.status}`);
    dallasProofSprint = await response.json();
    cachedDealsMarketEntries = null;
  } catch (error) {
    dallasProofSprint = { error: error.message, rows: [] };
  }
}

async function loadKeystoneHeightsLandowners() {
  try {
    const response = await fetch('data/real/duval-keystone-fl/keystone_heights_clay_landowners_app.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`keystone heights landowners ${response.status}`);
    keystoneHeightsLandowners = await response.json();
    invalidateLandPerformanceCaches();
    cachedDealsMarketEntries = null;
  } catch (error) {
    keystoneHeightsLandowners = { error: error.message, parcels: [] };
  }
}

async function loadFreeGovOwnerSources() {
  try {
    const response = await fetch('data/generated/free_gov_owner_sources.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`free gov owner sources ${response.status}`);
    freeGovOwnerSources = await response.json();
  } catch (error) {
    freeGovOwnerSources = { error: error.message, markets: [], agents: [], summary: {} };
  }
}

async function loadKnoxvilleBuyerCallSheet() {
  try {
    const response = await fetch('data/real/knoxville/buyer_call_sheet.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`knoxville call sheet ${response.status}`);
    knoxvilleBuyerCallSheet = await response.json();
  } catch (error) {
    knoxvilleBuyerCallSheet = { error: error.message, rows: [] };
  }
}

async function loadBuilderMarketData() {
  const entries = await Promise.all(builderMarketSources.map(async (source) => {
    try {
      const [signalsResponse, evidenceResponse] = await Promise.all([
        fetch(source.signalsUrl, { cache: 'no-store' }),
        fetch(source.evidenceUrl, { cache: 'no-store' }),
      ]);
      if (!signalsResponse.ok) throw new Error(`${source.key} builders ${signalsResponse.status}`);
      const rows = await signalsResponse.json();
      const evidence = evidenceResponse.ok ? await evidenceResponse.json() : { error: `${source.key} evidence ${evidenceResponse.status}` };
      return [source.key, { ...source, rows, evidence }];
    } catch (error) {
      return [source.key, { ...source, rows: [], evidence: { error: error.message }, error: error.message }];
    }
  }));
  builderMarketData = { loaded: true, error: '', markets: Object.fromEntries(entries) };
  cachedBuilderSwitchboardEntries = null;
  cachedDealsMarketEntries = null;
}

async function loadWeeklyMarketScout() {
  try {
    const response = await fetch('data/generated/weekly-market/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`weekly market ${response.status}`);
    weeklyMarketScout = await response.json();
  } catch (error) {
    weeklyMarketScout = { error: error.message };
  }
}

async function loadTitleCompanyResearch() {
  try {
    const [processResponse, marketsResponse] = await Promise.all([
      fetch('data/title-company/title_company_process.json', { cache: 'no-store' }),
      fetch('data/title-company/title_company_market_candidates.json', { cache: 'no-store' }),
    ]);
    if (!processResponse.ok) throw new Error(`title process ${processResponse.status}`);
    if (!marketsResponse.ok) throw new Error(`title markets ${marketsResponse.status}`);
    titleCompanyProcess = await processResponse.json();
    titleCompanyMarkets = await marketsResponse.json();
  } catch (error) {
    titleCompanyProcess = { error: error.message, closingDeskInsights: [], templates: {} };
    titleCompanyMarkets = { error: error.message, markets: [] };
  }
}

function marketRadarPlaceholderHtml() {
  const validationSteps = [
    ['01', 'Scan', 'Land.com sold/pending · 0-1 acre · $30k-$150k · undeveloped'],
    ['02', 'Gate', '5-10+ new builds, recent land comps, active inventory, repeatable infill lots'],
    ['03', 'Call', 'Ask high/low-comp agents what changes value before any seller list is pulled'],
  ].map(([number, label, detail]) => `<div class="engine-row priority-row"><b>${number} · ${label}</b><span>${detail}</span></div>`).join('');
  const placeholderCriteria = [
    ['Page', 'Sources', 'Market Radar belongs before parcel sourcing because it chooses where source lanes should run.'],
    ['Guardrail', 'Raw candidate != validated market', 'Keep candidate markets separate from buyer-backed seller queues.'],
    ['Next build', 'Generate first candidate packet', 'Output market_candidates.json, expert_call_targets.csv, and niche_value_rules.json.'],
  ].map(([label, title, detail]) => `<div class="criterion-row"><b>${label}: ${title}</b><span>${detail}</span></div>`).join('');
  return `<section class="weekly-market-card market-radar-placeholder" aria-label="Market Radar placeholder">
    <div class="weekly-market-head">
      <div><span class="eyebrow">Market Radar · placeholder</span><h3>Find hot land markets before seller sourcing.</h3><p>This lives on Sources because it is upstream of Builders and Land: it turns market signals into validated source lanes, then hands buyer targets to Builders and seller-list filters to Land.</p></div>
      <div class="market-grade"><span>Status</span><strong>Hold</strong><em>build next</em></div>
    </div>
    <div class="deal-strip four"><div><span>Current page</span><strong>Sources</strong></div><div><span>Workflow</span><strong>15-min scan</strong></div><div><span>Primary gate</span><strong>Expert call</strong></div><div><span>Promotion</span><strong>Validated only</strong></div></div>
    <div class="weekly-market-grid">
      <div><h4>Why here</h4>${placeholderCriteria}</div>
      <div><h4>Method to wire later</h4>${validationSteps}</div>
      <div><h4>Do not promote yet</h4>${badge('No fake markets', 'warn')}${badge('Zillow context only', 'warn')}${badge('No outreach without approval', 'warn')}<p>Run <code>node scripts/weekly-market-scout.mjs</code> later when the Market Radar generator exists.</p></div>
    </div>
  </section>`;
}

function renderWeeklyMarketScout() {
  const target = document.querySelector('#weekly-market-scout');
  if (!target) return;
  if (!weeklyMarketScout) {
    target.innerHTML = '<p>Loading weekly market scout…</p>';
    return;
  }
  if (weeklyMarketScout.error) {
    target.innerHTML = marketRadarPlaceholderHtml();
    return;
  }
  const market = weeklyMarketScout.recommendedMarket || {};
  const criteria = asArray(market.criteria);
  const actions = asArray(market.firstActions);
  const caveats = asArray(market.caveats);
  const statusLabel = String(market.nextStatus || market.status || 'research')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  target.innerHTML = `${marketRadarPlaceholderHtml()}<section class="weekly-market-card weekly-market-legacy">
    <div class="weekly-market-head">
      <div><span class="eyebrow">Market Expansion Engine · week ${h(weeklyMarketScout.week || '')}</span><h3>${h(market.name || 'No market selected')}</h3><p>${h(market.thesis || 'No thesis generated yet.')}</p></div>
      <div class="market-grade"><span>Score</span><strong>${h(market.score ?? 0)}</strong><em>Grade ${h(market.grade || '-')}</em></div>
    </div>
    <div class="deal-strip four"><div><span>State</span><strong>${h(market.state || '-')}</strong></div><div><span>Status</span><strong>${h(statusLabel)}</strong></div><div><span>Mentioned as</span><strong>${h(market.mentionedAs || 'source market')}</strong></div><div><span>Generated</span><strong>${formatDateTime(weeklyMarketScout.generatedAt)}</strong></div></div>
    <div class="weekly-market-grid">
      <div><h4>Operating criteria</h4>${criteria.map(item => `<div class="criterion-row"><b>${h(item.label)}</b><span>${h(item.score)}/10 · ${h(item.points)} pts · ${h(item.threshold)}</span></div>`).join('')}</div>
      <div><h4>First execution moves</h4>${actions.map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item)}</b><span>${index === 0 ? 'recent-build visual evidence' : index === 1 ? 'source provenance ledger' : index === 2 ? 'buyer-first validation' : 'seller work waits for buyer proof'}</span></div>`).join('')}</div>
      <div><h4>Risks / caveats</h4>${caveats.map(item => badge(item, 'warn')).join('') || '<p>No caveats captured.</p>'}<p>${asArray(market.flags).length ? `Flags: ${h(market.flags.join(', '))}` : 'No hard filter flags on this candidate.'}</p></div>
    </div>
  </section>`;
}

function renderLeadEnginePanel() {
  const target = document.querySelector('#lead-engine-panel');
  if (!target) return;
  if (!generatedLeads) {
    target.innerHTML = '<p>Loading generated lead-engine output…</p>';
    return;
  }
  if (generatedLeads.error) {
    target.innerHTML = `<p>Lead engine output not found yet: ${h(generatedLeads.error)}. Run <code>node scripts/lead-engine.mjs</code>.</p>`;
    return;
  }
  const snapshot = generatedLeads.snapshot || {};
  const queues = generatedLeads.queues || {};
  const states = availableLeadEngineStates(snapshot, queues);
  if (leadEngineStateFilter !== 'all' && !states.includes(leadEngineStateFilter)) leadEngineStateFilter = 'all';
  const topCalls = filteredRows(queues.topSellerCalls || []);
  const skipTrace = filteredRows(queues.skipTrace || []);
  const buyerTasks = filteredRows(queues.buyerValidation || []);
  const offerReady = filteredRows(queues.offerReady || []);
  const buyerDiscovery = filteredRows(queues.buyerDiscovery || []);
  const sellerDiscovery = filteredRows(queues.sellerDiscovery || []);
  const sourceCandidates = filteredRows(snapshot.sourceCandidates || []);
  const parcels = filteredRows(snapshot.parcels || []);
  const buyers = filteredRows(snapshot.buyers || []);
  const blockers = filteredRows(queues.missingData || []).filter(item => item.severity > 0);
  const sourceSummary = ['market', 'buyer', 'parcel', 'owner', 'offer', 'risk', 'crm'];
  const stateButtons = ['all', ...states].map(state => `<button type="button" class="state-filter ${state === leadEngineStateFilter ? 'active' : ''}" data-lead-state="${h(state)}">${state === 'all' ? 'All states' : h(state)}</button>`).join('');
  target.innerHTML = `<div class="lead-engine-grid">
    ${zeroFabricationNotice(snapshot, queues)}
    <div class="lead-state-toolbar"><div><span class="eyebrow">State filter</span><h4>Show only the markets you can actually execute.</h4></div><div class="state-filter-group">${stateButtons}</div></div>
    <div class="deal-strip five hero-metrics"><div><span>Parcel leads</span><strong>${parcels.length}</strong></div><div><span>Buyer leads</span><strong>${buyers.length}</strong></div><div><span>Seller calls</span><strong>${topCalls.length}</strong></div><div><span>Skip trace</span><strong>${skipTrace.length}</strong></div><div><span>Source candidates</span><strong>${sourceCandidates.length}</strong></div></div>
    <details class="engine-column primary-column source-ledger" open><summary><h4>Source ledger</h4><span>Last-sourced provenance by phase</span></summary><p>Every row must name its public source. Seed/demo rows are not eligible for seller calls.</p>${sourceSummary.map(type => {
      const blueprint = sourceBlueprint[type];
      const status = getPhaseSourceStatus(type);
      return `<div class="engine-row"><b>${h(blueprint.label)}</b><span>${formatDateTime(status.latest)} · ${h(status.count)} records · ${status.ids.length ? status.ids.map(id => h(id)).join(', ') : 'derived/local'}</span></div>`;
    }).join('')}</details>
    <div class="engine-column primary-column"><h4>Call these sellers first</h4>${topCalls.slice(0, 3).map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item.address)}</b><span>${provenancePill(item)}</span><span>${h(item.ownerName || 'owner')} · ${h(item.ownerPhone || item.ownerEmail || 'needs verified contact')} · score ${h(item.score ?? '')}</span></div>`).join('') || '<p>No verified seller calls for this state yet. Correct state: wait for public owner + buyer-demand evidence before calling.</p>'}</div>
    <div class="engine-column primary-column"><h4>Public-owner leads to skip trace</h4>${skipTrace.slice(0, 5).map((item, index) => `<div class="engine-row priority-row"><b>${index + 1}. ${h(item.address)}</b><span>${provenancePill(item)}</span><span>${h(item.ownerName || 'owner')} · ${h(item.ownerMailingAddress || 'mailing missing')} · confidence ${h(item.confidence ?? '')}</span></div>`).join('') || '<p>No verified public-owner skip trace queue for this state yet.</p>'}</div>
    <div class="engine-column"><h4>Source candidates</h4>${sourceCandidates.slice(0, 8).map(source => `<div class="engine-row"><b>${h(source.areaName || source.market)} · ${h(source.platform)} · ${h(source.sourceType)}</b><span>${provenancePill(source)}</span><span>${source.url ? safeLink(source.url, source.title || 'Open source') : h(source.title)} · confidence ${h(source.confidence ?? '')}</span></div>`).join('') || '<p>No external source candidates discovered for this state yet.</p>'}</div>
    <div class="engine-column"><h4>New-area discovery</h4>${[...buyerDiscovery, ...sellerDiscovery].slice(0, 6).map(task => `<div class="engine-row"><b>${h(task.areaName || task.market)}</b><span>${provenancePill(task)}</span><span>${h(task.reason)} · ${h(task.task)}</span></div>`).join('') || '<p>All selected-state areas have source records or no discovery tasks.</p>'}</div>
    <div class="engine-column"><h4>Buyer validation</h4>${buyerTasks.slice(0, 4).map(task => `<div class="engine-row"><b>${h(task.name)}</b><span>${provenancePill(task)}</span><span>${h(task.task)} · ${h(task.phone || task.website || 'find contact')}</span></div>`).join('') || '<p>No verified buyer-validation tasks for this state yet.</p>'}</div>
    <div class="engine-column"><h4>Offer-ready</h4>${offerReady.slice(0, 4).map(item => `<div class="engine-row"><b>${h(item.address)}</b><span>${provenancePill(item)}</span><span>${h(item.ownerName)} · ask ${h(item.askingPrice)} · max ${h(item.buyerMaxPrice)}</span></div>`).join('') || '<p>No offer-ready deals for this state yet.</p>'}</div>
    <div class="engine-column"><h4>Blockers</h4>${blockers.slice(0, 4).map(item => `<div class="engine-row"><b>${h(item.address || item.parcelId || item.market)}</b><span>${provenancePill(item)}</span><span>Missing: ${h(item.missing || 'unknown')}</span></div>`).join('') || '<p>No critical blockers in generated leads for this state.</p>'}</div>
  </div>`;
}

function renderQualityControl() {
  const target = document.querySelector('#quality-gate');
  if (!target) return;
  const duplicates = findDuplicateParcels(workspace.parcels || []);
  const report = reportMissingData(workspace.parcels || []);
  const checklist = getDataSourceChecklist('lehigh');
  const worstRows = report.rows.filter(row => row.severity > 0).slice(0, 6);
  target.innerHTML = `<div class="quality-grid">
    <div><b>${duplicates.length}</b><span>duplicate groups</span></div>
    <div><b>${report.summary.ownerContactMissing}</b><span>missing owner contact</span></div>
    <div><b>${report.summary.buildabilityMissing}</b><span>missing buildability</span></div>
    <div><b>${report.summary.pricingMissing}</b><span>missing pricing</span></div>
  </div>
  <div class="checklist">${checklist.map(item => `<div class="check-item ${item.blocksCallList ? 'blocks' : ''}"><strong>${h(item.label)}</strong><span>${h(item.detail)}</span></div>`).join('')}</div>
  <div class="missing-list">${worstRows.length ? worstRows.map(row => `<div><b>${h(row.address || row.id)}</b><span>${row.missing.map(item => badge(item, item === 'ownerContact' || item === 'buildability' ? 'bad' : 'warn')).join('')}</span></div>`).join('') : '<p>Quality gate clear for current records.</p>'}</div>
  ${duplicates.length ? `<div class="duplicate-list"><strong>Duplicate review:</strong>${duplicates.map(group => `<span>${h(group.reason)}: ${h(group.ids.join(', '))}</span>`).join('')}</div>` : ''}`;
}

function renderBuyerValidationPanel() {
  const target = document.querySelector('#buyer-validation-panel');
  if (!target) return;
  const scorecards = (workspace.buyers || []).map(calculateBuyerScorecard).sort((a, b) => b.score - a.score);
  const matrix = buildDealFitMatrix(workspace.parcels || [], workspace.buyers || []).slice(0, 6);
  const loop = buildBuyerFeedbackLoop(workspace.buyers || []);
  target.innerHTML = `<div class="buyer-validation-grid">
    <div class="scorecard-list"><h4>Buyer scorecards</h4>${scorecards.map(card => `<div class="buyer-score-row grade-${h(card.grade)}"><b>${h(card.grade)} · ${h(card.name || 'buyer')} · ${card.score}</b><span>${h(card.signals.join(', ') || 'needs validation')}</span></div>`).join('')}</div>
    <div class="fit-matrix"><h4>Deal-fit matrix</h4>${matrix.map(row => `<div class="fit-row ${h(row.fit)}"><b>${h(row.fit)} · ${h(row.address || row.parcelId)} → ${h(row.buyerName)}</b><span>${row.score}/100${row.misses.length ? ` · misses: ${h(row.misses.join(', '))}` : ''}</span></div>`).join('') || '<p>No exact buy boxes captured yet.</p>'}</div>
    <div class="feedback-loop"><h4>Feedback loop</h4><div class="deal-strip"><div><span>Total feedback</span><strong>${loop.totalFeedback}</strong></div><div><span>Accepted</span><strong>${loop.accepted}</strong></div><div><span>Rejected</span><strong>${loop.rejected}</strong></div><div><span>Maybe</span><strong>${loop.maybe}</strong></div></div><p>${h(loop.lessons || 'No rejection lessons captured yet.')}</p><strong>${h(loop.tightening)}</strong></div>
    <div class="call-notes"><h4>Latest call notes</h4>${(workspace.buyers || []).flatMap(b => (b.callNotes || []).map(n => ({ buyer: b.name, ...n }))).slice(0, 5).map(note => `<div class="note-row"><b>${h(note.date || '')} · ${h(note.buyer)}</b><span>${h(note.outcome || '')}: ${h(note.note || '')}</span></div>`).join('') || '<p>No buyer call notes captured yet.</p>'}</div>
  </div>`;
}

function renderOutreachPanel() {
  const target = document.querySelector('#outreach-panel');
  if (!target) return;
  const queue = buildFollowUpQueue(workspace.parcels || []);
  const top = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 1 })[0] || scoredParcels()[0];
  const buyer = top ? getBuyer(top) : {};
  const script = top ? generateOwnerCallScript(top, buyer) : null;
  target.innerHTML = `<div class="outreach-grid">
    <div class="followup-list"><h4>Follow-up queue</h4>${queue.length ? queue.slice(0, 6).map(item => `<div class="followup-row ${h(item.urgency)}"><b>${h(item.nextFollowUp)} · ${h(item.address)}</b><span>${h(item.ownerName || item.owner || 'owner unknown')} · ${h(item.crmStatus)} · ${h(item.urgency)}</span></div>`).join('') : '<p>No due follow-ups in the next 7 days.</p>'}</div>
    <div class="script-box"><h4>Suggested seller script</h4>${script ? `<p><strong>Opener:</strong> ${h(script.opener)}</p><p><strong>Positioning:</strong> ${h(script.positioning)}</p><p><strong>Price:</strong> ${h(script.priceAnchor)}</p><ul>${script.questions.slice(0, 4).map(q => `<li>${h(q)}</li>`).join('')}</ul><p><strong>Close:</strong> ${h(script.close)}</p>` : '<p>No parcel available for scripting.</p>'}</div>
  </div>`;
}

function currentMemoTarget() {
  const selected = (workspace.parcels || []).find(parcel => parcelSelectionKey(parcel) === selectedParcelId);
  return selected || buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 1 })[0] || scoredParcels()[0] || null;
}

function currentOfferPacket() {
  const candidate = currentMemoTarget();
  if (!candidate) return null;
  return generateOfferPacket(candidate, getBuyer(candidate));
}

function currentBuyerSendMemo() {
  const candidate = currentMemoTarget();
  if (!candidate) return null;
  const buyer = getBuyer(candidate);
  return generateBuyerSendMemo(candidate, buyer, generateOfferPacket(candidate, buyer));
}

function currentTitleCompanyEmail() {
  const candidate = currentMemoTarget();
  if (!candidate) return null;
  const desk = buildTitleCompanyClosingDesk(candidate, getBuyer(candidate));
  return `${desk.email.subject}\n\n${desk.email.body}`;
}

function renderBuyerSendMemoCard(memo, { compact = false, open = true } = {}) {
  if (!memo) return '';
  return `<section class="buyer-send-memo ${compact ? 'compact' : ''}" aria-label="Buyer send memo">
    <details ${open ? 'open' : ''}>
      <summary><span><em class="eyebrow">Buyer memo</em><b>${h(memo.subject)}</b></span><strong>${formatMoney(memo.assignmentFee)}</strong></summary>
      <p class="buyer-memo-ask">${h(memo.ask)}</p>
      <div class="deal-strip four"><div><span>Assignment fee path</span><strong>${formatMoney(memo.assignmentFee)}</strong></div><div><span>Fit score</span><strong>${h(memo.fit?.score || 0)}/100</strong></div><div><span>Contract gate</span><strong>${h(memo.contract?.label || 'unknown')}</strong></div><div><span>Close probability</span><strong>${h(memo.checklist?.probability || 0)}%</strong></div></div>
      <pre class="buyer-memo-preview">${h(memo.message.slice(0, compact ? 720 : 1400))}</pre>
      <div class="button-row"><button type="button" class="copy-buyer-send-memo">Copy memo</button><button type="button" class="secondary download-buyer-send-memo">Download memo</button><span class="buyer-send-memo-status"></span></div>
    </details>
  </section>`;
}

function renderBuyerFeedbackCapture(parcel, buyer) {
  const loop = buildBuyerFeedbackLoop(workspace.buyers || []);
  const recommendations = recommendNextSellerCallsFromFeedback(workspace.parcels || [], workspace.buyers || []).slice(0, 3);
  return `<section class="buyer-feedback-capture" data-feedback-parcel-id="${h(parcel.id)}" aria-label="Buyer feedback capture">
    <details>
      <summary><span><em class="eyebrow">Buyer feedback</em><b>Record the answer that rewrites tomorrow’s calls.</b></span><strong>${h(loop.totalFeedback)} logged</strong></summary>
      <p class="feedback-tightening-copy">${h(loop.tightening)}</p>
      <div class="feedback-form-grid">
        <label>Buyer response<select class="buyer-feedback-decision"><option value="accept">yes / wants it</option><option value="maybe">maybe / needs review</option><option value="reject">no / reject</option></select></label>
        <label>Reason<select class="buyer-feedback-reason">${BUYER_FEEDBACK_REASONS.map(reason => `<option value="${h(reason)}">${h(reason)}</option>`).join('')}</select></label>
        <label>Buyer max price<input class="buyer-feedback-max" type="number" min="0" step="500" placeholder="${h(buyer.maxPrice || parcel.buyerMaxPrice || '')}"></label>
        <label class="feedback-note-label">Exact words / next constraint<textarea class="buyer-feedback-note" rows="2" placeholder="Too much wetland risk; only send paved-road lots under $38k..."></textarea></label>
        <button class="save-buyer-feedback" type="button">Save buyer feedback</button><span class="buyer-feedback-status"></span>
      </div>
      <div class="feedback-summary"><div><span>Total feedback</span><b>${loop.totalFeedback}</b></div><div><span>Accepted</span><b>${loop.accepted}</b></div><div><span>Rejected</span><b>${loop.rejected}</b></div><div><span>Maybe</span><b>${loop.maybe}</b></div></div>
      <div class="next-call-guidance"><h4>What to call next</h4>${recommendations.map(item => `<div><b>${h(item.address)} · ${h(item.adjustedScore)}/100</b><span>${h(item.nextCallReason)}</span></div>`).join('') || '<p>No recommendations yet.</p>'}</div>
    </details>
  </section>`;
}

function renderOfferPacketPanel() {
  const target = document.querySelector('#offer-packet-panel');
  if (!target) return;
  const packet = currentOfferPacket();
  if (!packet) {
    target.innerHTML = '<p>No parcel available for offer packet generation.</p>';
    return;
  }
  const buyerMemo = currentBuyerSendMemo();
  target.innerHTML = `<div class="packet-grid">
    <div class="packet-economics"><h4>${h(packet.address)}</h4><div class="deal-strip five"><div><span>Seller offer</span><strong>${formatMoney(packet.sellerOffer)}</strong></div><div><span>Assignment price</span><strong>${formatMoney(packet.assignmentPrice)}</strong></div><div><span>Projected spread</span><strong>${formatMoney(packet.projectedSpread)}</strong></div><div><span>Closing costs</span><strong>${formatMoney(packet.closingCosts)}</strong></div><div><span>Buyer</span><strong>${h(packet.buyerName || 'unknown')}</strong></div></div><p>${h(packet.summary)}</p></div>
    ${renderBuyerSendMemoCard(buyerMemo)}
    <div class="risk-checklist"><h4>Risk checklist</h4>${packet.riskChecklist.map(item => `<div class="risk-item ${h(item.status)}"><b>${h(item.label)} · ${h(item.status)}</b><span>${h(item.detail)}</span></div>`).join('')}</div>
    <div class="memo-preview"><h4>Seller offer letter preview</h4><pre>${h(packet.sellerOfferLetter.slice(0, 900))}</pre></div>
    <div class="memo-preview"><h4>Buyer assignment summary preview</h4><pre>${h(packet.buyerAssignmentSummary.slice(0, 900))}</pre></div>
  </div>`;
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      const view = viewButton.dataset.view;
      if (validViews.has(view)) {
        event.preventDefault();
        navigateToView(view);
      }
      return;
    }

    const builderMarketButton = event.target.closest('[data-builder-market-key], [data-builder-market-state]');
    if (builderMarketButton) {
      event.preventDefault();
      const marketKey = builderMarketButton.dataset.builderMarketKey;
      const stateCode = builderMarketButton.dataset.builderMarketState;
      if (marketKey) {
        const registryMarket = builderMarketRegistryByKey.get(marketKey);
        selectedBuilderMarketKey = marketKey;
        selectedBuilderMarketState = registryMarket?.state || selectedBuilderMarketState;
        selectedBuilderId = '';
        selectedValidationBuilderId = '';
        renderBuilderListEnginePanel({ preserveViewport: true });
      } else if (stateCode) {
        selectedBuilderMarketState = stateCode;
        selectedBuilderMarketKey = '';
        selectedBuilderId = '';
        selectedValidationBuilderId = '';
        renderBuilderListEnginePanel({ preserveViewport: true });
      }
      return;
    }

    const stateButton = event.target.closest('[data-lead-state]');
    if (stateButton) {
      leadEngineStateFilter = stateButton.dataset.leadState || 'all';
      renderLeadEnginePanel();
      return;
    }


    const landActivityButton = event.target.closest('[data-toggle-land-activity]');
    if (landActivityButton) {
      event.preventDefault();
      event.stopPropagation();
      const parcelKey = landActivityButton.dataset.activityId || '';
      const channel = landActivityButton.dataset.toggleLandActivity;
      if (!parcelKey || !ACTIVITY_CHANNELS.includes(channel)) return;
      const current = activityChannelState('land', parcelKey, channel);
      setActivityChannel('land', parcelKey, channel, !current.done, todayIsoDate());
      persistWorkspace();
      renderParcels();
      return;
    }

    const parcelButton = event.target.closest('[data-select-parcel]');
    if (parcelButton) {
      selectedParcelId = parcelButton.dataset.selectParcel;
      renderParcels();
      if (activeView !== 'deals') {
        renderClosingDeskPanel();
        renderBuilderListEnginePanel();
      }
      return;
    }

    if (event.target.matches('#import-land-recon-packet')) {
      event.preventDefault();
      const input = document.querySelector('#land-recon-packet-input');
      const status = document.querySelector('#land-recon-import-status');
      try {
        const result = applyLandReconParcelImport(workspace, input?.value || '');
        workspace = result.workspace;
        persistWorkspace();
        lastLandReconImportStatus = `Imported ${result.summary.imported} visible finding${result.summary.imported === 1 ? '' : 's'}; merged ${result.summary.duplicateMerged || 0} duplicate${(result.summary.duplicateMerged || 0) === 1 ? '' : 's'}; rejected ${result.summary.rejected} unusable row${result.summary.rejected === 1 ? '' : 's'}. Confidence ranks; call-ready remains gated.`;
        selectedParcelId = result.workspace.parcels?.[0]?.id || selectedParcelId;
        if (status) status.textContent = lastLandReconImportStatus;
        renderAll();
      } catch (error) {
        lastLandReconImportStatus = `Import blocked: ${error.message}`;
        if (status) status.textContent = lastLandReconImportStatus;
      }
      return;
    }

    const builderButton = event.target.closest('[data-select-builder]');
    if (builderButton) {
      event.preventDefault();
      selectedBuilderId = builderButton.dataset.selectBuilder;
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    const validationContactButton = event.target.closest('[data-toggle-validation-contact]');
    if (validationContactButton) {
      event.preventDefault();
      const builderId = validationContactButton.dataset.builderId || selectedValidationBuilderId;
      const channel = validationContactButton.dataset.toggleValidationContact;
      if (!builderId || !ACTIVITY_CHANNELS.includes(channel)) return;
      const current = asArray(workspace.buyerValidations).find(item => item.builderId === builderId) || {};
      const currentOutreach = current.outreach || {};
      const currentChannel = currentOutreach[channel] || {};
      const nextContacted = !currentChannel.contacted;
      const today = todayIsoDate();
      const nextOutreach = {
        ...currentOutreach,
        [channel]: {
          contacted: nextContacted,
          at: nextContacted ? today : '',
        },
      };
      const updated = mergeBuyerValidationPatch(builderId, {
        outreach: nextOutreach,
        lastContacted: nextContacted ? today : (current.lastContacted || ''),
      });
      upsertBuyerValidation(updated);
      selectedValidationBuilderId = builderId;
      persistWorkspace();
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    const selectedBuilderDock = event.target.closest('[data-scroll-selected-builder]');
    if (selectedBuilderDock) {
      event.preventDefault();
      document.querySelector('#selected-builder-card')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return;
    }

    const validationBuilderButton = event.target.closest('[data-select-validation-builder]');
    if (validationBuilderButton) {
      event.preventDefault();
      selectedValidationBuilderId = validationBuilderButton.dataset.selectValidationBuilder;
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    const moneyCallButton = event.target.closest('[data-select-money-call]');
    if (moneyCallButton) {
      selectedMoneyCallId = moneyCallButton.dataset.selectMoneyCall;
      renderCommandCenter();
      return;
    }

    const outcomeButton = event.target.closest('[data-call-outcome]');
    if (outcomeButton && selectedMoneyCallId) {
      workspace = applyCallOutcome(workspace, selectedMoneyCallId, outcomeButton.dataset.callOutcome);
      persistWorkspace();
      renderAll();
      return;
    }

    if (event.target.matches('#load-lehigh-template')) {
      document.querySelector('#csv-input').value = getLehighImportTemplate();
      const status = document.querySelector('#import-status');
      if (status) status.textContent = 'Loaded Lehigh Acres template.';
    }

    if (event.target.matches('#import-csv')) {
      const input = document.querySelector('#csv-input');
      const status = document.querySelector('#import-status');
      const preset = document.querySelector('#source-preset')?.value || 'land-dealflow';
      const records = normalizeCsvToParcels(input.value, preset).map((record, index) => ({
        ...record,
        id: record.id || record.parcelId || `csv-${Date.now()}-${index + 1}`,
        crmStatus: record.crmStatus || 'New',
        notes: record.notes || '',
        nextFollowUp: record.nextFollowUp || '',
      }));
      workspace = { ...workspace, parcels: [...(workspace.parcels || []), ...records] };
      persistWorkspace();
      status.textContent = `Imported ${records.length} parcels.`;
      renderAll();
    }

    if (event.target.matches('#load-skiptrace-template')) {
      const input = document.querySelector('#skip-trace-csv');
      if (input) input.value = skipTraceTemplateRow();
      const status = document.querySelector('#skiptrace-status');
      if (status) status.textContent = 'Loaded first real skip-trace lead.';
    }

    if (event.target.matches('#import-skiptrace')) {
      const input = document.querySelector('#skip-trace-csv');
      const status = document.querySelector('#skiptrace-status');
      const result = applySkipTraceImport(workspace, input?.value || '', { candidateParcels: generatedCandidateParcels() });
      workspace = result.workspace;
      persistWorkspace();
      if (status) status.textContent = `Matched ${result.summary.matched}/${result.summary.imported}; Today can now promote real callable records.`;
      renderAll();
    }

    if (event.target.matches('#builder-load-skiptrace-template')) {
      const input = document.querySelector('#builder-skip-trace-csv');
      if (input) input.value = builderSkipTraceTemplateRow(selectedBuilderMarketState || 'TN');
      lastBuilderSkipTraceImportStatus = 'Loaded first buyer-box-matched seller row for the active state.';
      const status = document.querySelector('#builder-skiptrace-status');
      if (status) status.textContent = lastBuilderSkipTraceImportStatus;
    }

    if (event.target.matches('#builder-import-skiptrace')) {
      const input = document.querySelector('#builder-skip-trace-csv');
      const stateCode = selectedBuilderMarketState || 'TN';
      const result = applySkipTraceImport(workspace, input?.value || '', { candidateParcels: sellerPoolForState(stateCode) });
      workspace = result.workspace;
      persistWorkspace();
      const buyers = buyerPoolForState(stateCode);
      const sellers = sellerPoolForState(stateCode);
      const conveyor = buildExecutionConveyor({ buyers, sellerCandidates: sellers, limit: 50 });
      lastBuilderSkipTraceImportStatus = `Imported ${result.summary.matched}/${result.summary.imported} skip-trace rows; ${conveyor.callReadySellers.length} now sit in seller cockpit review for ${stateCode}.`;
      renderAll();
    }

    if (event.target.matches('#load-buyer-contact-template')) {
      const input = document.querySelector('#buyer-contact-csv');
      if (input) input.value = buyerContactTemplateRow();
      const status = document.querySelector('#buyer-contact-status');
      if (status) status.textContent = 'Loaded top builder signal.';
    }

    if (event.target.matches('#import-buyer-contact')) {
      const input = document.querySelector('#buyer-contact-csv');
      const status = document.querySelector('#buyer-contact-status');
      const result = applyBuyerContactImport(workspace, input?.value || '', { candidateBuyers: generatedCandidateBuyers() });
      workspace = result.workspace;
      persistWorkspace();
      if (status) status.textContent = `Enriched ${result.summary.matched}/${result.summary.imported} buyer contacts.`;
      renderAll();
    }

    if (event.target.matches('#export-json')) {
      downloadText(`land-dealflow-workspace-${new Date().toISOString().slice(0, 10)}.json`, exportWorkspace(workspace), 'application/json');
    }

    if (event.target.matches('#load-selected-contract-deal')) {
      const selected = getSelectedParcel(getVisibleParcels()) || {};
      workspace = { ...workspace, contractDraft: currentContractDraftInputs(selected) };
      persistWorkspace();
      renderClosingDeskPanel();
      return;
    }

    if (event.target.matches('[data-contract-status]')) {
      const form = document.querySelector('#contract-packet-form');
      const values = form ? Object.fromEntries(new FormData(form).entries()) : (workspace.contractDraft || {});
      const action = event.target.dataset.contractStatus;
      const nextStatus = { ...(workspace.contractStageStatus || {}) };
      if (action === 'seller-ready') nextStatus.sellerAgreement = 'ready';
      if (action === 'seller-signed') nextStatus.sellerAgreement = 'seller-signed';
      if (action === 'assignment-ready') nextStatus.assignmentAgreement = 'ready';
      if (action === 'buyer-signed') nextStatus.assignmentAgreement = 'buyer-signed';
      if (action === 'title-opened') nextStatus.titlePacket = 'title-opened';
      workspace = { ...workspace, contractDraft: values, contractStageStatus: nextStatus };
      persistWorkspace();
      renderClosingDeskPanel();
      return;
    }

    if (event.target.matches('#save-contract-packet')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      workspace = { ...workspace, contractDraft: values, contractPackets: [packet, ...asArray(workspace.contractPackets).filter(item => item.id !== packet.id)].slice(0, 12) };
      persistWorkspace();
      const status = document.querySelector('#contract-packet-status');
      if (status) status.textContent = `${packet.status}; draft stored locally.`;
      renderClosingDeskPanel();
      return;
    }

    if (event.target.matches('#print-contract-packet, [data-print-contract-packet]')) {
      const form = document.querySelector('#contract-packet-form');
      if (form) workspace = { ...workspace, contractDraft: Object.fromEntries(new FormData(form).entries()) };
      persistWorkspace();
      triggerContractPrint(event.target.dataset.printContractPacket || 'packet');
      return;
    }

    if (event.target.matches('#export-seller-contract')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      downloadText(`land-dealflow-seller-agreement-${slugify(values.propertyAddress || values.parcelId || 'draft')}-${new Date().toISOString().slice(0, 10)}.md`, `# Seller Land Sale Agreement\n\n${renderContractDocumentText(packet.sellerAgreement, packet.inputs)}\n\n## Legal guardrail\n\n${packet.legalGuardrail}`, 'text/markdown');
      return;
    }

    if (event.target.matches('#export-assignment-contract')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      downloadText(`land-dealflow-assignment-agreement-${slugify(values.propertyAddress || values.parcelId || 'draft')}-${new Date().toISOString().slice(0, 10)}.md`, `# Assignment Agreement\n\n${renderContractDocumentText(packet.buyerAssignment, packet.inputs)}\n\n## Legal guardrail\n\n${packet.legalGuardrail}`, 'text/markdown');
      return;
    }

    if (event.target.matches('#export-contract-packet')) {
      const form = document.querySelector('#contract-packet-form');
      const values = Object.fromEntries(new FormData(form).entries());
      const packet = buildContractPacketDraft(values);
      downloadText(`land-dealflow-title-packet-${slugify(values.propertyAddress || values.parcelId || 'draft')}-${new Date().toISOString().slice(0, 10)}.md`, exportContractPacketMarkdown(packet), 'text/markdown');
      const status = document.querySelector('#contract-packet-status');
      if (status) status.textContent = 'Title packet exported with review letter, seller agreement, and assignment agreement.';
      return;
    }

    if (event.target.matches('#export-filtered-csv')) {
      downloadText(`land-dealflow-filtered-${filter}-${new Date().toISOString().slice(0, 10)}.csv`, exportParcelsCsv(getVisibleParcels()));
    }

    if (event.target.matches('#export-top20-csv')) {
      const calls = buildTopCallList({ parcels: workspace.parcels, buyers: workspace.buyers, limit: 20 });
      downloadText(`land-dealflow-top20-call-list-${new Date().toISOString().slice(0, 10)}.csv`, exportParcelsCsv(calls));
    }

    if (event.target.matches('#export-matched-seller-batch')) {
      const stateCode = selectedBuilderMarketState || 'TN';
      const buyers = buyerPoolForState(stateCode);
      const sellers = sellerPoolForState(stateCode);
      const conveyor = buildExecutionConveyor({ buyers, sellerCandidates: sellers, limit: 50 });
      downloadText(`land-dealflow-matched-seller-batch-${stateCode.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, exportMatchedSellerBatchCsv(conveyor.matchedSellerBatch));
      const status = document.querySelector('#matched-seller-export-status');
      if (status) status.textContent = `Exported ${conveyor.matchedSellerBatch.length} buyer-box-matched sellers from saved selected-builder buy boxes.`;
    }

    const executionOutcomeButton = event.target.closest('[data-execution-call-outcome]');
    if (executionOutcomeButton) {
      event.preventDefault();
      const card = executionOutcomeButton.closest('[data-phase7-seller-card]');
      const capture = card?.querySelector('[data-execution-capture]');
      const parcelId = executionOutcomeButton.dataset.parcelId || card?.dataset.phase7SellerCard || '';
      workspace = applyCallOutcome(workspace, parcelId, executionOutcomeButton.dataset.executionCallOutcome, {
        updates: {
          sellerAskingPrice: capture?.querySelector('.phase7-ask')?.value || '',
          askingPrice: capture?.querySelector('.phase7-ask')?.value || '',
          sellerTimeline: capture?.querySelector('.phase7-timeline')?.value || '',
          nextFollowUp: capture?.querySelector('.phase7-callback')?.value || '',
          sellerMotivation: capture?.querySelector('.phase7-motivation')?.value || '',
          accessBuildabilityNotes: capture?.querySelector('.phase7-access')?.value || '',
          exactSellerLanguage: capture?.querySelector('.phase7-language')?.value || '',
        },
      });
      persistWorkspace();
      lastBuilderSkipTraceImportStatus = 'Seller outcome captured; contract/title gate, buyer memo, and feedback rewrite recomputed.';
      renderAll();
      return;
    }

    const executionMemoButton = event.target.closest('[data-download-execution-memo]');
    if (executionMemoButton) {
      event.preventDefault();
      const parcelId = executionMemoButton.dataset.downloadExecutionMemo;
      const stateCode = selectedBuilderMarketState || 'TN';
      const sellers = sellerPoolForState(stateCode);
      const buyers = buyerPoolForState(stateCode);
      const parcel = sellers.find(item => String(item.id || '') === String(parcelId) || String(item.parcelId || '') === String(parcelId));
      const buyer = buyers.find(item => String(item.id || item.buyerId || '') === String(parcel?.buyerId || parcel?.buyer?.id || '')) || buyers[0] || {};
      if (!parcel) return;
      const memo = generateBuyerSendMemo(parcel, buyer, generateOfferPacket(parcel, buyer));
      downloadText(`land-dealflow-buyer-send-memo-${stateCode.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`, exportBuyerSendMemoMarkdown(memo), 'text/markdown');
      const status = executionMemoButton.closest('[data-phase7-seller-card]')?.querySelector('.phase7-save-status');
      if (status) status.textContent = 'Buyer memo downloaded for this seller row.';
      return;
    }

    if (event.target.matches('#export-daily-call-sheet')) {
      const queue = buildDailyMoneyQueue({ parcels: workspace.parcels || [], buyers: workspace.buyers || [], limit: 20, requireRealContact: true });
      downloadText(`land-dealflow-daily-call-sheet-${new Date().toISOString().slice(0, 10)}.csv`, exportDailyCallSheetCsv([...queue.followUps, ...queue.today]));
    }

    if (event.target.matches('#export-mailmerge-csv')) {
      downloadText(`land-dealflow-mail-merge-${new Date().toISOString().slice(0, 10)}.csv`, exportMailMergeCsv(getVisibleParcels()));
    }

    if (event.target.matches('#capture-sample-buybox')) {
      workspace = { ...workspace, buyers: (workspace.buyers || []).map((buyer, index) => index === 0 ? captureBuyBox(buyer, { lotSizeMin: 0.23, lotSizeMax: 0.32, maxPrice: buyer.maxPrice || 42000, targetMarkets: [buyer.market || 'lehigh'], requiredRoadAccess: true, requiredUtilities: false, avoidFloodZones: ['AE'], avoidWetlands: true, notes: 'captured from v0.7 buyer validation panel' }) : buyer) };
      persistWorkspace();
      const status = document.querySelector('#buyer-validation-status');
      if (status) status.textContent = 'Sample buy-box captured.';
      renderAll();
    }

    if (event.target.matches('#add-sample-buyer-note')) {
      workspace = { ...workspace, buyers: (workspace.buyers || []).map((buyer, index) => index === 0 ? addBuyerCallNote(buyer, { date: new Date().toISOString().slice(0, 10), contact: buyer.contactName || '', outcome: 'answered', note: 'Validated buyer criteria and captured feedback loop.', dealFeedback: { parcelId: 'parcel-1', decision: 'accept', reason: 'clean infill' } }) : buyer) };
      persistWorkspace();
      const status = document.querySelector('#buyer-validation-status');
      if (status) status.textContent = 'Buyer call note added.';
      renderAll();
    }

    if (event.target.matches('#bulk-contact-callnow')) {
      const callNowIds = scoredParcels().filter(parcel => parcel.action === 'Call now').map(parcel => parcel.id);
      const followUp = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      workspace = bulkMarkContacted(workspace, callNowIds, { channel: 'phone', nextFollowUp: followUp, note: 'bulk marked from v0.5 outreach panel' });
      persistWorkspace();
      const status = document.querySelector('#outreach-status');
      if (status) status.textContent = `Marked ${callNowIds.length} parcels contacted.`;
      renderAll();
    }

    if (event.target.matches('#export-deal-memo')) {
      const packet = currentOfferPacket();
      if (!packet) return;
      downloadText(`land-dealflow-deal-memo-${new Date().toISOString().slice(0, 10)}.md`, exportDealMemoMarkdown(packet), 'text/markdown');
      const status = document.querySelector('#deal-memo-status');
      if (status) status.textContent = 'Deal memo exported.';
    }

    if (event.target.matches('#download-buyer-send-memo, .download-buyer-send-memo')) {
      const memo = currentBuyerSendMemo();
      if (!memo) return;
      downloadText(`land-dealflow-buyer-send-memo-${new Date().toISOString().slice(0, 10)}.md`, exportBuyerSendMemoMarkdown(memo), 'text/markdown');
      const status = event.target.closest('.buyer-send-memo, .machine-panel')?.querySelector('.buyer-send-memo-status, #buyer-send-memo-status');
      if (status) status.textContent = 'Buyer memo downloaded.';
    }

    if (event.target.matches('#copy-buyer-send-memo, .copy-buyer-send-memo')) {
      const memo = currentBuyerSendMemo();
      if (!memo) return;
      const status = event.target.closest('.buyer-send-memo, .machine-panel')?.querySelector('.buyer-send-memo-status, #buyer-send-memo-status');
      const write = navigator.clipboard?.writeText?.(memo.message) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Buyer memo copied.'; }).catch(() => {
        downloadText(`land-dealflow-buyer-send-memo-${new Date().toISOString().slice(0, 10)}.txt`, memo.message, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-title-email]')) {
      const email = currentTitleCompanyEmail();
      if (!email) return;
      const status = event.target.closest('.closing-desk')?.querySelector('.closing-email-status');
      const write = navigator.clipboard?.writeText?.(email) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Title email copied.'; }).catch(() => {
        downloadText(`land-dealflow-title-company-email-${new Date().toISOString().slice(0, 10)}.txt`, email, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-research-title-email]')) {
      const template = titleCompanyProcess?.templates?.titlePacketEmail || {};
      const payload = `Subject: ${template.subject || '<PROPERTY ADDRESS> - Assignment closing packet'}\n\n${template.body || ''}`;
      const status = event.target.closest('.closing-email-template-card')?.querySelector('.research-closing-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Template copied.'; }).catch(() => {
        downloadText(`land-dealflow-title-packet-template-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }


    const copyBuilderEmailAddressButton = event.target.closest('[data-copy-builder-email-address]');
    if (copyBuilderEmailAddressButton) {
      event.preventDefault();
      const email = copyBuilderEmailAddressButton.dataset.copyBuilderEmailAddress || '';
      if (!email) return;
      const status = copyBuilderEmailAddressButton.closest('.validation-focus-card')?.querySelector('.validation-email-status');
      const write = navigator.clipboard?.writeText?.(email) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Email address copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-email-address-${new Date().toISOString().slice(0, 10)}.txt`, email, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded address instead.';
      });
      return;
    }

    if (event.target.matches('[data-copy-validation-email]')) {
      const center = buildBuyerValidationCommandCenter(getActiveValidationRows(), workspace.buyerValidations || []);
      const builder = center.items.find(item => item.builderId === selectedValidationBuilderId) || center.next || center.items[0] || {};
      const email = builder.emailDraft || {};
      const fallbackEmail = generateBuilderEmail(builder);
      const subject = email.subject || fallbackEmail.subject;
      const body = fallbackEmail.body;
      const payload = `Subject: ${subject}

${body}`;
      const status = event.target.closest('.validation-actions')?.querySelector('.validation-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Buy-box email copied.'; }).catch(() => {
        downloadText(`land-dealflow-validation-email-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
      return;
    }

    if (event.target.matches('[data-save-buyer-validation]')) {
      event.preventDefault();
      const form = event.target.closest('[data-validation-form]');
      const builderId = form?.dataset.validationForm;
      const sourceRow = findLoadedBuilderRow(builderId);
      if (!builderId) return;
      const updated = mergeBuyerValidationPatch(builderId, {
        callStatus: form.querySelector('.validation-status')?.value || 'not_called',
        lastContacted: form.querySelector('.validation-last')?.value || '',
        callbackDate: form.querySelector('.validation-callback')?.value || '',
        callNotes: form.querySelector('.validation-notes')?.value || '',
        buyBox: {
          geography: form.querySelector('.validation-geography')?.value || '',
          lotSize: form.querySelector('.validation-lot')?.value || '',
          maxPrice: Number(form.querySelector('.validation-price')?.value || 0) || '',
          closeSpeed: form.querySelector('.validation-speed')?.value || '',
          packageRecipient: form.querySelector('.validation-recipient')?.value || '',
          utilitiesAccess: form.querySelector('.validation-utilities')?.value || '',
          productType: form.querySelector('.validation-product')?.value || '',
          dealKillers: parseListInput(form.querySelector('.validation-killers')?.value || ''),
        },
      });
      const centerRow = buildBuyerValidationCommandCenter([sourceRow], [updated]).items[0] || updated;
      upsertBuyerValidation(updated);
      const promotedBuyer = centerRow.validation?.sellerEligible ? upsertBuyerFromValidation(centerRow) : null;
      persistWorkspace();
      const status = form.querySelector('.validation-save-status');
      if (status) status.textContent = promotedBuyer ? 'Validation saved; selected builder is now the buyer object for seller matching and CSV export.' : 'Validation saved. Complete the six-field buy box and set validated status to unlock seller matching.';
      renderBuilderListEnginePanel({ preserveViewport: true });
      return;
    }

    if (event.target.matches('[data-save-builder-buybox]')) {
      event.preventDefault();
      const form = event.target.closest('[data-builder-form]');
      const builderId = form?.dataset.builderForm;
      const builders = getPermitBuilders();
      const builder = builders.find(item => item.builderId === builderId);
      if (!builder) return;
      const updated = {
        ...builder,
        buyBoxStatus: 'captured',
        buyBox: {
          zipCodes: String(form.querySelector('.builder-zip')?.value || '').split(',').map(item => item.trim()).filter(Boolean),
          lotSizeRange: form.querySelector('.builder-size')?.value || '',
          maxPrice: Number(form.querySelector('.builder-price')?.value || 0) || null,
          dealKillers: String(form.querySelector('.builder-killers')?.value || '').split(',').map(item => item.trim()).filter(Boolean),
          closeSpeedDays: form.querySelector('.builder-speed')?.value || '',
          submissionMethod: form.querySelector('.builder-submit')?.value || '',
        },
      };
      workspace = { ...workspace, permitBuilders: [...asArray(workspace.permitBuilders).filter(item => item.builderId !== builderId), updated] };
      persistWorkspace();
      const status = form.querySelector('.builder-save-status');
      if (status) status.textContent = 'Buy box captured; builder promoted from permitVerified.';
      renderBuilderListEnginePanel({ preserveViewport: true });
    }

    if (event.target.matches('[data-copy-builder-script]')) {
      const builder = getSelectedBuilder();
      const script = generateBuilderCallScript(builder);
      const status = event.target.closest('.builder-script-panel')?.querySelector('.builder-script-status');
      const write = navigator.clipboard?.writeText?.(script) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Call script copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-call-script-${new Date().toISOString().slice(0, 10)}.txt`, script, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-builder-email]')) {
      const builder = getSelectedBuilder();
      const email = generateBuilderEmail(builder);
      const payload = `Subject: ${email.subject}\n\n${email.body}`;
      const status = event.target.closest('.builder-script-panel')?.querySelector('.builder-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Buy-box email copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-email-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('[data-copy-builder-marketing-email]')) {
      const builder = getSelectedBuilder();
      const email = generateBuilderMarketingEmailTemplate(builder);
      const payload = `Subject: ${email.subject}\n\n${email.body}`;
      const status = event.target.closest('.builder-script-panel')?.querySelector('.builder-marketing-email-status');
      const write = navigator.clipboard?.writeText?.(payload) || Promise.reject(new Error('Clipboard unavailable'));
      write.then(() => { if (status) status.textContent = 'Marketing template copied.'; }).catch(() => {
        downloadText(`land-dealflow-builder-marketing-template-${new Date().toISOString().slice(0, 10)}.txt`, payload, 'text/plain');
        if (status) status.textContent = 'Clipboard blocked; downloaded instead.';
      });
    }

    if (event.target.matches('#import-json')) {
      const input = document.querySelector('#json-input');
      workspace = importWorkspace(input.value);
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('#reset-workspace')) {
      workspace = { markets: seedMarkets, buyers: seedBuyers, parcels: seedParcels, permitRecords: seedPermitRecords, permitBuilders: [], buyerValidations: [] };
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('.save-buyer-feedback')) {
      const panel = event.target.closest('.buyer-feedback-capture');
      const parcelId = panel?.dataset.feedbackParcelId;
      workspace = applyBuyerFeedback(workspace, parcelId, {
        decision: panel.querySelector('.buyer-feedback-decision')?.value || 'reject',
        reason: panel.querySelector('.buyer-feedback-reason')?.value || 'other',
        maxPrice: panel.querySelector('.buyer-feedback-max')?.value || '',
        note: panel.querySelector('.buyer-feedback-note')?.value || '',
      });
      persistWorkspace();
      const status = panel.querySelector('.buyer-feedback-status');
      if (status) status.textContent = 'Buyer feedback saved; next-call guidance recalculated.';
      renderAll();
      return;
    }

    if (event.target.matches('.save-crm')) {
      const row = event.target.closest('.crm-row');
      const parcelId = row.dataset.parcelId;
      workspace = applyCrmUpdate(workspace, parcelId, {
        crmStatus: row.querySelector('.crm-status').value,
        nextFollowUp: row.querySelector('.crm-followup').value,
        negotiatedSellerRange: row.querySelector('.crm-negotiated-range')?.value || '',
        titlePacketStatus: row.querySelector('.crm-title-status')?.value || 'missing',
        buyerMemoStatus: row.querySelector('.crm-buyer-memo-status')?.value || 'missing',
        assignmentStatus: row.querySelector('.crm-assignment-status')?.value || 'not-started',
        notes: row.querySelector('.crm-notes').value,
      });
      persistWorkspace();
      renderAll();
    }

    if (event.target.matches('[data-filter]')) {
      filter = event.target.dataset.filter;
      renderFilters();
      renderParcels();
      renderTopCallList();
    }

    const dealsMarketButton = event.target.closest('[data-deals-market-key]');
    if (dealsMarketButton) {
      selectedDealsMarketKey = dealsMarketButton.dataset.dealsMarketKey || 'all';
      selectedParcelId = '';
      renderParcels();
    }

    const landStateButton = event.target.closest('[data-land-state]');
    if (landStateButton) {
      selectedLandStateFilter = landStateButton.dataset.landState || 'all';
      const activeMarket = getSelectedDealsMarket();
      if (selectedLandStateFilter === 'all') selectedDealsMarketKey = 'all';
      if (activeMarket && selectedLandStateFilter !== 'all' && (activeMarket.stateCode || activeMarket.state) !== selectedLandStateFilter) selectedDealsMarketKey = 'all';
      selectedParcelId = '';
      renderParcels();
    }

    const landSortButton = event.target.closest('[data-land-sort]');
    if (landSortButton) {
      selectedLandSort = landSortButton.dataset.landSort || 'priority';
      selectedParcelId = '';
      renderParcels();
    }


    const lateLandActivityButton = event.target.closest('[data-toggle-land-activity]');
    if (lateLandActivityButton) {
      event.preventDefault();
      event.stopPropagation();
      const parcelKey = lateLandActivityButton.dataset.activityId || '';
      const channel = lateLandActivityButton.dataset.toggleLandActivity;
      if (!parcelKey || !ACTIVITY_CHANNELS.includes(channel)) return;
      const current = activityChannelState('land', parcelKey, channel);
      setActivityChannel('land', parcelKey, channel, !current.done, todayIsoDate());
      persistWorkspace();
      renderParcels();
      return;
    }

    if (event.target.matches('[data-select-parcel]')) {
      selectedParcelId = event.target.dataset.selectParcel;
      renderParcels();
    }
  });

  document.addEventListener('keydown', (event) => {
    const stateMarketButton = event.target.closest?.('[data-builder-market-state].state-market-toggle');
    if (stateMarketButton && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      stateMarketButton.click();
      return;
    }

    const dealsMarketButton = event.target.closest?.('[data-deals-market-key]');
    if (dealsMarketButton && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      selectedDealsMarketKey = dealsMarketButton.dataset.dealsMarketKey || 'all';
      selectedParcelId = '';
      renderParcels();
      return;
    }

    const landKeyboardButton = event.target.closest?.('[data-land-state], [data-land-sort]');
    if (landKeyboardButton && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      if (landKeyboardButton.dataset.landState) {
        selectedLandStateFilter = landKeyboardButton.dataset.landState || 'all';
        const activeMarket = getSelectedDealsMarket();
        if (selectedLandStateFilter === 'all') selectedDealsMarketKey = 'all';
        if (activeMarket && selectedLandStateFilter !== 'all' && (activeMarket.stateCode || activeMarket.state) !== selectedLandStateFilter) selectedDealsMarketKey = 'all';
      }
      if (landKeyboardButton.dataset.landSort) selectedLandSort = landKeyboardButton.dataset.landSort || 'priority';
      selectedParcelId = '';
      renderParcels();
      return;
    }

    if (document.body?.dataset?.activeView !== 'builders') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target?.tagName?.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    const rows = [...document.querySelectorAll('[data-select-validation-builder]')];
    if (!rows.length || !['j', 'k'].includes(event.key.toLowerCase())) return;
    event.preventDefault();
    const currentIndex = Math.max(0, rows.findIndex(row => row.dataset.selectValidationBuilder === selectedValidationBuilderId));
    const nextIndex = event.key.toLowerCase() === 'j' ? Math.min(rows.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    const nextId = rows[nextIndex]?.dataset.selectValidationBuilder;
    if (!nextId || nextId === selectedValidationBuilderId) return;
    selectedValidationBuilderId = nextId;
    renderBuilderListEnginePanel({ preserveViewport: true });
  });

  document.addEventListener('toggle', (event) => {
    const machinePanel = event.target.closest?.('.machine-panel');
    if (machinePanel) {
      if (machinePanel.open) {
        openMachinePanel = machinePanel.dataset.machinePanel || '';
        document.querySelectorAll('.machine-panel[open]').forEach((other) => {
          if (other !== machinePanel) other.open = false;
        });
      } else if (openMachinePanel === machinePanel.dataset.machinePanel) {
        openMachinePanel = '';
      }
      return;
    }

    const disclosure = event.target.closest?.('.source-disclosure');
    if (!disclosure || !disclosure.open) return;
    document.querySelectorAll('.source-disclosure[open]').forEach((other) => {
      if (other !== disclosure) other.open = false;
    });
  }, true);

  window.addEventListener('hashchange', () => {
    const view = hashToView();
    if (view) setActiveView(view, { scrollToTop: true });
  });
}

function renderFilters() {
  const target = document.querySelector('#parcel-filters');
  if (!target) return;
  target.setAttribute('aria-label', 'Land page legacy stage filters removed');
  target.classList.add('land-stage-filters-retired');
  target.hidden = true;
  target.innerHTML = '';
}

function renderAll() {
  if (activeView === 'deals') {
    renderFilters();
    renderParcels();
    renderAppShell();
    return;
  }
  renderCommandCenter();
  renderWorkspaceTools();
  renderSkipTraceIntakePanel();
  renderBuyerContactIntakePanel();
  renderSourcePriorityBoard();
  renderPipeline();
  renderMarkets();
  renderBuyers();
  renderFilters();
  renderParcels();
  renderClosingDeskPanel();
  renderBuilderListEnginePanel();
  renderTopCallList();
  renderWeeklyMarketScout();
  renderLeadEnginePanel();
  renderQualityControl();
  renderBuyerValidationPanel();
  renderOutreachPanel();
  renderOfferPacketPanel();
  renderAppShell();
}

bindEvents();
renderAll();
loadGeneratedLeads().then(renderAll);
loadDallasProofSprint().then(renderAll);
loadKeystoneHeightsLandowners().then(renderAll);
loadFreeGovOwnerSources().then(renderAll);
loadKnoxvilleBuyerCallSheet().then(renderAll);
loadBuilderMarketData().then(renderAll);
loadWeeklyMarketScout().then(renderAll);
loadTitleCompanyResearch().then(renderAll);
