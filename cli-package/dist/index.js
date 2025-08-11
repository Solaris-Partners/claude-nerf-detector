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
const RESPONSE_FILE = join(CONFIG_DIR, 'last_response.txt');
// Get or create anonymous user ID
function getAnonymousUserId() {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    let config;
    if (existsSync(CONFIG_FILE)) {
        config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }
    else {
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
async function getRegion() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return data.country_name || null;
    }
    catch {
        return null;
    }
}
// Save responses to file for hook to process
// function saveResponses(responses: string) {
//   if (!existsSync(CONFIG_DIR)) {
//     mkdirSync(CONFIG_DIR, { recursive: true });
//   }
//   writeFileSync(RESPONSE_FILE, responses);
// }
// Load responses from file
function loadResponses() {
    if (existsSync(RESPONSE_FILE)) {
        return readFileSync(RESPONSE_FILE, 'utf-8');
    }
    return null;
}
// Simple validators for auto-scoring
const validators = {
    P1: (response) => {
        const hasHeap = /heap|Heap/i.test(response);
        const hasKth = /kth|largest/i.test(response);
        const hasFunction = /function|def|const.*=.*=>|const.*=.*function/i.test(response);
        return hasHeap && hasKth && hasFunction;
    },
    P2: (response) => {
        const hasJSON = /\{[\s\S]*timestamp[\s\S]*level[\s\S]*\}/i.test(response);
        const hasFields = /timestamp|level|service|user_id/i.test(response);
        return hasJSON && hasFields;
    },
    P3: (response) => {
        const hasEqualityFix = /===|==/i.test(response) && !/\(n\s*=\s*0\)/i.test(response);
        const hasDecrementFix = /n\s*-\s*1|n-1|--n/i.test(response);
        return hasEqualityFix && hasDecrementFix;
    },
    P4: (response) => {
        const commandCount = (response.match(/\.command\(|subcommand|command.*init|command.*build|command.*test|command.*deploy|command.*clean|command.*help/gi) || []).length;
        const hasErrorHandling = /try|catch|error|Error/i.test(response);
        return commandCount >= 5 && hasErrorHandling;
    },
    P5: (response) => {
        const numbers = response.match(/\d+\.?\d*/g) || [];
        return numbers.some(n => {
            const val = parseFloat(n);
            return val >= 54 && val <= 55;
        });
    }
};
// Main test runner with automatic scoring
async function runTests() {
    console.log('\n🚀 Claude NerfDetector v2.6.0\n');
    console.log('━'.repeat(60));
    console.log('              AUTOMATIC TEST MODE');
    console.log('━'.repeat(60));
    console.log('📋 How this works:');
    console.log('1. I\'ll show you 5 test prompts');
    console.log('2. You respond to ALL prompts in one message');
    console.log('3. After 30 seconds, I\'ll automatically score your responses');
    console.log('━'.repeat(60));
    console.log('\nPreparing tests...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Display all test prompts
    console.log('\n' + '═'.repeat(60));
    console.log('📝 RESPOND TO ALL 5 PROMPTS BELOW');
    console.log('═'.repeat(60) + '\n');
    console.log('TEST 1: Algorithm Implementation');
    console.log('────────────────────────────────');
    console.log('Write a function to find the kth largest element in an array');
    console.log('using a min-heap approach. Include edge case handling.\n');
    console.log('TEST 2: Log Parsing');
    console.log('────────────────────────────────');
    console.log('Parse this log line into JSON:');
    console.log('"2024-01-15 08:23:45.123 [ERROR] UserService - Failed to');
    console.log('authenticate user_id=12345 reason=invalid_token"\n');
    console.log('TEST 3: Bug Fixing');
    console.log('────────────────────────────────');
    console.log('Fix all bugs in this factorial function:');
    console.log('```javascript');
    console.log('function factorial(n) {');
    console.log('  if (n = 0) return 1;');
    console.log('  return n * factorial(n);');
    console.log('}');
    console.log('```\n');
    console.log('TEST 4: Complex Generation');
    console.log('────────────────────────────────');
    console.log('Generate a complete CLI application structure with 6 subcommands');
    console.log('(init, build, test, deploy, clean, help) using commander.js');
    console.log('or similar. Include proper error handling.\n');
    console.log('TEST 5: Math Reasoning');
    console.log('────────────────────────────────');
    console.log('A train travels 120 miles in 2 hours, then stops for 30 minutes,');
    console.log('then travels another 180 miles in 3 hours. What is the average');
    console.log('speed for the entire journey including the stop?\n');
    console.log('═'.repeat(60));
    console.log('\n⏰ IMPORTANT: Respond to ALL 5 prompts above NOW!');
    console.log('   Auto-scoring will begin in 30 seconds...\n');
    // Start capture immediately
    const startTime = Date.now();
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    const originalLog = console.log;
    // Intercept all output
    const captureOutput = (text) => {
        capturedOutput += text;
        // Save to file for backup
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(RESPONSE_FILE, capturedOutput);
    };
    process.stdout.write = function (chunk, ...args) {
        const text = chunk?.toString() || '';
        captureOutput(text);
        return originalWrite.apply(process.stdout, [chunk, ...args]);
    };
    console.log = function (...args) {
        const text = args.join(' ') + '\n';
        captureOutput(text);
        return originalLog.apply(console, args);
    };
    // Wait 30 seconds for Claude to respond
    let countdown = 30;
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0 && countdown % 10 === 0) {
            originalLog(`⏱️  ${countdown} seconds remaining...`);
        }
    }, 1000);
    await new Promise(resolve => setTimeout(resolve, 30000));
    clearInterval(countdownInterval);
    // Restore original functions
    process.stdout.write = originalWrite;
    console.log = originalLog;
    const totalTime = Date.now() - startTime;
    // Auto-score the captured responses
    console.log('\n\n' + '═'.repeat(60));
    console.log('📊 AUTO-SCORING YOUR RESPONSES');
    console.log('═'.repeat(60) + '\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const scores = {};
    const testResults = [];
    let totalScore = 0;
    const tests = [
        { id: 'P1', name: 'Algorithm Implementation' },
        { id: 'P2', name: 'Log Parsing' },
        { id: 'P3', name: 'Bug Fixing' },
        { id: 'P4', name: 'Complex Generation' },
        { id: 'P5', name: 'Math Reasoning' }
    ];
    for (const test of tests) {
        const validator = validators[test.id];
        const passed = validator(capturedOutput);
        scores[test.id] = passed ? 1 : 0;
        totalScore += scores[test.id];
        testResults.push({
            test_id: test.id,
            test_name: test.name,
            passed,
            response_time_ms: Math.round(totalTime / 5),
            output_quality: passed ? 100 : 0
        });
    }
    // Display results
    console.log('Individual Scores:');
    for (const test of tests) {
        const score = scores[test.id];
        console.log(`  ${test.name}: ${score === 1 ? '✅ PASSED' : '❌ FAILED'}`);
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
                avg_output_length: capturedOutput.length / 5,
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
        }
        else {
            console.log('⚠️  Failed to submit results to community');
        }
    }
    catch (error) {
        console.log('⚠️  Could not connect to community server');
        console.log('   Results saved locally only');
    }
    // Update config
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    config.lastRun = new Date().toISOString();
    config.totalRuns = (config.totalRuns || 0) + 1;
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Thank you for contributing to Claude NerfDetector!');
    console.log('📈 View global stats: https://claude-nerf-detector.vercel.app');
    console.log('═'.repeat(60) + '\n');
}
// Manual scoring command (backup option)
async function scoreManual() {
    console.log('\n📊 Manual Scoring Mode\n');
    // Load saved responses
    const saved = loadResponses();
    if (!saved) {
        console.log('⚠️  No saved responses found.');
        console.log('Please run "npx claude-nerf-test" first and respond to the prompts.');
        return;
    }
    console.log('Scoring saved responses...\n');
    const scores = {};
    const testResults = [];
    let totalScore = 0;
    const tests = [
        { id: 'P1', name: 'Algorithm Implementation' },
        { id: 'P2', name: 'Log Parsing' },
        { id: 'P3', name: 'Bug Fixing' },
        { id: 'P4', name: 'Complex Generation' },
        { id: 'P5', name: 'Math Reasoning' }
    ];
    for (const test of tests) {
        const validator = validators[test.id];
        const passed = validator(saved);
        scores[test.id] = passed ? 1 : 0;
        totalScore += scores[test.id];
        testResults.push({
            test_id: test.id,
            test_name: test.name,
            passed,
            response_time_ms: 2000,
            output_quality: passed ? 100 : 0
        });
    }
    // Display results
    console.log('═'.repeat(60));
    console.log('                    TEST RESULTS');
    console.log('═'.repeat(60) + '\n');
    console.log('Individual Scores:');
    for (const test of tests) {
        const score = scores[test.id];
        console.log(`  ${test.name}: ${score === 1 ? '✅ PASSED' : '❌ FAILED'}`);
    }
    console.log('\n📊 Overall Score: ' + totalScore + '/5 (' + Math.round(totalScore / 5 * 100) + '%)');
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
                ttft_ms: 2000,
                avg_output_length: saved.length / 5,
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
        }
        else {
            console.log('⚠️  Failed to submit results to community');
        }
    }
    catch (error) {
        console.log('⚠️  Could not connect to community server');
        console.log('   Results saved locally only');
    }
    // Update config
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    config.lastRun = new Date().toISOString();
    config.totalRuns = (config.totalRuns || 0) + 1;
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Thank you for contributing to Claude NerfDetector!');
    console.log('📈 View global stats: https://claude-nerf-detector.vercel.app');
    console.log('═'.repeat(60) + '\n');
}
// Import Claude runner
import { runClaudeTests } from './claude-runner.js';
// CLI setup
program
    .name('claude-nerf-test')
    .description('Community performance testing for Claude Code')
    .version('2.7.0');
program
    .command('run', { isDefault: true })
    .description('Run performance tests with automatic scoring after 30 seconds')
    .action(async () => {
    await runTests();
});
program
    .command('claude')
    .description('Run tests optimized for Claude (programmatic solving)')
    .action(async () => {
    await runClaudeTests();
});
program
    .command('manual-score')
    .description('Manually score saved responses (backup option)')
    .action(async () => {
    await scoreManual();
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
        }
        else {
            console.log('No configuration found. Run tests to create one.');
        }
    }
});
program.parse();
export { runTests };
//# sourceMappingURL=index.js.map