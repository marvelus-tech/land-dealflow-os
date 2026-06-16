# Land Dealflow OS v0.1

Static web app prototype for a builder-first vacant-land wholesaling workflow.

## Modules

- Market Finder: scores zip codes/suburbs for new construction, builders, land velocity, vacant supply, lot standardization, compliance, buildability risk.
- Buyer Finder: ranks builders/buyers by recent builds, scattered-lot demand, buy-box quality, close speed, repeat demand.
- Land Finder: sample parcel queue matched to buyer criteria.
- Owner + Contact Finder: represented in parcel/owner fields; next iteration will add contact enrichment tables.
- Offer Engine: computes buyer price, initial seller offer, max seller offer, kill price, and target spread.
- Risk Filter: flags wetlands, flood, road access, utilities, slope, wildlife, easements/main-road issues.
- Outreach CRM: planned next iteration.

## Run

```bash
cd /root/land-dealflow-os
python3 -m http.server 4173
```

Open: http://127.0.0.1:4173

## Test

```bash
cd /root/land-dealflow-os
node tests/scoring.test.mjs
```

Expected:

```text
scoring tests passed
```

## Deploy to GitHub Pages

This repo includes `.github/workflows/pages.yml`.

When pushed to `main` on GitHub, the workflow:

1. Checks out the repo.
2. Sets up Node 20.
3. Runs `node tests/scoring.test.mjs`.
4. Syntax-checks `src/app.mjs` and `src/core.mjs`.
5. Uploads the static site artifact.
6. Deploys to GitHub Pages.

Expected live URL once pushed under `marvelus-tech/land-dealflow-os`:

```text
https://marvelus-tech.github.io/land-dealflow-os/
```

## Next build iteration

1. Add editable tables backed by localStorage or Supabase.
2. Add CSV import/export for markets, buyers, buy boxes, parcels, owner contacts.
3. Add contact-finding task queue.
4. Add outreach statuses and call notes.
5. Add map/parcel view.
6. Add automated market search integrations where legally and technically feasible.
