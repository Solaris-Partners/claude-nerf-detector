// Test prompts that Claude will actually solve
export const TEST_PROMPTS = {
    P1: {
        id: 'P1',
        name: 'Algorithm Implementation',
        prompt: `Write a JavaScript function called findKthLargest that finds the kth largest element in an array using a min-heap approach.

Requirements:
- Function should take two parameters: nums (array of numbers) and k (integer)
- Implement a MinHeap class with push, pop, and size methods
- Handle edge cases: empty array, k out of bounds
- Return null for invalid inputs
- The heap should maintain k largest elements

Example:
findKthLargest([3,2,1,5,6,4], 2) should return 5
findKthLargest([3,2,3,1,2,4,5,5,6], 4) should return 4

Provide the complete implementation.`
    },
    P2: {
        id: 'P2',
        name: 'Log Parsing',
        prompt: `Parse this log line into a JSON object:

Log line:
"2024-01-15 08:23:45.123 [ERROR] UserService - Failed to authenticate user_id=12345 reason=invalid_token"

Create a parseLogLine function that extracts:
- timestamp (as string)
- level (ERROR, INFO, etc)
- service name
- message
- user_id (as string)
- reason

Return the result as a formatted JSON object. Show both the function and the resulting JSON output.`
    },
    P3: {
        id: 'P3',
        name: 'Bug Fixing',
        prompt: `Fix all the bugs in this factorial function:

\`\`\`javascript
function factorial(n) {
  if (n = 0) return 1;
  return n * factorial(n);
}
\`\`\`

Issues to fix:
1. Assignment instead of comparison
2. Missing recursive decrement
3. No handling for negative numbers
4. Missing base case for n=1

Provide the corrected function and explain each bug you fixed.`
    },
    P4: {
        id: 'P4',
        name: 'Complex Generation',
        prompt: `Create a Node.js CLI application using Commander.js with exactly 6 subcommands:
1. init [name] - Initialize a new project
2. build - Build the project (with --production flag)
3. test [pattern] - Run tests (with --watch flag)
4. deploy [environment] - Deploy the application
5. clean - Clean build artifacts
6. help [command] - Display help

Requirements:
- Each command should have try-catch error handling
- Include proper descriptions for each command
- Commands should log what they're doing
- Include global error handling
- Add appropriate default values where needed

Provide the complete CLI application code.`
    },
    P5: {
        id: 'P5',
        name: 'Math Reasoning',
        prompt: `Solve this word problem and show your work:

A train travels 120 miles in 2 hours, then stops for 30 minutes, then travels 180 miles in 3 hours.

Calculate:
1. The average speed for the entire journey (including the stop)
2. Show the calculation step by step
3. Round to 1 decimal place

Write a calculateAverageSpeed function that solves this and returns the answer.`
    }
};
//# sourceMappingURL=claude-test-prompts.js.map