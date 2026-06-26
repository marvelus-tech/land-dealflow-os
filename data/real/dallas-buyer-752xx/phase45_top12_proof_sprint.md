# Phase 4.5 Top-12 Proof Sprint — Dallas 752xx

Generated: 2026-06-26T11:24:36+00:00

Purpose: verify the buyer's hard criteria before skip-tracing any owner.

## Zero-fabrication rules

- Do not mark utilities/taps verified from old structures, CCN/service-area context, or assumptions.
- Do not mark recorded plat/legal-lot verified from DCAD legal text alone; capture Dallas County Official Public Records or equivalent legal proof.
- Do not enrich/call owners until a row passes water/sewer, electric/gas, recorded plat, builder zoning acceptance, and operator decision.
- Top 12 is a sprint view only. The complete Phase 4 queue remains 68 rows.

## Pass fields to fill

- `waterSewerProofStatus` + `waterSewerProofUrl`
- `electricGasProofStatus` + `electricGasProofUrl`
- `recordedPlatProofStatus` + `recordedPlatProofUrl`
- `zoningBuilderAcceptedStatus` + `zoningBuilderAcceptedProof`
- `operatorDecision` + `operatorNotes`

## Sprint rows

### 1. 3243 MODELLA AVE, 75229

- APN: `00000594277000000`
- Owner of record: HOLMAN LORIA ANN
- Lot: 20,638 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: pass-public-zoning-layer — City of Dallas Zoning MapServer layer 15 intersects the City Tax Parcel geometry for ACCT 00000594277000000 with ZONE_DIST R-10(A), LONG_ZONE_DIST R-10(A), PD_NUM blank, DISTRICTUSE null.
- Recorded plat/legal-lot proof: partial-public-record-legal-lot-reference-found — Dallas County Property Records quick search `CORAL HILLS LOT 73` returned official index rows matching Coral Hills Lot 73 Block 17 CBLK 6441, including doc 198900182488 and doc 198402447714 with Reference 40/139. This confirms county-indexed subdivision/lot/block legal evidence, but not a full utility/plat pass packet.
- Water/sewer proof: hold-dwu-official-request-ready-not-submitted
- Electric/gas proof: partial-official-oncor-esiid-found-gas-not-verified
- Legal: CORAL HILLS | BLK 17/6441 LOT 73 | INT201400129199 DOD05142000 | 6441 017   07300      1006441 017
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594277000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594277000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3243 MODELLA AVE | HOLMAN LORIA ANN`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 2. 11652 CORAL HILLS CT, 75229

- APN: `00000594130000000`
- Owner of record: BURANI ROHIT M &
- Lot: 14,403 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: pass-public-zoning-layer — City of Dallas Zoning MapServer layer 15 intersects the City Tax Parcel geometry for ACCT 00000594130000000 with ZONE_DIST R-10(A), LONG_ZONE_DIST R-10(A), PD_NUM blank, DISTRICTUSE null.
- Recorded plat/legal-lot proof: partial-public-record-legal-lot-reference-found — Dallas County Property Records quick search `CORAL HILLS LOT 23` returned an official index row matching Coral Hills Lot 23 Block 17 CBLK 6441, doc 201200366789. Search also returned Coral Hills records with Reference 40/139 for the same subdivision/CBLK. This confirms county-indexed subdivision/lot/block legal evidence, but not a full utility/plat pass packet.
- Water/sewer proof: hold-dwu-official-request-ready-not-submitted
- Electric/gas proof: partial-official-oncor-esiid-found-gas-not-verified
- Legal: CORAL HILLS | BLK 17/6441 LT 23 | INT201900222067 DD08092019 CO-DC | 6441 017   02300      1006441 017
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594130000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594130000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 11652 CORAL HILLS CT | BURANI ROHIT M &`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 3. 2034 ANGELINA DR, 75212

