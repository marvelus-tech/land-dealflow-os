#!/usr/bin/env python3
import csv
import datetime as dt
import html
import http.cookiejar
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = 'https://aca-prod.accela.com'
SEARCH = f'{BASE}/POLKCO/Cap/CapHome.aspx?module=Building'
SOURCE_URL = 'https://aca-prod.accela.com/POLKCO/Cap/CapHome.aspx?module=Building'
PERMIT_TYPE_VALUE = 'Building/Residential/New/NA'
PERMIT_TYPE_LABEL = 'Residential New Permit - Ex: New House'
MINIMUM_UNIQUE_BUILDERS = 20
OUT_DIR = Path('data/real/polk')
HEADERS = {'User-Agent': 'Mozilla/5.0 LandDealflowOS/1.0'}

TRADE_RE = re.compile(r'\b(AIR|A/C|CONDITION|ROOF|ROOFING|PLUMB|PLUMBING|ELECTRIC|ELECTRICAL|FENCE|POOL|SPA|SOLAR|GARAGE DOOR|MECHANICAL|ALUMINUM|SCREEN|MASONRY|FIRE|FOUNDATION|HANDYMAN|HVAC|IRRIGATION)\b', re.I)
BUILDER_RE = re.compile(r'\b(HOME|HOMES|BUILD|BUILDER|BUILDERS|CONSTRUCTION|CONTRACTING|CONTRACTOR|PROPERTIES|GROUP|COMMUNITIES|DEVELOPMENT|LLC|INC|CORP|RYAN|LENNAR|HORTON|HIGHLAND|MARONDA|TERRANOVA|LGI|MEXVEZ|VERANDAH|WALLER|BOBCO|EAGLE)\b', re.I)


def compact(value):
    return re.sub(r'\s+', ' ', str(value or '').replace('\x00', ' ')).strip()


def slug(value):
    return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', compact(value).lower())) or 'unknown'


def clean_company(value):
    text = compact(value)
    text = re.sub(r'\s+\d{2,6}\s+[A-Z0-9 .#-]+\s+(?:LAKELAND|WINTER HAVEN|ORLANDO|WINTER GARDEN|KISSIMMEE|DAVENPORT|HAINES CITY|AUBURNDALE|SANFORD|POINCIANA|BARTOW|MULBERRY|LAKE WALES).*$','', text, flags=re.I)
    text = re.sub(r'\s+POST OFFICE BOX.*$', '', text, flags=re.I)
    text = re.sub(r'\s+P\. ?O\. ?BOX.*$', '', text, flags=re.I)
    text = re.sub(r'^.*?(CWS General Contractor)$', r'\1', text, flags=re.I)
    text = re.sub(r'^.*?(Majestic Eagle Construction Services LLC)$', r'\1', text, flags=re.I)
    text = re.sub(r'^.*?(Gordon Moore\s*&\s*Associates\s*LLC)$', r'\1', text, flags=re.I)
    text = re.sub(r'^.*?(Reed Builders Group,?\s*Inc\.?)$', r'\1', text, flags=re.I)
    text = re.sub(r'^.*?(Signature Homes\s+RSS Enterprises LLC)$', r'\1', text, flags=re.I)
    text = re.sub(r'\s+T/A\s+.*$', '', text, flags=re.I)
    text = re.sub(r'\s+AKA:?\s+.*$', '', text, flags=re.I)
    return compact(text).strip(' ,')


def canonical_builder_brand(value):
    text = clean_company(value)
    # Accela detail pages often render this builder without punctuation as
    # "D R HORTON INC". Keep the permit-backed match, but restore the public
    # builder brand/legal punctuation used by the Polk evidence contract.
    if re.fullmatch(r'D\s*\.?\s*R\s*\.?\s+HORTON,?\s+INC\.?', text, re.I) or re.fullmatch(r'DR\s+HORTON', text, re.I):
        return 'D. R. HORTON, INC.'
    return text


def is_builder_name(value):
    text = clean_company(value)
    if not text or len(text) < 4:
        return False
    if TRADE_RE.search(text):
        return False
    if re.search(r'\b(TRUST|BANK|COUNTY|SCHOOL|CHURCH|OWNER|REVOCABLE|ESTATE)\b', text, re.I):
        return False
    return bool(BUILDER_RE.search(text))


