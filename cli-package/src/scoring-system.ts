/**
 * Continuous scoring system for NerfDetector
 * Each test returns a score from 0-100 based on multiple quality factors
 */

export interface QualityMetrics {
  correctness: number;      // 0-40 points: Does it work?
  completeness: number;     // 0-20 points: Are all requirements met?
  performance: number;      // 0-15 points: Is it efficient?
  style: number;           // 0-15 points: Is it well-written?
  edgeCases: number;       // 0-10 points: Are edge cases handled?
}

export interface TestScore {
  testId: string;
  score: number;           // 0-100
  metrics: QualityMetrics;
  details: string[];       // Specific feedback
}

/**
 * Scoring rubric for algorithm implementation
 */
export function scoreAlgorithm(solution: string): TestScore {
  const metrics: QualityMetrics = {
    correctness: 0,
    completeness: 0,
    performance: 0,
    style: 0,
    edgeCases: 0
  };
  const details: string[] = [];

  // Correctness (0-40)
  if (/class\s+(Min)?Heap/i.test(solution)) {
    metrics.correctness += 15;
    details.push('+15: Heap class implemented');
  }
  if (/bubbleUp|heapifyUp/i.test(solution) && /bubbleDown|heapifyDown/i.test(solution)) {
    metrics.correctness += 15;
    details.push('+15: Heap operations present');
  }
  if (/\(idx\s*-\s*1\)\s*\/\s*2|2\s*\*\s*idx/i.test(solution)) {
    metrics.correctness += 10;
    details.push('+10: Correct parent/child indexing');
  }

  // Completeness (0-20)
  if (/push|add|insert/i.test(solution)) {
    metrics.completeness += 7;
    details.push('+7: Insert operation');
  }
  if (/pop|remove|extract/i.test(solution)) {
    metrics.completeness += 7;
    details.push('+7: Extract operation');
  }
  if (/size|length|count/i.test(solution)) {
    metrics.completeness += 6;
    details.push('+6: Size tracking');
  }

  // Performance (0-15)
  if (/O\(.*n.*log.*k\)|O\(.*n.*lg.*k\)/i.test(solution)) {
    metrics.performance += 10;
    details.push('+10: Optimal complexity mentioned');
  }
  if (/heap\.size\s*>\s*k/i.test(solution)) {
    metrics.performance += 5;
    details.push('+5: Maintains k-sized heap');
  }

  // Style (0-15)
  if (/\/\/|\/\*|\*\//i.test(solution)) {
    metrics.style += 5;
    details.push('+5: Comments present');
  }
  if (/const|let/i.test(solution) && !/var\s/i.test(solution)) {
    metrics.style += 5;
    details.push('+5: Modern JS syntax');
  }
  if (/\n\s{2,}/i.test(solution)) {
    metrics.style += 5;
    details.push('+5: Proper indentation');
  }

  // Edge Cases (0-10)
  if (/!nums|null|undefined|\.length\s*===\s*0/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Null/empty check');
  }
  if (/k\s*[<>]\s*[0-9]|k\s*[<>]=?\s*nums\.length/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: k bounds check');
  }

  const totalScore = Object.values(metrics).reduce((a, b) => a + b, 0);

  return {
    testId: 'P1',
    score: Math.min(100, totalScore),
    metrics,
    details
  };
}

/**
 * Scoring rubric for log parsing
 */
