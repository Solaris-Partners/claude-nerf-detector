export interface TestPrompt {
  id: string;
  name: string;
  prompt: string;
  version: string;
  type: 'correctness' | 'performance';
  replicates: number;
  scoring?: (output: string) => number;
  hiddenTests?: Array<{ input: any; expected: any }>;
}

export const TEST_SUITE_VERSION = '1.0.0';

export const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 'P1',
    name: 'Deterministic Coding',
    version: '1.0.0',
    type: 'correctness',
    replicates: 2,
    prompt: `Write a Python function that finds the kth largest element in an unsorted array using a min-heap. The function should be called 'find_kth_largest(nums, k)' and handle edge cases. Output ONLY the function code, no explanation.`,
    scoring: (output: string) => {
      // Check for key indicators of a correct solution
      const code = output.toLowerCase();
      const hasHeapImport = code.includes('import heapq') || code.includes('from heapq');
      const hasFunction = code.includes('def find_kth_largest');
      const hasHeapPush = code.includes('heappush') || code.includes('heapify');
      const hasCorrectLogic = code.includes('heappop') || code.includes('nlargest');
      
      if (hasHeapImport && hasFunction && (hasHeapPush || hasCorrectLogic)) {
        return 1;
      }
      return 0;
    },
  },
  {
    id: 'P2',
    name: 'Parsing/Transform',
    version: '1.0.0',
    type: 'correctness',
    replicates: 2,
    prompt: `Parse this log line and output as JSON with fields: timestamp, level, message, request_id.
Log: "2024-03-15T10:30:45.123Z [ERROR] Failed to process payment for order_12345 request_id=req_abc123"
Output ONLY the JSON, no explanation.`,
    scoring: (output: string) => {
      try {
        const json = JSON.parse(output.trim());
        const hasTimestamp = json.timestamp && json.timestamp.includes('2024-03-15');
        const hasLevel = json.level === 'ERROR';
        const hasMessage = json.message && json.message.includes('payment');
        const hasRequestId = json.request_id === 'req_abc123';
        
        return (hasTimestamp && hasLevel && hasMessage && hasRequestId) ? 1 : 0;
      } catch {
        return 0;
      }
    },
  },
  {
    id: 'P3',
    name: 'Bug-Fix',
    version: '1.0.0',
    type: 'correctness',
    replicates: 2,
    prompt: `Fix this buggy JavaScript function that should return the factorial of n:

function factorial(n) {
  if (n = 0) return 1;
  return n * factorial(n);
}

Output ONLY the corrected function, no explanation.`,
    scoring: (output: string) => {
      const code = output.toLowerCase();
      // Check for the two bug fixes needed:
      // 1. n = 0 should be n === 0 or n == 0
      // 2. factorial(n) should be factorial(n-1) or factorial(n - 1)
      const hasEqualityFix = code.includes('== 0') || code.includes('=== 0') || code.includes('<= 0') || code.includes('< 1');
      const hasRecursionFix = code.includes('factorial(n-1)') || code.includes('factorial(n - 1)') || code.includes('factorial(--n)');
      
      return (hasEqualityFix && hasRecursionFix) ? 1 : 0;
    },
  },
  {
    id: 'P4',
    name: 'Long-Form Generation',
    version: '1.0.0',
    type: 'performance',
    replicates: 3,
    prompt: `Generate a complete CLI application in Python that includes:

1. A main command with help text
2. Six subcommands: init, status, add, remove, list, and sync
3. Each subcommand should have:
   - A description
   - At least 2 command-line arguments or options
   - Basic implementation that prints what it would do
4. Use argparse for argument parsing
5. Include proper error handling
6. Add docstrings for all functions
7. Structure the code with clear separation of concerns

The application should be a task manager CLI. Make it production-ready with proper structure and comprehensive functionality.`,
  },
  {
    id: 'P5',
    name: 'Reasoning',
    version: '1.0.0',
    type: 'correctness',
    replicates: 2,
    prompt: `A train travels from City A to City B at 60 mph. The return trip at 40 mph takes 2 hours longer. What is the distance between the cities in miles? Output ONLY the number.`,
    scoring: (output: string) => {
      const answer = output.trim();
      // Distance is 240 miles
      // Going: 240/60 = 4 hours
      // Return: 240/40 = 6 hours (2 hours longer)
      return answer === '240' ? 1 : 0;
    },
  },
];