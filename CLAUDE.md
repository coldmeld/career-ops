# Career-Ops — Claude Code

<!-- Claude Code-specific additions. Shared instructions live in @AGENTS.md below. -->

## Session Start (Claude Code)

On the first message of each session, run the cold-start check — one deterministic source of truth (this doc and `doctor.mjs` share the same prerequisite list, so they can never drift):

```bash
node doctor.mjs --json
```

Output: `{"onboardingNeeded": <bool>, "missing": [...], "warnings": [...]}`, where `missing` lists whichever of `cv.md`, `config/profile.yml`, `modes/_profile.md`, `portals.yml` are absent. `warnings` is reserved for non-blocking setup signals.

If `modes/_profile.md` is missing, copy from `modes/_profile.template.md` silently.

If `onboardingNeeded` is still true (any of `cv.md` / `config/profile.yml` / `portals.yml` is missing), enter onboarding mode per the steps in @AGENTS.md.

Also run the update checker silently:

```bash
node update-system.mjs check
```

Parse the JSON output per the Update Check section in @AGENTS.md.

## OpenCode & Gemini CLI Commands

Both [OpenCode](https://opencode.ai) and [Gemini CLI](https://github.com/google-gemini/gemini-cli) natively support the open agent skill standard (`agentskills.io`).

Instead of registering individual `.toml` files for every slash command, all subcommands are routed through the single unified skill defined in `.agents/skills/career-ops/SKILL.md`.

Users can invoke the command center or any of its modes directly within their CLI:

* `/career-ops` (Shows the Command Center menu)
* `/career-ops {JD text or URL}` (Runs the auto-evaluation pipeline)
* `/career-ops [subcommand]` (Runs a specific subcommand)

#### Subcommands:
* `pipeline` — Process pending URLs from inbox
* `scan` — Scan job portals for new offers
* `tracker` — Show application status overview
* `pdf` — Generate ATS-optimized CV PDF
* `latex` — Export CV as LaTeX/Overleaf .tex
* `cover` — Generate cover letter
* `interview-prep` — Generate interview preparation guide
* `interview` — Onboarding/on-demand interview
* `contacto` — Generate LinkedIn outreach message
* `deep` — Execute deep company research
* `training` — Evaluate course/cert against North Star
* `project` — Evaluate portfolio project idea
* `batch` — Run parallel batch evaluations
* `patterns` — Analyze rejection patterns
* `followup` — Update and calculate follow-ups
* `update` — Update system files

All `modes/*` files and prompt contexts (e.g., `GEMINI.md`) are shared across Claude Code, OpenCode, and Gemini CLI.

@AGENTS.md
<!-- Add anything Claude Code specific that other agents don't need -->
