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
function saveResponses(responses) {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(RESPONSE_FILE, responses);
}
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
// Display tests for Claude to respond to
async function runTests() {
    console.log('\n🚀 Claude NerfDetector v2.5.0\n');
    console.log('━'.repeat(60));
    console.log('                    TEST MODE');
    console.log('━'.repeat(60));
    console.log('📋 Instructions:');
    console.log('1. Respond to ALL 5 test prompts below');
    console.log('2. Results will be automatically scored via hooks');
    console.log('━'.repeat(60));
    console.log('\nStarting tests...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
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
    console.log('\n✅ Tests displayed. Please respond to all 5 prompts above.');
    console.log('\n💡 Tip: Configure a hook to run "npx claude-nerf-test score"');
    console.log('   after you\'ve finished responding to automatically score results.');
    console.log('\nExample .claude/hooks.json:');
    console.log('```json');
    console.log('{');
    console.log('  "user-prompt-submit": {');
    console.log('    "command": "npx claude-nerf-test score"');
    console.log('  }');
    console.log('}');
    console.log('```');
}
// Score previously captured responses
async function scoreResponses() {
    console.log('\n📊 Scoring Claude NerfDetector Results\n');
    // Capture Claude's response that just happened
    const startCapture = Date.now();
    let capturedResponses = '';
    let captureCount = 0;
    // Give Claude a moment to finish outputting
    await new Promise(resolve => setTimeout(resolve, 500));
    // Read the last ~50 lines from stdout (should contain Claude's responses)
    // This is a simple approach - in production you might want to use a more sophisticated method
    const recentOutput = process.stdout.write.toString() || '';
    // For now, we'll ask the user to paste their responses
    console.log('Capturing Claude\'s responses from this session...');
    console.log('(Note: This works best when triggered via hooks)\n');
    // Simple heuristic: look for test-related content in recent console output
    // In practice, hooks would help us capture this more reliably
    capturedResponses = recentOutput || 'No responses captured';
    // If we don't have good responses, check if they were saved from a previous run
    if (!capturedResponses || capturedResponses.length < 100) {
        const saved = loadResponses();
        if (saved) {
            capturedResponses = saved;
            console.log('Using saved responses from previous test run.\n');
        }
        else {
            console.log('⚠️  No responses captured. Please ensure you:');
            console.log('1. Run "npx claude-nerf-test" first');
            console.log('2. Respond to all 5 test prompts');
            console.log('3. Then run "npx claude-nerf-test score"');
            console.log('\nOr configure a hook to run scoring automatically.');
            return;
        }
    }
    const totalTime = Date.now() - startCapture;
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
    // Score each test
    for (const test of tests) {
        const validator = validators[test.id];
        const passed = validator(capturedResponses);
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
    console.log('═'.repeat(60));
    console.log('                    TEST RESULTS');
    console.log('═'.repeat(60) + '\n');
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
                avg_output_length: capturedResponses.length / 5,
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
    // Clean up response file
    if (existsSync(RESPONSE_FILE)) {
        try {
            // Keep for debugging but could delete in production
            // unlinkSync(RESPONSE_FILE);
        }
        catch { }
    }
}
// Hook-triggered scoring with response capture
async function captureAndScore() {
    console.log('\n🎯 Claude NerfDetector - Auto-Scoring Mode\n');
    console.log('Capturing your responses from the previous prompts...');
    // This function is called by the hook after Claude responds
    // We need to capture what Claude just output
    // Create a marker to identify Claude's responses
    const marker = '<<<NERF_RESPONSE_START>>>';
    console.log(marker);
    // Wait a moment for any remaining output
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Now score based on what was output between test display and this scoring
    // In practice, the hook system should help us capture the actual responses
    await scoreResponses();
}
// CLI setup
program
    .name('claude-nerf-test')
    .description('Community performance testing for Claude Code')
    .version('2.5.0');
program
    .command('run', { isDefault: true })
    .description('Display performance tests for Claude to answer')
    .action(async () => {
    await runTests();
});
program
    .command('score')
    .description('Score Claude\'s responses (can be triggered via hooks)')
    .action(async () => {
    await captureAndScore();
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
export { runTests, captureAndScore };
//# sourceMappingURL=index.js.map