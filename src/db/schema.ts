export interface Run {
  id: string;
  timestamp: Date;
  model_id: string;
  provider: string;
  region?: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  suite_version: string;
  correctness_score: number;
  ttft_median?: number;
  ttft_p95?: number;
  latency_median?: number;
  latency_p95?: number;
  tokens_per_sec_median?: number;
  tokens_per_sec_p95?: number;
  output_tokens_median?: number;
  error_rate: number;
  refusal_rate: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  flags: string[];
  created_at: Date;
}

export interface TestCase {
  id: string;
  run_id: string;
  prompt_id: string;
  prompt_version: string;
  replicate_number: number;
  request_id: string;
  success: boolean;
  score: number;
  ttft?: number;
  total_latency?: number;
  output_tokens?: number;
  tokens_per_sec?: number;
  finish_reason?: string;
  output_hash?: string;
  raw_output?: string;
  error_message?: string;
  created_at: Date;
}

export interface Rollup {
  id: string;
  run_id: string;
  period: 'daily' | 'weekly';
  date: Date;
  avg_correctness: number;
  avg_ttft_median: number;
  avg_ttft_p95: number;
  avg_latency_median: number;
  avg_latency_p95: number;
  avg_tokens_per_sec_median: number;
  avg_tokens_per_sec_p95: number;
  avg_output_tokens: number;
  avg_error_rate: number;
  total_runs: number;
  created_at: Date;
}

export interface Config {
  key: string;
  value: string;
  updated_at: Date;
}