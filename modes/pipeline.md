# Mode: pipeline — URL Inbox (Second Brain)

Process job URLs stored in `data/pipeline.md`. The user adds URLs at any time and then executes `/career-ops pipeline` to process them all.

## Liveness sweep (Phase 2 detail)

Run after the title pre-filter, before any JD fetch. Drops dead postings in bulk before any tokens are spent on them.

1. Collect every surviving `- [ ]` URL into a temp file (one per line).
2. Run `node check-liveness.mjs --file <tmpfile>` (add `--throttle` for large batches). Zero Claude tokens — pure HTTP/browser.
3. **expired/closed** → mark `- [x] ~~URL | Company | Role~~ — posting expired (liveness sweep)`. If a tracker row exists, mark `Discarded`. No JD fetch, no evaluation.
4. **uncertain** → leave in place; confirm liveness during Phase 3 JD fetch.
5. Only confirmed-live or uncertain entries proceed to Phase 3.

## Pre-filter: title-based SKIP (before liveness sweep or workers)

Before touching any URL, scan each pending entry's title for signals that guarantee a SKIP regardless of JD content. This runs on the pipeline entry text alone — zero tokens, zero network calls.

**Instant SKIP titles** (mark `- [x] ~~entry~~ — pre-filter SKIP: {reason}` and write a minimal TSV with status `SKIP`, score blank, no report, no PDF):

| Title contains (case-insensitive) | Reason |
|-----------------------------------|--------|
| HVAC | Mechanical Engineering — excluded archetype |
| CCTV, ELV, Security Systems, Security Inspection | Electrical Engineering domain — excluded archetype |
| Data Centre, Data Center | IT infrastructure domain — not in target archetypes |
| AI Infrastructure, AI Data Centre, AI Data Center | IT/data centre domain — not in target archetypes |
| PLC, SCADA (when paired with "Project Engineer") | Electrical/instrumentation domain — not in target archetypes |
| Solar (when paired with "Engineer") | Electrical Engineering — excluded archetype |
| Sheet Metal, Metal Casting, Foundry | Manufacturing domains requiring specialist background not in profile |
| Senior / (slash after Senior in title) | Over-leveled — Senior Engineer is an excluded archetype per _profile.md |

**Do NOT pre-filter** if the title is ambiguous or the company is a named pharma/biotech/chemical firm (e.g. GSK, Novartis, Pfizer, Solvay) — those warrant a real liveness check and evaluation.

After pre-filtering, proceed with the liveness sweep and workers only on the surviving entries.

## Workflow

The pipeline runs in four sequential phases. Phases 1–3 are handled by the **main agent** (no workers). Workers are spawned only in Phase 4, and only for roles that survive triage.

### Phase 1 — Pre-filter (zero tokens, zero network)
Apply the **Pre-filter** table above to every `- [ ]` entry based on its title text alone. Mark instant SKIPs immediately and write a minimal TSV. These entries never reach the liveness sweep or triage.

### Phase 2 — Liveness sweep
Run `node check-liveness.mjs --file <tmpfile>` on the survivors. Drop expired entries (mark `~~entry~~`) before continuing.

### Phase 3 — JD fetch + inline triage (main agent, no workers spawned)

For each surviving URL, the main agent:

**a. Fetch the JD** using the cheapest available method:
- MCF URL → MCF API (extract 32-char hex UUID from URL tail, `GET https://api.mycareersfuture.gov.sg/v2/jobs/{hex}`) — zero tokens, instant
- Other URLs → WebFetch → WebSearch fallback
- If inaccessible → mark `[!]` and continue

**b. Triage decision** — read the JD and decide in one pass:

| Signal | Decision |
|--------|----------|
| Archetype maps to an excluded type (Mechanical, Electrical, Software, Sales Engineer) | **INLINE SKIP** |
| Core requirements have zero overlap with cv.md (wrong domain entirely) | **INLINE SKIP** |
| Experience required clearly exceeds candidate level (5yr+ in a specialist domain) | **INLINE SKIP** |
| MCF posting + CV match clearly < 3.5 (fundamental domain mismatch, not a gap) | **INLINE SKIP** |
| Role is plausibly a match OR uncertain (any meaningful CV overlap, domain adjacent) | **SPAWN WORKER** |

When in doubt, spawn a worker — don't over-filter.

**c. Handle inline SKIPs** (main agent writes these directly, no worker):
- Reserve report number, write a **short report** to `reports/{###}-{slug}-{date}.md`:
  ```
  # Evaluation: {Company} — {Role}
  **Date:** / **URL:** / **Archetype:** / **Score:** / **Legitimacy:** High Confidence (not verified) / **PDF:** N/A
  ## A) Role Summary
  {1-sentence TL;DR and archetype}
  ## B) Match with CV
  **Verdict: SKIP** — {2–3 sentence reason: which requirement is the blocker, why no adjacent experience covers it}
  *Blocks C–G not produced (inline SKIP — clear mismatch, full evaluation not warranted)*
  ## Machine Summary
  ```yaml
  archetype: {canonical label}
  score: {X.X}
  status: SKIP
  ```
  ```
