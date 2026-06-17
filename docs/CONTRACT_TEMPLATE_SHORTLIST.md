# Contract template shortlist — assignable vacant-land operations

Date: 2026-06-17  
Owner: IriSys / Okeito  
Purpose: identify online contract forms that can serve as source material for the Land Dealflow OS contracts-ready gate.

> Not legal advice. Do not send any of these directly to sellers/buyers without review by a real estate attorney licensed in the target state. Treat this as a source shortlist for attorney review and operations design.

## Criteria from transcript / operating model

The transcript’s required paperwork stack is:

1. Seller purchase contract for vacant land.
2. Contract must be **assignable**.
3. Buyer/wholesaler can run due diligence / feasibility checks.
4. Buyer can terminate if the deal fails diligence or builder demand.
5. Closing runs through title/escrow/closing company.
6. Separate assignment agreement with end buyer/builder.
7. Assignment fee/spread paid at closing.

## Best match found for Florida / Lee County

### 1. Florida Realtors — Vacant Land Contract, VAC-14

- Source: https://www.floridarealtors.org/sites/default/files/2024-08/Vacant%20Land%20Contract_VAC-14xxx[2].pdf
- Type: Florida vacant-land purchase contract.
- Status: **Best source form for Florida**, but must be completed correctly and attorney-reviewed.
- Why it fits:
  - Explicit **Assignability** section.
  - Explicit **Due Diligence Period**.
  - Explicit escrow/deposit section.
  - Explicit title evidence/title insurance/closing-agent mechanics.
  - Built for vacant land, not residential houses.

Verified text extracted from the PDF:

```text
7. Assignability: (Check one) Buyer may assign and thereby be released from any further liability under this Contract, may assign but not be released from liability under this Contract, or may not assign this Contract.
```

```text
Due Diligence Period: Buyer will, at Buyer’s expense and within ___ days (30 days if left blank) ("Due Diligence Period") after Effective Date and in Buyer’s sole and absolute discretion, determine whether the Property is suitable for Buyer’s intended use.
```

```text
The party who pays for the owner’s title insurance policy will select the closing agent and pay for the title search, including tax and lien search (including municipal lien search) if performed, and all other fees charged by closing agent.
```

How to use for our model:

- Select one of the **may assign** options in paragraph 7; never select “may not assign.”
- Use the Due Diligence Period as the builder/title/parcel-check window.
- Add or attach a wholesaling/assignment disclosure addendum, because the stock form does not solve the disclosure risk by itself.
- Confirm with Florida attorney/title company whether assignment fee can appear on settlement statement or whether double close is preferred.

Verdict: **Use as the Florida seller-contract base.**

## Useful public mirrors / older Florida copies

These are not the primary source, but they confirm the Florida vacant-land form structure and are useful if the official PDF moves.

### 2. Highlight Realty mirror — Florida Vacant Land Contract

- Source: http://www.highlightrealty.com/forms/vacant%20land%20contract.pdf
- Type: older Florida vacant-land contract mirror.
- Important limitation: extracted text showed an older clause:

```text
12. ASSIGNABILITY; PERSONS BOUND: Buyer may not assign this Contract without Seller’s written consent.
```

Verdict: **Do not use as-is** for the transcript model unless seller consent is obtained or the assignability language is changed by counsel. Useful only as historical reference.

### 3. CB Title Group mirror — Florida Vacant Land Contract

- Source: https://cbtitlegroup.com/files/pdfs/florida/Vacant-Land-Contract.pdf
- Type: Florida vacant-land contract mirror.
- Verified it includes feasibility/inspection, title, escrow, and assignability language.
- Limitation: older/mirrored form; prefer current official Florida Realtors source above.

Verdict: **Reference only; not first choice.**

## Assignment agreement source

### 4. Judicial Title — Assignment of Contract for Purchase of Real Estate

- Source: https://judicialtitle.com/pdf/AssignmentContractPurchaseRealEstate.pdf
- Type: assignment agreement, not seller purchase agreement.
- Why it fits:
  - Transfers assignor’s rights/interests in the purchase contract to assignee.
  - Assignee accepts obligations and indemnifies assignor.
  - Includes optional seller consent block.

Verified text extracted from the PDF:

```text
For value received, I, [assignor], hereby transfer and assign to [assignee] ... all rights and interest in that contract between [seller] and assignor ... as purchaser ... for the sale of premises...
```

```text
I ... accept the above assignment ... I agree to perform all obligations to be performed by assignor under the contract, and to indemnify assignor against any liability arising from the performance or nonperformance of such obligations.
```

Verdict: **Useful assignment-agreement source material**, but needs a Florida/vacant-land/wholesale-specific version and title-company approval.

## Generic online templates found but not sufficient alone

### 5. LegalTemplates — Land Purchase Agreement

- Source: https://legaltemplates.net/form/purchase-agreement/land/
- Type: generic land purchase agreement generator/template.
- Verified page includes land purchase agreement, earnest-money, and inspection concepts.
- Limitation: page text did not expose a clear assignability clause in the accessible HTML.

Verdict: **Not enough as-is** for our model unless paired with explicit assignment language/addendum and attorney review.

### 6. LawDepot — Real Estate Purchase Agreement

- Source: https://www.lawdepot.com/contracts/real-estate-purchase-agreement/?loc=US
- Type: customizable real estate purchase agreement.
- Limitation: broader real-estate form, not specifically vacant-land wholesaling. Page had references to title company/earnest/inspection, but we did not verify a complete vacant-land assignability workflow from the public HTML.

Verdict: **Fallback drafting aid only**, not the operating base.

## Recommended contract stack for our Florida v1

1. Seller contract base: **Florida Realtors VAC-14 Vacant Land Contract**.
2. Paragraph 7: select **Buyer may assign** option.
3. Due diligence: use the Due Diligence Period; set long enough to validate builder/title/parcel facts but short enough to be credible.
4. Addendum A: buyer-as-principal / assignment disclosure.
5. Addendum B: no brokerage / no representation disclosure.
6. Buyer-side form: assignment agreement derived from Judicial Title-style assignment, rewritten for Florida vacant land and title-company settlement.
7. Closing provider: Florida title company or closing attorney that explicitly accepts assignments/double closes.

## Missing before live seller calls

- Florida attorney review of final packet.
- Florida title-company review of assignment fee / double-close preference.
- Final disclosure language.
- Final fillable packet:
  - Seller purchase agreement completion guide.
  - Assignment addendum.
  - Buyer assignment agreement.
  - Title-company intake sheet.
  - Termination notice template.

## Product gate implications

Add contract-readiness fields:

```text
market_contract_base: Florida Realtors VAC-14
assignability_status: may_assign_selected / missing / blocked
assignment_disclosure_status: missing / drafted / attorney_reviewed / active
title_company_assignment_ok: unknown / yes / no / double_close_only
due_diligence_days: integer
seller_call_permission: blocked_until_contract_stack_ready / allowed
```
