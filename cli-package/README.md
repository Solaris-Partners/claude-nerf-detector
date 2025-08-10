# Claude NerfDetector Test Suite

## How it Works

This test suite is designed to run **inside Claude Code** to evaluate Claude's performance on standardized tasks.

### Step 1: Run the Test in Claude Code

In Claude Code, run:
```bash
npx claude-nerf-test
```

This will:
1. Display 5 test prompts one by one
2. Claude will automatically respond to each prompt
3. After all prompts, you'll manually score Claude's responses

### Step 2: Score the Results

After Claude completes all 5 tests, evaluate the responses and submit scores:

```bash
npx claude-nerf-test score --p1 [0/1] --p2 [0/1] --p3 [0/1] --p4 [0/1] --p5 [0/1]
```

**Scoring Guide:**
- **P1 (Algorithm)**: Did Claude implement a heap-based solution with edge cases? (1=yes, 0=no)
- **P2 (Log Parsing)**: Did Claude parse the log into valid JSON with all fields? (1=yes, 0=no)
- **P3 (Bug Fixing)**: Did Claude fix both bugs (= vs == and missing n-1)? (1=yes, 0=no)
- **P4 (CLI Generation)**: Did Claude create a CLI with 5+ commands and error handling? (1=yes, 0=no)
- **P5 (Math)**: Did Claude calculate ~54.5 mph? (1=yes, 0=no)

Example:
```bash
npx claude-nerf-test score --p1 1 --p2 1 --p3 0 --p4 1 --p5 1
```

### Important Notes

⚠️ **This tool MUST be run inside Claude Code** - it won't work in a regular terminal as it relies on Claude processing the prompts.

The test prompts are intentionally challenging to detect capability changes over time. A typical score is 2-3 out of 5.

### Privacy

- Only performance metrics are collected (score, timing)
- No prompt/response content is stored
- Anonymous user IDs (hashed machine ID)
- Run with `--local` flag to skip submission

### Commands

```bash
# Run tests (default submits to community)
npx claude-nerf-test

# Run tests locally (no submission)
npx claude-nerf-test run --local

# Submit scores after test
npx claude-nerf-test score --p1 1 --p2 1 --p3 0 --p4 1 --p5 1

# View configuration
npx claude-nerf-test config --show

# Reset anonymous ID
npx claude-nerf-test config --reset
```

### Dashboard

View global statistics: https://claude-nerf-detector.vercel.app