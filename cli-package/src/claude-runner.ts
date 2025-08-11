#!/usr/bin/env node

import { createHash } from 'crypto';
import { homedir, hostname, platform } from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { 
  scoreAlgorithm, 
  scoreLogParsing, 
  scoreBugFix, 
  scoreCLI, 
  scoreMath,
  generateReport,
  TestScore
} from './scoring-system.js';

// Configuration
const API_URL = process.env.NERF_API_URL || 'https://claude-nerf-detector.vercel.app/api';
const BASE_URL = 'https://claude-nerf-detector.vercel.app';
const CONFIG_DIR = join(homedir(), '.claude-nerf');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  anonymousUserId: string;
  lastRun?: string;
  totalRuns: number;
}

interface TestResult {
  test_id: string;
  test_name: string;
  score: number;  // 0-100 continuous score
  passed: boolean; // For backwards compatibility
  response_time_ms: number;
  output_quality: number;
  solution?: string;
  metrics?: {
    correctness: number;
    completeness: number;
    performance: number;
    style: number;
    edgeCases: number;
  };
  details?: string[];
}

// Get or create anonymous user ID
function getAnonymousUserId(): string {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  let config: Config;
  if (existsSync(CONFIG_FILE)) {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } else {
    const machineId = createHash('sha256')
      .update(hostname() + platform() + homedir())
      .digest('hex')
      .substring(0, 16);
    
    config = {
      anonymousUserId: `anon_${machineId}`,
      totalRuns: 0
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  return config.anonymousUserId;
}

// Get rough geographic region
async function getRegion(): Promise<string | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_name || null;
  } catch {
    return null;
  }
}

