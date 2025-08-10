import express from 'express';
import { config } from 'dotenv';
import { NerfDatabase } from '../db/database.js';
import { TestRunner } from '../tests/runner.js';

config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// CORS for development
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// API Routes
const database = new NerfDatabase();

// Get recent runs
app.get('/api/runs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const runs = database.getRecentRuns(limit);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

// Get specific run details
app.get('/api/runs/:id', (req, res) => {
  try {
    const run = database.getRunById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }
    const testCases = database.getTestCasesByRunId(req.params.id);
    res.json({ run, testCases });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch run details' });
  }
});

// Get 7-day statistics
app.get('/api/stats/seven-day', (_req, res) => {
  try {
    const stats = database.getSevenDayStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get current configuration
app.get('/api/config', (_req, res) => {
  try {
    const config = {
      cacheBusting: database.getConfig('cache_busting') === 'true',
      storeRawOutputs: database.getConfig('store_raw_outputs') === 'true',
      scheduleTimes: database.getConfig('schedule_times') || process.env.SCHEDULE_TIMES || '09:00,21:00',
      timezone: database.getConfig('timezone') || process.env.TIMEZONE || 'America/Chicago',
      suiteVersion: database.getConfig('suite_version') || '1.0.0',
      temperature: parseFloat(database.getConfig('temperature') || process.env.TEMPERATURE || '0.1'),
      topP: parseFloat(database.getConfig('top_p') || process.env.TOP_P || '0.3'),
      maxTokensP4: parseInt(database.getConfig('max_tokens_p4') || process.env.MAX_TOKENS_P4 || '1200'),
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update configuration
app.put('/api/config', (req, res) => {
  try {
    const updates = req.body;
    
    if (updates.cacheBusting !== undefined) {
      database.setConfig('cache_busting', String(updates.cacheBusting));
    }
    if (updates.storeRawOutputs !== undefined) {
      database.setConfig('store_raw_outputs', String(updates.storeRawOutputs));
    }
    if (updates.scheduleTimes !== undefined) {
      database.setConfig('schedule_times', updates.scheduleTimes);
    }
    if (updates.timezone !== undefined) {
      database.setConfig('timezone', updates.timezone);
    }
    if (updates.temperature !== undefined) {
      database.setConfig('temperature', String(updates.temperature));
    }
    if (updates.topP !== undefined) {
      database.setConfig('top_p', String(updates.topP));
    }
    if (updates.maxTokensP4 !== undefined) {
      database.setConfig('max_tokens_p4', String(updates.maxTokensP4));
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Trigger manual run
app.post('/api/run', async (_req, res) => {
  try {
    res.json({ message: 'Test suite started', status: 'running' });
    
    // Run asynchronously
    const runner = new TestRunner();
    runner.runSuite().then(result => {
      console.log('Manual test suite completed:', result.status);
    }).catch(error => {
      console.error('Error in manual test suite:', error);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start test suite' });
  }
});

// Get latest run status
app.get('/api/status', (_req, res) => {
  try {
    const runs = database.getRecentRuns(1);
    if (runs.length === 0) {
      return res.json({ 
        status: 'UNKNOWN',
        message: 'No runs found',
        lastRun: null,
      });
    }
    
    const latestRun = runs[0];
    res.json({
      status: latestRun.status,
      lastRun: latestRun.timestamp,
      correctnessScore: latestRun.correctness_score,
      flags: latestRun.flags,
      runId: latestRun.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  database.close();
  process.exit(0);
});