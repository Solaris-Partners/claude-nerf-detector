# Community Testing Implementation Plan

## Project Transformation: Local → Community

### Current State
- Local SQLite database
- Anthropic API integration  
- React dashboard on localhost
- Tests require API key
- Individual monitoring only

### Target State
- Central Supabase database
- Claude Code self-testing (no API needed)
- Public dashboard on claude-nerf.com
- Community aggregated data
- Anonymous participation

## Implementation Phases

### Phase 1: MVP Core (Week 1)

#### 1.1 Backend Infrastructure
**Location**: New repo `claude-nerf-api`
- [ ] Initialize Vercel project
- [ ] Set up Supabase database
- [ ] Create database schema
- [ ] Implement core API endpoints
- [ ] Add rate limiting
- [ ] Deploy to Vercel

#### 1.2 Claude Code Test Runner
**Location**: New folder `/claude-test-runner`
- [ ] Create standalone test runner
- [ ] Implement self-measurement
- [ ] Add anonymous ID generation
- [ ] Create result submission logic
- [ ] Build CLI interface
- [ ] Package as npm module

#### 1.3 Basic Public Dashboard
**Location**: New repo `claude-nerf-dashboard`
- [ ] Create Next.js app
- [ ] Add global stats page
- [ ] Show recent tests feed
- [ ] Display basic charts
- [ ] Deploy to Vercel

### Phase 2: Enhanced Features (Week 2)

#### 2.1 Advanced Dashboard
- [ ] Real-time updates via WebSocket
- [ ] Geographic heat map
- [ ] Performance trends (7-day, 30-day)
- [ ] Anonymous leaderboard
- [ ] Individual result pages

#### 2.2 Improved Test Runner
- [ ] Add `--schedule` option for automated testing
- [ ] Implement offline mode with caching
- [ ] Add detailed comparison stats
- [ ] Create configuration file support
- [ ] Add `--local` flag for privacy

#### 2.3 Data & Analytics
- [ ] Pre-compute aggregate statistics
- [ ] Add data export endpoints
- [ ] Create researcher API
- [ ] Implement data retention policies

### Phase 3: Production Ready (Week 3-4)

#### 3.1 Scaling & Performance
- [ ] Add Cloudflare CDN
- [ ] Implement database indexing
- [ ] Add Redis caching layer
- [ ] Optimize API response times
- [ ] Load testing

#### 3.2 User Features
- [ ] Optional user accounts
- [ ] Performance history tracking
- [ ] Custom test suites
- [ ] Email alerts for degradations
- [ ] Badge/achievement system

#### 3.3 Documentation & Community
- [ ] Create documentation site
- [ ] Add contribution guide
- [ ] Set up Discord/community space
- [ ] Create researcher documentation
- [ ] Launch announcement

## Technical Architecture

### Database Schema (Supabase)

```sql
-- Main test results table
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id VARCHAR(64) NOT NULL,
  claude_version VARCHAR(32),
  model_info JSONB,
  test_suite_version VARCHAR(16),
  correctness_score INTEGER,
  total_tests INTEGER,
  ttft_median DECIMAL(10,3),
  ttft_p95 DECIMAL(10,3),
  tokens_per_sec_median DECIMAL(10,3),
  tokens_per_sec_p95 DECIMAL(10,3),
  output_tokens_median INTEGER,
  error_rate DECIMAL(5,4),
  region VARCHAR(64),
  country_code VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual test details
CREATE TABLE test_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES test_runs(id),
  test_id VARCHAR(16),
  test_name VARCHAR(128),
  passed BOOLEAN,
  response_time_ms INTEGER,
  tokens_generated INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-aggregated statistics for performance
CREATE TABLE aggregated_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type VARCHAR(16), -- 'hour', 'day', 'week', 'month'
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  total_runs INTEGER,
  unique_users INTEGER,
  avg_correctness_score DECIMAL(5,2),
  avg_ttft_median DECIMAL(10,3),
  avg_tokens_per_sec DECIMAL(10,3),
  percentile_data JSONB,
  region_breakdown JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_test_runs_user ON test_runs(anonymous_user_id);
CREATE INDEX idx_test_runs_created ON test_runs(created_at DESC);
CREATE INDEX idx_test_runs_region ON test_runs(region);
CREATE INDEX idx_test_details_run ON test_details(run_id);
CREATE INDEX idx_aggregated_period ON aggregated_stats(period_type, period_start);
```

