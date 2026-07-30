import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const app = readFileSync('src/app.mjs', 'utf8');
const index = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

const pdfPath = 'data/legal-forms/marketing-fee-jv-partner-addendum-clean.pdf';
const txtPath = 'data/legal-forms/marketing-fee-jv-partner-addendum-clean.txt';

assert.match(app, /phase311-legal-form-downloads/, 'Closing page must render the Phase 311 legal form download card.');
assert.match(app, /Marketing Fee \/ JV Partner Addendum/, 'Closing page must label the JV/marketing fee addendum clearly.');
assert.match(app, /downloadLink\('\.\/data\/legal-forms\/marketing-fee-jv-partner-addendum-clean\.pdf', 'Download PDF'/, 'PDF must be exposed through a download link.');
assert.match(app, /downloadLink\('\.\/data\/legal-forms\/marketing-fee-jv-partner-addendum-clean\.txt', 'Download TXT'/, 'Editable text must be exposed through a download link.');
assert.match(app, /attorney\/title\/broker review is still required/, 'Legal review warning must stay visible with the template.');
assert.match(index, /phase311-legal-form-downloads/, 'index.html must cache-bust Phase 311 legal form download assets.');
assert.match(css, /--phase311-legal-form-downloads: closing-marketing-fee-jv-addendum-downloads/, 'CSS marker must document the downloadable legal form asset lane.');
assert.match(pkg, /phase311-legal-form-downloads\.test\.mjs/, 'npm test must include the Phase 311 legal form download guard.');

assert.ok(existsSync(pdfPath), `${pdfPath} must exist as a downloadable static asset.`);
assert.ok(statSync(pdfPath).size > 100000, `${pdfPath} should be a real PDF, not an empty placeholder.`);
assert.equal(readFileSync(pdfPath).subarray(0, 4).toString(), '%PDF', `${pdfPath} must have a PDF header.`);
assert.ok(existsSync(txtPath), `${txtPath} must exist as editable text fallback.`);
assert.match(readFileSync(txtPath, 'utf8'), /Marketing Fee \/ JV Partner Addendum/, `${txtPath} must contain the addendum title.`);
