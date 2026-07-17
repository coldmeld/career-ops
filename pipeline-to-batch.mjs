#!/usr/bin/env node
// Extracts pending URLs from data/pipeline.md and appends them to batch/batch-input.tsv.
// Skips URLs already present in batch-input.tsv and local: entries (not fetchable by workers).
//
// Usage: node pipeline-to-batch.mjs [--dry-run]

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const PIPELINE  = resolve(ROOT, 'data/pipeline.md');
const BATCH_INPUT = resolve(ROOT, 'batch/batch-input.tsv');

const DRY_RUN = process.argv.includes('--dry-run');

// --- Parse pipeline.md ---

const pipelineText = readFileSync(PIPELINE, 'utf8');

const skipped = [];
const pending = [];

for (const line of pipelineText.split('\n')) {
  if (!/^- \[ \]/.test(line)) continue;

  const content = line.replace(/^- \[ \]\s*/, '').trim();
  const parts   = content.split('|').map(p => p.trim());
  const url     = parts[0];

  if (!url || !url.startsWith('http')) {
    // local: entries or bare text — not fetchable by batch workers
    skipped.push(line.trim());
    continue;
  }

  const company = parts[1] || '';
  const title   = parts[2] || '';
  const notes   = [company, title].filter(Boolean).join(' | ');

  pending.push({ url, notes });
}

// --- Read existing batch-input.tsv ---

let maxId = 0;
const existingUrls = new Set();
let existingContent = 'id\turl\tsource\tnotes';

if (existsSync(BATCH_INPUT)) {
  existingContent = readFileSync(BATCH_INPUT, 'utf8').trimEnd();
  for (const line of existingContent.split('\n').slice(1)) {
    if (!line.trim()) continue;
    const [idStr, url] = line.split('\t');
    const id = parseInt(idStr, 10);
    if (!isNaN(id) && id > maxId) maxId = id;
    if (url) existingUrls.add(url.trim());
  }
}

// --- Filter duplicates ---

const newEntries = pending.filter(e => !existingUrls.has(e.url));
const duplicates = pending.length - newEntries.length;

// --- Report ---

console.log(`Pipeline pending : ${pending.length}`);
if (skipped.length)   console.log(`Skipped (local:) : ${skipped.length}`);
if (duplicates)       console.log(`Already in batch : ${duplicates}`);
console.log(`New to add       : ${newEntries.length}`);

if (newEntries.length === 0) {
  console.log('Nothing to add.');
  process.exit(0);
}

const startId = maxId + 1;
const newLines = newEntries.map((e, i) =>
  `${startId + i}\t${e.url}\tpipeline\t${e.notes}`
);

if (DRY_RUN) {
  console.log('\n-- dry run (nothing written) --');
  newLines.forEach(l => console.log(l));
  process.exit(0);
}

// --- Append ---

writeFileSync(BATCH_INPUT, existingContent + '\n' + newLines.join('\n') + '\n');

console.log(`\nAppended IDs ${startId}–${startId + newEntries.length - 1} to batch/batch-input.tsv`);