def visible_text(page):
    text = html.unescape(re.sub(r'<[^>]+>', ' ', page))
    return compact(text)


def form_fields(page):
    data = {}
    for tag in re.findall(r'<input\b[^>]*>', page, re.I | re.S):
        name = re.search(r'name="([^"]+)"', tag, re.I)
        if not name:
            continue
        typ = (re.search(r'type="([^"]+)"', tag, re.I).group(1).lower() if re.search(r'type="([^"]+)"', tag, re.I) else 'text')
        if typ in ('checkbox', 'radio') and not re.search(r'checked', tag, re.I):
            continue
        value = re.search(r'value="([^"]*)"', tag, re.I | re.S)
        data[html.unescape(name.group(1))] = html.unescape(value.group(1) if value else '')
    for match in re.finditer(r'<select\b[^>]*name="([^"]+)"[^>]*>(.*?)</select>', page, re.I | re.S):
        name = html.unescape(match.group(1))
        block = match.group(2)
        option = re.search(r'<option[^>]*selected[^>]*value="([^"]*)"', block, re.I | re.S) or re.search(r'<option[^>]*value="([^"]*)"', block, re.I | re.S)
        data[name] = html.unescape(option.group(1) if option else '')
    for match in re.finditer(r'<textarea\b[^>]*name="([^"]+)"[^>]*>(.*?)</textarea>', page, re.I | re.S):
        data[html.unescape(match.group(1))] = html.unescape(re.sub('<.*?>', '', match.group(2)))
    return data


