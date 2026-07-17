#!/usr/bin/env node
// mcf-expiry-update.mjs — Build new rows for mcf-expiry-dates.md
// Reads applications.md for entries after CUTOFF_DATE, finds MCF reports, queries API.

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = '/workspace/career-ops/reports';
const TRACKER_FILE = '/workspace/career-ops/data/applications.md';
const MCF_API = 'https://api.mycareersfuture.gov.sg/v2/jobs/';
const CUTOFF_DATE = '2026-06-25'; // last mcf-expiry-dates.md update

function parseTracker() {
  const content = readFileSync(TRACKER_FILE, 'utf8');
  const entries = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Date') || line.includes('Role')) continue;
    const cols = line.split('|').map(c => c.trim()).filter((_, i) => i > 0); // skip leading empty
    // cols: [trackerNum, date, company, role, score, status, pdf, report, notes]
    if (cols.length < 8) continue;
    const [trackerNum, date, company, role, score, status, , report] = cols;

    const dateMatch = date?.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    const entryDate = dateMatch[1];
    if (entryDate <= CUTOFF_DATE) continue;

    // Extract report number from [NNN](...) or NNN
    const reportMatch = report?.match(/\[(\d+)\]/);
    const plainMatch = !reportMatch && report?.match(/^(\d+)$/);
    const reportNum = reportMatch ? parseInt(reportMatch[1]) : (plainMatch ? parseInt(plainMatch[1]) : null);

    const trackerNumClean = trackerNum?.replace(/\D/g, '');

    entries.push({
      trackerNum: trackerNumClean || '—',
      date: entryDate,
      company: company || '?',
      role: role || '?',
      score: score || 'N/A',
      status: status || 'Evaluated',
      reportNum,
    });
  }
  return entries;
}

function extractMcfUuid(content) {
  // UUID is always the last 32 hex chars in the MCF URL path
  const match = content.match(/mycareersfuture\.gov\.sg\/job\/[^\s)"']+([a-f0-9]{32})/);
  return match ? match[1] : null;
}

async function fetchExpiry(uuid) {
  try {
    const res = await fetch(`${MCF_API}${uuid}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.metadata?.expiryDate ?? data?.expiryDate ?? null;
  } catch {
    return null;
  }
}

// Build report# → filename map
const reportFiles = {};
for (const f of readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'))) {
  const num = parseInt(f.split('-')[0], 10);
  if (!isNaN(num)) reportFiles[num] = f;
}

const trackerEntries = parseTracker();
process.stderr.write(`Found ${trackerEntries.length} tracker entries after ${CUTOFF_DATE}\n`);

const results = [];
const noMcf = [];

for (const entry of trackerEntries) {
  const { trackerNum, date, company, role, score, status, reportNum } = entry;
  if (!reportNum) {
    noMcf.push({ trackerNum, date, company, role, score, status, reason: 'no-report#' });
    continue;
  }

  const reportFile = reportFiles[reportNum];
  if (!reportFile) {
    noMcf.push({ trackerNum, date, company, role, score, status, reason: `report-${reportNum}-missing` });
    continue;
  }

  const content = readFileSync(join(REPORTS_DIR, reportFile), 'utf8');
  const uuid = extractMcfUuid(content);
  if (!uuid) {
    noMcf.push({ trackerNum, date, company, role, score, status, reason: 'no-mcf-url' });
    continue;
  }

  process.stderr.write(`  [${trackerNum}/${reportNum}] ${company.slice(0, 35).padEnd(35)} `);
  const expiry = await fetchExpiry(uuid);
  const expiryDate = expiry ? expiry.split('T')[0] : 'unknown';
  process.stderr.write(`${expiryDate}\n`);

  results.push({ trackerNum, reportNum, expiryDate, company, role, score, status });
  await new Promise(r => setTimeout(r, 100));
}

const fmt = r =>
  `| ${r.trackerNum} | ${r.reportNum} | ${r.expiryDate} | ${r.company} | ${r.role} | ${r.score} | ${r.status} |`;

const TODAY = '2026-07-15';
const expired  = results.filter(r => r.expiryDate !== 'unknown' && r.expiryDate < TODAY).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate));
const julyRem  = results.filter(r => r.expiryDate !== 'unknown' && r.expiryDate >= TODAY && r.expiryDate < '2026-08-01').sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate));
const august   = results.filter(r => r.expiryDate !== 'unknown' && r.expiryDate >= '2026-08-01').sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate));
const unknown  = results.filter(r => r.expiryDate === 'unknown');

console.log('## ⚫ NEW EXPIRED entries (add to ⚫ section, before today)');
for (const r of expired) console.log(fmt(r));

console.log('\n## 🟡 NEW remaining-July entries (add to 🟡 July section)');
for (const r of julyRem) console.log(fmt(r));

console.log('\n## 🟢 NEW August+ entries (new section after 🟡)');
for (const r of august) console.log(fmt(r));

console.log('\n## ⬜ NEW unknown-expiry entries (add to ⬜ section)');
for (const r of unknown) console.log(fmt(r));

process.stderr.write(`\nSummary: ${results.length} MCF entries found\n`);
process.stderr.write(`  Expired: ${expired.length}, July-remaining: ${julyRem.length}, August+: ${august.length}, Unknown: ${unknown.length}\n`);
process.stderr.write(`  Non-MCF / skipped: ${noMcf.length}\n`);
