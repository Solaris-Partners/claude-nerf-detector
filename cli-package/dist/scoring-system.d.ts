/**
 * Continuous scoring system for NerfDetector
 * Each test returns a score from 0-100 based on multiple quality factors
 */
export interface QualityMetrics {
    correctness: number;
    completeness: number;
    performance: number;
    style: number;
    edgeCases: number;
}
export interface TestScore {
    testId: string;
    score: number;
    metrics: QualityMetrics;
    details: string[];
}
/**
 * Scoring rubric for algorithm implementation
 */
export declare function scoreAlgorithm(solution: string): TestScore;
/**
 * Scoring rubric for log parsing
 */
export declare function scoreLogParsing(solution: string): TestScore;
/**
 * Scoring rubric for bug fixing
 */
export declare function scoreBugFix(solution: string): TestScore;
/**
 * Scoring rubric for CLI generation
 */
export declare function scoreCLI(solution: string): TestScore;
/**
 * Scoring rubric for math problem
 */
export declare function scoreMath(solution: string): TestScore;
/**
 * Calculate overall performance score
 */
export declare function calculateOverallScore(testScores: TestScore[]): number;
/**
 * Generate performance report
 */
export declare function generateReport(testScores: TestScore[]): string;
//# sourceMappingURL=scoring-system.d.ts.map