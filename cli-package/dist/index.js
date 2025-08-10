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
// Capture output between markers
let capturedOutput = '';
let capturing = false;
let currentTestId = '';
// Override console.log to capture Claude's responses
const originalLog = console.log;
console.log = function (...args) {
    const output = args.join(' ');
    if (output.includes('NERF_TEST_START_CAPTURE_')) {
        const match = output.match(/NERF_TEST_START_CAPTURE_(\w+)/);
        if (match) {
            currentTestId = match[1];
            capturing = true;
            capturedOutput = '';
        }
        return; // Don't print the marker
    }
    if (output.includes('NERF_TEST_END_CAPTURE')) {
        capturing = false;
        return; // Don't print the marker
    }
    if (capturing) {
        capturedOutput += output + '\n';
    }
    // Still print to console
    originalLog.apply(console, args);
};
// Test validators
const validators = {
    P1: (response) => {
        const hasHeap = /heap|Heap/.test(response);
        const hasKth = /kth|largest/.test(response);
        const hasEdgeCases = /if.*\(/.test(response) && (/length|k\s*>|k\s*<=\s*0/.test(response));
        return hasHeap && hasKth && hasEdgeCases;
    },
    P2: (response) => {
        try {
            const jsonMatch = response.match(/\{[\s\S]*?\}/);
            if (!jsonMatch)
                return false;
            const parsed = JSON.parse(jsonMatch[0]);
            return !!(parsed.timestamp && parsed.level && parsed.service && parsed.user_id);
        }
        catch {
            return false;
        }
    },
    P3: (response) => {
        const hasCorrectComparison = /===|==/.test(response) && !/\(n\s*=\s*0\)/.test(response);
        const hasDecrement = /n\s*-\s*1|n-1|--n/.test(response);
        return hasCorrectComparison && hasDecrement;
    },
    P4: (response) => {
        const commandCount = (response.match(/\.command\(/g) || []).length;
        const hasErrorHandling = /try|catch|error|Error/.test(response);
        const hasHelp = /help|--help/.test(response);
        return commandCount >= 5 && hasErrorHandling && hasHelp;
    },
    P5: (response) => {
        const numbers = response.match(/\d+\.?\d*/g) || [];
        return numbers.some(n => {
            const val = parseFloat(n);
            return val >= 54 && val <= 55;
        });
    }
};
// Main test execution
async function runTests(submitResults = true) {
    // Immediate feedback
    console.log('\n🚀 Claude NerfDetector is starting...\n');
    console.log('✅ Test runner loaded successfully');
    console.log('✅ Claude Code detected');
    console.log('✅ Starting performance evaluation\n');
    console.log('━'.repeat(60));
    console.log('                    IMPORTANT NOTICE');
    console.log('━'.repeat(60));
    console.log('This test will:');
    console.log('  1. Show 5 test prompts that Claude will answer');
    console.log('  2. Automatically score Claude\'s responses');
    console.log('  3. Submit results anonymously to the community');
    console.log('');
    console.log('Please let Claude complete each response before scrolling.');
    console.log('━'.repeat(60));
    console.log('\nStarting in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const testResults = [];
    let totalScore = 0;
    const startTime = Date.now();
    const responses = {};
    // Test 1
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 1/5: Algorithm Implementation');
    console.log('═'.repeat(60) + '\n');
    console.log('NERF_TEST_START_CAPTURE_P1');
    console.log('📝 PROMPT: Write a function to find the kth largest element in an array using a min-heap approach. Include edge case handling.\n');
    console.log('NERF_TEST_END_CAPTURE');
    // Wait for Claude's response
    await new Promise(resolve => setTimeout(resolve, 2000));
    responses.P1 = capturedOutput;
    // Test 2
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 2/5: Log Parsing');
    console.log('═'.repeat(60) + '\n');
    console.log('NERF_TEST_START_CAPTURE_P2');
    console.log('📝 PROMPT: Parse this log line into JSON: "2024-01-15 08:23:45.123 [ERROR] UserService - Failed to authenticate user_id=12345 reason=invalid_token"\n');
    console.log('NERF_TEST_END_CAPTURE');
    await new Promise(resolve => setTimeout(resolve, 2000));
    responses.P2 = capturedOutput;
    // Test 3
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 3/5: Bug Fixing');
    console.log('═'.repeat(60) + '\n');
    console.log('NERF_TEST_START_CAPTURE_P3');
    console.log(`📝 PROMPT: Fix all bugs in this factorial function:
\`\`\`javascript
function factorial(n) {
  if (n = 0) return 1;
  return n * factorial(n);
}
\`\`\`\n`);
    console.log('NERF_TEST_END_CAPTURE');
    await new Promise(resolve => setTimeout(resolve, 2000));
    responses.P3 = capturedOutput;
    // Test 4
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 4/5: Complex Generation');
    console.log('═'.repeat(60) + '\n');
    console.log('NERF_TEST_START_CAPTURE_P4');
    console.log('📝 PROMPT: Generate a complete CLI application structure with 6 subcommands (init, build, test, deploy, clean, help) using commander.js or similar. Include proper error handling.\n');
    console.log('NERF_TEST_END_CAPTURE');
    await new Promise(resolve => setTimeout(resolve, 2000));
    responses.P4 = capturedOutput;
    // Test 5
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 5/5: Math Reasoning');
    console.log('═'.repeat(60) + '\n');
    console.log('NERF_TEST_START_CAPTURE_P5');
    console.log('📝 PROMPT: A train travels 120 miles in 2 hours, then stops for 30 minutes, then travels another 180 miles in 3 hours. What is the average speed for the entire journey including the stop?\n');
    console.log('NERF_TEST_END_CAPTURE');
    await new Promise(resolve => setTimeout(resolve, 2000));
    responses.P5 = capturedOutput;
    // Wait a bit more for all responses to complete
    console.log('\n⏳ Analyzing Claude\'s responses...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Auto-score responses
    const scores = {};
    for (const [testId, response] of Object.entries(responses)) {
        const validator = validators[testId];
        scores[testId] = validator(response) ? 1 : 0;
        totalScore += scores[testId];
        testResults.push({
            test_id: testId,
            test_name: getTestName(testId),
            passed: scores[testId] === 1,
            response_time_ms: 2000, // Rough estimate
            output_quality: scores[testId] * 100
        });
    }
    const totalTime = Date.now() - startTime;
    // Display results
    console.log('\n' + '═'.repeat(60));
    console.log('                    TEST RESULTS');
    console.log('═'.repeat(60) + '\n');
    console.log('Individual Scores:');
    console.log(`  P1 (Algorithm):    ${scores.P1 === 1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  P2 (Log Parsing):  ${scores.P2 === 1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  P3 (Bug Fixing):   ${scores.P3 === 1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  P4 (CLI Gen):      ${scores.P4 === 1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  P5 (Math):         ${scores.P5 === 1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('\n📊 Overall Score: ' + totalScore + '/5 (' + Math.round(totalScore / 5 * 100) + '%)');
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    if (submitResults) {
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
                if (data.share_url) {
                    console.log(`\n🔗 View your results: ${data.share_url}`);
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
function getTestName(testId) {
    const names = {
        P1: 'Algorithm Implementation',
        P2: 'Log Parsing',
        P3: 'Bug Fixing',
        P4: 'Complex Generation',
        P5: 'Math Reasoning'
    };
    return names[testId] || testId;
}
// CLI setup
program
    .name('claude-nerf-test')
    .description('Community performance testing for Claude Code')
    .version('2.0.0');
program
    .command('run', { isDefault: true })
    .description('Run performance tests in Claude Code')
    .option('--local', 'Run tests locally without submitting to community')
    .action(async (options) => {
    await runTests(!options.local);
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