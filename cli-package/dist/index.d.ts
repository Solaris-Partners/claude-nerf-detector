#!/usr/bin/env node
declare function runTests(submitResults?: boolean): Promise<void>;
declare function submitScore(scores: Record<string, number>): Promise<void>;
export { runTests, submitScore };
//# sourceMappingURL=index.d.ts.map