- APN: `00000681256000000`
- Owner of record: CURRY FANNIE MAE
- Lot: 12,200 sq ft
- Zoning: `R-5(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: pass-public-zoning-layer — City of Dallas Zoning MapServer layer 15 intersects the City Tax Parcel geometry for ACCT 00000681256000000 with ZONE_DIST R-5(A), LONG_ZONE_DIST R-5(A), PD_NUM blank, DISTRICTUSE null.
- Recorded plat/legal-lot proof: partial-public-record-subdivision-reference-found-needs-exact-lot-confirmation — Dallas County Property Records quick searches `ROOSEVELT MANOR`, `ROOSEVELT MANOR LOT 8 BLOCK 11`, and `CURRY FANNIE MAE` found official indexed Roosevelt Manor records and repeated Reference 8/178 for subdivision/CBLK 7130 context, but did not find an exact Lot 8 & 9 Block 11 match in the first returned rows. Legal-lot status remains partial/needs deeper county-record review.
- Water/sewer proof: hold-dwu-official-request-ready-not-submitted
- Electric/gas proof: partial-official-oncor-esiid-found-gas-not-verified
- Legal: ROOSEVELT MANOR 2ND INST | BLK 11/7130 LTS 8 & 9 ACS 0.28 | VOL99189/4191 DD08061999 CO-DC | 7130 011   00900      2007130 011
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000681256000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000681256000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `ROOSEVELT MANOR 2ND INST | 2034 ANGELINA DR | CURRY FANNIE MAE`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 4. 3434 ST CLOUD CIR, 75229

- APN: `00000595177000000`
- Owner of record: HILLS SUSANNAH J
- Lot: 12,156 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: PARK FOREST 3RD INST | BLK 8/6442 LT 42 | VOL98111/2251 DD052998 CO-DALLAS | 6442 008   04200      1006442 008
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000595177000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000595177000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `PARK FOREST 3RD INST | 3434 ST CLOUD CIR | HILLS SUSANNAH J`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 5. 3111 TOWER TRL, 75229

- APN: `00000594469000000`
- Owner of record: AGUINAGA MIREYA
- Lot: 11,582 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 20/6441 LT 11 | VOL2005155/3759 DD07292005 CO-DC | 6441 020   01100      1DA6441 020
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594469000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594469000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3111 TOWER TRL | AGUINAGA MIREYA`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 6. 3252 TOWER TRL, 75229

- APN: `00000594265000000`
- Owner of record: TREJO ISIDRO VARGAS & MARIA BLANCA VALDEZ
- Lot: 11,515 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 17/6441  LT 69 | INT200900145160 DD05182009 CO-DC | 6441 017   06900      1006441 017
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594265000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594265000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3252 TOWER TRL | TREJO ISIDRO VARGAS & MARIA BLANCA VALDEZ`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 7. 3135 ST CROIX DR, 75229

- APN: `00000594493000000`
- Owner of record: PLATZ MARK A
- Lot: 11,068 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 20/6441 LOT 19 | ST CROIX DR & CORAL HILLS DR | VOL2005120/13945 DD06152005 CO-DC | 6441 020   01900      2DA6441 020
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594493000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594493000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3135 ST CROIX DR | PLATZ MARK A`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 8. 3238 MODELLA AVE, 75229

- APN: `00000594412000000`
- Owner of record: VALLES GRACIELA CASTANEDA
- Lot: 10,899 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 19/6441 LT 8 | INT201600093058 DD04052016 CO-DC | 6441 019   00800      1006441 019
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594412000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594412000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3238 MODELLA AVE | VALLES GRACIELA CASTANEDA`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 9. 3136 TOWER TRL, 75229

- APN: `00000594490000000`
- Owner of record: CAMARILLO JUANITA M
- Lot: 10,725 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 20/6441 LOT 18 | VOL91233/1354 EX112291 CO-DALLAS | 6441 020   01800      1006441 020
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594490000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594490000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3136 TOWER TRL | CAMARILLO JUANITA M`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 10. 3162 MODELLA AVE, 75229

- APN: `00000594448000000`
- Owner of record: LARA RAFAEL JR & OLIVIA S
- Lot: 10,646 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 20/6441 LOT 4 MODELLA AVE | VOL86132 PG3579    CO-DALLAS | 6441 020   00400      1006441 020
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594448000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594448000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3162 MODELLA AVE | LARA RAFAEL JR & OLIVIA S`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 11. 11416 CORAL HILLS DR, 75229

- APN: `00000594019000000`
- Owner of record: WISE JAMES ROBERT
- Lot: 10,626 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 16/6441 LT 43 | INT20080106345 DD03252008 CO-DC | 6441 016   04300      1006441 016
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594019000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594019000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 11416 CORAL HILLS DR | WISE JAMES ROBERT`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

### 12. 3210 MODELLA AVE, 75229

- APN: `00000594394000000`
- Owner of record: SUTTON WILLIAM T
- Lot: 10,567 sq ft
- Zoning: `R-10(A)`
- Flood: pass-outside-sfha
- City parcel proof: public-api-pass / SINGLE FAMILY RESIDENCES
- Public zoning proof: needs-proof — 
- Recorded plat/legal-lot proof: needs-proof — 
- Water/sewer proof: needs-proof
- Electric/gas proof: needs-proof
- Legal: CORAL HILLS | BLK 19/6441  LT 2 | VOL2003222/10996 DD11052003 CO-DC | 6441 019   002        1006441 019
- DCAD: https://www.dallascad.org/AcctDetail.aspx?ID=00000594394000000
- City parcel API: https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0/query?f=json&where=ACCT+%3D+%2700000594394000000%27&outFields=%2A&returnGeometry=false
- Dallas County records: https://dallas.tx.publicsearch.us/
- Search terms: `CORAL HILLS | 3210 MODELLA AVE | SUTTON WILLIAM T`
- DWU: https://dallascityhall.com/departments/waterutilities/Pages/default.aspx
- Oncor: https://www.oncor.com/
- Atmos: https://www.atmosenergy.com/
- Decision: `pass / fail / hold`
- Proof notes:

