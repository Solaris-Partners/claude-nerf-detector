#!/usr/bin/env node

import { createHash } from 'crypto';
import { homedir, hostname, platform } from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';

// Configuration
const API_URL = process.env.NERF_API_URL || 'https://claude-nerf-detector.vercel.app/api';
const CONFIG_DIR = join(homedir(), '.claude-nerf');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  anonymousUserId: string;
  lastRun?: string;
  totalRuns: number;
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
    // Create deterministic but anonymous ID based on machine characteristics
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

// Get rough geographic region (country level)
async function getRegion(): Promise<string | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_name || null;
  } catch {
    return null;
  }
}

// Main test execution for Claude Code
async function runTests(submitResults: boolean = true) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  Claude NerfDetector Test Suite                ║
║                                                                ║
║  This test will evaluate Claude Code's performance on          ║
║  5 challenging tasks. Claude will respond to each prompt       ║
║  and the results will be automatically scored.                 ║
║                                                                ║
║  Instructions:                                                 ║
║  1. Claude will process each test prompt below                 ║
║  2. Let Claude complete its response for each test             ║
║  3. After all tests, results will be submitted                 ║
║                                                                ║
║  Privacy: Only performance metrics are collected anonymously   ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log('\n🧪 Starting tests in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test results tracking
  const testResults: any[] = [];
  let totalScore = 0;
  const startTime = Date.now();

  // Test 1: Algorithm Implementation
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1/5: Algorithm Implementation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('NERF_TEST_P1_START');
  console.log('Write a function to find the kth largest element in an array using a min-heap approach. Include edge case handling.');
  console.log('NERF_TEST_P1_END');
  console.log('\n[Claude will respond above - wait for completion]\n');
  
  // Test 2: Log Parsing
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2/5: Log Parsing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('NERF_TEST_P2_START');
  console.log('Parse this log line into JSON: "2024-01-15 08:23:45.123 [ERROR] UserService - Failed to authenticate user_id=12345 reason=invalid_token"');
  console.log('NERF_TEST_P2_END');
  console.log('\n[Claude will respond above - wait for completion]\n');

  // Test 3: Bug Fixing
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3/5: Bug Fixing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('NERF_TEST_P3_START');
  console.log(`Fix all bugs in this factorial function:
\`\`\`javascript
function factorial(n) {
  if (n = 0) return 1;
  return n * factorial(n);
}
\`\`\``);
  console.log('NERF_TEST_P3_END');
  console.log('\n[Claude will respond above - wait for completion]\n');

  // Test 4: Complex Generation
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4/5: Complex Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('NERF_TEST_P4_START');
  console.log('Generate a complete CLI application structure with 6 subcommands (init, build, test, deploy, clean, help) using commander.js or similar. Include proper error handling.');
  console.log('NERF_TEST_P4_END');
  console.log('\n[Claude will respond above - wait for completion]\n');

  // Test 5: Math Reasoning
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5/5: Math Reasoning');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('NERF_TEST_P5_START');
  console.log('A train travels 120 miles in 2 hours, then stops for 30 minutes, then travels another 180 miles in 3 hours. What is the average speed for the entire journey including the stop?');
  console.log('NERF_TEST_P5_END');
  console.log('\n[Claude will respond above - wait for completion]\n');

  // Scoring instruction
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST COMPLETE - MANUAL SCORING REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Please evaluate Claude\'s responses and run the scoring command:\n');
  console.log('npx claude-nerf-test score --p1 [0/1] --p2 [0/1] --p3 [0/1] --p4 [0/1] --p5 [0/1]');
  console.log('\nScoring Guide:');
  console.log('  P1: Did Claude implement a heap-based solution with edge cases? (1=yes, 0=no)');
  console.log('  P2: Did Claude parse the log into valid JSON with all fields? (1=yes, 0=no)');
  console.log('  P3: Did Claude fix both bugs (= vs == and missing n-1)? (1=yes, 0=no)');
  console.log('  P4: Did Claude create a CLI with 5+ commands and error handling? (1=yes, 0=no)');
  console.log('  P5: Did Claude calculate ~54.5 mph? (1=yes, 0=no)');
  console.log('\nExample: npx claude-nerf-test score --p1 1 --p2 1 --p3 0 --p4 1 --p5 1');
  
  const totalTime = Date.now() - startTime;
  console.log(`\nTotal test time: ${(totalTime / 1000).toFixed(1)}s`);
  
  // Save test session info
  const sessionFile = join(CONFIG_DIR, 'last_session.json');
  writeFileSync(sessionFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTime,
    submitResults
  }, null, 2));
}

