---
title: "1185 SW Gastador Ave - Dallas Black Comp - July 2026"
created: 2026-07-07
tags:
  - landflip
  - comp
  - port-st-lucie
  - florida
  - vacant-land
  - manual-review
market: "Port St Lucie, FL"
source: "Hermes public-record comp run, July 2026"
status: "identity-conflict-manual-review-not-clean-vacant-land"
---

# 1185 SW Gastador Ave - Dallas Black Comp - July 2026

## Bottom line

**Do not offer as a clean vacant-land wholesale deal yet.** The seller-provided address `1185 SW Gastador Ave` did not resolve as a separate clean vacant parcel in the St. Lucie parcel layer during this run. The closest/owner-matching official parcel is **1193 SW Gastador Ave / Account 52146 / PID 3[redacted phone]-000-5**, owned by **Dallas L Black Sr**, and Florida statewide cadastral shows it as an **improved homestead** with **1 building**, **1,132 sf living area**, **1992 effective/actual year built**, **DOR use 001**, and 2025 just value **$262,000**.

Seller quote: **“$175k cash in hand.”** For land-only underwriting, that is **at/above a realistic retail vacant-lot exit**, not a wholesale acquisition price. If the seller is selling the whole improved parcel, this needs a residential/teardown analysis, not vacant-land comps. If he means a separately split vacant side yard or hidden second parcel at/near 1185, require **parcel ID / tax bill / survey / deed confirmation** before offer-ready.

## Subject identity and official parcel facts

- Seller-provided address: `1185 SW Gastador Ave, Port Saint Lucie, FL 34953`.
- Official owner-matching parcel found: `1193 SW Gastador Ave, Port Saint Lucie, FL 34953`.
- Owner: `Black Sr Dallas L` / `Dallas L Black Sr`.
- Parcel ID: **3[redacted phone]-000-5**.
- Alternate/account key: **52146**.
- St. Lucie account/PASLC record: **52146**.
- Legal: `PORT ST LUCIE-SECTION 08- BLK 1223 LOT 4 (MAP 43/01S) (OR 1125-1988 : 1969-1243)`.
- St. Lucie parcel-boundary acreage: **0.47842938 ac**.
- Florida statewide cadastral land square feet: **14,097 sf** (~0.3236 ac). This conflicts with boundary acreage and must be reconciled before pricing any split/excess-land deal.
- Zoning from St. Lucie parcel layer: **SLC_Zoning RS-2**. Other zoning/future-land-use fields were blank in the queried county layer.
- FEMA NFHL point check: **Zone X, Area of Minimal Flood Hazard, SFHA_TF = F**.
- 2025 statewide cadastral values: **JV $262,000; land value $149,300; assessed value $64,515; taxable value non-school $25,000 / school $39,515**.
- Building/improvement evidence: **NO_BULDNG = 1; TOT_LVG_AR = 1,132; effective year built 1992; actual year built 1992; app status H / homestead.**

## Ownership and purchase history

- Current public-record owner: **Dallas L Black Sr**.
- Official record references embedded in county parcel layer: **OR 1125-1988** and **OR 1969-1243**.
- Florida statewide cadastral sale fields for this parcel returned **SALE_PRC1 = 0, SALE_YR1 = 0, OR_BOOK1 blank, OR_PAGE1 blank**, so the original paid price is **not confirmed from the statewide sale fields**.
- Hold time: **manual clerk-image verification required**. The presence of OR Book/Page references indicates prior recorded instruments, but without PASLC sale API or clerk deed images, I will not fabricate the acquisition date or price.
- PASLC record-card API and app were blocked by 403 from this environment during this run; manual record-card URL remains below.

## Subject source links

- St. Lucie ParcelBoundaries exact PID query: https://services1.arcgis.com/oDRzuf2MGmdEHAbQ/arcgis/rest/services/ParcelBoundaries/FeatureServer/0/query?f=json&where=Hyphen_PID+%3D+%273[redacted phone]-000-5%27&outFields=%2A&returnGeometry=true&outSR=4326
- Florida statewide cadastral exact PID query: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-5%27&outFields=%2A&returnGeometry=true&outSR=4326
- PASLC record card: https://apps.paslc.gov/rerecordcard/52146
- FEMA NFHL point query: https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?f=json&geometry=%7B%22x%22%3A-80.38585%2C%22y%22%3A27.28585%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF%2CSTATIC_BFE%2CV_DATUM%2CDFIRM_ID&returnGeometry=false
- Google Maps coordinate check: https://www.google.com/maps/search/?api=1&query=27.28585,-80.38585
- St. Lucie Property Appraiser: https://www.paslc.gov/
- St. Lucie Clerk Official Records search: https://stlucieclerk.com/services/official-records

## Nearby vacant-land sales comps from official public records

