# Saddleback Rd, Joshua Tree CA 92252 — Michael Drayer / Identity-Conflict Comp

As of: July 09, 2026 UTC

Lead input:

- Name on lead: Michael Drayer
- Phone: +144****7235
- Address: Saddleback Rd, Joshua Tree CA 92252
- Seller response: **"Yes, but I am not Michael"**

## 1. Fast verdict

**Status: identity-conflict-manual-review. Do not make a price offer yet.**

The provided address is not a complete situs address or APN; it is only a road name. Saddleback Rd in Joshua Tree crosses many parcels, including vacant land and improved SFR parcels. Public San Bernardino County parcel GIS does not expose owner names normally because ownership is protected/redacted under California Gov. Code 7928.205, so I cannot source-verify that Michael Drayer owns any specific Saddleback Rd parcel from the public GIS output.

The seller saying **"Yes, but I am not Michael"** is a major identity mismatch. Treat this as either:

1. a wrong contact/name in the lead list,
2. a spouse/relative/co-owner replying,
3. a title/estate/trust/LLC/beneficiary situation,
4. a skip-trace mismatch, or
5. the person is interested but not the titled owner.

Until they provide APN/tax bill/vesting proof, this should not be offer-ready.

## 2. Official road/parcel context found

Source stack:

- San Bernardino County public PIMS: https://arcpropertyinfo.sbcounty.gov/
- San Bernardino County public GIS parcel FeatureServer: https://services.arcgis.com/aA3snZwJfFkVyDuP/arcgis/rest/services/Parcels_for_San_Bernardino_County/FeatureServer/0
- Parcel assistant/map pattern: https://pat.bhamaps.com/?appid=a4fd4f46e98f4379a6deb89e3ed90545&parcel=060214108

OpenStreetMap resolves Saddleback Road in Joshua Tree roughly along longitude `-116.3304`, latitude range about `34.1204–34.1411`.

I queried a bounding box around Saddleback Rd:

- Nearby parcels intersecting the Saddleback corridor: **215**
- Vacant parcels in that corridor: **112**
- Vacant parcels from about 0.9–2.6 acres: **100**
- Dominant zoning in the 0.9–2.6 acre vacant band: **JT/RS-1**
- Other zoning appears near highway/commercial corridor: JT/CG-SCp, JT/RL, JT/RL-5

Representative candidate parcels along/near Saddleback Rd include:

- `060214108` — 1.25 ac, vacant land, JT/RS-1, land value $51,893
- `060214112` — 1.25 ac, vacant land, JT/RS-1, land value $45,900
- `060213107` — 1.25 ac, vacant land, JT/RS-1, land value $43,611
- `060214113` — 1.25 ac, vacant land, JT/RS-1, land value $33,605
- `060213105` — 1.25 ac, vacant land, JT/RS-1, land value $30,600
- `060213104` — 1.25 ac, vacant land, JT/RS-1, land value $21,326
- `060214115` — 1.25 ac, vacant land, JT/RS-1, land value $18,758
- `060215103` — 1.25 ac, vacant land, JT/RS-1, land value $16,166
- `060214116` — 1.25 ac, vacant land, JT/RS-1, land value $8,801
- `060214105` — 1.25 ac, vacant land, JT/RS-1, land value $7,460

These are **candidate-context parcels only**. They are not confirmed as the subject property.

## 3. Public-record value sanity layer

From the Saddleback corridor query:

For 0.9–2.6 acre vacant parcels:

- Count: **100**
- Land-value-per-acre range:
  - Min: about **$2,327/ac**
  - P25: about **$12,021/ac**
  - Median: about **$26,909/ac**
  - P75: about **$50,938/ac**
  - Max: about **$168,065/ac**

Important: county land value is an assessment signal, not market value. It is useful only as a sanity check that Saddleback includes both cheap desert lots and high-assessed infill/commercial-adjacent parcels.

## 4. Active listing competition — Joshua Tree 1–5 acre land

Source: LandWatch active Joshua Tree land under $50k, 1–5 acres.  
Source page: https://www.landwatch.com/california-land-for-sale/joshua-tree/price-under-50000/acres-1-5

Active examples:

1. **000 Campanula Street**
   - Ask: $22,500
   - Size: 2.30 ac
   - Price/acre: ~$9,783/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-undeveloped-land-for-sale/pid/418947659

2. **Arizona Ave**
   - Ask: $18,500
   - Size: 2.23 ac
   - Price/acre: ~$8,296/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/420296336

3. **61376 Venus Dr**
   - Ask: $16,995
   - Size: 2.29 ac
   - Price/acre: ~$7,421/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/425721085

4. **Joshua Tree, unnamed 5 ac**
   - Ask: $8,999
   - Size: 5 ac
   - Price/acre: ~$1,800/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/426574004

5. **0 Sunny Hill Road**
   - Ask: $25,000
   - Size: 2.46 ac
   - Price/acre: ~$10,163/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-undeveloped-land-for-sale/pid/426942259

6. **0 Desert Trail Drive**
   - Ask: $12,000
   - Size: 1.25 ac
   - Price/acre: ~$9,600/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-homesite-for-sale/pid/427113968

