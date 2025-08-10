export interface CurrentMetrics {
  correctnessScore: number;
  ttftMedian?: number;
  ttftP95?: number;
  latencyMedian?: number;
  latencyP95?: number;
  tokensPerSecMedian?: number;
  tokensPerSecP95?: number;
  outputTokensMedian?: number;
  errorRate: number;
}

export interface SevenDayStats {
  avgCorrectness: number;
  avgTtftMedian: number;
  avgTtftP95: number;
  avgTokensPerSecMedian: number;
  avgTokensPerSecP95: number;
  avgOutputTokens: number;
  avgErrorRate: number;
}

export function detectRegressions(
  current: CurrentMetrics,
  sevenDay: SevenDayStats
): string[] {
  const flags: string[] = [];

  // Quality regression: correctness down ≥2 pts vs 7-day mean
  if (sevenDay.avgCorrectness > 0 && 
      current.correctnessScore <= sevenDay.avgCorrectness - 2) {
    flags.push('quality_regression');
  }

  // Perf regression: P4 median TPS halves
  if (current.tokensPerSecMedian !== undefined && 
      sevenDay.avgTokensPerSecMedian > 0 &&
      current.tokensPerSecMedian < sevenDay.avgTokensPerSecMedian / 2) {
    flags.push('performance_regression_tps');
  }

  // Perf regression: p95 latency doubles
  if (current.latencyP95 !== undefined &&
      sevenDay.avgTtftP95 > 0 &&
      current.latencyP95 > sevenDay.avgTtftP95 * 2) {
    flags.push('performance_regression_latency');
  }

  // Output cap hint: P4 median output tokens drops ≥25%
  if (current.outputTokensMedian !== undefined &&
      sevenDay.avgOutputTokens > 0 &&
      current.outputTokensMedian < sevenDay.avgOutputTokens * 0.75) {
    flags.push('output_cap_detected');
  }

  // Error rate increase
  if (current.errorRate > sevenDay.avgErrorRate + 0.1) {
    flags.push('error_rate_increase');
  }

  return flags;
}

export function calculateStatus(flags: string[]): 'GREEN' | 'YELLOW' | 'RED' {
  if (flags.length >= 2) {
    return 'RED';
  } else if (flags.length === 1) {
    return 'YELLOW';
  } else {
    return 'GREEN';
  }
}

export function getAlertMessage(flags: string[]): string {
  const messages: Record<string, string> = {
    quality_regression: 'Quality regression detected: correctness score dropped significantly',
    performance_regression_tps: 'Performance regression: tokens per second halved',
    performance_regression_latency: 'Performance regression: p95 latency doubled',
    output_cap_detected: 'Possible output capping: median output tokens dropped 25%+',
    error_rate_increase: 'Error rate increased significantly',
  };

  return flags.map(flag => messages[flag] || flag).join('; ');
}