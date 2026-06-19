#!/usr/bin/env python3
import csv
import datetime as dt
import html
import io
import json
import re
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ARCHIVE_URL = 'https://www.maricopa.gov/Archive.aspx?AMID=128'
MINIMUM_UNIQUE_BUILDERS = 20
OUT_DIR = Path('data/real/maricopa')
MAX_WEEKLY_REPORTS = 30
HEADERS = {'User-Agent': 'Mozilla/5.0 LandDealflowOS/1.0'}

TRADE_RE = re.compile(r'\b(PROPANE|POOL|SPA|FENCE|ROOF|ROOFING|PLUMB|PLUMBING|ELECTRIC|ELECTRICAL|SOLAR|SIGN|HVAC|AIR|CONDITION|MECHANICAL|GARAGE DOOR|FIRE|ALARM|LANDSCAP|IRRIGATION|SEPTIC|MOBILE HOME SERVICE)\b', re.I)
BUILDER_RE = re.compile(r'\b(HOME|HOMES|BUILD|BUILDER|BUILDERZ|BUILDERS|CONSTRUCTION|CONTRACT|CONTRACTOR|DEVELOPMENT|COMMUNITIES|DWELLING|INDUSTRIES|REMODELING|PROBUILDS|WESTCRAFT|LENNAR|SHEA|COURTLAND|SHALC|ELLIOTT|ADAIR|MATTAMY)\b', re.I)
TARGET_DESC_RE = re.compile(r'\b(SINGLE[- ]FAMILY RESIDENCE|CUSTOM SINGLE FAMILY|SFR|RESIDENCE\s*//\s*PLAN|PLAN\s+\d{3,5}|NEW SINGLE FAMILY|DETACHED SINGLE FAMILY)\b', re.I)
EXCLUDE_DESC_RE = re.compile(r'\b(POOL|SPA|FENCE|SHADE|PATIO|GARAGE ONLY|MANUFACTURED HOME|MOBILE HOME|SOLAR|ROOF|ADDITION|REMODEL|REPAIR|ALTERATION|DETACHED ADU|ADU ONLY|CARPORT|TOWER|SIGN)\b', re.I)


def compact(value):
    return re.sub(r'\s+', ' ', str(value or '').replace('\x00', ' ')).strip()


def slug(value):
    return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', compact(value).lower())) or 'unknown'


def titleish(value):
    value = compact(value)
    known = {
        'SHALC GC': 'SHALC GC / Shea Homes',
        'SHEA HOMES': 'SHALC GC / Shea Homes',
        'SHALC GC, SHEA HOMES, SHEA HOMES': 'SHALC GC / Shea Homes',
        'LENNAR ARIZONA LLC': 'Lennar Arizona LLC',
        'ELLIOTT HOMES INC': 'Elliott Homes Inc',
        'GARCIA INDUSTRIES INC': 'Garcia Industries Inc',
        'TLD BUILDERS, LLC': 'TLD Builders LLC',
    }
    upper = value.upper().strip(' ,')
    if upper in known:
        return known[upper]
    value = re.sub(r'\s*,\s*', ', ', value.strip(' ,'))
    if value.isupper():
        value = value.title()
        value = re.sub(r'\bLlc\b', 'LLC', value)
        value = re.sub(r'\bInc\b', 'Inc', value)
        value = re.sub(r'\bGc\b', 'GC', value)
        value = re.sub(r'\bRc\b', 'RC', value)
        value = re.sub(r'\bTld\b', 'TLD', value)
    return value


def normalize_builder(value):
    raw = compact(value)
    parts = [compact(p) for p in re.split(r'\s*,\s*', raw) if compact(p)]
    if any(re.fullmatch(r'Shea homes?', p, re.I) for p in parts) or re.search(r'\bSHALC\b', raw, re.I):
        return 'SHALC GC / Shea Homes'
    # Some rows duplicate the same entity in comma-separated contractor fields. Prefer the first builder-like part.
    for part in parts or [raw]:
        if BUILDER_RE.search(part) and not TRADE_RE.search(part):
            return titleish(part)
    return titleish(raw)


def valid_builder(value):
    name = compact(value)
    if len(name) < 4:
        return False
    if TRADE_RE.search(name):
        return False
    if re.search(r'\b(N/A|NONE|OWNER|UNKNOWN|TBD|APPLICANT)\b', name, re.I):
        return False
    return bool(BUILDER_RE.search(name))


def excel_date(value):
    text = compact(value)
    if not re.fullmatch(r'\d+(?:\.\d+)?', text):
        return text
    # Excel serial date. Maricopa workbook stores issue dates as serials.
    base = dt.datetime(1899, 12, 30, tzinfo=dt.UTC)
    return (base + dt.timedelta(days=float(text))).date().isoformat()