### API Endpoints

```typescript
// Core submission endpoint
POST /api/v1/submit
Body: {
  anonymous_user_id: string,
  claude_version: string,
  test_results: TestResult[],
  metrics: PerformanceMetrics,
  client_timestamp: string
}
Response: {
  run_id: string,
  comparison: {
    percentile: number,
    vs_global_avg: number,
    vs_region_avg: number,
    trend: 'improving' | 'stable' | 'declining'
  },
  dashboard_url: string
}

// Get user history
GET /api/v1/history/:anonymous_user_id
Response: {
  runs: TestRun[],
  aggregate_stats: UserStats,
  trend_data: TrendData
}

// Public statistics
GET /api/v1/stats/global
Response: {
  total_runs_24h: number,
  unique_users_24h: number,
  avg_score: number,
  avg_performance: PerformanceStats,
  trend_7d: TrendData,
  top_regions: RegionStats[]
}

// Real-time feed (WebSocket)
WS /api/v1/live
Messages: {
  type: 'new_test' | 'stats_update',
  data: TestResult | GlobalStats
}
```

### NPM Package Structure

```
claude-nerf-test/
├── package.json
├── README.md
├── LICENSE
├── bin/
│   └── claude-nerf-test.js    # CLI entry point
├── src/
│   ├── index.ts               # Main test runner
│   ├── prompts.ts             # Test prompts
│   ├── metrics.ts             # Performance measurement
│   ├── submission.ts          # API submission
│   ├── display.ts             # Terminal output
│   └── config.ts              # Configuration
└── dist/                      # Compiled output
```

## Privacy & Security

### Data Minimization
- Hash machine ID for anonymity
- No storage of prompt/response content
- IP addresses used only for region detection, not stored
- No personal information collected

### Security Measures
- Rate limiting: 10 tests/hour per user
- Input validation on all endpoints
- CORS properly configured
- API versioning for compatibility
- Result verification to prevent fake data

### User Control
- `--local` flag for local-only testing
- `--no-submit` to see results without sending
- Data deletion endpoint available
- Opt-out of public leaderboard

## Cost Analysis

### Initial Launch (0-1K users)
- Vercel: $0 (free tier)
- Supabase: $0 (free tier)
- Domain: $12/year
- **Total: $1/month**

### Growth Phase (1K-10K users)
- Vercel: $20/month (Pro)
- Supabase: $25/month (Pro)
- Cloudflare: $0 (free tier)
- **Total: $45/month**

### Scale Phase (10K+ users)
- Consider migration to:
  - Hetzner VPS: $20/month
  - Managed PostgreSQL: $15/month
  - Cloudflare Pro: $20/month
- **Total: $55/month**

## Success Metrics

### Technical Metrics
- API response time < 200ms p95
- Dashboard load time < 2s
- Test submission success rate > 99%
- Uptime > 99.9%

### User Metrics
- Daily active testers > 100
- Test submissions per day > 1000
- Geographic diversity > 20 countries
- Return user rate > 30%

### Community Metrics
- GitHub stars > 500
- NPM weekly downloads > 1000
- Community contributors > 10
- Research citations

## Launch Strategy

### Soft Launch (Week 1)
- Deploy MVP infrastructure
- Test with small group
- Fix critical issues
- Gather feedback

### Beta Launch (Week 2)
- Announce on Twitter/Reddit
- Share in Claude communities
- Create launch blog post
- Monitor and iterate

### Public Launch (Week 3-4)
- Press release
- Product Hunt submission
- Hacker News post
- Conference talks

## Maintenance Plan

### Ongoing Tasks
- Weekly aggregation jobs
- Monthly data cleanup
- Security updates
- Performance monitoring
- Community support

### Future Features
- Multi-model support (Claude versions)
- Custom test suites
- Team accounts
- API for researchers
- Mobile app

---

## Ready to Build!

With this plan documented, we're ready to:
1. Clear context
2. Start fresh with Phase 1 implementation
3. Build the MVP infrastructure first
4. Iterate based on user feedback

The transformation from local tool to community platform begins!