#!/usr/bin/env node
import { createHash } from 'crypto';
import { homedir, hostname, platform } from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
// Test suite definition
const TEST_SUITE = [
    {
        id: 'P1',
        name: 'Algorithm Implementation',
        prompt: 'Write a function to find the kth largest element in an array using a min-heap approach. Include edge case handling.',
        validate: (response) => {
            const hasHeapImplementation = response.includes('heap') || response.includes('Heap');
            const hasKthLargest = response.includes('kth') || response.includes('largest');
            const hasEdgeCases = response.includes('if') && (response.includes('length') || response.includes('k >'));
            return hasHeapImplementation && hasKthLargest && hasEdgeCases;
        }
    },
    {
        id: 'P2',
        name: 'Log Parsing',
        prompt: 'Parse this log line into JSON: "2024-01-15 08:23:45.123 [ERROR] UserService - Failed to authenticate user_id=12345 reason=invalid_token"',
        validate: (response) => {
            try {
                const jsonMatch = response.match(/\{[\s\S]*?\}/);
                if (!jsonMatch)
                    return false;
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.timestamp && parsed.level && parsed.service && parsed.user_id;
            }
            catch {
                return false;
            }
        }
    },
    {
        id: 'P3',
        name: 'Bug Fixing',
        prompt: 'Fix all bugs in this factorial function:\n```javascript\nfunction factorial(n) {\n  if (n = 0) return 1;\n  return n * factorial(n);\n}\n```',
        validate: (response) => {
            const hasCorrectComparison = response.includes('===') || response.includes('==');
            const hasDecrementOrMinus = response.includes('n - 1') || response.includes('n-1') || response.includes('--n');
            return hasCorrectComparison && hasDecrementOrMinus;
        }
    },
    {
        id: 'P4',
        name: 'Complex Generation',
        prompt: 'Generate a complete CLI application structure with 6 subcommands (init, build, test, deploy, clean, help) using commander.js or similar. Include proper error handling.',
        validate: (response) => {
            const commandCount = (response.match(/\.command\(/g) || []).length;
            const hasErrorHandling = response.includes('try') || response.includes('catch') || response.includes('error');
            const hasHelp = response.includes('help') || response.includes('--help');
            return commandCount >= 5 && hasErrorHandling && hasHelp;
        }
    },
    {
        id: 'P5',
        name: 'Math Reasoning',
        prompt: 'A train travels 120 miles in 2 hours, then stops for 30 minutes, then travels another 180 miles in 3 hours. What is the average speed for the entire journey including the stop?',
        validate: (response) => {
            // Looking for correct answer around 54.5 mph
            const numbers = response.match(/\d+\.?\d*/g) || [];
            return numbers.some(n => {
                const val = parseFloat(n);
                return val >= 54 && val <= 55;
            });
        }
    }
];
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
// Main test execution
async function runTests(submitResults = true) {
    console.log('🧪 Running Claude Performance Tests...\n');
    console.log('📝 Please respond to each prompt below.\n');
    console.log('⚠️  Note: Tests are intentionally challenging to detect capability changes.\n');
    console.log('━'.repeat(60) + '\n');
    const results = [];
    let totalScore = 0;
    const startTime = Date.now();
    const ttftTimes = [];
    const outputLengths = [];
    for (const test of TEST_SUITE) {
        console.log(`\n📌 Test ${test.id}: ${test.name}`);
        console.log('─'.repeat(50));
        console.log('\nPROMPT:');
        console.log(test.prompt);
        console.log('\n[Claude Code will process this prompt above]\n');
        // This is where Claude Code will process the prompt
        // The test runner waits for Claude's response
        const testStart = Date.now();
        // For NPX execution, we'll simulate waiting for response
        console.log('⏳ Awaiting Claude Code response...\n');
        console.log('(In actual usage, Claude Code will generate a response here)\n');
        // Placeholder for actual response capture
        const response = '';
        const responseTime = Date.now() - testStart;
        ttftTimes.push(responseTime);
        outputLengths.push(response.length);
        const passed = false; // Will be determined by actual response
        results.push({
            test_id: test.id,
            test_name: test.name,
            passed,
            response_time_ms: responseTime,
            output_quality: passed ? 100 : 0
        });
        if (passed) {
            totalScore++;
        }
    }
    const totalTime = Date.now() - startTime;
    const avgTtft = ttftTimes.length > 0 ? ttftTimes.reduce((a, b) => a + b, 0) / ttftTimes.length : 0;
    const avgOutputLength = outputLengths.length > 0 ? outputLengths.reduce((a, b) => a + b, 0) / outputLengths.length : 0;
    // Display results
    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 Your Results:');
    console.log(`  Score: ${totalScore}/${TEST_SUITE.length} (${Math.round(totalScore / TEST_SUITE.length * 100)}%)`);
    console.log(`  Avg Response Time: ${(avgTtft / 1000).toFixed(1)}s`);
    console.log(`  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    if (submitResults) {
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
                    total_tests: TEST_SUITE.length,
                    ttft_ms: Math.round(avgTtft),
                    avg_output_length: Math.round(avgOutputLength),
                    region,
                    test_details: results
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
            }
            else {
                console.log('  ⚠️  Failed to submit results');
            }
        }
        catch (error) {
            console.log('  ⚠️  Could not connect to community server');
            console.log('  Results saved locally only');
        }
    }
    // Update config
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    config.lastRun = new Date().toISOString();
    config.totalRuns = (config.totalRuns || 0) + 1;
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('\n✅ Test complete! Thank you for contributing to the community.\n');
    console.log('📈 View global statistics at: https://claude-nerf-detector.vercel.app\n');
}
// CLI setup
program
    .name('claude-nerf-test')
    .description('Community performance testing for Claude Code')
    .version('1.0.0');
program
    .command('run', { isDefault: true })
    .description('Run performance tests')
    .option('--local', 'Run tests locally without submitting to community')
    .option('--verbose', 'Show detailed output')
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