- Write TSV to `batch/tracker-additions/`
- Release report sentinel
- Mark pipeline entry `[x]`
- **Do NOT run WebSearch** for comp or company data — no Block D, E, F, or G research

This is the key token saving: a clear SKIP costs one JD read + one short write. No comp research, no interview plan, no customization plan.

### Phase 4 — Full evaluation (workers, parallel)

After Phase 3 completes, collect all URLs flagged **SPAWN WORKER**.

- If **1–2 workers**: evaluate inline (main agent, sequentially) using the full A–G flow in `modes/oferta.md`
- If **3+ workers**: launch one background agent per URL in parallel (`Agent tool`, `run_in_background=true`). Each worker is a **single-pass**: full A–G + report + TSV + PDF gate. Must not spawn further subagents.

**About the PDF gate (configurable):** Read `config/profile.yml` → `auto_pdf_score_threshold`. Default `3.0` if unset. Score below threshold → skip PDF, note in report header, mark PDF ❌. Score ≥ threshold → generate via `PATH=/workspace/career-ops:$PATH node generate-latex.mjs`.

### Phase 5 — Merge and summarise

Run `node merge-tracker.mjs` after all workers complete. Then show the summary table:

```
| # | Company | Role | Score | Path | Recommended action |
```

`Path` = `inline-skip`, `inline-eval`, or `worker`.

## Format of pipeline.md

```markdown
## Pending
- [ ] https://jobs.example.com/posting/123
- [ ] https://boards.greenhouse.io/company/jobs/456 | Company Inc | Senior PM
- [ ] https://jobs.ashbyhq.com/acme/789 | Acme Corp | Solutions Architect | Remote (US)
- [ ] https://jobs.ashbyhq.com/acme/790 | Acme Corp | AI Engineer | Remote (US) | 180000-220000 USD
- [!] https://private.url/job — Error: login required

## Processed
- [x] #143 | https://jobs.example.com/posting/789 | Acme Corp | AI PM | 4.2/5 | PDF ✅
- [x] #144 | https://boards.greenhouse.io/xyz/jobs/012 | BigCo | SA | 2.1/5 | PDF ❌
```

Pending lines are variable-width. The rawest form is a bare pasted URL,
`- [ ] {url}` (1 column) — what you drop into the inbox by hand. Scanner-written
entries add `| {company} | {title}` (3 columns) plus two optional trailing
columns: `| {location}` (4th) and `| {compensation}` (5th). The scanner fills the
trailing columns only when the ATS exposes them, so 1-, 3-, 4-, and 5-column rows
are all valid — `{url} | {company} | {title} | {location} | {compensation}` is the
maximum (canonical) shape, not the only one. The columns are positional, so a row
carrying compensation always includes the location cell (empty if unknown); a row
with only a location stays 4 columns. Existing shorter rows remain valid and are
read as having empty values for the missing trailing columns.

## Intelligent JD detection from URL

1. **MCF API (mycareersfuture.gov.sg URLs):** Extract 32-char hex UUID from the URL tail (segment after final `-`), fetch `https://api.mycareersfuture.gov.sg/v2/jobs/{hex}`. Zero tokens, zero browser. A 404 response = posting expired (treat as definitive). See `_custom.md` for full rule.
2. **WebFetch:** For non-MCF static pages or when the MCF API returns an error.
3. **Playwright (`browser_navigate` + `browser_snapshot`):** For SPAs that require JavaScript rendering and cannot be fetched statically. Use the project Playwright install (`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`), not the MCP tool (see `_custom.md`).
4. **WebSearch (last resort):** Search in secondary portals that index the JD.

**Special cases:**
- **LinkedIn**: May require login → mark `[!]` and ask the user to paste the text
- **PDF**: If the URL points to a PDF, read it directly with the Read tool
- **`local:` prefix**: Read the local file. Example: `local:jds/linkedin-pm-ai.md` → read `jds/linkedin-pm-ai.md`

## Automatic numbering

1. Run `node reserve-report-num.mjs` to claim the next sequential number (stdout returns `{###}`).
2. Write the report file using that number.
3. Release the sentinel by running `node reserve-report-num.mjs --release {###}` once the report is written.

## Source synchronization

Before processing any URL, verify sync and confirm `_custom.md` was read:
```bash
node cv-sync-check.mjs
```
If there is a desynchronization, warn the user before continuing.

**`_custom.md` must be read before any URL is processed.** It contains portal-specific extraction rules (MCF API, careers.gov.sg patterns) and active house rules that affect every evaluation. If you reached this mode without reading it, read it now before continuing.
