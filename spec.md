# Minimal Twice-Daily LLM Nerf Check — Spec

## Goal
Detect meaningful changes in an LLM provider’s **quality** and **performance** with a small, fixed test suite run **twice daily**, and visualize results in a **web dashboard**.  
Design for **local use** now, with an option to switch to **remote storage** later.

---

## Scope
- **In-scope:** fixed prompts, deterministic scoring, latency/tokens telemetry, time-series storage, web dashboard, alert rules, run schedule, and basic admin panel.
- **Out-of-scope:** multi-provider comparisons, agent/tool use, large eval benchmarks.

---

## Test Set (fixed prompts)
Lock these on day 1. Do not change without versioning (`suite_version`).

**Temperature:** 0–0.2  
**top_p:** fixed (e.g., 0.3)  
**Max tokens (P4):** ~1200  
**No tools, no external calls.**

### P1 — Deterministic Coding
Prompt: _"Write a function `fib(n: number): number` …"_  
Scoring: hidden tests → pass=1 / fail=0.

### P2 — Parsing/Transform
Prompt: _"Given this log line … output JSON …"_  
Scoring: strict JSON parse + type checks → pass=1 / fail=0.

### P3 — Bug-Fix
Prompt: _"Given this broken function spec … output only corrected implementation …"_  
Scoring: hidden edge-case tests → pass=1 / fail=0.

### P4 — Long-Form Generation (Performance)
Prompt: _"Generate a CLI app with six subcommands …"_  
Metrics only (no correctness): TTFT, total latency, output tokens, tokens/sec, finish_reason.

### Optional P5 — Reasoning
Prompt: _"Minimal number of coins to make 97 with [1,3,4,10] …"_  
Scoring: correct integer=1 / else 0.

**Suite Size:** 4–5 prompts  
**Replicates:**  
- P1–P3(/P5): 2 reps each (best-of-2 for scoring)  
- P4: 3 reps (median + p95 for perf metrics)

---

## Metrics per Run
- **Correctness score:** 0–3 or 0–4 (sum of best-of-2 correctness prompts)  
- **TTFT (s):** median + p95 (P4)  
- **Total latency (s):** median + p95 (P4)  
- **Tokens/sec:** median + p95 (P4)  
- **Output tokens:** median (P4)  
- **Error/refusal rate**  
- **Model metadata:** model ID, provider, region, temp, top_p, max_tokens, timestamp, run_id, request IDs

---

## Storage

### Local (default)
SQLite file (`llm_bench.db`):
- `runs` — per-run metadata  
- `cases` — per-prompt replicate results  
- `rollups` — aggregated per-run stats

### Remote Option (future)
Postgres DB with identical schema for shared or cloud-hosted dashboard.

---

## Scheduler
- **Cadence:** 09:00 and 21:00 America/Chicago
- **Run order:** P1–P3, then P4, optionally P5
- **Timeouts:** 60s/request
- **Retries:** none
- **Prompt caching policy:** fixed prompts OR cache-busting nonce — choose and keep consistent

---

## Scoring & Alerts
- **Quality regression:** correctness down ≥2 pts vs 7-day mean  
- **Perf regression:** P4 median TPS halves OR p95 latency doubles vs 7-day mean  
- **Output cap hint:** P4 median output tokens drops ≥25% vs 7-day mean  
- **Incident:** 2+ flags = RED; 1 flag = YELLOW

---

## Web UI

### Top Bar
- Model/provider  
- Suite version  
- Last run timestamp  
- Status pill (GREEN / YELLOW / RED)

### Cards (Today vs 7-Day Mean)
- Correctness (big number)  
- TTFT median & p95  
- Tokens/sec median & p95  
- Error/refusal rate

### Charts (14 days)
- Correctness score per run  
- TTFT median & p95  
- Tokens/sec median & p95  
- Output tokens (P4 median)

### Runs Table
- Timestamp, correctness, TTFT, TPS, tokens, error rate, flags, link to run detail

**Run Detail Modal**
- Per-prompt results & metrics  
- Output hash (or full output if enabled)  
- Request metadata

### Admin Panel
- Toggle cache-busting  
- Change schedule times  
- Store raw outputs toggle  
- Alert threshold settings  
- Suite version bump

---

## Privacy
- Default: store **hash only** of output  
- Configurable: store raw output (off by default)  
- Strip API keys from logs

---

## Non-Functional
- **Runtime:** <5 min per suite  
- **Cost:** <$0.50/day  
- **Availability:** partial runs logged  
- **Determinism:** fixed temp, top_p, max_tokens

---

## Runbook
1. Finalize prompts & scoring  
2. Configure provider + API creds  
3. Dry run, verify metrics & UI  
4. Enable scheduler  
5. Weekly review charts & export data if RED  
6. Version prompts when changed

---

## Acceptance
- Dashboard loads <2s with 100 runs  
- Status pill changes correctly on synthetic regressions  
- All metrics & charts accurate

---

## Future Extensions
- Alerts via email/Slack  
- Multi-model tracking  
- Region A/B testing  
- Cost tracking from token usage
