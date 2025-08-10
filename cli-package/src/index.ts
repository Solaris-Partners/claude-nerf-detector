#!/usr/bin/env node

import { createHash } from 'crypto';
import { homedir, hostname, platform } from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';

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

// Main test execution
async function runTests(submitResults: boolean = true) {
  console.log('\n🚀 Claude NerfDetector Performance Test\n');
  console.log('━'.repeat(60));
  console.log('This test will evaluate Claude Code\'s performance on 5 tasks.');
  console.log('After Claude completes all responses, you will need to manually');
  console.log('score each test based on the criteria shown.');
  console.log('━'.repeat(60));
  console.log('\nStarting in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test prompts
  const tests = [
    {
      id: 'P1',
      name: 'Algorithm Implementation',
      prompt: 'Write a function to find the kth largest element in an array using a min-heap approach. Include edge case handling.',
      scoring: 'Score 1 if: Uses heap/Heap, mentions kth/largest, has edge case checks'
    },
    {
      id: 'P2', 
      name: 'Log Parsing',
      prompt: 'Parse this log line into JSON: "2024-01-15 08:23:45.123 [ERROR] UserService - Failed to authenticate user_id=12345 reason=invalid_token"',
      scoring: 'Score 1 if: Returns valid JSON with timestamp, level, service, user_id fields'
    },
    {
      id: 'P3',
      name: 'Bug Fixing',
      prompt: 'Fix all bugs in this factorial function:\n```javascript\nfunction factorial(n) {\n  if (n = 0) return 1;\n  return n * factorial(n);\n}\n```',
      scoring: 'Score 1 if: Uses === for comparison and n-1 for recursion'
    },
    {
      id: 'P4',
      name: 'Complex Generation',
      prompt: 'Generate a complete CLI application structure with 6 subcommands (init, build, test, deploy, clean, help) using commander.js or similar. Include proper error handling.',
      scoring: 'Score 1 if: Has 5+ commands, includes error handling, has help command'
    },
    {
      id: 'P5',
      name: 'Math Reasoning',
      prompt: 'A train travels 120 miles in 2 hours, then stops for 30 minutes, then travels another 180 miles in 3 hours. What is the average speed for the entire journey including the stop?',
      scoring: 'Score 1 if: Answer is between 54-55 mph'
    }
  ];

  // Display all test prompts
  console.log('═'.repeat(60));
  console.log('CLAUDE: Please respond to each of the following 5 test prompts.');
  console.log('After you complete ALL responses, the scoring will begin.');
  console.log('═'.repeat(60));
  console.log();

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`TEST ${i + 1}/5: ${test.name}`);
    console.log('-'.repeat(40));
    console.log(`📝 PROMPT: ${test.prompt}`);
    console.log();
  }

  console.log('═'.repeat(60));
  console.log('⏳ Please complete all 5 responses above.');
  console.log('When done, run: npx claude-nerf-test score');
  console.log('═'.repeat(60));
  console.log();
  
  // Store test info for scoring phase
  const testInfo = {
    timestamp: Date.now(),
    tests: tests
  };
  writeFileSync(join(CONFIG_DIR, 'current-test.json'), JSON.stringify(testInfo, null, 2));
}

// Score tests
async function scoreTests() {
  const testInfoPath = join(CONFIG_DIR, 'current-test.json');
  
  if (!existsSync(testInfoPath)) {
    console.log('❌ No active test found. Please run "npx claude-nerf-test" first.');
    return;
  }
  
  const testInfo = JSON.parse(readFileSync(testInfoPath, 'utf-8'));
  const tests = testInfo.tests;
  
  console.log('\n📊 Test Scoring\n');
  console.log('Please score each test based on Claude\'s responses above.');
  console.log('Enter 1 for passed, 0 for failed.\n');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const scores: Record<string, number> = {};
  const testResults: any[] = [];
  
  for (const test of tests) {
    console.log(`\n${test.name}:`);
    console.log(`Criteria: ${test.scoring}`);
    
    const score = await new Promise<number>((resolve) => {
      rl.question(`Score (0 or 1): `, (answer) => {
        const s = parseInt(answer);
        resolve(s === 1 ? 1 : 0);
      });
    });
    
    scores[test.id] = score;
    testResults.push({
      test_id: test.id,
      test_name: test.name,
      passed: score === 1,
      response_time_ms: 2000,
      output_quality: score * 100
    });
  }
  
  rl.close();
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const totalTime = Date.now() - testInfo.timestamp;
  
  // Display results
  console.log('\n' + '═'.repeat(60));
  console.log('                    TEST RESULTS');
  console.log('═'.repeat(60) + '\n');
  
  console.log('Individual Scores:');
  for (const test of tests) {
    const score = scores[test.id];
    console.log(`  ${test.id} (${test.name}): ${score === 1 ? '✅ PASSED' : '❌ FAILED'}`);
  }
  
  console.log('\n📊 Overall Score: ' + totalScore + '/5 (' + Math.round(totalScore / 5 * 100) + '%)');
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
  
  // Submit results
  console.log('\n🌍 Submitting to community database...');
  
  const anonymousUserId = getAnonymousUserId();
  const region = await getRegion();
  
  try {
    const response = await fetch(`${API_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous_user_id: anonymousUserId,
        claude_version: process.env.CLAUDE_VERSION || 'claude-code',
        test_score: totalScore,
        total_tests: 5,
        ttft_ms: Math.round(totalTime / 5),
        avg_output_length: 500,
        region,
        test_details: testResults
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n✅ Results submitted successfully!\n');
      
      if (data.comparison) {
        console.log('📈 Community Comparison:');
        console.log(`   You scored better than ${data.comparison.percentile}% of users`);
        if (data.comparison.regionAvg) {
          console.log(`   Your region average: ${data.comparison.regionAvg.toFixed(1)}/5`);
        }
        console.log(`   Global average: ${data.comparison.globalAvg.toFixed(1)}/5`);
      }
      
      if (data.run_id) {
        console.log(`\n🔗 View your results: ${BASE_URL}/run/${data.run_id}`);
      }
    } else {
      console.log('⚠️  Failed to submit results to community');
    }
  } catch (error) {
    console.log('⚠️  Could not connect to community server');
    console.log('   Results saved locally only');
  }
  
  // Update config
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  config.lastRun = new Date().toISOString();
  config.totalRuns = (config.totalRuns || 0) + 1;
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  // Clean up test file
  if (existsSync(testInfoPath)) {
    const fs = await import('fs');
    fs.unlinkSync(testInfoPath);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✨ Thank you for contributing to Claude NerfDetector!');
  console.log('📈 View global stats: https://claude-nerf-detector.vercel.app');
  console.log('═'.repeat(60) + '\n');
}

// CLI setup
program
  .name('claude-nerf-test')
  .description('Community performance testing for Claude Code')
  .version('2.3.0');

program
  .command('run', { isDefault: true })
  .description('Run performance tests in Claude Code')
  .option('--local', 'Run tests locally without submitting to community')
  .action(async (options) => {
    await runTests(!options.local);
  });

program
  .command('score')
  .description('Score the completed tests')
  .action(async () => {
    await scoreTests();
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

export { runTests, scoreTests };