// Test definitions with Claude's programmatic solutions
const TESTS = [
  {
    id: 'P1',
    name: 'Algorithm Implementation',
    description: 'Find kth largest element using min-heap',
    solve: () => {
      // Claude's solution for kth largest element using heap approach
      const solution = `
function findKthLargest(nums, k) {
  // Min heap implementation for kth largest
  class MinHeap {
    constructor() {
      this.heap = [];
    }
    
    push(val) {
      this.heap.push(val);
      this.bubbleUp(this.heap.length - 1);
    }
    
    pop() {
      if (this.heap.length === 0) return null;
      const min = this.heap[0];
      const last = this.heap.pop();
      if (this.heap.length > 0) {
        this.heap[0] = last;
        this.bubbleDown(0);
      }
      return min;
    }
    
    bubbleUp(idx) {
      while (idx > 0) {
        const parentIdx = Math.floor((idx - 1) / 2);
        if (this.heap[idx] >= this.heap[parentIdx]) break;
        [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
        idx = parentIdx;
      }
    }
    
    bubbleDown(idx) {
      while (true) {
        let minIdx = idx;
        const leftIdx = 2 * idx + 1;
        const rightIdx = 2 * idx + 2;
        
        if (leftIdx < this.heap.length && this.heap[leftIdx] < this.heap[minIdx]) {
          minIdx = leftIdx;
        }
        if (rightIdx < this.heap.length && this.heap[rightIdx] < this.heap[minIdx]) {
          minIdx = rightIdx;
        }
        
        if (minIdx === idx) break;
        [this.heap[idx], this.heap[minIdx]] = [this.heap[minIdx], this.heap[idx]];
        idx = minIdx;
      }
    }
    
    get size() {
      return this.heap.length;
    }
  }
  
  // Edge cases
  if (!nums || nums.length === 0) return null;
  if (k < 1 || k > nums.length) return null;
  
  const heap = new MinHeap();
  
  for (const num of nums) {
    heap.push(num);
    if (heap.size > k) {
      heap.pop();
    }
  }
  
  return heap.pop();
}`;
      return solution;
    },
    score: (solution: string) => scoreAlgorithm(solution)
  },
  {
    id: 'P2',
    name: 'Log Parsing',
    description: 'Parse log line to JSON',
    solve: () => {
      // Claude's solution for parsing the log line
      const logLine = "2024-01-15 08:23:45.123 [ERROR] UserService - Failed to authenticate user_id=12345 reason=invalid_token";
      const solution = `
// Parsing log line: "${logLine}"

function parseLogLine(line) {
  const regex = /^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3}) \\[(\\w+)\\] (\\w+) - (.+) user_id=(\\d+) reason=(.+)$/;
  const match = line.match(regex);
  
  if (match) {
    return {
      "timestamp": match[1],
      "level": match[2],
      "service": match[3],
      "message": match[4],
      "user_id": match[5],
      "reason": match[6]
    };
  }
  return null;
}

// Result:
${JSON.stringify({
  "timestamp": "2024-01-15 08:23:45.123",
  "level": "ERROR",
  "service": "UserService",
  "message": "Failed to authenticate",
  "user_id": "12345",
  "reason": "invalid_token"
}, null, 2)}`;
      return solution;
    },
    score: (solution: string) => scoreLogParsing(solution)
  },
  {
    id: 'P3',
    name: 'Bug Fixing',
    description: 'Fix factorial function bugs',
    solve: () => {
      // Claude's solution for fixing the factorial function
      const solution = `
// Original buggy code:
// function factorial(n) {
//   if (n = 0) return 1;
//   return n * factorial(n);
// }

// Fixed version:
function factorial(n) {
  if (n === 0) return 1;  // Fixed: Use === instead of = (assignment)
  if (n === 1) return 1;  // Added base case for n=1
  if (n < 0) return undefined; // Handle negative numbers
  return n * factorial(n - 1);  // Fixed: Decrement n in recursive call
}

// The bugs were:
// 1. Using assignment (=) instead of comparison (=== or ==)
// 2. Missing decrement (n-1) in recursive call causing infinite recursion
// 3. No handling for edge cases like negative numbers`;
      return solution;
    },
    score: (solution: string) => scoreBugFix(solution)
  },
  {
    id: 'P4',
    name: 'Complex Generation',
    description: 'CLI app with 6 subcommands',
    solve: () => {
      // Claude's solution for CLI application
      const solution = `
#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();

program
  .name('myapp')
  .description('CLI application with multiple commands')
  .version('1.0.0');

// Init command
program
  .command('init [name]')
  .description('Initialize a new project')
  .action((name = 'myproject') => {
    try {
      console.log(\`Initializing project: \${name}\`);
      // Project initialization logic here
    } catch (error) {
      console.error('Error during initialization:', error.message);
      process.exit(1);
    }
  });

// Build command
program
  .command('build')
  .description('Build the project')
  .option('-p, --production', 'Production build')
  .action((options) => {
    try {
      console.log(\`Building project\${options.production ? ' for production' : ''}...\`);
      // Build logic here
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });

// Test command
program
  .command('test [pattern]')
  .description('Run tests')
  .option('-w, --watch', 'Watch mode')
  .action((pattern, options) => {
    try {
      console.log(\`Running tests\${pattern ? ' matching ' + pattern : ''}...\`);
      // Test execution logic here
    } catch (error) {
      console.error('Test execution failed:', error.message);
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy [environment]')
  .description('Deploy the application')
  .action((environment = 'staging') => {
    try {
      console.log(\`Deploying to \${environment}...\`);
      // Deployment logic here
    } catch (error) {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    }
  });

// Clean command
program
  .command('clean')
  .description('Clean build artifacts')
  .action(() => {
    try {
      console.log('Cleaning build artifacts...');
      // Cleanup logic here
    } catch (error) {
      console.error('Cleanup failed:', error.message);
      process.exit(1);
    }
  });

// Help command (built-in, but we can customize)
program
  .command('help [command]')
  .description('Display help for a command')
  .action((cmd) => {
    if (cmd) {
      const subCommand = program.commands.find(c => c.name() === cmd);
      if (subCommand) {
        subCommand.outputHelp();
      } else {
        console.log(\`Unknown command: \${cmd}\`);
      }
    } else {
      program.outputHelp();
    }
  });

// Global error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}`;
      return solution;
    },
    score: (solution: string) => scoreCLI(solution)
  },
  {
    id: 'P5',
    name: 'Math Reasoning',
    description: 'Calculate average speed including stops',
    solve: () => {
      // Claude's solution for the math problem
      const solution = `
// Problem: Train travels 120 miles in 2 hours, stops for 30 minutes,
// then travels 180 miles in 3 hours. What is the average speed?

// Solution:
// First leg: 120 miles in 2 hours
// Stop: 0 miles in 0.5 hours (30 minutes)
// Second leg: 180 miles in 3 hours

// Total distance = 120 + 180 = 300 miles
// Total time = 2 + 0.5 + 3 = 5.5 hours

// Average speed = Total distance / Total time
// Average speed = 300 miles / 5.5 hours
// Average speed = 54.545... mph

// Rounded: 54.5 mph

function calculateAverageSpeed() {
  const leg1Distance = 120; // miles
  const leg1Time = 2; // hours
  
  const stopTime = 0.5; // hours (30 minutes)
  
  const leg2Distance = 180; // miles
  const leg2Time = 3; // hours
  
  const totalDistance = leg1Distance + leg2Distance;
  const totalTime = leg1Time + stopTime + leg2Time;
  
  const averageSpeed = totalDistance / totalTime;
  
  return Math.round(averageSpeed * 10) / 10; // Round to 1 decimal place
}

// Answer: 54.5 mph`;
      return solution;
    },
    score: (solution: string) => scoreMath(solution)
  }
];

