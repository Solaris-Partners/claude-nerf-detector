#!/usr/bin/env node

import { program } from 'commander';
import { runTests } from './test-runner';

program
  .name('claude-nerf-test')
  .description('Community performance testing for Claude Code')
  .version('1.0.0');

program
  .command('run', { isDefault: true })
  .description('Run performance tests')
  .option('--local', 'Run tests locally without submitting to community')
  .option('--verbose', 'Show detailed output')
  .action((options) => {
    runTests(!options.local, options.verbose);
  });

program
  .command('config')
  .description('View or modify configuration')
  .option('--reset', 'Reset anonymous user ID')
  .option('--show', 'Show current configuration')
  .action((options) => {
    if (options.reset) {
      console.log('Configuration reset');
    }
    if (options.show) {
      console.log('Current configuration...');
    }
  });

program.parse();

export { runTests };