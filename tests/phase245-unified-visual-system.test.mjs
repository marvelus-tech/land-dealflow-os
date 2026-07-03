import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const phase = css.slice(css.indexOf('v1.71 - Phase 245 unified Apple visual-system layer'));

assert.ok(phase.length > 0, 'Phase 245 unified visual-system marker missing.');
assert.match(phase, /--phase245-system-rule: unified-apple-hig-typographic-hierarchy-open-ledger-single-token-source/, 'Central visual-system rule token missing.');
assert.match(phase, /--phase245-forest: #0f4d35/, 'Primary forest accent must be centralized.');
assert.match(phase, /--phase245-gold: #9a721d/, 'Gold metric accent must be centralized.');
assert.match(phase, /--brand: var\(--phase245-forest\)/, 'Legacy brand token must alias to the Phase 245 source of truth.');
assert.match(phase, /--money: var\(--phase245-gold\)/, 'Legacy metric token must alias to the Phase 245 source of truth.');
assert.match(phase, /main#app \{[\s\S]*max-width: var\(--phase245-max\)/, 'App shell width must be controlled by central token.');
assert.match(phase, /body :where\(\.brand-hero,[\s\S]*\.validation-focus-card,[\s\S]*border-radius: var\(--phase245-radius\) !important/, 'Common surfaces must inherit the unified rectilinear/open-ledger radius token.');
assert.match(phase, /body\[data-active-view="builders"\] #builder-list-panel \.state-workbench-layout[\s\S]*grid-template-columns: minmax\(360px, \.56fr\) minmax\(320px, \.44fr\)/, 'Builders top workbench must use one shared state/detail split instead of isolated route chrome.');
assert.match(phase, /body\[data-active-view="builders"\] #buyer-validation-command \.validation-grid-main[\s\S]*grid-template-columns: minmax\(260px, \.34fr\) minmax\(0, 1fr\) minmax\(220px, \.26fr\)/, 'Builder queue/detail/seller gate must be normalized into a scan-first grid.');
assert.match(phase, /body\[data-active-view="builders"\] #builder-list-panel \.wide-permit-panel[\s\S]*grid-template-columns: minmax\(260px, \.34fr\) minmax\(0, 1fr\)/, 'Lower permit landscape must use the same memo/ledger split instead of a narrow orphan column.');
assert.match(phase, /body\[data-active-view="machine"\] :where\(pre, code, textarea, \.csv-example, \.import-preview\)[\s\S]*background: var\(--phase245-field\)/, 'Machine/code surfaces must remain light inside the unified system.');
assert.match(phase, /@media \(max-width: 900px\)[\s\S]*\.validation-grid-main[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, 'Unified system must include a mobile single-column lock for dense builder surfaces.');
assert.match(css, /\.app-panel\[hidden\], main#app \.app-panel\[hidden\] \{ display: none !important; \}/, 'Route hidden guard must survive the final visual-system layer.');
assert.match(css, /v1\.71\.1 - Phase 245 second-pass review: remove dead air, calm builder detail scale, preserve scan width/, 'Second-pass visual review marker must be present.');
assert.match(css, /--phase245-second-pass-rule: no-dead-air-detail-title-stays-proportional/, 'Second pass must encode the dead-air/detail-scale correction rule.');
assert.match(css, /body\[data-active-view="builders"\] #builder-list-panel \.state-focus-summary \{[\s\S]*grid-template-rows: auto auto auto auto !important/, 'Selected-state summary must not reserve dead 1fr air before metrics.');
assert.match(css, /body\[data-active-view="builders"\] #buyer-validation-command \.validation-focus-head h3 \{[\s\S]*font-size: clamp\(30px, 3\.35vw, 46px\)/, 'Selected builder title must be calm enough for dense scan work.');
assert.match(css, /v1\.71\.2 - Phase 245 closing sidebar QA: queue numerals get their own rail, no address collision/, 'Closing queue sidebar QA correction must be present.');
assert.match(css, /--phase245-closing-queue-rule: stable-number-rail-before-address-copy/, 'Closing queue numerals must have a stable rail token.');
assert.match(css, /body\[data-active-view="closing"\] \.closing-queue \.queue-item \{[\s\S]*grid-template-columns: 44px minmax\(0, 1fr\)/, 'Closing queue rows must keep numbers and addresses in separate columns.');

console.log('phase245 unified visual system guard passed');
