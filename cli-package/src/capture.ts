// Response capture utilities for Claude NerfDetector

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.claude-nerf');
const CAPTURE_FILE = join(CONFIG_DIR, 'capture.txt');
const TEST_STATE_FILE = join(CONFIG_DIR, 'test_state.json');

interface TestState {
  testsDisplayed: boolean;
  testStartTime: number;
  capturedResponses: string[];
}

// Save test state
export function saveTestState(state: TestState) {
  writeFileSync(TEST_STATE_FILE, JSON.stringify(state, null, 2));
}

// Load test state
export function loadTestState(): TestState | null {
  if (existsSync(TEST_STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(TEST_STATE_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

// Clear test state
export function clearTestState() {
  if (existsSync(TEST_STATE_FILE)) {
    try {
      require('fs').unlinkSync(TEST_STATE_FILE);
    } catch {}
  }
}

// Intercept console output for response capture
export function setupResponseCapture() {
  const originalWrite = process.stdout.write;
  const originalLog = console.log;
  let isCapturing = false;
  let capturedText = '';
  
  // Start capturing after tests are displayed
  process.stdout.write = function(chunk: any, ...args: any[]): boolean {
    const text = chunk?.toString() || '';
    
    // Check if we should start capturing
    if (text.includes('RESPOND TO ALL 5 PROMPTS BELOW')) {
      isCapturing = true;
      capturedText = '';
    }
    
    // Capture responses
    if (isCapturing) {
      capturedText += text;
      
      // Save periodically
      if (capturedText.length > 0) {
        writeFileSync(CAPTURE_FILE, capturedText);
      }
    }
    
    // Call original
    return originalWrite.apply(process.stdout, [chunk, ...args] as any);
  };
  
  // Also capture console.log
  console.log = function(...args: any[]) {
    if (isCapturing) {
      const text = args.join(' ') + '\n';
      capturedText += text;
      writeFileSync(CAPTURE_FILE, capturedText);
    }
    return originalLog.apply(console, args);
  };
  
  return {
    getCaptured: () => capturedText,
    stopCapture: () => {
      isCapturing = false;
      process.stdout.write = originalWrite;
      console.log = originalLog;
    }
  };
}

// Load captured responses
export function loadCapturedResponses(): string | null {
  if (existsSync(CAPTURE_FILE)) {
    return readFileSync(CAPTURE_FILE, 'utf-8');
  }
  return null;
}

// Clear captured responses
export function clearCapturedResponses() {
  if (existsSync(CAPTURE_FILE)) {
    try {
      require('fs').unlinkSync(CAPTURE_FILE);
    } catch {}
  }
}