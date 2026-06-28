# Zillow neighborhood-link URL pattern recommendation

## Recommendation

Use a **Zillow outbound search URL**, not a scraped Zillow endpoint and not a Zillow API. Construct one click-through field per parcel row:

- Field: `zillowNeighborhoodUrl`
- Label for UI: `Zillow neighborhood search`
- Pattern: `https://www.zillow.com/homes/{url_encoded_search_query}_rb/`
- Encoding: URL-encode the full search query as one path segment before appending `_rb/`.

This is the safest pattern for LandFlip rows because it behaves like a normal user search link, does not require scraping Zillow, does not depend on private `searchQueryState` JSON parameters, and can fall back gracefully for rows that do not have a house number.

## Query construction

### 1. Rows with a full street address

Use the most specific public parcel location available:

```text
{propertyAddress}, {propertyCity}, {state} {propertyZip}
```

Recommended row fields:

- `zillowNeighborhoodUrl`: encoded Zillow search URL
- `zillowNeighborhoodLabel`: `Zillow neighborhood search`
- `zillowNeighborhoodBasis`: `full-address`
- Optional debug/display field: `zillowNeighborhoodQuery`

Example from the app data:

- Input: `5755 COUNTY ROAD 214`, `KEYSTONE HEIGHTS`, `FL`, `32656`
- Query: `5755 COUNTY ROAD 214, KEYSTONE HEIGHTS, FL 32656`
- URL: `https://www.zillow.com/homes/5755%20COUNTY%20ROAD%20214%2C%20KEYSTONE%20HEIGHTS%2C%20FL%2032656_rb/`

### 2. Rows with street-only / road-only addresses

Do **not** fabricate a street number. Use the road name with city/state/ZIP and mark it as approximate:

```text
{propertyAddress}, {propertyCity}, {state} {propertyZip}
```

Recommended row fields:

- `zillowNeighborhoodUrl`: encoded Zillow search URL
- `zillowNeighborhoodLabel`: `Zillow neighborhood search - approximate road/ZIP`
- `zillowNeighborhoodBasis`: `road-zip-approximate`
- Optional debug/display field: `zillowNeighborhoodQuery`

Example from the app data:

- Input: `COUNTY ROAD 214`, `KEYSTONE HEIGHTS`, `FL`, `32656`
- Query: `COUNTY ROAD 214, KEYSTONE HEIGHTS, FL 32656`
- URL: `https://www.zillow.com/homes/COUNTY%20ROAD%20214%2C%20KEYSTONE%20HEIGHTS%2C%20FL%2032656_rb/`

### 3. Fallback if address is blank or unusable

If a future row has no usable `propertyAddress` / `address`, fall back to city/state/ZIP only:

```text
{propertyCity}, {state} {propertyZip}
```

Recommended label/basis:

- `zillowNeighborhoodLabel`: `Zillow neighborhood search - ZIP fallback`
- `zillowNeighborhoodBasis`: `zip-fallback`

Example:

- Query: `KEYSTONE HEIGHTS, FL 32656`
- URL: `https://www.zillow.com/homes/KEYSTONE%20HEIGHTS%2C%20FL%2032656_rb/`

## Caveats

- These are outbound convenience links only. Do not fetch, crawl, scrape, parse, or store Zillow result pages.
- Zillow may redirect exact full-address searches to a property detail page when it recognizes the address. That is acceptable for click-through use, but the field should still be labeled as a neighborhood/search link rather than as a verified Zillow property URL.
- Road-only rows are approximate. They help the operator open the right neighborhood/road area but should not be treated as parcel geocoding, access verification, valuation evidence, or proof of a Zillow match.
- Keep official parcel/source URLs as the system of record. The Zillow link is only an external map/neighborhood convenience.

## Data note

In `data/real/duval-keystone-fl/keystone_heights_clay_landowners_app.json`, there are 823 app-visible parcel rows: 534 have a full numeric street address, 289 have road/street-only addresses, and 0 are blank. All current rows use ZIP `32656`, so the ZIP fallback is mainly future-proofing.
