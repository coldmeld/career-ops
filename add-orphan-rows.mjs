#!/usr/bin/env node
// One-shot script: read orphan reports → write TSVs to batch/tracker-additions/
// Run: node add-orphan-rows.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const REPORTS_DIR = join(ROOT, 'reports');
const TRACKER_PATH = join(ROOT, 'data', 'applications.md');
const TSV_DIR = join(ROOT, 'batch', 'tracker-additions');

// ── 1. Collect all report numbers that ARE referenced in the tracker ──────────
const trackerText = readFileSync(TRACKER_PATH, 'utf-8');
// Match report links like [NNN](...) anywhere in the tracker
const referencedNums = new Set(
  [...trackerText.matchAll(/\[(\d+)\]\((?:\.\.\/)?reports\//g)].map(m => m[1])
);

// ── 2. Find orphan report files ───────────────────────────────────────────────
const allReports = readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));
const orphans = allReports.filter(f => {
  const num = f.match(/^(\d+)-/)?.[1];
  return num && !referencedNums.has(num);
});

console.log(`Found ${orphans.length} orphan reports`);

// ── 3. Find current max tracker # ────────────────────────────────────────────
const trackerNums = [...trackerText.matchAll(/^\|\s*(\d+)\s*\|/gm)].map(m => parseInt(m[1]));
let nextNum = Math.max(...trackerNums) + 1;
console.log(`Starting tracker # at ${nextNum}`);

// ── 4. Parse Machine Summary YAML from each report ───────────────────────────
function parseMachineSummary(text) {
  const block = text.match(/```yaml\s*([\s\S]*?)```/);
  if (!block) return null;
  const yaml = block[1];
  const get = (key) => yaml.match(new RegExp(`^${key}:\\s*(.+)`, 'm'))?.[1]?.trim() ?? '';
  return {
    score: get('score'),
    status: get('status'),
    company: get('company'),
    role: get('role'),
    date: get('date'),
  };
}

function canonicalStatus(raw) {
  const map = {
    'evaluated': 'Evaluated',
    'applied': 'Applied',
    'responded': 'Responded',
    'interview': 'Interview',
    'offer': 'Offer',
    'rejected': 'Rejected',
    'discarded': 'Discarded',
    'skip': 'SKIP',
  };
  return map[raw.toLowerCase()] ?? 'Evaluated';
}

// ── 5. Write one TSV per orphan ───────────────────────────────────────────────
if (!existsSync(TSV_DIR)) mkdirSync(TSV_DIR, { recursive: true });

let written = 0;
let skipped = 0;
const problems = [];

for (const file of orphans.sort()) {
  const reportNumStr = file.match(/^(\d+)-/)[1];
  const reportPath = join(REPORTS_DIR, file);
  const text = readFileSync(reportPath, 'utf-8');
  const meta = parseMachineSummary(text);

  if (!meta || !meta.company || !meta.role) {
    problems.push(`  SKIP (no Machine Summary): ${file}`);
    skipped++;
    continue;
  }

  const trackerNum = nextNum++;
  const date = meta.date || '2026-01-01';
  const company = meta.company.replace(/\|/g, '-');
  const role = meta.role.replace(/\|/g, '-');
  const status = canonicalStatus(meta.status || 'evaluated');
  const rawScore = meta.score && meta.score !== 'skip' && meta.score !== 'null' && meta.score !== '' ? meta.score : null;
  const score = rawScore ? `${rawScore}/5` : 'N/A';
  const reportLink = `[${reportNumStr}](reports/${file})`;
  const note = `Orphan report — tracker row added retroactively`;

  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tsvName = `${String(trackerNum).padStart(4, '0')}-${slug}.tsv`;
  const tsvPath = join(TSV_DIR, tsvName);

  // TSV column order: num, date, company, role, status, score, pdf, report, notes
  const row = [trackerNum, date, company, role, status, score, '❌', reportLink, note].join('\t');
  writeFileSync(tsvPath, row + '\n', 'utf-8');
  written++;
}

console.log(`\nDone: ${written} TSVs written, ${skipped} skipped (no Machine Summary)`);
if (problems.length) {
  console.log('\nProblems:');
  problems.forEach(p => console.log(p));
}