def post(opener, page, target, extra=None):
    data = form_fields(page)
    data.update({'__EVENTTARGET': target, '__EVENTARGUMENT': '', 'Submit': 'Submit'})
    if extra:
        data.update(extra)
    request = urllib.request.Request(SEARCH, data=urllib.parse.urlencode(data).encode(), headers={**HEADERS, 'Referer': SEARCH, 'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
    return opener.open(request, timeout=60).read().decode('utf-8', 'ignore')


def start_search(opener, days):
    page = opener.open(urllib.request.Request(SEARCH, headers=HEADERS), timeout=30).read().decode('utf-8', 'ignore')
    start = (dt.date.today() - dt.timedelta(days=days)).strftime('%m/%d/%Y')
    end = dt.date.today().strftime('%m/%d/%Y')
    return post(opener, page, 'ctl00$PlaceHolderMain$btnNewSearch', {
        'ctl00$ScriptManager1': 'ctl00$PlaceHolderMain$updatePanel|ctl00$PlaceHolderMain$btnNewSearch',
        'ctl00$PlaceHolderMain$ddlSearchType': '0',
        'ctl00$PlaceHolderMain$generalSearchForm$ddlGSPermitType': PERMIT_TYPE_VALUE,
        'ctl00$PlaceHolderMain$generalSearchForm$txtGSStartDate': start,
        'ctl00$PlaceHolderMain$generalSearchForm$txtGSEndDate': end,
    })


def parse_rows(page):
    found = []
    for match in re.finditer(r'<tr class="ACA_TabRow_[^"]+".*?</tr>', page, re.I | re.S):
        row_html = match.group(0)
        if PERMIT_TYPE_LABEL not in html.unescape(row_html):
            continue
        link = re.search(r'href="([^"]*CapDetail\.aspx[^"]*)"[^>]*>\s*<strong>\s*<span[^>]*>(.*?)</span>', row_html, re.I | re.S)
        if not link:
            continue
        href = html.unescape(link.group(1))
        permit = compact(html.unescape(re.sub('<.*?>', ' ', link.group(2))))
        if not permit.startswith('BR-'):
            continue
        row_text = visible_text(row_html)
        address_match = re.search(re.escape(PERMIT_TYPE_LABEL) + r'\s+(.+?)\s+(?:Application|Issued|Complete|Permit Finaled|Record)', row_text)
        address = compact(address_match.group(1) if address_match else '')
        if address and not re.search(r'\b(FL|LAKELAND|DAVENPORT|POINCIANA|WINTER HAVEN|EAGLE LAKE|HAINES CITY|BARTOW|AUBURNDALE|LAKE WALES|MULBERRY)\b', address, re.I):
            address = ''
        found.append({'permitNumber': permit, 'detailUrl': BASE + href, 'address': address, 'recordType': PERMIT_TYPE_LABEL})
    # Fallback for Accela rows whose TR class changes.
    if not found:
        for href, label in re.findall(r'href="([^"]*CapDetail\.aspx[^"]*)"[^>]*>\s*<strong>\s*<span[^>]*>(.*?)</span>', page, re.S | re.I):
            permit = compact(html.unescape(re.sub('<.*?>', ' ', label)))
            if permit.startswith('BR-'):
                found.append({'permitNumber': permit, 'detailUrl': BASE + html.unescape(href), 'address': '', 'recordType': PERMIT_TYPE_LABEL})
    dedup = {}
    for row in found:
        dedup[row['permitNumber']] = row
    return list(dedup.values())


def pager_targets(page):
    return re.findall(r"__doPostBack\(&#39;(ctl00\$PlaceHolderMain\$dgvPermitList\$gdvPermitList\$ctl13\$ctl\d+)&#39;,&#39;&#39;\)", page)


def extract_builder(text):
    if PERMIT_TYPE_LABEL not in text:
        return ''
    start = text.find('Licensed Professional:')
    end = text.find('Owner:', start if start != -1 else 0)
    professional = text[start:end if end != -1 else start + 3000] if start != -1 else ''
    candidates = []
    for match in re.finditer(r'(?:\d+\)\s*)?([A-Z][A-Za-z .\'-]{2,60})\s+([\w.+-]+@[\w.-]+)?\s*([A-Z0-9][A-Z0-9 &.,\'/-]{4,90}?)\s+\d{2,6}\s+.{0,180}?\b(Building|Residential|General)\b\s+[A-Z]{2,}\d+', professional, re.I):
        company = canonical_builder_brand(match.group(3))
        if is_builder_name(company):
            candidates.append(company)
    if candidates:
        return candidates[-1]
    owner = re.search(r'Owner:\s*([^*]{4,90})\s*\*', text, re.I)
    if owner:
        company = canonical_builder_brand(owner.group(1))
        if is_builder_name(company):
            return company
    applicant = re.search(r'Applicant:\s*([^:]{4,120}?)(?:\s+Work Phone|\s+Mobile Phone|\s+[\w.+-]+@[\w.-]+)', text, re.I)
    if applicant:
        company = canonical_builder_brand(applicant.group(1))
        if is_builder_name(company):
            return company
    return ''


def extract_contact(text):
    email = re.search(r'[\w.+-]+@[\w.-]+', text)
    phone = re.search(r'(?:(?:Work|Mobile) Phone:\s*)?(\d{10})', text)
    return {'email': email.group(0) if email else '', 'phone': phone.group(1) if phone else ''}


def collect(days=180, max_pages=18, max_details=220):
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    page = start_search(opener, days)
    pages = [page]
    visited = set()
    for _ in range(max_pages - 1):
        targets = pager_targets(page)
        next_target = None
        for target in targets:
            if target.endswith('$ctl14') and target not in visited:
                next_target = target
                break
        if not next_target:
            for target in targets:
                if target not in visited:
                    next_target = target
                    break
        if not next_target:
            break
        visited.add(next_target)
        try:
            page = post(opener, page, next_target, {'ctl00$ScriptManager1': 'ctl00$PlaceHolderMain$dgvPermitList$updatePanel|' + next_target})
            pages.append(page)
        except Exception:
            break
    permit_rows = {}
    for page in pages:
        for row in parse_rows(page):
            permit_rows[row['permitNumber']] = row
    groups = {}
    detail_count = 0
    for row in list(permit_rows.values())[:max_details]:
        try:
            detail = opener.open(urllib.request.Request(row['detailUrl'], headers=HEADERS), timeout=30).read().decode('utf-8', 'ignore')
        except Exception:
            continue
        detail_count += 1
        text = visible_text(detail)
        if PERMIT_TYPE_LABEL not in text:
            continue
        builder = extract_builder(text)
        if not builder:
            continue
        key = slug(builder)
        contact = extract_contact(text)
        permit = {**row, **contact, 'sourceUrl': row['detailUrl']}
        groups.setdefault(key, {'name': builder, 'permits': []})['permits'].append(permit)
        if len(groups) >= 50 and detail_count >= 100:
            break
        time.sleep(0.03)
    return list(permit_rows.values()), groups, detail_count


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    permit_rows, groups, detail_count = collect()
    builders = []
    for key, group in groups.items():
        permits = group['permits']
        first = permits[0]
        builders.append({
            'id': f'polk-builder-{slug(group["name"])[:56]}',
            'name': group['name'],
            'market': 'polk-lakeland-fl',
            'state': 'FL',
            'website': '',
            'phone': first.get('phone', ''),
            'email': first.get('email', ''),
            'contactName': group['name'],
            'recentBuilds': len(permits),
            'closeSpeedDays': '',
            'maxPrice': '',
            'buyBox': 'Public Polk County Accela residential-new permit signal only. Call builder to capture exact Polk/Lakeland land buy box, max price, closing speed, parcel constraints, utility requirements, and deal killers.',
            'validationStatus': 'needs-call-confirmation',
            'confidence': min(100, 48 + len(permits) * 6 + (8 if first.get('email') or first.get('phone') else 0)),
            'sourceUrl': SOURCE_URL,
            'publicSource': 'Polk County Accela Citizen Access public Building records. Filtered to Residential New Permit - Ex: New House records and verified from public detail pages.',
            'evidenceType': 'permitVerified active-builder signal',
            'recentPermits': permits[:5],
            'acquisitionNotes': f"Appears on {len(permits)} Polk County public Accela Residential New permit record(s). Latest sample {first['permitNumber']} at {first.get('address','')}.",
        })
    builders.sort(key=lambda row: (-row['recentBuilds'], -row['confidence'], row['name']))
    if len(builders) < MINIMUM_UNIQUE_BUILDERS:
        raise SystemExit(f'Polk permit-builder pull requires at least {MINIMUM_UNIQUE_BUILDERS} unique builders; found {len(builders)} from {len(permit_rows)} permit rows / {detail_count} detail pages.')
    builders = builders[:50]
    evidence = {
        'market': 'Polk / Lakeland, FL',
        'marketId': 'polk-lakeland-fl',
        'state': 'FL',
        'generatedAt': dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
        'source': {'name': 'Polk County Accela Citizen Access — Building records', 'sourceUrl': SOURCE_URL, 'permitType': PERMIT_TYPE_LABEL, 'searchWindowDays': 180},
        'summary': {'permitRowsSampled': len(permit_rows), 'detailPagesInspected': detail_count, 'uniqueBuilders': len(builders), 'minimumUniqueBuilders': MINIMUM_UNIQUE_BUILDERS, 'totalRecentBuildSignals': sum(int(row['recentBuilds']) for row in builders), 'filter': 'Public Accela Building module records with exact Residential New Permit - Ex: New House type; BR permit numbers only; trade/accessory contractor names excluded.'},
        'operatingRules': ['Contractor/owner data is permit-backed builder signal, not validated buyer demand until buy-box outreach is complete.', 'Only Residential New Permit - Ex: New House records count toward the floor.', 'No Polk seller sourcing until builder geography, max price, parcel criteria, close speed, and deal killers are captured.'],
    }
    (OUT_DIR / 'market_evidence.json').write_text(json.dumps(evidence, indent=2) + '\n')
    (OUT_DIR / 'builder_signals.json').write_text(json.dumps(builders, indent=2) + '\n')
    with (OUT_DIR / 'builder_validation_queue.csv').open('w', newline='') as handle:
        fields = ['id','name','market','state','recentBuilds','contactName','phone','email','validationStatus','confidence','sourceUrl','acquisitionNotes']
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in builders:
            writer.writerow({field: row.get(field, '') for field in fields})
    return evidence, builders

if __name__ == '__main__':
    evidence, builders = build()
    print(json.dumps({'outDir': str(OUT_DIR), 'builderSignals': len(builders), 'summary': evidence['summary'], 'topBuilders': [{'name': b['name'], 'recentBuilds': b['recentBuilds']} for b in builders[:12]]}, indent=2))
