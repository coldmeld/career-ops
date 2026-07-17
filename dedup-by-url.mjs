#!/usr/bin/env node
// Deduplicate reports and tracker rows that share the same URL.
//
// For each URL shared by 2+ reports:
//   - Keep the tracker row with the highest status (Applied beats Evaluated, etc.)
//   - Update that row's report link to point to the highest-numbered report file (newest)
//   - Delete all lower-numbered report files
//   - Delete all other tracker rows
//
// Run: node dedup-by-url.mjs [--dry-run]

import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const REPORTS_DIR = join(ROOT, 'reports');
const TRACKER_PATH = join(ROOT, 'data', 'applications.md');
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('DRY RUN — no files will be changed\n');

const STATUS_RANK = {
  'offer': 7, 'interview': 6, 'responded': 5, 'applied': 4,
  'evaluated': 3, 'rejected': 2, 'discarded': 1, 'skip': 0,
};
function rankStatus(s) {
  return STATUS_RANK[(s || '').toLowerCase().trim()] ?? 0;
}

// ── 1. Extract URL from a report file ────────────────────────────────────────
function extractUrl(text) {
  const m = text.match(/\*\*URL:\*\*\s*(.+)/);
  if (!m) return null;
  const url = m[1].trim().split(/\s/)[0].replace(/[*)]/g, '').trim();
  if (!/^https?:\/\/.{8,}/.test(url)) return null;
  return url;
}

// ── 2. Load all reports ───────────────────────────────────────────────────────
const allFiles = readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md')).sort();
const reports = new Map(); // reportNum → { file, url }
for (const file of allFiles) {
  const num = parseInt(file.match(/^(\d+)-/)?.[1] ?? '0', 10);
  const text = readFileSync(join(REPORTS_DIR, file), 'utf-8');
  reports.set(num, { file, url: extractUrl(text) });
}

// ── 3. Group report numbers by URL ───────────────────────────────────────────
const byUrl = new Map(); // url → Set<reportNum>
for (const [num, { url }] of reports) {
  if (!url) continue;
  if (!byUrl.has(url)) byUrl.set(url, new Set());
  byUrl.get(url).add(num);
}

const duplicateUrls = [...byUrl.entries()].filter(([, nums]) => nums.size > 1);
if (duplicateUrls.length === 0) {
  console.log('No duplicate URLs found.'); process.exit(0);
}

// ── 4. Parse tracker rows ─────────────────────────────────────────────────────
// Format: | trackerNum | date | company | role | score | status | pdf | [repNum](link) | notes |
const rawTracker = readFileSync(TRACKER_PATH, 'utf-8');
const trackerLines = rawTracker.split('\n');

function parseRow(line) {
  const cells = line.split('|').map(c => c.trim());
  if (cells.length < 9) return null;
  const trackerNum = parseInt(cells[1]);
  if (isNaN(trackerNum)) return null;
  const linkMatch = (cells[7] || '').match(/\[(\d+)\]\((?:\.\.\/)?reports\/([^)]+)\)/);
  if (!linkMatch) return null;
  return {
    trackerNum,
    date: cells[2],
    company: cells[3],
    role: cells[4],
    score: cells[5],
    status: cells[6],
    pdf: cells[7] === '✅' ? '✅' : '❌',
    reportNum: parseInt(linkMatch[1]),
    reportFile: linkMatch[2],
    notes: cells[9] || '',
    raw: line,
  };
}

// Build map: reportNum → tracker row
const rowByReport = new Map();
for (const line of trackerLines) {
  const row = parseRow(line);
  if (row) rowByReport.set(row.reportNum, row);
}

// ── 5. For each duplicate URL group, decide what to keep ─────────────────────
const reportsToDelete = new Set();   // report nums
const trackerNumsToRemove = new Set();
const trackerUpdates = new Map();    // trackerNum → new report link string

let groupCount = 0;
for (const [url, numSet] of duplicateUrls) {
  const nums = [...numSet].sort((a, b) => a - b); // ascending
  const newestReport = nums[nums.length - 1];

  // Collect tracker rows for all reports in this group
  const rows = nums.map(n => rowByReport.get(n)).filter(Boolean);

  if (rows.length === 0) {
    // No tracker rows at all — just keep newest report, delete rest
    for (const n of nums.slice(0, -1)) reportsToDelete.add(n);
    console.log(`[no tracker rows] Keep #${newestReport}, delete ${nums.slice(0, -1).join(', ')}`);
    groupCount++;
    continue;
  }

  // Pick winning row: highest status; tie-break by higher tracker num (newer)
  rows.sort((a, b) => {
    const sd = rankStatus(b.status) - rankStatus(a.status);
    return sd !== 0 ? sd : b.trackerNum - a.trackerNum;
  });
  const winner = rows[0];
  const losers = rows.slice(1);

  const newestFile = reports.get(newestReport)?.file ?? winner.reportFile;

  console.log(`URL: ${url.substring(0, 80)}`);
  console.log(`  Keep tracker #${winner.trackerNum} (${winner.status}) — report #${winner.reportNum}`);
  if (winner.reportNum !== newestReport) {
    console.log(`  → Repoint to newest report #${newestReport} (${newestFile})`);
    trackerUpdates.set(winner.trackerNum, {
      oldLink: `[${winner.reportNum}](`,
      newLink: `[${newestReport}](../reports/${newestFile})`,
      winner,
      newestFile,
      newestReport,
    });
  }
  for (const loser of losers) {
    console.log(`  Remove tracker #${loser.trackerNum} (${loser.status}) — report #${loser.reportNum}`);
    trackerNumsToRemove.add(loser.trackerNum);
  }
  // Delete all report files except newest
  for (const n of nums.slice(0, -1)) reportsToDelete.add(n);

  groupCount++;
}

console.log(`\n${groupCount} URL groups | ${reportsToDelete.size} report files to delete | ${trackerNumsToRemove.size} tracker rows to remove | ${trackerUpdates.size} rows to repoint`);

if (!DRY_RUN) {
  // Delete report files
  for (const num of reportsToDelete) {
    const info = reports.get(num);
    if (!info) continue;
    try {
      unlinkSync(join(REPORTS_DIR, info.file));
      console.log(`Deleted: reports/${info.file}`);
    } catch (e) {
      console.warn(`Could not delete reports/${info.file}: ${e.message}`);
    }
  }

  // Rewrite tracker: apply updates and removals
  const updatedLines = trackerLines
    .filter(line => {
      const row = parseRow(line);
      return !row || !trackerNumsToRemove.has(row.trackerNum);
    })
    .map(line => {
      const row = parseRow(line);
      if (!row || !trackerUpdates.has(row.trackerNum)) return line;
      const { newestReport, newestFile } = trackerUpdates.get(row.trackerNum);
      // Replace report link
      return line.replace(
        /\[(\d+)\]\((?:\.\.\/)?reports\/[^)]+\)/,
        `[${newestReport}](../reports/${newestFile})`
      );
    });

  const cleaned = updatedLines.join('\n').replace(/\n{3,}/g, '\n\n');
  writeFileSync(TRACKER_PATH, cleaned, 'utf-8');
  console.log(`\nTracker updated: ${trackerNumsToRemove.size} rows removed, ${trackerUpdates.size} links repointed.`);
}
