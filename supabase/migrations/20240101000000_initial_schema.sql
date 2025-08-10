-- Supabase schema for NerfDetector Community

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main test runs table
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anonymous_user_id TEXT NOT NULL,
    claude_version TEXT NOT NULL,
    test_score INTEGER NOT NULL,
    total_tests INTEGER NOT NULL,
    ttft_ms INTEGER,
    tokens_per_second DECIMAL(10, 2),
    avg_output_length INTEGER,
    error_rate DECIMAL(5, 4),
    region TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by user and time
CREATE INDEX idx_test_runs_user ON test_runs(anonymous_user_id);
CREATE INDEX idx_test_runs_timestamp ON test_runs(timestamp DESC);
CREATE INDEX idx_test_runs_region ON test_runs(region);

-- Detailed test results
CREATE TABLE test_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    output_quality DECIMAL(5, 2),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying test details
CREATE INDEX idx_test_details_run ON test_details(run_id);
CREATE INDEX idx_test_details_test ON test_details(test_id);

-- Aggregated statistics table
CREATE TABLE aggregated_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period TEXT NOT NULL, -- 'hour', 'day', 'week', 'month'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    avg_score DECIMAL(5, 2),
    avg_ttft_ms DECIMAL(10, 2),
    avg_tokens_per_second DECIMAL(10, 2),
    avg_output_length DECIMAL(10, 2),
    avg_error_rate DECIMAL(5, 4),
    total_runs INTEGER,
    unique_users INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying aggregated stats
CREATE INDEX idx_aggregated_stats_period ON aggregated_stats(period, period_start DESC);

-- User preferences (optional features)
CREATE TABLE user_preferences (
    anonymous_user_id TEXT PRIMARY KEY,
    show_on_leaderboard BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create views for common queries
CREATE OR REPLACE VIEW recent_tests AS
SELECT 
    tr.*,
    COUNT(td.id) as test_count,
    SUM(CASE WHEN td.passed THEN 1 ELSE 0 END) as tests_passed
FROM test_runs tr
LEFT JOIN test_details td ON tr.id = td.run_id
WHERE tr.timestamp > NOW() - INTERVAL '24 hours'
GROUP BY tr.id
ORDER BY tr.timestamp DESC;

-- Create view for global statistics
CREATE OR REPLACE VIEW global_stats AS
SELECT 
    COUNT(DISTINCT anonymous_user_id) as unique_users,
    COUNT(*) as total_runs,
    AVG(test_score::DECIMAL / total_tests) as avg_score_percentage,
    AVG(ttft_ms) as avg_ttft,
    AVG(tokens_per_second) as avg_tps,
    AVG(error_rate) as avg_error_rate
FROM test_runs
WHERE timestamp > NOW() - INTERVAL '7 days';

-- Row Level Security
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for test results
CREATE POLICY "Public read access" ON test_runs
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON test_details
    FOR SELECT USING (true);

-- Users can only modify their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR ALL USING (anonymous_user_id = current_setting('app.current_user', true));