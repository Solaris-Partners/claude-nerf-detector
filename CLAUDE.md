# NerfDetector - Claude Code Community Performance Monitor

## Project Overview

NerfDetector is a community-driven performance monitoring system for Claude Code that detects capability changes ("nerfs") over time. Users run performance tests directly in Claude Code, and results are aggregated to track global performance trends.

## Architecture

### System Components

```
┌─────────────────┐
│  Claude Code    │ (Multiple users running tests)
│  Test Runner    │──┐
└─────────────────┘  │
                     │
                     ▼
            ┌──────────────┐     ┌─────────────┐
            │ Central API  │────►│  Supabase   │
            │  (Vercel)    │     │ (PostgreSQL)│
            └──────────────┘     └─────────────┘
                     │
                     ▼
            ┌──────────────┐
            │Public Dashboard│
            │  (Next.js)    │
            └──────────────┘
```

### Data Flow

1. **Test Execution**: User runs `npx claude-nerf-test` in Claude Code
2. **Local Measurement**: Claude Code executes test prompts and measures its own performance
3. **Result Submission**: Metrics sent to central API with anonymous user ID
4. **Comparison Stats**: API returns user's performance vs community averages
5. **Local Display**: Results shown in Claude Code terminal
6. **Public Dashboard**: Real-time updates on public website

## Test Suite Design

### Current Tests (Challenging by Design)

The tests are intentionally difficult to prevent 100% scores, allowing detection of both improvements and degradations:

1. **P1 - Algorithm Implementation**: Write kth largest element finder using heap
2. **P2 - Log Parsing**: Parse log line to specific JSON structure  
3. **P3 - Bug Fixing**: Fix multiple bugs in factorial function
4. **P4 - Complex Generation**: Generate full CLI app with 6 subcommands
5. **P5 - Math Reasoning**: Solve multi-step word problem

Target score: 2-3 out of 5 (40-60%)

### Metrics Collected

- **Correctness Score**: How many tests passed
- **TTFT (Time To First Token)**: Response latency
- **Tokens Per Second**: Generation speed
- **Output Length**: Detecting if model outputs less
- **Error Rate**: Reliability metric

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

#### Backend (Vercel + Supabase)
- [ ] Set up Vercel project with Express/Next.js API routes
- [ ] Configure Supabase with schema:
  ```sql
  test_runs (id, anonymous_user_id, claude_version, test_score, metrics, region, timestamp)
  test_details (run_id, test_id, passed, response_time, output_quality)
  aggregated_stats (period, avg_score, avg_response_time, total_runs)
  ```
- [ ] Create API endpoints:
  - `POST /api/submit` - Submit test results
  - `GET /api/compare` - Get comparison stats
  - `GET /api/stats/global` - Global statistics

#### Claude Code Test Runner
- [ ] Create test runner that executes prompts directly in Claude Code
- [ ] Implement performance measurement (TTFT, tokens/sec)
- [ ] Add result submission to central API
- [ ] Display results in terminal with community comparison

#### NPM Package
- [ ] Create distributable package `claude-nerf-test`
- [ ] Add CLI interface for easy execution
- [ ] Include privacy-preserving anonymous ID generation

### Phase 2: Public Dashboard (Week 2)

#### Next.js Dashboard (Vercel)
- [ ] Global performance statistics
- [ ] Real-time test feed
- [ ] Performance trends (7-day, 30-day)
- [ ] Geographic heat map
- [ ] Anonymous leaderboard
- [ ] Individual result pages (shareable links)

### Phase 3: Enhancements (Week 3-4)

- [ ] WebSocket for real-time dashboard updates
- [ ] Historical data export
- [ ] Custom test suite support
- [ ] Performance alerts/notifications
- [ ] API for researchers

## Hosting & Infrastructure

### Selected Stack
- **API Server**: Vercel (serverless functions)
- **Database**: Supabase (PostgreSQL with real-time)
- **Dashboard**: Vercel (Next.js static/SSR)
- **CDN**: Cloudflare (optional for scale)

### Cost Projections
- **MVP**: Free (Vercel + Supabase free tiers)
- **1K users/day**: ~$1/month (still free tier)
- **10K users/day**: ~$45/month
- **100K+ users/day**: ~$50-100/month (migrate to VPS)

## Privacy & Ethics

### Data Collection Policy
- ✅ Anonymous user IDs (hashed machine ID)
- ✅ Performance metrics only
- ✅ Claude Code version
- ✅ Rough geographic region (country/state)
- ❌ No prompt/response content
- ❌ No personal information
- ❌ No IP address storage
- ❌ No tracking cookies

### User Control
- Run tests locally without submission (`--local` flag)
- Request data deletion
- Opt out of leaderboard
- Transparent about all data collected

## User Experience

### In Claude Code
```bash
$ npx claude-nerf-test

🧪 Running Claude Performance Tests...
  ✓ Algorithm Implementation (P1): Passed
  ✗ Log Parsing (P2): Failed
  ✓ Bug Fixing (P3): Passed
  ✗ Complex Generation (P4): Failed
  ✓ Math Reasoning (P5): Passed

📊 Your Results:
  Score: 3/5 (60%)
  Response Time: 1.8s
  Generation Speed: 45 tokens/sec

🌍 Community Comparison:
  • Better than 68% of users
  • Your region avg: 2.1s
  • Global avg: 2.4s

📈 View details: https://claude-nerf.com/run/abc123
```

### Public Dashboard (claude-nerf.com)
- Real-time global statistics
- Performance trend charts
- Geographic distribution map
- Anonymous leaderboard
- Individual test result pages

## Development Commands

```bash
# Local development
npm run dev              # Run local dashboard
npm run test:local       # Run tests locally only
npm run test:submit      # Run tests and submit to community

# Deployment
npm run deploy:api       # Deploy API to Vercel
npm run deploy:dashboard # Deploy dashboard to Vercel

# Testing the test runner
npm run simulate         # Simulate Claude Code responses
```

## Next Steps

1. **Clear context** after documenting this plan
2. **Start fresh** with Phase 1 implementation
3. **Focus on** getting MVP working with basic submission and display
4. **Then iterate** on dashboard and enhanced features

## Key Design Decisions

1. **No API keys required** - Tests run directly in Claude Code
2. **Privacy first** - Anonymous by default with opt-in features
3. **Community driven** - Aggregate data benefits everyone
4. **Open source** - Transparent about how it works
5. **Progressive enhancement** - Start simple, add features based on usage

## Technical Considerations

- **Rate limiting** to prevent abuse (10 tests/hour per user)
- **Data validation** to ensure legitimate results
- **Version handling** for different Claude Code versions
- **Offline mode** with result caching
- **Graceful degradation** if API unavailable

---

This document serves as the blueprint for transforming NerfDetector from a local monitoring tool to a community-driven performance tracking system for Claude Code.