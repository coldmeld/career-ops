#!/usr/bin/env node
/**
 * Consolidates fragmented archetype labels in all reports to the 10 canonical names.
 * Dry-run by default. Pass --apply to write changes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, 'reports');
const DRY_RUN = !process.argv.includes('--apply');

const CANONICAL = [
  'Chemical / Process Engineer',
  'Environmental Engineer',
  'Manufacturing / Production Engineer',
  'Quality Engineer',
  'Materials Engineer',
  'HSE / Safety Engineer',
  'R&D Engineer',
  'Project Engineer',
  'Industrial / Reliability Engineer',
  'Cybersecurity Engineer (Entry)',
  'EXCLUDED',
  'Unknown',
];

function classify(raw) {
  const s = raw.replace(/['"]/g, '').trim();

  // Already canonical — return as-is (normalizes quotes)
  for (const c of CANONICAL) {
    if (s.toLowerCase() === c.toLowerCase()) return c;
  }

  // --- EXCLUDED ---
  if (/\(excluded\)|excluded|not in target archetypes|mismatch|technical sales|field service|supply chain.*procurement|outside scope|below target level|it\/data center|data center infrastructure/i.test(s)) return 'EXCLUDED';
  if (/^contracts\s*\/|^contracts\b/i.test(s)) return 'EXCLUDED';
  if (/\bsoftware\b.*engineer|sre.*engineer|\belectrical.*engineer\b|\bmarine engineer\b/i.test(s) && !/chemical|process|quality/i.test(s)) return 'EXCLUDED';

  // --- CYBERSECURITY ---
  if (/cybersecurity|cyber security|\bsoc\b.*analyst|network security|penetration test|threat hunt|threat intel|application security|\biam\b|\bpam\b|blue team|red team|\boscp\b|security operations|security intelligence|\bosint\b|security.*engineer.*entry|entry.*security/i.test(s)) return 'Cybersecurity Engineer (Entry)';

  // --- HSE / SAFETY ---
  if (/\bhse\b|safety engineer|\behs\b|process safety|wsho|health.*safety.*engineer|safety.*health.*engineer/i.test(s)) return 'HSE / Safety Engineer';

  // --- QUALITY (before Chemical/Process to catch QC chemist variants) ---
  if (/\bquality engineer\b|quality.*engineer|supplier quality|qc\/analytical|qc.*chemist|quality control chemist|qc scientist|analytical.*chemist|lab.*chemist|materials.*testing chemist|qc.*lab|quality.*lab|qc\/qa/i.test(s)) return 'Quality Engineer';

  // --- MATERIALS ---
  if (/\bmaterials engineer\b|materials characteriz|failure analysis.*engineer|materials.*testing engineer/i.test(s)) return 'Materials Engineer';

  // --- ENVIRONMENTAL ---
  if (/environmental engineer|environmental.*process engineer|waste.*treatment.*engineer/i.test(s) && !/safety|hse/i.test(s)) return 'Environmental Engineer';

  // --- INDUSTRIAL / RELIABILITY ---
  if (/industrial.*reliability|\breliability engineer\b|industrial\/reliability|industrial\s*\/\s*reliability|industrial.*lean|lean.*engineer|industrial engineering|industrial\/lean/i.test(s)) return 'Industrial / Reliability Engineer';

  // --- PROJECT ENGINEER ---
  // "Project Engineer" as the primary role noun (not "Process/Project" or "R&D Project")
  if (/project engineer/i.test(s)) {
    // Exceptions: if "process engineer" appears before "project" or is the noun
    const processFirst = /^process.*project|^chemical.*\/.*process.*project/i.test(s);
    if (!processFirst) return 'Project Engineer';
  }

  // --- SIMULATION / COMPUTATIONAL (R&D track) ---
  if (/simulation.*engineer|thermal.*fluid.*engineer|computational.*engineer|cfd.*engineer/i.test(s)) return 'R&D Engineer';

  // --- R&D (when R&D is the leading keyword) ---
  if (/^r&d\b|^r&d\s*engineer|^r&d\s*\//i.test(s.trim())) return 'R&D Engineer';

  // --- MANUFACTURING / PRODUCTION ---
  if (/manufacturing.*engineer|production.*engineer|manufacturing.*production|manufacturing.*process engineer|production operations|semiconductor fab engineer|equipment engineer|equipment technician/i.test(s)) {
    // Chemical/Process takes priority if msat/process development is a primary function
    if (/\bmsat\b|process development|chemical.*process.*engineer/i.test(s)) return 'Chemical / Process Engineer';
    return 'Manufacturing / Production Engineer';
  }

  // --- CHEMICAL / PROCESS (broad) ---
  if (/chemical.*engineer|process.*engineer|chemical.*process|\bmsat\b|process development|validation.*engineer|process.*\/.*r&d|r&d.*\/.*process|process.*r&d|specialist.*chemist|industrial.*chemist|process.*chemist|process.*chemical|facilities.*utilities.*engineer|facilities\/utilities|product development.*che/i.test(s)) return 'Chemical / Process Engineer';

  // --- R&D (broader catch) ---
  if (/\br&d\b|research.*engineer|research.*develop|research.*project.*manage/i.test(s)) return 'R&D Engineer';

  // --- Chemist catch-all → Quality Engineer ---
  if (/chemist|chemistry|analytical.*scientist/i.test(s)) return 'Quality Engineer';

  // --- Industrial / Manufacturing Engineer catch ---
  if (/\bindustrial engineer\b/i.test(s)) return 'Industrial / Reliability Engineer';

  return 'Unknown';
}

const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.md') && !f.startsWith('pattern-analysis'));

let changed = 0;
let unchanged = 0;
const changeLog = [];
const unknownLog = [];

for (const file of files) {
  const fpath = path.join(reportsDir, file);
  const content = fs.readFileSync(fpath, 'utf8');

  // Match archetype line in Machine Summary YAML block
  const match = content.match(/^archetype:\s*(.+)$/m);
  if (!match) continue;

  const rawValue = match[1].trim();
  const canonical = classify(rawValue);
  const currentClean = rawValue.replace(/^["']|["']$/g, '').trim();

  if (currentClean === canonical) {
    unchanged++;
    continue;
  }

  if (canonical === 'Unknown') unknownLog.push({ file, raw: rawValue });

  changeLog.push({ file, from: rawValue, to: canonical });

  if (!DRY_RUN) {
    const updated = content.replace(/^archetype:\s*.+$/m, `archetype: ${canonical}`);
    fs.writeFileSync(fpath, updated, 'utf8');
  }

  changed++;
}

console.log(`\n=== Archetype Consolidation ${DRY_RUN ? '(DRY RUN)' : '(APPLIED)'} ===`);
console.log(`Reports scanned:  ${files.length}`);
console.log(`Already canonical: ${unchanged}`);
console.log(`To change:        ${changed}`);

if (unknownLog.length) {
  console.log(`\nStill Unknown (${unknownLog.length}) — review manually:`);
  for (const u of unknownLog) console.log(`  ${u.file}: "${u.raw}"`);
}

console.log('\nSample changes (first 30):');
for (const c of changeLog.slice(0, 30)) {
  console.log(`  ${c.file}`);
  console.log(`    "${c.from}" → ${c.to}`);
}

if (DRY_RUN && changed > 0) {
  console.log(`\nRun with --apply to write ${changed} changes.`);
}
