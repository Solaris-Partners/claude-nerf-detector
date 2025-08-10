import Database from 'better-sqlite3';
import { Run, TestCase } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class NerfDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const finalPath = dbPath || process.env.DATABASE_PATH || path.join(__dirname, '../../llm_bench.db');
    this.db = new Database(finalPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        model_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        region TEXT,
        temperature REAL NOT NULL,
        top_p REAL NOT NULL,
        max_tokens INTEGER NOT NULL,
        suite_version TEXT NOT NULL,
        correctness_score REAL NOT NULL,
        ttft_median REAL,
        ttft_p95 REAL,
        latency_median REAL,
        latency_p95 REAL,
        tokens_per_sec_median REAL,
        tokens_per_sec_p95 REAL,
        output_tokens_median REAL,
        error_rate REAL NOT NULL,
        refusal_rate REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('GREEN', 'YELLOW', 'RED')),
        flags TEXT NOT NULL DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        prompt_id TEXT NOT NULL,
        prompt_version TEXT NOT NULL,
        replicate_number INTEGER NOT NULL,
        request_id TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        score REAL NOT NULL,
        ttft REAL,
        total_latency REAL,
        output_tokens INTEGER,
        tokens_per_sec REAL,
        finish_reason TEXT,
        output_hash TEXT,
        raw_output TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES runs(id)
      );

      CREATE TABLE IF NOT EXISTS rollups (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        period TEXT NOT NULL CHECK(period IN ('daily', 'weekly')),
        date DATE NOT NULL,
        avg_correctness REAL NOT NULL,
        avg_ttft_median REAL NOT NULL,
        avg_ttft_p95 REAL NOT NULL,
        avg_latency_median REAL NOT NULL,
        avg_latency_p95 REAL NOT NULL,
        avg_tokens_per_sec_median REAL NOT NULL,
        avg_tokens_per_sec_p95 REAL NOT NULL,
        avg_output_tokens REAL NOT NULL,
        avg_error_rate REAL NOT NULL,
        total_runs INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES runs(id)
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_cases_run_id ON test_cases(run_id);
      CREATE INDEX IF NOT EXISTS idx_rollups_date ON rollups(date);
    `);
  }

  insertRun(run: Omit<Run, 'id' | 'created_at'>): string {
    const id = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO runs (
        id, timestamp, model_id, provider, region, temperature, top_p, max_tokens,
        suite_version, correctness_score, ttft_median, ttft_p95, latency_median,
        latency_p95, tokens_per_sec_median, tokens_per_sec_p95, output_tokens_median,
        error_rate, refusal_rate, status, flags
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    stmt.run(
      id,
      run.timestamp.toISOString(),
      run.model_id,
      run.provider,
      run.region,
      run.temperature,
      run.top_p,
      run.max_tokens,
      run.suite_version,
      run.correctness_score,
      run.ttft_median,
      run.ttft_p95,
      run.latency_median,
      run.latency_p95,
      run.tokens_per_sec_median,
      run.tokens_per_sec_p95,
      run.output_tokens_median,
      run.error_rate,
      run.refusal_rate,
      run.status,
      JSON.stringify(run.flags)
    );
    
    return id;
  }

  insertTestCase(testCase: Omit<TestCase, 'id' | 'created_at'>): string {
    const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO test_cases (
        id, run_id, prompt_id, prompt_version, replicate_number, request_id,
        success, score, ttft, total_latency, output_tokens, tokens_per_sec,
        finish_reason, output_hash, raw_output, error_message
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    stmt.run(
      id,
      testCase.run_id,
      testCase.prompt_id,
      testCase.prompt_version,
      testCase.replicate_number,
      testCase.request_id,
      testCase.success ? 1 : 0,
      testCase.score,
      testCase.ttft,
      testCase.total_latency,
      testCase.output_tokens,
      testCase.tokens_per_sec,
      testCase.finish_reason,
      testCase.output_hash,
      testCase.raw_output,
      testCase.error_message
    );
    
    return id;
  }

  getRecentRuns(limit: number = 100): Run[] {
    const stmt = this.db.prepare(`
      SELECT * FROM runs
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    
    return stmt.all(limit).map(this.mapRun);
  }

  getRunById(id: string): Run | null {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRun(row) : null;
  }

  getTestCasesByRunId(runId: string): TestCase[] {
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE run_id = ?');
    return stmt.all(runId).map(this.mapTestCase);
  }

  getSevenDayStats(): {
    avgCorrectness: number;
    avgTtftMedian: number;
    avgTtftP95: number;
    avgTokensPerSecMedian: number;
    avgTokensPerSecP95: number;
    avgOutputTokens: number;
    avgErrorRate: number;
  } {
    const stmt = this.db.prepare(`
      SELECT 
        AVG(correctness_score) as avgCorrectness,
        AVG(ttft_median) as avgTtftMedian,
        AVG(ttft_p95) as avgTtftP95,
        AVG(tokens_per_sec_median) as avgTokensPerSecMedian,
        AVG(tokens_per_sec_p95) as avgTokensPerSecP95,
        AVG(output_tokens_median) as avgOutputTokens,
        AVG(error_rate) as avgErrorRate
      FROM runs
      WHERE timestamp >= datetime('now', '-7 days')
    `);
    
    const row: any = stmt.get();
    return {
      avgCorrectness: row.avgCorrectness || 0,
      avgTtftMedian: row.avgTtftMedian || 0,
      avgTtftP95: row.avgTtftP95 || 0,
      avgTokensPerSecMedian: row.avgTokensPerSecMedian || 0,
      avgTokensPerSecP95: row.avgTokensPerSecP95 || 0,
      avgOutputTokens: row.avgOutputTokens || 0,
      avgErrorRate: row.avgErrorRate || 0,
    };
  }

  getConfig(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
    const row: any = stmt.get(key);
    return row ? row.value : null;
  }

  setConfig(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value);
  }

  private mapRun(row: any): Run {
    return {
      ...row,
      timestamp: new Date(row.timestamp),
      created_at: new Date(row.created_at),
      flags: JSON.parse(row.flags || '[]'),
      success: row.success === 1,
    };
  }

  private mapTestCase(row: any): TestCase {
    return {
      ...row,
      created_at: new Date(row.created_at),
      success: row.success === 1,
    };
  }

  close() {
    this.db.close();
  }
}