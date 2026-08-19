# Mode: email-scan — Pull Unread Job Alert Emails → Pipeline

Fetch unread job alert emails from Gmail and extract job listings into `data/pipeline.md`.

## Steps

### 1 — Search for all unread threads

Use `mcp__claude_ai_Gmail__search_threads` with query:
```
is:unread
```

Fetch up to 50 threads. This covers job alert emails regardless of sender (including forwarded alerts).

### 2 — Fetch each thread

For each thread returned, call `mcp__claude_ai_Gmail__get_thread` with the thread ID.

Save the raw JSON response to `batch/email-threads/{threadId}.json`.

Skip threads whose file already exists in `batch/email-threads/` (already processed this session).

### 3 — Extract listings

Once all threads are saved, run:
```bash
node email-extract.mjs batch/email-threads/ --append
```

This processes every `.json` file in the directory, deduplicates against existing `data/pipeline.md` entries, applies profile triage (exclude_roles, over-leveled titles), and appends new entries.

**Do not run a liveness check** on email-sourced URLs — assume live and add directly.

### 4 — Mark threads as read

For each processed thread, call `mcp__claude_ai_Gmail__unlabel_thread` with `labelIds: ["UNREAD"]`.

This will likely fail with an auth scope error (`gmail.modify` not granted). Attempt it anyway and report the error once if it fails — do not retry per-thread.

### 5 — Report

Show a summary:
- Threads fetched
- Listings found / skipped / added
- Entries now pending in pipeline.md