// Score submission function
async function submitScore(scores: Record<string, number>) {
  const sessionFile = join(CONFIG_DIR, 'last_session.json');
  if (!existsSync(sessionFile)) {
    console.log('❌ No test session found. Please run tests first: npx claude-nerf-test');
    return;
  }

  const session = JSON.parse(readFileSync(sessionFile, 'utf-8'));
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  
  console.log('\n📊 Your Results:');
  console.log(`  Score: ${totalScore}/5 (${Math.round(totalScore / 5 * 100)}%)`);
  console.log(`  Total Time: ${(session.totalTime / 1000).toFixed(1)}s`);
  
  const testDetails = [
    { test_id: 'P1', test_name: 'Algorithm Implementation', passed: scores.p1 === 1 },
    { test_id: 'P2', test_name: 'Log Parsing', passed: scores.p2 === 1 },
    { test_id: 'P3', test_name: 'Bug Fixing', passed: scores.p3 === 1 },
    { test_id: 'P4', test_name: 'Complex Generation', passed: scores.p4 === 1 },
    { test_id: 'P5', test_name: 'Math Reasoning', passed: scores.p5 === 1 }
  ];

  if (session.submitResults !== false) {
    console.log('\n🌍 Submitting to community...');
    
    const anonymousUserId = getAnonymousUserId();
    const region = await getRegion();
    
    try {
      const response = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous_user_id: anonymousUserId,
          claude_version: process.env.CLAUDE_VERSION || 'unknown',
          test_score: totalScore,
          total_tests: 5,
          ttft_ms: Math.round(session.totalTime / 5), // Rough estimate
          avg_output_length: 500, // Rough estimate
          region,
          test_details: testDetails
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.comparison) {
          console.log('\n🌍 Community Comparison:');
          console.log(`  • Better than ${data.comparison.percentile}% of users`);
          if (data.comparison.regionAvg) {
            console.log(`  • Your region avg: ${data.comparison.regionAvg.toFixed(1)}/5`);
          }
          console.log(`  • Global avg: ${data.comparison.globalAvg.toFixed(1)}/5`);
        }
        
        if (data.share_url) {
          console.log(`\n📈 View details: ${data.share_url}`);
        }
      } else {
        console.log('  ⚠️  Failed to submit results');
      }
    } catch (error) {
      console.log('  ⚠️  Could not connect to community server');
      console.log('  Results saved locally only');
    }
  }
  
  // Update config
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  config.lastRun = new Date().toISOString();
  config.totalRuns = (config.totalRuns || 0) + 1;
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  console.log('\n✅ Test complete! Thank you for contributing to the community.');
  console.log('📈 View global statistics at: https://claude-nerf-detector.vercel.app\n');
}

// CLI setup
program
  .name('claude-nerf-test')
  .description('Community performance testing for Claude Code')
  .version('1.0.1');

program
  .command('run', { isDefault: true })
  .description('Run performance tests in Claude Code')
  .option('--local', 'Run tests locally without submitting to community')
  .action(async (options) => {
    await runTests(!options.local);
  });

program
  .command('score')
  .description('Submit scores after running tests')
  .requiredOption('--p1 <score>', 'Score for test P1 (0 or 1)', (v) => parseInt(v))
  .requiredOption('--p2 <score>', 'Score for test P2 (0 or 1)', (v) => parseInt(v))
  .requiredOption('--p3 <score>', 'Score for test P3 (0 or 1)', (v) => parseInt(v))
  .requiredOption('--p4 <score>', 'Score for test P4 (0 or 1)', (v) => parseInt(v))
  .requiredOption('--p5 <score>', 'Score for test P5 (0 or 1)', (v) => parseInt(v))
  .action(async (options) => {
    const scores = {
      p1: options.p1,
      p2: options.p2,
      p3: options.p3,
      p4: options.p4,
      p5: options.p5
    };
    
    // Validate scores
    for (const [key, value] of Object.entries(scores)) {
      if (value !== 0 && value !== 1) {
        console.error(`❌ Invalid score for ${key}: ${value}. Must be 0 or 1.`);
        process.exit(1);
      }
    }
    
    await submitScore(scores);
  });

program
  .command('config')
  .description('View or modify configuration')
  .option('--reset', 'Reset anonymous user ID')
  .option('--show', 'Show current configuration')
  .action((options) => {
    if (options.reset) {
      if (existsSync(CONFIG_FILE)) {
        const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        const newId = createHash('sha256')
          .update(hostname() + platform() + homedir() + Date.now())
          .digest('hex')
          .substring(0, 16);
        config.anonymousUserId = `anon_${newId}`;
        config.totalRuns = 0;
        writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('✅ Configuration reset');
      }
    }
    if (options.show) {
      if (existsSync(CONFIG_FILE)) {
        const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        console.log('\nCurrent configuration:');
        console.log(`  Anonymous ID: ${config.anonymousUserId}`);
        console.log(`  Total runs: ${config.totalRuns}`);
        if (config.lastRun) {
          console.log(`  Last run: ${new Date(config.lastRun).toLocaleString()}`);
        }
      } else {
        console.log('No configuration found. Run tests to create one.');
      }
    }
  });

program.parse();

export { runTests, submitScore };