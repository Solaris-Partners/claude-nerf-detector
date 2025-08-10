import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface TestRun {
  id?: string;
  anonymous_user_id: string;
  claude_version: string;
  test_score: number;
  total_tests: number;
  ttft_ms?: number;
  tokens_per_second?: number;
  avg_output_length?: number;
  error_rate?: number;
  region?: string;
  timestamp?: string;
}

export interface TestDetail {
  id?: string;
  run_id: string;
  test_id: string;
  test_name: string;
  passed: boolean;
  response_time_ms?: number;
  output_quality?: number;
  error_message?: string;
}

export interface AggregatedStats {
  period: 'hour' | 'day' | 'week' | 'month';
  period_start: string;
  period_end: string;
  avg_score: number;
  avg_ttft_ms: number;
  avg_tokens_per_second: number;
  avg_output_length: number;
  avg_error_rate: number;
  total_runs: number;
  unique_users: number;
}

export interface UserComparison {
  userScore: number;
  percentile: number;
  regionAvg: number;
  globalAvg: number;
  totalUsers: number;
}