def col_number(cell_ref):
    match = re.match(r'([A-Z]+)', cell_ref)
    if not match:
        return 0
    number = 0
    for char in match.group(1):
        number = number * 26 + ord(char) - 64
    return number


def parse_xlsx(data):
    ns = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    zf = zipfile.ZipFile(io.BytesIO(data))
    strings = []
    if 'xl/sharedStrings.xml' in zf.namelist():
        root = ET.fromstring(zf.read('xl/sharedStrings.xml'))
        for si in root.findall('a:si', ns):
            strings.append(''.join(t.text or '' for t in si.findall('.//a:t', ns)))
    sheet_name = next(name for name in zf.namelist() if name.startswith('xl/worksheets/sheet'))
    sheet = ET.fromstring(zf.read(sheet_name))
    rows = []
    for row in sheet.findall('.//a:row', ns):
        values = {}
        for cell in row.findall('a:c', ns):
            ref = cell.attrib.get('r', 'A1')
            value_node = cell.find('a:v', ns)
            if value_node is None:
                continue
            value = value_node.text or ''
            if cell.attrib.get('t') == 's':
                value = strings[int(value)]
            values[col_number(ref)] = value
        if values:
            rows.append(values)
    headers = None
    data_rows = []
    for idx, row in enumerate(rows):
        if any(value == 'Permit Type' for value in row.values()):
            headers = row
            data_rows = rows[idx + 1:]
            break
    if not headers:
        return []
    return [{headers.get(col, col): value for col, value in row.items()} for row in data_rows]


def discover_archive_links():
    page = urllib.request.urlopen(urllib.request.Request(ARCHIVE_URL, headers=HEADERS), timeout=30).read().decode('utf-8', 'ignore')
    pairs = re.findall(r'href="(Archive\.aspx\?ADID=\d+)"[^>]*>\s*<span>\s*([^<]*Weekly Permit Activity Report[^<]*)</span>', page, re.I | re.S)
    links = []
    seen = set()
    for href, label in pairs:
        url = 'https://www.maricopa.gov/' + html.unescape(href)
        if url not in seen:
            seen.add(url)
            links.append({'label': compact(html.unescape(label)), 'url': url})
    if not links:
        # Fallback when archive markup is table-rendered with labels before links.
        for label, url in re.findall(r'Weekly Permit Activity Report ([^<]+).*?href="(/Archive\.aspx\?ADID=\d+)"', page, re.I | re.S):
            full = 'https://www.maricopa.gov' + html.unescape(url)
            if full not in seen:
                seen.add(full)
                links.append({'label': 'Weekly Permit Activity Report ' + compact(label), 'url': full})
    return links


def is_target_row(row):
    permit_type = compact(row.get('Permit Type'))
    work_class = compact(row.get('Work Class'))
    permit_number = compact(row.get('Permit Number'))
    description = compact(row.get('Permit Description'))
    if permit_type != 'Building (Residential)':
        return False
    if not permit_number.startswith('BLDR'):
        return False
    haystack = f'{work_class} {description}'
    if EXCLUDE_DESC_RE.search(haystack):
        return False
    return bool(TARGET_DESC_RE.search(haystack))