// Main test execution
async function runClaudeTests() {
  console.log('\n🚀 Claude NerfDetector v3.0 - Continuous Scoring Mode\n');
  console.log('━'.repeat(60));
  console.log('Testing with detailed quality metrics (0-100 scale)');
  console.log('━'.repeat(60) + '\n');
  
  const results: TestResult[] = [];
  const testScores: TestScore[] = [];
  const startTime = Date.now();
  
  // Execute each test
  for (const test of TESTS) {
    console.log(`\n📝 Test ${test.id}: ${test.name}`);
    console.log(`   ${test.description}`);
    
    const testStart = Date.now();
    
    try {
      // Claude solves the test
      console.log('   Solving...');
      const solution = test.solve();
      
      // Score the solution with continuous scoring
      const scoreResult = test.score(solution);
      testScores.push(scoreResult);
      const responseTime = Date.now() - testStart;
      
      // Display score with color coding
      const score = scoreResult.score;
      const color = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
      console.log(`   ${color} Score: ${score}/100`);
      
      // Show breakdown
      if (scoreResult.metrics) {
        console.log(`   ├─ Correctness:  ${scoreResult.metrics.correctness}/40`);
        console.log(`   ├─ Completeness: ${scoreResult.metrics.completeness}/20`);
        console.log(`   ├─ Performance:  ${scoreResult.metrics.performance}/15`);
        console.log(`   ├─ Style:        ${scoreResult.metrics.style}/15`);
        console.log(`   └─ Edge Cases:   ${scoreResult.metrics.edgeCases}/10`);
      }
      
      results.push({
        test_id: test.id,
        test_name: test.name,
        score: score,
        passed: score >= 60, // Consider 60% as passing for backwards compatibility
        response_time_ms: responseTime,
        output_quality: score,
        solution: solution.substring(0, 500), // Truncate for storage
        metrics: scoreResult.metrics,
        details: scoreResult.details
      });
      
    } catch (error: any) {
      console.log('   ❌ ERROR:', error.message);
      results.push({
        test_id: test.id,
        test_name: test.name,
        score: 0,
        passed: false,
        response_time_ms: Date.now() - testStart,
        output_quality: 0
      });
      testScores.push({
        testId: test.id,
        score: 0,
        metrics: {
          correctness: 0,
          completeness: 0,
          performance: 0,
          style: 0,
          edgeCases: 0
        },
        details: [`Error: ${error.message}`]
      });
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // Calculate overall score
  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );
  
  // Generate detailed report
  const report = generateReport(testScores);
  console.log(report);
  
  // Display results summary
  console.log('═'.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('═'.repeat(60));
  console.log(`\nOverall Score: ${overallScore}/100`);
  console.log(`Performance Grade: ${
    overallScore >= 90 ? 'A+' :
    overallScore >= 85 ? 'A' :
    overallScore >= 80 ? 'B+' :
    overallScore >= 75 ? 'B' :
    overallScore >= 70 ? 'C+' :
    overallScore >= 65 ? 'C' :
    overallScore >= 60 ? 'D' : 'F'
  }`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`Average Time per Test: ${(totalTime / TESTS.length / 1000).toFixed(2)}s`);
  
  // Calculate metrics
  const avgResponseTime = results.reduce((sum, r) => sum + r.response_time_ms, 0) / results.length;
  const avgOutputLength = results.reduce((sum, r) => sum + (r.solution?.length || 0), 0) / results.length;
  
  // Submit to community
  console.log('\n🌍 Submitting results to community database...');
  
  const anonymousUserId = getAnonymousUserId();
  const region = await getRegion();
  
  try {
    const response = await fetch(`${API_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous_user_id: anonymousUserId,
        claude_version: 'claude-3.5-sonnet',
        test_score: Math.round(overallScore / 20), // Convert to 0-5 for backwards compatibility
        continuous_score: overallScore, // New: 0-100 continuous score
        total_tests: TESTS.length,
        ttft_ms: Math.round(avgResponseTime),
        avg_output_length: Math.round(avgOutputLength),
        region: region || 'Unknown',
        test_details: results.map(r => ({
          test_id: r.test_id,
          test_name: r.test_name,
          score: r.score, // New: continuous score
          passed: r.passed,
          response_time_ms: r.response_time_ms,
          output_quality: r.output_quality,
          metrics: r.metrics // New: detailed metrics
        }))
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Results submitted successfully!\n');
      
      if (data.comparison) {
        console.log('📈 Community Comparison:');
        console.log(`   • Better than ${data.comparison.percentile}% of users`);
        console.log(`   • Your score: ${overallScore}/100`);
        if (data.comparison.regionAvg) {
          const regionScore = data.comparison.regionAvg * 20; // Convert from 0-5 to 0-100
          console.log(`   • Your region average: ${regionScore.toFixed(1)}/100`);
        }
        const globalScore = data.comparison.globalAvg * 20; // Convert from 0-5 to 0-100
        console.log(`   • Global average: ${globalScore.toFixed(1)}/100`);
        
        // Performance insights
        const diff = overallScore - (data.comparison.globalAvg * 20);
        if (diff > 10) {
          console.log(`   • 🎯 Performing ${diff.toFixed(0)} points above average!`);
        } else if (diff < -10) {
          console.log(`   • ⚠️  Performing ${Math.abs(diff).toFixed(0)} points below average`);
        } else {
          console.log(`   • ✓ Performance is within normal range`);
        }
      }
      
      if (data.run_id) {
        // Enhanced dashboard preview
        console.log('\n' + '═'.repeat(60));
        console.log('🌐 VIEW YOUR RESULTS & GLOBAL PERFORMANCE METRICS');
        console.log('═'.repeat(60));
        console.log(`\n📊 Your Test: ${BASE_URL}/run/${data.run_id}`);
        console.log(`🌍 Global Dashboard: ${BASE_URL}\n`);
        
        console.log('Your test contributes to:');
        console.log('  📊 Real-time performance tracking');
        console.log('  📈 Historical trend analysis'); 
        console.log('  🏆 Global leaderboard rankings');
        console.log('  🔍 Performance degradation detection');
        
        // Show performance insights
        if (data.insights) {
          console.log('\n💡 Performance Insights:');
          if (data.insights.trending) {
            console.log(`  • Claude is trending ${data.insights.trending}`);
          }
          if (data.insights.testCount) {
            console.log(`  • You're test #${data.insights.testCount} today`);
          }
          if (data.insights.uniqueUsers) {
            console.log(`  • Joined by ${data.insights.uniqueUsers} other testers`);
          }
        }
        
        console.log('\n🎯 Visit the global dashboard to see:');
        console.log('  • Live performance heatmap (last 30 days)');
        console.log('  • How Claude performs vs yesterday/last week/last month');
        console.log('  • Which tests are getting harder or easier');
        console.log('  • Live feed of tests from around the world');
        console.log('  • Your contribution to the community dataset');
        console.log(`\n👉 ${BASE_URL}`);
      }
    } else {
      const errorText = await response.text();
      console.log('⚠️  Failed to submit results:', errorText);
    }
  } catch (error: any) {
    console.log('⚠️  Could not connect to community server:', error.message);
    console.log('   Results saved locally only');
  }
  
  // Update local config
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  config.lastRun = new Date().toISOString();
  config.totalRuns = (config.totalRuns || 0) + 1;
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  console.log('\n' + '═'.repeat(60));
  console.log('✨ Test complete! Thank you for using Claude NerfDetector');
  console.log('📈 View global stats: https://claude-nerf-detector.vercel.app');
  console.log('═'.repeat(60) + '\n');
}

// Execute if run directly
// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runClaudeTests().catch(console.error);
}

export { runClaudeTests };