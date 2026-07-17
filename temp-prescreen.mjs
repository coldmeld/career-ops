#!/usr/bin/env node
/**
 * temp-prescreen.mjs
 * Pre-screen pipeline entries by title before liveness sweep.
 * Marks excluded archetypes, senior roles, IT/electrical roles,
 * salary-below-floor entries, and duplicates as SKIP.
 * Safe to run multiple times (idempotent on already-processed lines).
 */
import { readFile, writeFile } from 'fs/promises';

const PIPELINE = '/workspace/career-ops/data/pipeline.md';

// Title patterns → immediate SKIP
const TITLE_SKIPS = [
  { re: /Lead Site Reliability Engineer/i,           reason: 'SRE/IT — excluded archetype' },
  { re: /\bSite Reliability Engineer\b/i,            reason: 'SRE/IT — excluded archetype' },
  { re: /\bReliability Manager\b/i,                  reason: 'Manager level — too senior for profile' },
  { re: /Senior Manufacturing Engineer/i,            reason: 'Senior — excluded seniority' },
  { re: /Senior Quality Engineer/i,                  reason: 'Senior — excluded seniority' },
  { re: /Senior Customer Quality Engineer/i,         reason: 'Senior — excluded seniority' },
  { re: /Senior Project Engineer/i,                  reason: 'Senior — excluded seniority' },
  { re: /Project Manager \/ Senior/i,               reason: 'Project Manager / Senior — excluded' },
  { re: /Project Manager \/ Snr/i,                  reason: 'Project Manager / Senior — excluded' },
  { re: /AI Infrastructure Project Engineer/i,       reason: 'IT infrastructure — excluded (RN CARE IT pattern)' },
  { re: /AI Data Centre Project Engineer/i,          reason: 'IT infrastructure — excluded' },
  { re: /CCTV \/ ELV/i,                             reason: 'Electrical/low-voltage IT — excluded archetype' },
  { re: /Project Engineer \(Security Systems/i,      reason: 'IT security systems — excluded archetype' },
  { re: /Project Engineer \(Audio Visual/i,          reason: 'IT/AV — excluded archetype' },
  { re: /Workplace Technology Solutions/i,           reason: 'IT — excluded archetype' },
  { re: /Data Centre Project Engineer/i,             reason: 'IT infrastructure — excluded archetype' },
  { re: /Project Engineer \(PLC\//i,                reason: 'PLC/SCADA/controls IT — excluded archetype' },
  { re: /Project Engineer - HVAC/i,                 reason: 'HVAC — Mechanical Engineering domain, excluded archetype' },
  { re: /Trading Analyst/i,                         reason: 'Finance/trading — no matching archetype' },
  { re: /Sales & Trading/i,                         reason: 'Sales — excluded archetype' },
  { re: /\| View all jobs \|/i,                     reason: 'Malformed entry — Indeed search link, not a job posting' },
];

// Salary hints in pipeline metadata → below SGD 4,000/month ceiling → SKIP
const SALARY_SKIPS = [
  { re: /\$3,500 – \$3,650/,  reason: 'Salary ceiling SGD 3,650/month below floor (SGD 4,000/month)' },
];

// Duplicate URL fragments → SKIP (keeping the earlier / cleaner entry)
const DUPLICATE_SKIPS = [
  { fragment: '4s3/qxVyl59AQU6cggN_sSIuIQ/h54',  reason: 'Duplicate — same role as 4rz/h60 (AEM Vendor/Supplier Quality Engineer)' },
  { fragment: '4s1/IqSSjq_MQX6-clHDfC4hhg/h58',  reason: 'Duplicate — same role as 4rz/h60 (AEM Vendor/Supplier Quality Engineer)' },
  { fragment: '4s1/IqSSjq_MQX6-clHDfC4hhg/h46',  reason: 'Duplicate — same role as 4s3/h46 (UMC Defect Management Process Engineer)' },
  { fragment: '4s1/IqSSjq_MQX6-clHDfC4hhg/h50',  reason: 'Duplicate — same role as 4s2/h46 (AlwaysHired R&D Engineer Sputter Process)' },
  { fragment: '4s1/IqSSjq_MQX6-clHDfC4hhg/h66',  reason: 'Duplicate — same role as 4s2/h58 (Sunningdale Process Engineer)' },
  { fragment: '4s3/qxVyl59AQU6cggN_sSIuIQ/h60',  reason: 'Duplicate — same role as 4rz/h68 (Genic Process Engineer)' },
  { fragment: '4s2/sDrXmJHOQreKIg6gsEV3JA/h62',  reason: 'Duplicate — same role as 4rz/h68 (Genic Process Engineer)' },
  { fragment: '4s1/IqSSjq_MQX6-clHDfC4hhg/h64',  reason: 'Duplicate — same role as 4s2/h54 (Triton AI Operations Engineer Chemical Plant)' },
  { fragment: '4s2/sDrXmJHOQreKIg6gsEV3JA/h56',  reason: 'Duplicate — same role as 4s3/h56 (Trust Recruit Quality Engineer ISO13485)' },
  { fragment: 'jk=15bbe00e8f1744',                reason: 'Duplicate — same role as jk=1e3ae6ac805b89 (GSK EHS Internship Jan-Jun 2027)' },
  { fragment: 'jk=31a6d9de268f66',                reason: 'Duplicate — same role as jk=fe9b3b76b881ff (Merck KGaA GOglobal Graduate Program)' },
];

const src = await readFile(PIPELINE, 'utf8');
const lines = src.split('\n');
let changed = 0;

const out = lines.map(line => {
  if (!line.startsWith('- [ ]')) return line;

  for (const { re, reason } of TITLE_SKIPS) {
    if (re.test(line)) {
      changed++;
      return `- [x] SKIP | ${line.slice(5).trim()} | ${reason}`;
    }
  }

  for (const { re, reason } of SALARY_SKIPS) {
    if (re.test(line)) {
      changed++;
      return `- [x] SKIP | ${line.slice(5).trim()} | ${reason}`;
    }
  }

  for (const { fragment, reason } of DUPLICATE_SKIPS) {
    if (line.includes(fragment)) {
      changed++;
      return `- [x] SKIP | ${line.slice(5).trim()} | ${reason}`;
    }
  }

  return line;
});

if (changed === 0) {
  console.log('No changes — all matching entries already processed.');
} else {
  await writeFile(PIPELINE, out.join('\n'), 'utf8');
  console.log(`Pre-screened ${changed} entries as SKIP.`);
}

// Print summary of remaining pending entries
const remaining = out.filter(l => l.startsWith('- [ ]'));
console.log(`\nRemaining pending after pre-screen: ${remaining.length}`);
remaining.forEach(l => {
  const parts = l.slice(5).split(' | ');
  const company = parts[1] || '(unknown)';
  const role = parts[2] || '(unknown)';
  console.log(`  • ${company.trim()} — ${role.trim()}`);
});
