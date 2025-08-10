import { LLMClient, LLMResponse } from '../llm/client.js';
import { NerfDatabase } from '../db/database.js';
import { TEST_PROMPTS, TEST_SUITE_VERSION } from './prompts.js';
import { calculateStatus, detectRegressions } from '../analysis/alerts.js';

export interface TestResult {
  promptId: string;
  promptVersion: string;
  replicateNumber: number;
  response: LLMResponse;
  score: number;
  success: boolean;
}

export interface SuiteResult {
  runId: string;
  timestamp: Date;
  correctnessScore: number;
  performanceMetrics: {
    ttft_median?: number;
    ttft_p95?: number;
    latency_median?: number;
    latency_p95?: number;
    tokens_per_sec_median?: number;
    tokens_per_sec_p95?: number;
    output_tokens_median?: number;
  };
  errorRate: number;
  refusalRate: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  flags: string[];
  testResults: TestResult[];
}

export class TestRunner {
  private llmClient: LLMClient;
  private database: NerfDatabase;
  private cacheBusting: boolean;
  private storeRawOutputs: boolean;

  constructor() {
    this.llmClient = new LLMClient();
    this.database = new NerfDatabase();
    this.cacheBusting = process.env.CACHE_BUSTING === 'true';
    this.storeRawOutputs = process.env.STORE_RAW_OUTPUTS === 'true';
  }

  async runSuite(): Promise<SuiteResult> {
    const timestamp = new Date();
    const testResults: TestResult[] = [];
    let totalErrors = 0;
    let totalRefusals = 0;
    let totalTests = 0;

    console.log(`Starting test suite run at ${timestamp.toISOString()}`);

    for (const prompt of TEST_PROMPTS) {
      console.log(`Running ${prompt.name} (${prompt.id})...`);
      
      for (let rep = 1; rep <= prompt.replicates; rep++) {
        totalTests++;
        const maxTokens = prompt.id === 'P4' 
          ? parseInt(process.env.MAX_TOKENS_P4 || '1200')
          : 500;

        try {
          const response = await this.llmClient.executePrompt(
            prompt.prompt,
            maxTokens,
            this.cacheBusting
          );

          let score = 0;
          let success = true;

          if (response.error) {
            totalErrors++;
            success = false;
          } else if (prompt.type === 'correctness' && prompt.scoring) {
            score = prompt.scoring(response.output);
            success = score === 1;
            if (!success && response.output.includes('I cannot') || response.output.includes('I can\'t')) {
              totalRefusals++;
            }
          }

          testResults.push({
            promptId: prompt.id,
            promptVersion: prompt.version,
            replicateNumber: rep,
            response,
            score,
            success,
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error running ${prompt.id} rep ${rep}:`, error);
          totalErrors++;
          
          testResults.push({
            promptId: prompt.id,
            promptVersion: prompt.version,
            replicateNumber: rep,
            response: {
              output: '',
              metrics: {
                totalLatency: 0,
                outputTokens: 0,
                tokensPerSec: 0,
                requestId: `error_${Date.now()}`,
              },
              outputHash: '',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            score: 0,
            success: false,
          });
        }
      }
    }

    const correctnessScore = this.calculateCorrectnessScore(testResults);
    const performanceMetrics = this.calculatePerformanceMetrics(testResults);
    const errorRate = totalErrors / totalTests;
    const refusalRate = totalRefusals / totalTests;

    const sevenDayStats = this.database.getSevenDayStats();
    const flags = detectRegressions(
      {
        correctnessScore,
        ...performanceMetrics,
        errorRate,
      },
      sevenDayStats
    );

    const status = calculateStatus(flags);

    const runId = this.database.insertRun({
      timestamp,
      model_id: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      region: process.env.REGION,
      temperature: parseFloat(process.env.TEMPERATURE || '0.1'),
      top_p: parseFloat(process.env.TOP_P || '0.3'),
      max_tokens: parseInt(process.env.MAX_TOKENS_P4 || '1200'),
      suite_version: TEST_SUITE_VERSION,
      correctness_score: correctnessScore,
      ...performanceMetrics,
      error_rate: errorRate,
      refusal_rate: refusalRate,
      status,
      flags,
    });

    for (const result of testResults) {
      this.database.insertTestCase({
        run_id: runId,
        prompt_id: result.promptId,
        prompt_version: result.promptVersion,
        replicate_number: result.replicateNumber,
        request_id: result.response.metrics.requestId,
        success: result.success,
        score: result.score,
        ttft: result.response.metrics.ttft,
        total_latency: result.response.metrics.totalLatency,
        output_tokens: result.response.metrics.outputTokens,
        tokens_per_sec: result.response.metrics.tokensPerSec,
        finish_reason: result.response.metrics.finishReason,
        output_hash: result.response.outputHash,
        raw_output: this.storeRawOutputs ? result.response.output : undefined,
        error_message: result.response.error,
      });
    }

    console.log(`Suite completed. Status: ${status}, Score: ${correctnessScore}`);

    return {
      runId,
      timestamp,
      correctnessScore,
      performanceMetrics,
      errorRate,
      refusalRate,
      status,
      flags,
      testResults,
    };
  }

  private calculateCorrectnessScore(results: TestResult[]): number {
    const correctnessResults = results.filter(r => 
      TEST_PROMPTS.find(p => p.id === r.promptId)?.type === 'correctness'
    );

    const promptScores = new Map<string, number[]>();
    
    for (const result of correctnessResults) {
      if (!promptScores.has(result.promptId)) {
        promptScores.set(result.promptId, []);
      }
      promptScores.get(result.promptId)!.push(result.score);
    }

    let totalScore = 0;
    for (const scores of promptScores.values()) {
      totalScore += Math.max(...scores);
    }

    return totalScore;
  }

  private calculatePerformanceMetrics(results: TestResult[]) {
    const p4Results = results.filter(r => r.promptId === 'P4');
    
    if (p4Results.length === 0) {
      console.log('No P4 results found');
      return {};
    }

    console.log(`Found ${p4Results.length} P4 results`);

    const ttfts = p4Results
      .map(r => r.response.metrics.ttft)
      .filter((t): t is number => t !== undefined)
      .sort((a, b) => a - b);
    
    console.log(`TTFT values: ${ttfts}`);
    
    const latencies = p4Results
      .map(r => r.response.metrics.totalLatency)
      .filter(t => t > 0)
      .sort((a, b) => a - b);
    
    const tokensPerSec = p4Results
      .map(r => r.response.metrics.tokensPerSec)
      .filter(t => t > 0)
      .sort((a, b) => a - b);
    
    const outputTokens = p4Results
      .map(r => r.response.metrics.outputTokens)
      .filter(t => t > 0)
      .sort((a, b) => a - b);

    const metrics = {
      ttft_median: this.median(ttfts),
      ttft_p95: this.percentile(ttfts, 95),
      latency_median: this.median(latencies),
      latency_p95: this.percentile(latencies, 95),
      tokens_per_sec_median: this.median(tokensPerSec),
      tokens_per_sec_p95: this.percentile(tokensPerSec, 95),
      output_tokens_median: this.median(outputTokens),
    };
    
    console.log('Performance metrics:', JSON.stringify(metrics));
    
    return metrics;
  }

  private median(arr: number[]): number | undefined {
    if (arr.length === 0) return undefined;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }

  private percentile(arr: number[], p: number): number | undefined {
    if (arr.length === 0) return undefined;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.min(index, arr.length - 1)];
  }

  close() {
    this.database.close();
  }
}