Method: queried Florida statewide cadastral within ~2 miles of the subject coordinate for vacant residential use (`DOR_UC = 000`), then filtered client-side to recent sale price > $10,000 and sale year 2024+. 122 qualified recent vacant-lot sales appeared in the 2-mile pull. For 9k-22k sf lots, the public-record sale set had a median around **$14.00/sf**, P25 around **$12.56/sf**, and P75 around **$15.87/sf**; extreme deed rows above ~$30/sf were treated as outliers/package/noise unless independently verified.

### Comp table

- **1950 SW Americana St**
  - Parcel ID: `3[redacted phone]-000-7`
  - Sale price/date: **$145,000** / **2024-08**
  - Lot size: **10,375 sf** / **0.2382 ac**
  - Unit price: **$13.98/sf** / **$608,732/ac**
  - Zoning/use: **RS-2 / PSL Section 08; DOR_UC 000 vacant residential**
  - Distance: **0.17 mi**
  - Key adjustment: Holiday Builders buyer; closest 2024 sale; same market/neighborhood; standard ~10k sf lot; +size adj subject larger but improved/identity issue.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-7%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1306 SW Del Rio Blvd**
  - Parcel ID: `3[redacted phone]-000-7`
  - Sale price/date: **$140,000** / **2024-12**
  - Lot size: **10,000 sf** / **0.2296 ac**
  - Unit price: **$14.00/sf** / **$609,756/ac**
  - Zoning/use: **RS-2 / PSL Section 08; DOR_UC 000 vacant residential**
  - Distance: **0.18 mi**
  - Key adjustment: Very close; institutional SFH rental buyer; clean 10k sf lot; use as strong retail/builder demand proof.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-7%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1142 SW Abbey Ave**
  - Parcel ID: `3[redacted phone]-000-0`
  - Sale price/date: **$132,000** / **2024-04**
  - Lot size: **10,000 sf** / **0.2296 ac**
  - Unit price: **$13.20/sf** / **$574,913/ac**
  - Zoning/use: **RS-2 / PSL Section 08; DOR_UC 000 vacant residential**
  - Distance: **0.19 mi**
  - Key adjustment: Closest same-neighborhood sale; slightly older; builder/infill comparable.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-0%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1801 SW Bismarck St**
  - Parcel ID: `3[redacted phone]-000-1`
  - Sale price/date: **$160,000** / **2024-09**
  - Lot size: **10,625 sf** / **0.2439 ac**
  - Unit price: **$15.06/sf** / **$656,007/ac**
  - Zoning/use: **RS-2 / PSL Section 08; DOR_UC 000 vacant residential**
  - Distance: **0.38 mi**
  - Key adjustment: DR Horton buyer; supports upper retail for standard lot; not enough to chase $175k ask.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-1%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1438 SW Goodman Ave**
  - Parcel ID: `3[redacted phone]-000-0`
  - Sale price/date: **$150,000** / **2024-08**
  - Lot size: **10,375 sf** / **0.2382 ac**
  - Unit price: **$14.46/sf** / **$629,723/ac**
  - Zoning/use: **RS-2 / PSL Section 08; DOR_UC 000 vacant residential**
  - Distance: **0.41 mi**
  - Key adjustment: Holiday Builders buyer; same neighborhood code; good builder-demand proof.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-0%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1198 SW Bellevue Ave**
  - Parcel ID: `3[redacted phone]-000-0`
  - Sale price/date: **$151,300** / **2024-10**
  - Lot size: **12,792 sf** / **0.2937 ac**
  - Unit price: **$11.83/sf** / **$515,152/ac**
  - Zoning/use: **RS-2 / PSL Section 09; DOR_UC 000 vacant residential**
  - Distance: **0.48 mi**
  - Key adjustment: Larger lot; lower $/sf confirms size discount; relevant to subject if land-only area is ~14k sf.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-0%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1174 SW Bellevue Ave**
  - Parcel ID: `3[redacted phone]-010-2`
  - Sale price/date: **$151,300** / **2024-10**
  - Lot size: **10,000 sf** / **0.2296 ac**
  - Unit price: **$15.13/sf** / **$658,972/ac**
  - Zoning/use: **RS-2 / PSL Section 09; DOR_UC 000 vacant residential**
  - Distance: **0.48 mi**
  - Key adjustment: Same deed/price area as Bellevue sale; standard-lot upper support; builder buyer Synergy Homes.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-010-2%27&outFields=%2A&returnGeometry=true&outSR=4326

- **1701 SW Choate St**
  - Parcel ID: `3[redacted phone]-000-2`
  - Sale price/date: **$155,000** / **2024-12**
  - Lot size: **19,769 sf** / **0.4538 ac**
  - Unit price: **$7.84/sf** / **$341,560/ac**
  - Zoning/use: **RS-2 / PSL Section 09; DOR_UC 000 vacant residential**
  - Distance: **0.59 mi**
  - Key adjustment: Best size analog to St. Lucie boundary acreage (~0.48 ac); shows large-lot retail does not scale linearly; DR Horton buyer.
  - Source: https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query?f=json&where=PARCEL_ID+%3D+%273[redacted phone]-000-2%27&outFields=%2A&returnGeometry=true&outSR=4326

