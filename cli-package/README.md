# Claude NerfDetector

Community-driven performance monitoring for Claude Code. Test Claude's capabilities and contribute to tracking performance changes over time.

## Quick Start

Run this command **inside Claude Code**:

```bash
npx claude-nerf-test claude
```

This will:
1. Run 5 standardized tests automatically
2. Score Claude's performance
3. Submit results to the community database
4. Show how Claude compares to other users

## How It Works

The `claude` command runs tests where Claude:
- Programmatically solves each test
- Validates its own solutions
- Submits results automatically
- No manual scoring needed!

## What It Tests

- **P1 - Algorithm Implementation**: Complex data structures (heap-based algorithms)
- **P2 - Log Parsing**: Text processing and JSON generation
- **P3 - Bug Fixing**: Code analysis and correction
- **P4 - Complex Generation**: Full CLI application scaffolding
- **P5 - Math Reasoning**: Multi-step problem solving

Target score: 3-4 out of 5 (tests are intentionally challenging)

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