7. **0 La Ferney Avenue**
   - Ask: $10,000
   - Size: 1.25 ac
   - Price/acre: ~$8,000/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-undeveloped-land-for-sale/pid/427209907

8. **0 Sunburst**
   - Ask: $30,000
   - Size: 2.18 ac
   - Price/acre: ~$13,761/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-homesite-for-sale/pid/426033791

## 5. Sold comp evidence — Joshua Tree 1–5 acre land

Source: LandWatch recently sold Joshua Tree land under $50k, 1–5 acres.  
Source page: https://www.landwatch.com/california-land-for-sale/joshua-tree/price-under-50000/acres-1-5/sold

Sold examples:

1. **0 Broadway St**
   - Sold: Feb 19, 2026
   - Price: $34,900
   - Size: 5 ac
   - Price/acre: ~$6,980/ac
   - Notes: listing claimed city water at lot line and overhead power nearby; legal dirt-road access.
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/425520833

2. **Broadway**
   - Sold: Nov 3, 2025
   - Price: $29,000
   - Size: 2.2 ac
   - Price/acre: ~$13,182/ac
   - Notes: listing claimed paved road nearby, RVs allowed, utilities at lot line.
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/422666391

3. **Campanula Street**
   - Sold: Nov 14, 2024
   - Price: $22,560
   - Size: 2.31 ac
   - Price/acre: ~$9,766/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/418110468

4. **4999 Sun Gold Ave**
   - Sold: Jun 20, 2024
   - Price: $26,000
   - Size: 2.28 ac
   - Price/acre: ~$11,404/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-homesite-for-sale/pid/418708850

5. **61624 Mercury Drive**
   - Sold: Dec 17, 2024
   - Price: $19,900
   - Size: 4.2 ac
   - Price/acre: ~$4,738/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-undeveloped-land-for-sale/pid/420184044

6. **Delaware Ave**
   - Sold: Feb 27, 2024
   - Price: $23,000
   - Size: 2.15 ac
   - Price/acre: ~$10,698/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/417982364

7. **Tilford Way**
   - Sold: Feb 22, 2023
   - Price: $32,000
   - Size: 2.5 ac
   - Price/acre: ~$12,800/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/415671024

8. **Joshua Tree 1.25-acre Hollinger Rd-area lot**
   - Sold: Oct 27, 2022
   - Price: $18,999
   - Size: 1.25 ac
   - Price/acre: ~$15,199/ac
   - Link: https://www.landwatch.com/san-bernardino-county-california-recreational-property-for-sale/pid/414946409

## 6. Underwriting range — only if the eventual parcel is a normal 1.25–2.5 ac vacant JT lot

Because APN and seller authority are unverified, this is not an offer recommendation for a specific parcel. It is a **conditional market range**.

If confirmed parcel is a typical 1.25 ac vacant JT/RS-1 Saddleback lot:

- Expected retail exit: **$12k–$25k** depending utilities/access/view/buildability
- Conservative quick-sale exit: **$10k–$16k**
- Wholesale acquisition target: **$3k–$7k**
- Walk-up ceiling: **$8k–$10k** only if no hard issues and buyer demand exists

If confirmed parcel is a typical 2.2–2.5 ac vacant Joshua Tree lot:

- Expected retail exit: **$18k–$35k** depending utility/access/buildability
- Conservative quick-sale exit: **$18k–$25k**
- Wholesale acquisition target: **$6k–$12k**
- Walk-up ceiling: **$14k–$16k** only with strong utility/access evidence or a buyer lined up

If confirmed parcel is a 5 ac rural/off-grid lot:

- Expected retail exit: **$20k–$35k** for better lots; weaker remote lots can be much lower
- Wholesale acquisition target: **$7k–$15k**, depending access/utilities

## 7. Key risks / manual review blockers

- No APN or exact street number.
- Seller explicitly says they are not Michael.
- Public owner identity is protected/redacted; cannot confirm Michael from public parcel GIS.
- Saddleback Rd has many parcels, including improved SFR, commercial-adjacent, RL, RL-5, and standard RS-1 vacant lots.
- Utility access is deal-defining in Joshua Tree.
- Road access/surface and legal access must be confirmed.
- Water availability/haul/well/service area must be confirmed.
- Short-term-rental or buildability assumptions must be verified by county rules, zoning, and parcel constraints.

## 8. Recommended seller reply

Use this before discussing price:

> Got it — thanks for clarifying. My list had Michael tied to the Saddleback Rd property, so I don’t want to assume the wrong owner or wrong parcel. Are you the owner, co-owner, spouse/relative, or authorized representative for the land? If yes, can you send me the APN/parcel number or a photo of the tax bill/title page so I can make sure I’m looking at the exact property? Saddleback Rd has a lot of different parcels, so I need the APN before I can give you a real number.

If they respond with authority/APN:

> Perfect, thank you. Once I have the APN I’ll verify it with San Bernardino County, check acreage/zoning/access/utilities, and then I can give you a realistic quick-close number.

If they avoid authority:

> No problem. I can only discuss price with the owner or someone authorized by the owner. If you’re connected to them, feel free to have them text me directly or send the APN/title info first.

## 9. Next action

**Next action: ask for APN/tax bill/title/authority.**

Do not comp as offer-ready until the seller provides parcel identity and relationship to owner.