export function scoreLogParsing(solution: string): TestScore {
  const metrics: QualityMetrics = {
    correctness: 0,
    completeness: 0,
    performance: 0,
    style: 0,
    edgeCases: 0
  };
  const details: string[] = [];

  // Correctness (0-40)
  if (/regex|RegExp|match\(/i.test(solution)) {
    metrics.correctness += 15;
    details.push('+15: Uses regex');
  }
  if (/"timestamp".*"level".*"service"/i.test(solution)) {
    metrics.correctness += 15;
    details.push('+15: Correct JSON structure');
  }
  if (/user_id.*12345|"12345"/i.test(solution)) {
    metrics.correctness += 10;
    details.push('+10: Extracts user_id correctly');
  }

  // Completeness (0-20)
  const fields = ['timestamp', 'level', 'service', 'message', 'user_id', 'reason'];
  const foundFields = fields.filter(f => new RegExp(`"${f}"`, 'i').test(solution));
  metrics.completeness = Math.round((foundFields.length / fields.length) * 20);
  details.push(`+${metrics.completeness}: ${foundFields.length}/6 fields extracted`);

  // Performance (0-15)
  if (/^\^.*\$$/m.test(solution)) {
    metrics.performance += 10;
    details.push('+10: Anchored regex');
  }
  if (/\\d\{4\}|\\d\{2\}/i.test(solution)) {
    metrics.performance += 5;
    details.push('+5: Efficient digit matching');
  }

  // Style (0-15)
  if (/const|function/i.test(solution)) {
    metrics.style += 5;
    details.push('+5: Proper function declaration');
  }
  if (/\n {2,}|\n\t/i.test(solution)) {
    metrics.style += 5;
    details.push('+5: Code formatting');
  }
  if (/return/i.test(solution)) {
    metrics.style += 5;
    details.push('+5: Explicit return');
  }

  // Edge Cases (0-10)
  if (/try|catch|null|undefined/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Error handling');
  }
  if (/if.*match|!match/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Match validation');
  }

  const totalScore = Object.values(metrics).reduce((a, b) => a + b, 0);

  return {
    testId: 'P2',
    score: Math.min(100, totalScore),
    metrics,
    details
  };
}

/**
 * Scoring rubric for bug fixing
 */
export function scoreBugFix(solution: string): TestScore {
  const metrics: QualityMetrics = {
    correctness: 0,
    completeness: 0,
    performance: 0,
    style: 0,
    edgeCases: 0
  };
  const details: string[] = [];

  // Correctness (0-40)
  if (/===/i.test(solution) && !/\(n\s*=\s*0\)/i.test(solution)) {
    metrics.correctness += 20;
    details.push('+20: Fixed assignment bug');
  }
  if (/n\s*-\s*1|n-1/i.test(solution)) {
    metrics.correctness += 20;
    details.push('+20: Fixed recursion bug');
  }

  // Completeness (0-20)
  if (/n\s*===\s*0.*return\s*1/i.test(solution)) {
    metrics.completeness += 10;
    details.push('+10: Base case 0');
  }
  if (/n\s*===\s*1.*return\s*1/i.test(solution)) {
    metrics.completeness += 10;
    details.push('+10: Base case 1');
  }

  // Performance (0-15)
  if (/memo|cache|dp\[/i.test(solution)) {
    metrics.performance += 10;
    details.push('+10: Memoization');
  }
  if (/while|for\s*\(/i.test(solution)) {
    metrics.performance += 5;
    details.push('+5: Iterative option');
  }

  // Style (0-15)
  if (/\/\/ Fixed:|\/\/ Bug:/i.test(solution)) {
    metrics.style += 8;
    details.push('+8: Bug explanation');
  }
  if (/function factorial|const factorial/i.test(solution)) {
    metrics.style += 7;
    details.push('+7: Proper naming');
  }

  // Edge Cases (0-10)
  if (/n\s*<\s*0|negative/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Negative handling');
  }
  if (/typeof|Number\.is|isNaN/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Type checking');
  }

  const totalScore = Object.values(metrics).reduce((a, b) => a + b, 0);

  return {
    testId: 'P3',
    score: Math.min(100, totalScore),
    metrics,
    details
  };
}

/**
 * Scoring rubric for CLI generation
 */
export function scoreCLI(solution: string): TestScore {
  const metrics: QualityMetrics = {
    correctness: 0,
    completeness: 0,
    performance: 0,
    style: 0,
    edgeCases: 0
  };
  const details: string[] = [];

  // Correctness (0-40)
  const commands = ['init', 'build', 'test', 'deploy', 'clean', 'help'];
  const foundCommands = commands.filter(cmd => 
    new RegExp(`command\\(['"]${cmd}`, 'i').test(solution)
  );
  metrics.correctness = Math.round((foundCommands.length / 6) * 40);
  details.push(`+${metrics.correctness}: ${foundCommands.length}/6 commands`);

  // Completeness (0-20)
  if (/\.option\(/i.test(solution)) {
    metrics.completeness += 7;
    details.push('+7: Has options');
  }
  if (/\.description\(/i.test(solution)) {
    metrics.completeness += 7;
    details.push('+7: Has descriptions');
  }
  if (/\.version\(/i.test(solution)) {
    metrics.completeness += 6;
    details.push('+6: Has version');
  }

  // Performance (0-15)
  if (/async|await|Promise/i.test(solution)) {
    metrics.performance += 10;
    details.push('+10: Async support');
  }
  if (/process\.exit/i.test(solution)) {
    metrics.performance += 5;
    details.push('+5: Exit codes');
  }

  // Style (0-15)
  if (/commander|yargs|minimist/i.test(solution)) {
    metrics.style += 8;
    details.push('+8: Uses CLI framework');
  }
  if (/#!/.test(solution)) {
    metrics.style += 7;
    details.push('+7: Shebang line');
  }

  // Edge Cases (0-10)
  if (/try|catch|error/i.test(solution)) {
    metrics.edgeCases += 10;
    details.push('+10: Error handling');
  }

  const totalScore = Object.values(metrics).reduce((a, b) => a + b, 0);

  return {
    testId: 'P4',
    score: Math.min(100, totalScore),
    metrics,
    details
  };
}

/**
 * Scoring rubric for math problem
 */
export function scoreMath(solution: string): TestScore {
  const metrics: QualityMetrics = {
    correctness: 0,
    completeness: 0,
    performance: 0,
    style: 0,
    edgeCases: 0
  };
  const details: string[] = [];

  // Correctness (0-40)
  const numbers = solution.match(/\d+\.?\d*/g) || [];
  const hasCorrectAnswer = numbers.some(n => {
    const val = parseFloat(n);
    return val >= 54.5 && val <= 54.6;
  });
  
  if (hasCorrectAnswer) {
    metrics.correctness += 30;
    details.push('+30: Correct answer');
  }
  if (/300|total.*distance/i.test(solution)) {
    metrics.correctness += 5;
    details.push('+5: Total distance correct');
  }
  if (/5\.5|total.*time/i.test(solution)) {
    metrics.correctness += 5;
    details.push('+5: Total time correct');
  }

  // Completeness (0-20)
  if (/120.*miles|first.*leg/i.test(solution)) {
    metrics.completeness += 5;
    details.push('+5: First leg');
  }
  if (/180.*miles|second.*leg/i.test(solution)) {
    metrics.completeness += 5;
    details.push('+5: Second leg');
  }
  if (/30.*min|stop|rest/i.test(solution)) {
    metrics.completeness += 5;
    details.push('+5: Stop mentioned');
  }
  if (/average|mean/i.test(solution)) {
    metrics.completeness += 5;
    details.push('+5: Average concept');
  }

  // Performance (0-15)
  if (/function|const.*=/i.test(solution)) {
    metrics.performance += 10;
    details.push('+10: Programmatic solution');
  }
  if (/return/i.test(solution)) {
    metrics.performance += 5;
    details.push('+5: Returns value');
  }

  // Style (0-15)
  if (/mph|miles.*hour/i.test(solution)) {
    metrics.style += 8;
    details.push('+8: Units specified');
  }
  if (/\n\s+/i.test(solution)) {
    metrics.style += 7;
    details.push('+7: Formatted solution');
  }

  // Edge Cases (0-10)
  if (/round|toFixed|decimal/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Rounding consideration');
  }
  if (/speed\s*=\s*distance\s*\/\s*time/i.test(solution)) {
    metrics.edgeCases += 5;
    details.push('+5: Formula shown');
  }

  const totalScore = Object.values(metrics).reduce((a, b) => a + b, 0);

  return {
    testId: 'P5',
    score: Math.min(100, totalScore),
    metrics,
    details
  };
}

/**
 * Calculate overall performance score
 */
export function calculateOverallScore(testScores: TestScore[]): number {
  const totalScore = testScores.reduce((sum, test) => sum + test.score, 0);
  return Math.round(totalScore / testScores.length);
}

/**
 * Generate performance report
 */
export function generateReport(testScores: TestScore[]): string {
  let report = '\n📊 DETAILED SCORING REPORT\n';
  report += '═'.repeat(60) + '\n\n';

  for (const test of testScores) {
    report += `Test ${test.testId}: ${test.score}/100\n`;
    report += '─'.repeat(30) + '\n';
    
    report += 'Breakdown:\n';
    report += `  Correctness:   ${test.metrics.correctness}/40\n`;
    report += `  Completeness:  ${test.metrics.completeness}/20\n`;
    report += `  Performance:   ${test.metrics.performance}/15\n`;
    report += `  Style:         ${test.metrics.style}/15\n`;
    report += `  Edge Cases:    ${test.metrics.edgeCases}/10\n`;
    
    if (test.details.length > 0) {
      report += '\nDetails:\n';
      test.details.forEach(detail => {
        report += `  ${detail}\n`;
      });
    }
    report += '\n';
  }

  const overall = calculateOverallScore(testScores);
  report += '═'.repeat(60) + '\n';
  report += `OVERALL SCORE: ${overall}/100\n`;
  report += '═'.repeat(60) + '\n';

  return report;
}