def collect():
    links = discover_archive_links()
    if not links:
        raise SystemExit('No Maricopa weekly permit report links found in archive.')
    reports = []
    permit_rows = []
    for link in links[:MAX_WEEKLY_REPORTS]:
        data = urllib.request.urlopen(urllib.request.Request(link['url'], headers=HEADERS), timeout=45).read()
        rows = parse_xlsx(data)
        target_rows = []
        for row in rows:
            if not is_target_row(row):
                continue
            builder = normalize_builder(row.get('Contractor Name', ''))
            if not valid_builder(builder):
                continue
            permit = {
                'permitNumber': compact(row.get('Permit Number')),
                'issueDate': excel_date(row.get('Permit Issue Date')),
                'recordType': compact(row.get('Permit Type')),
                'workClass': compact(row.get('Work Class')),
                'description': compact(row.get('Permit Description')),
                'valuation': compact(row.get('Permit Valuation')),
                'squareFeet': compact(row.get('Permit Square Feet')),
                'parcelNumber': compact(row.get('Parcel No')),
                'address': compact(row.get('Job Address')).replace('  ', ' '),
                'city': compact(row.get('Job City')),
                'state': compact(row.get('Job State')),
                'zip': compact(row.get('Job Zip')),
                'subdivision': compact(row.get('Subdivision')),
                'lot': compact(row.get('Lot')),
                'ownerName': compact(row.get('Owner Name')),
                'contractorName': builder,
                'contractorPhone': compact(row.get('Contractor Phone')),
                'contractorEmail': compact(row.get('Contractor Email')),
                'sourceUrl': link['url'],
                'sourceReport': link['label'],
            }
            target_rows.append(permit)
        reports.append({'label': link['label'], 'url': link['url'], 'rows': len(rows), 'targetRows': len(target_rows)})
        permit_rows.extend(target_rows)
    return reports, permit_rows


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    reports, permit_rows = collect()
    groups = {}
    for permit in permit_rows:
        key = slug(permit['contractorName'])
        if permit['permitNumber'] in {p['permitNumber'] for p in groups.get(key, {}).get('permits', [])}:
            continue
        groups.setdefault(key, {'name': permit['contractorName'], 'permits': []})['permits'].append(permit)
    builders = []
    for key, group in groups.items():
        permits = sorted(group['permits'], key=lambda row: row.get('issueDate') or '', reverse=True)
        first = permits[0]
        builders.append({
            'id': f'maricopa-builder-{slug(group["name"])[:54]}',
            'name': group['name'],
            'market': 'phoenix-maricopa-az',
            'state': 'AZ',
            'website': '',
            'phone': first.get('contractorPhone', ''),
            'email': first.get('contractorEmail', ''),
            'contactName': group['name'],
            'recentBuilds': len(permits),
            'closeSpeedDays': '',
            'maxPrice': '',
            'buyBox': 'Public Maricopa County weekly residential building permit signal only. Call builder to capture exact Phoenix/Maricopa buy box, max price, close speed, utility/road requirements, lot size, jurisdiction preferences, and deal killers.',
            'validationStatus': 'needs-call-confirmation',
            'confidence': min(100, 50 + len(permits) * 6 + (8 if first.get('contractorPhone') or first.get('contractorEmail') else 0)),
            'sourceUrl': ARCHIVE_URL,
            'publicSource': 'Maricopa County Planning & Development Weekly Permit Activity Reports. Filtered to Building (Residential) BLDR rows whose descriptions indicate single-family/new residence construction.',
            'evidenceType': 'permitVerified active-builder signal',
            'recentPermits': permits[:5],
            'acquisitionNotes': f"Appears on {len(permits)} Maricopa County weekly residential building permit row(s). Latest sample {first['permitNumber']} in {first.get('city','')} from {first.get('sourceReport','weekly report')}.",
        })
    builders.sort(key=lambda row: (-row['recentBuilds'], -row['confidence'], row['name'].lower()))
    if len(builders) < MINIMUM_UNIQUE_BUILDERS:
        raise SystemExit(f'Maricopa permit-builder pull requires at least {MINIMUM_UNIQUE_BUILDERS} unique builders; found {len(builders)} from {len(permit_rows)} target permit rows across {len(reports)} reports.')
    builders = builders[:50]
    evidence = {
        'market': 'Phoenix / Maricopa County, AZ',
        'marketId': 'phoenix-maricopa-az',
        'state': 'AZ',
        'generatedAt': dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
        'source': {'name': 'Maricopa County Planning & Development — Weekly Permit Activity Reports', 'sourceUrl': ARCHIVE_URL, 'reportsInspected': len(reports), 'sourceFormat': 'XLSX workbooks from Archive Center'},
        'summary': {'permitRowsSampled': sum(r['rows'] for r in reports), 'targetPermitRows': len(permit_rows), 'uniqueBuilders': len(builders), 'minimumUniqueBuilders': MINIMUM_UNIQUE_BUILDERS, 'totalRecentBuildSignals': sum(int(row['recentBuilds']) for row in builders), 'filter': 'Building (Residential) BLDR permit rows from Maricopa weekly XLSX reports with single-family/new residence descriptions; trade/accessory work excluded.'},
        'reports': reports,
        'operatingRules': ['Contractor rows are permit-backed active-builder signals, not validated buyer demand until buy-box outreach is complete.', 'Only Building (Residential) BLDR rows with single-family/new residence descriptions count toward the floor.', 'No Maricopa seller sourcing until builder geography, max price, parcel criteria, close speed, and deal killers are captured.'],
    }
    (OUT_DIR / 'market_evidence.json').write_text(json.dumps(evidence, indent=2) + '\n')
    (OUT_DIR / 'builder_signals.json').write_text(json.dumps(builders, indent=2) + '\n')
    with (OUT_DIR / 'builder_validation_queue.csv').open('w', newline='') as handle:
        fields = ['id', 'name', 'market', 'state', 'recentBuilds', 'contactName', 'phone', 'email', 'validationStatus', 'confidence', 'sourceUrl', 'acquisitionNotes']
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in builders:
            writer.writerow({field: row.get(field, '') for field in fields})
    return evidence, builders


if __name__ == '__main__':
    evidence, builders = build()
    print(json.dumps({'outDir': str(OUT_DIR), 'builderSignals': len(builders), 'summary': evidence['summary'], 'topBuilders': [{'name': b['name'], 'recentBuilds': b['recentBuilds']} for b in builders[:12]]}, indent=2))
