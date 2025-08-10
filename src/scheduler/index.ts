import cron from 'node-cron';
import { TestRunner } from '../tests/runner.js';
import { config } from 'dotenv';

config();

export class Scheduler {
  private runner: TestRunner;
  private tasks: cron.ScheduledTask[] = [];

  constructor() {
    this.runner = new TestRunner();
  }

  start() {
    const scheduleTimes = (process.env.SCHEDULE_TIMES || '09:00,21:00').split(',');
    const timezone = process.env.TIMEZONE || 'America/Chicago';

    console.log(`Starting scheduler with times: ${scheduleTimes.join(', ')} ${timezone}`);

    for (const time of scheduleTimes) {
      const [hour, minute] = time.trim().split(':');
      const cronExpression = `${minute} ${hour} * * *`;
      
      const task = cron.schedule(
        cronExpression,
        async () => {
          console.log(`Running scheduled test suite at ${new Date().toISOString()}`);
          try {
            await this.runner.runSuite();
            console.log('Test suite completed successfully');
          } catch (error) {
            console.error('Error running test suite:', error);
          }
        },
        {
          scheduled: true,
          timezone,
        }
      );

      this.tasks.push(task);
      console.log(`Scheduled task for ${time} ${timezone} (cron: ${cronExpression})`);
    }

    // Also run immediately if requested
    if (process.env.RUN_ON_START === 'true') {
      this.runNow();
    }
  }

  async runNow() {
    console.log('Running test suite immediately...');
    try {
      const result = await this.runner.runSuite();
      console.log('Test suite completed:', {
        status: result.status,
        score: result.correctnessScore,
        flags: result.flags,
      });
    } catch (error) {
      console.error('Error running test suite:', error);
    }
  }

  stop() {
    for (const task of this.tasks) {
      task.stop();
    }
    this.runner.close();
    console.log('Scheduler stopped');
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const scheduler = new Scheduler();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down scheduler...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down scheduler...');
    scheduler.stop();
    process.exit(0);
  });

  // Check for immediate run flag
  if (process.argv.includes('--run-now')) {
    scheduler.runNow().then(() => {
      if (!process.argv.includes('--keep-running')) {
        scheduler.stop();
        process.exit(0);
      }
    });
  } else {
    scheduler.start();
    console.log('Scheduler is running. Press Ctrl+C to stop.');
  }
}