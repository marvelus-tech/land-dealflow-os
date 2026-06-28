# Keystone Zillow Links UI Review

## Goal
Surface two optional Zillow context links for the selected parcel detail:

- **Zillow neighborhood view**: parcel/neighborhood-level context.
- **ZIP market view**: broader ZIP-level market context.

Keep the row queue scan-first and avoid making any parcel row look call-ready. These links should be research context only, not proof, contact, money, or call actions.

## Current UI location reviewed

- File: `src/app.mjs`
- Function: `renderParcels()`
- Selected-detail branch starts after a parcel is selected, around `src/app.mjs:2730`.
- The selected parcel card is rendered in `<article class="deal-detail land-calm-operator-sheet ...">` around `src/app.mjs:2820`.
- Existing selected-detail sub-sections:
  - Hero: `src/app.mjs:2821-2827`
  - Proof/contact/buyer/money gates: `src/app.mjs:2828`
  - Dallas proof panel, if present: `src/app.mjs:2829`
  - Seller action script/checklist: `src/app.mjs:2830-2838`
  - Money review: `src/app.mjs:2839-2853`
  - Buyer memo/feedback: `src/app.mjs:2854-2857`
  - Raw depth: `src/app.mjs:2858-2867`

## Recommended insertion point

Add the Zillow links in the selected parcel detail card, immediately after the hero block and before `selectedGateSummary`:

```js
      <div class="detail-hero">
        ...
      </div>
      ${selectedZillowContextLinks}
      ${selectedGateSummary}
```

Exact surrounding anchor in current `src/app.mjs`:

```js
      <div class="detail-hero">
        <span class="eyebrow">Selected land listing · ${h(selectedListingState.label)}</span>
        <h2>${h(selected.address || selected.parcelId || 'Untitled parcel')}</h2>
        <p>${h(selectedListingState.detail)} ${h(selected.lotSize || 'lot size unknown')} · held ${h(selected.heldYears || 0)} yrs · paid ${formatMoney(Number(selected.paid || 0))}</p>
        ${duplicateNotice}
        <div class="badge-stack">${badge(`${selected.score} deal score`, actionTone)}${badge(selected.action, actionTone)}${badge(selected.risk.status, riskTone)}</div>
      </div>
      ${selectedGateSummary}
```

Change only this selected-detail area so the Land queue rows remain unchanged.

## Minimal safe code shape

Create a small local render fragment inside `renderParcels()` after `selectedGateSummary` is defined, or just before `target.innerHTML` if preferred:

```js
  const selectedZillowLinks = [
    selected.zillowNeighborhoodUrl ? safeLink(selected.zillowNeighborhoodUrl, 'Zillow neighborhood view', 'zillow-market-link parcel-context-link') : '',
    selected.zillowZipMarketUrl ? safeLink(selected.zillowZipMarketUrl, 'ZIP market view', 'zillow-market-link parcel-context-link') : '',
  ].filter(Boolean).join('');
  const selectedZillowContextLinks = selectedZillowLinks ? `<nav class="parcel-context-links" aria-label="Selected parcel market context">${selectedZillowLinks}</nav>` : '';
```

Then insert:

```js
      ${selectedZillowContextLinks}
```

between the hero `</div>` and `${selectedGateSummary}`.

## Suggested row fields

Rows can safely carry optional fields without changing queue behavior:

- `zillowNeighborhoodUrl`
- `zillowZipMarketUrl`

Do not derive call-readiness, proof readiness, or offer readiness from these fields. They are context links only.

If upstream data already uses alternate names, keep the UI tolerant with a narrow fallback, for example:

```js
const neighborhoodUrl = selected.zillowNeighborhoodUrl || selected.neighborhoodZillowUrl || '';
const zipMarketUrl = selected.zillowZipMarketUrl || selected.zillowMarketUrl || '';
```

Use only URL fields that are already sanitized/controlled by the dataset; continue rendering with `safeLink()` and `h()` as the existing Zillow market UI does.

## Why this location is safest

- It appears only after a parcel is deliberately selected.
- It sits above the proof/contact/buyer/money gates as passive context, not inside a call/action rail.
- It does not add visual weight to `renderLandQueue()` rows.
- It avoids the right-side `deal-action` panel, where links could be mistaken for operator next actions.
- It mirrors existing market-level Zillow link treatment in `renderBuyerValidationCommandCenter()` (`src/app.mjs:2396`) where Zillow is labeled as a market view, separate from permit evidence.

## CSS considerations

Existing CSS already defines `.zillow-market-link` in `src/styles.css:5531-5545`. Minimal option: reuse that class and add only a lightweight wrapper if spacing is needed.

Recommended minimal CSS, if needed:

```css
.parcel-context-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 4px;
}
```

No row CSS should be touched. Avoid button styling, primary-action styling, or call/action colors. Keeping `.zillow-market-link` preserves the existing “context link” visual language.

## Test considerations

This can be covered with source-level tests similar to the existing Zillow market assertions in `tests/buyer-validation-command-center.test.mjs:151-155`.

Recommended minimal assertions:

- `src/app.mjs` contains `zillowNeighborhoodUrl` and the label `Zillow neighborhood view`.
- `src/app.mjs` contains `zillowZipMarketUrl` and the label `ZIP market view`.
- `src/app.mjs` inserts the parcel Zillow fragment in the selected-detail card, not inside `renderLandQueue()`.
- Optional CSS assertion if wrapper is added: `src/styles.css` contains `.parcel-context-links`.

A full DOM/browser test is not necessary for this small safe change unless the project already has one for `renderParcels()` selected-state rendering.

## Do not change

- Do not add Zillow links to Land queue rows.
- Do not add them to the primary action strip or `deal-action` aside.
- Do not let these links affect `selectedCallable`, `selectedPrimaryAction`, proof gates, money gates, or CRM state.
- Do not label Zillow as proof/evidence; keep labels as context/market views.
