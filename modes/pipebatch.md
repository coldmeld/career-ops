# Mode: pipeBatch — Pipeline → Batch Runner

Convert pending pipeline URLs to batch input, then run the batch with 4 parallel workers.

## Steps

1. Run `node pipeline-to-batch.mjs` — extracts all `- [ ]` entries from `data/pipeline.md` into `batch/batch-input.tsv`, skipping URLs already present.
2. If no new URLs were added, tell the user and stop.
3. Run `./batch/batch-runner.Unix.sh --model claude-haiku-4-5-20251001 --parallel 4 --skip-pdf` — processes all pending offers.
4. When the batch completes, show the summary table.

