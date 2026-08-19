# Mode: scripts — Run Maintenance Scripts

Run any career-ops `.mjs` script based on what the user asks for. Match intent to the right script, run it with sensible defaults, and report the output.

**When in doubt, run `--dry-run` or `--help` first and show the user the preview before committing.**

---

## Scripts

### Pipeline & Tracker

| Intent | Command |
|--------|---------|
| Merge batch tracker additions into applications.md | `node merge-tracker.mjs` |
| Sync pipeline.md with completed batch entries | `node reconcile-pipeline.mjs` |
| Verify pipeline integrity (reports, links, statuses) | `node verify-pipeline.mjs` |
| Normalize non-canonical statuses in tracker | `node normalize-statuses.mjs` |
| Remove duplicate tracker entries | `node dedup-tracker.mjs` |
| Convert pipeline.md pending URLs → batch-input.tsv | `node pipeline-to-batch.mjs` |
| Preview pipeline-to-batch without writing | `node pipeline-to-batch.mjs --dry-run` |

**Full post-batch maintenance sequence (run in order):**
```bash
node merge-tracker.mjs
node reconcile-pipeline.mjs
node normalize-statuses.mjs
node dedup-tracker.mjs
node verify-pipeline.mjs
```

### Scanning & Liveness

| Intent | Command |
|--------|---------|
| Scan portals for new roles | `node scan.mjs` |
| Check if a single URL is live | `node check-liveness.mjs <url>` |
| Check a list of URLs from a file | `node check-liveness.mjs --file <path> --throttle` |

### Batch Mode

| Intent | Command |
|--------|---------|
| Convert pipeline pending → batch input | `node pipeline-to-batch.mjs` |
| Preview batch (dry run) | `./batch/batch-runner.sh --dry-run` |
| Run batch (N parallel workers) | `./batch/batch-runner.sh --parallel <N>` |
| Check batch progress | `./batch/batch-runner.sh --status` |
| Watch batch live | `./batch/batch-runner.sh --watch` |
| Retry failed offers | `./batch/batch-runner.sh --retry-failed` |
| Resume after rate-limit pause | `./batch/batch-runner.sh --resume-paused` |

### Analysis & Reporting

| Intent | Command |
|--------|---------|
| Analyse rejection patterns / ATS channels | `node analyze-patterns.mjs` |
| Show follow-up cadence for active applications | `node followup-cadence.mjs` |
| Detect reposted roles in scan history | `node detect-reposts.mjs --summary` |

### CV & PDF

| Intent | Command |
|--------|---------|
| Generate PDF from HTML template | `PATH=/workspace/career-ops:$PATH node generate-pdf.mjs <input.html> <output.pdf>` |
| Compile LaTeX CV to PDF | `PATH=/workspace/career-ops:$PATH node generate-latex.mjs <file.tex>` |

### System

| Intent | Command |
|--------|---------|
| Run setup health check | `node doctor.mjs` |
| Check for system updates | `node update-system.mjs check` |
| Apply system update | `node update-system.mjs apply` |
| Roll back last update | `node update-system.mjs rollback` |
| List plugins | `node plugins.mjs list` |
| List available plugins | `node plugins.mjs available` |

---

## Rules

- Always run from `/workspace/career-ops/` (project root).
- For PDF/LaTeX commands, prefix with `PATH=/workspace/career-ops:$PATH` so tectonic resolves.
- For batch-runner.sh, use `./batch/batch-runner.sh` (not `node`).
- If the user asks to run a sequence (e.g. "run maintenance"), use the full post-batch sequence above.
- If a script outputs JSON (`analyze-patterns.mjs`, `followup-cadence.mjs`, `detect-reposts.mjs`), parse and summarise the key findings — don't dump raw JSON.
- If a script fails, show the last 20 lines of output and suggest a fix before retrying.