## Active listing context

Automated extraction from Zillow, Redfin, Realtor, Homes.com, and Land.com was blocked by bot/access controls in this environment. I am not fabricating active-listing prices. Use these manual active-listing checks before making an external buyer-facing quote:

- Zillow manual land search: https://www.zillow.com/port-saint-lucie-fl/land/
- Redfin manual land search: https://www.redfin.com/city/15100/FL/Port-St-Lucie/filter/property-type=land
- Realtor.com manual land search: https://www.realtor.com/realestateandhomes-search/Port-Saint-Lucie_FL/type-land
- Land.com manual search: https://www.land.com/Port-Saint-Lucie-FL/all-land/
- LandSearch manual search: https://www.landsearch.com/properties/port-st-lucie-fl/filter/land

Operational read: because 2024-2025 public-record builder/infill sales cluster around **$120k-$160k** for ordinary 10k-13k sf Port St. Lucie lots, active listings materially above ~$160k should be treated as competition/asking optimism unless they are oversized, corner, water/canal, commercial, or development-package lots.

## Market trends and quick-flip conditions

- Builder demand is real in this pocket: recent public-record vacant-lot buyers within ~2 miles include **Holiday Builders, DR Horton, Synergy Homes, K Hovnanian, Adams Homes, Monna Homes, LGI Homes**, and other builder/investor entities.
- The market is active but price-sensitive. Builder buys around the subject’s submarket generally validate retail land exits in the **low-to-mid $100ks** for standard infill lots.
- Larger lots do not price linearly. The best large-lot analog in this set, **1701 SW Choate St (19,769 sf)**, sold for **$155k / $7.84/sf** to DR Horton, showing that a 0.45-0.48 ac gross parcel should not automatically be priced at 2x a standard lot.
- The subject is not a clean vacant lot in official records; a house/structure creates different buyer pools: flippers, landlords, teardown builders, or split-lot developers. Vacant-land assignment buyers may reject unless the excess land can be legally split and buildable.
- Quick wholesale flip risk: high. The seller quote of **$175k cash** leaves little/no assignment spread if the land-only exit is roughly **$145k-$160k** and the parcel is improved/identity-conflicted.

## Wholesale acquisition recommendation

### If this is truly a separately buildable vacant lot after proof

- Safe retail exit low: **$140k-$150k**.
- Expected retail/builder exit: **$145k-$160k**.
- Upside retail exit: **$165k-$175k only with buyer commitment, clean split/buildability, and active-listing support.**
- Suggested initial wholesale offer: **$80k-$90k**.
- Walk-up ceiling: **$100k-$110k**.
- Aggressive buyer-backed max: **$115k-$120k**, only if a builder has already confirmed appetite around this exact lot/size and will take assignment fast.

### If seller is selling the whole improved 1193 SW Gastador parcel

- **Do not use vacant-land comps as the offer basis.** It is an improved 1,132 sf homestead per statewide cadastral.
- $175k may be potentially interesting as a house/teardown lead because public JV is $262k, but that requires residential ARV, condition, occupancy, title, and repair/teardown costs.
- Next action: ask seller: “Are you selling the house parcel at 1193 SW Gastador, a separate vacant parcel at 1185, or a split/side-yard portion? Can you text the parcel ID or tax bill?”

## Seller-response framing

- “I pulled the county record and the owner-matching parcel shows as 1193 SW Gastador with a structure, not a clean vacant parcel at 1185. Before I can put cash on paper, I need to verify whether you mean the full house parcel, a separate lot, or a split piece.”
- “For clean vacant lots nearby, builders have been closing mostly around the low-to-mid $100ks depending on size and road/utility/buildability. At $175k, I would need something special — larger legally buildable land, waterfront/corner premium, or confirmed split rights — to make it work.”

## Verification checklist before offer-ready

- Confirm parcel ID directly with Dallas Black.
- Verify whether `1185 SW Gastador` is an address alias, side-yard split, or incorrect address for `1193 SW Gastador`.
- Open PASLC record card manually and pull sale history, building card, permits, and assessment details.
- Search St. Lucie Clerk OR Book/Page **1125/1988** and **1969/1243** for acquisition date, deed type, consideration, and chain-of-title notes.
- Pull manual active listings from Zillow/Redfin/Realtor/LandSearch and screen out canals/corners/commercial/outlier asks.
- If land-only: confirm legal split/buildability, setbacks, utilities, road frontage, and whether existing structure blocks independent development.
