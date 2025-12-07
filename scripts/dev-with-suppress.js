#!/usr/bin/env node

// Wrapper script to suppress baseline-browser-mapping warnings
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = 'true';

const { spawn } = require('child_process');

// Use shell: true for cross-platform compatibility (Windows .cmd files)
const next = spawn('next', ['dev'], {
  shell: true,
  env: {
    ...process.env,
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: 'true',
  },
  stdio: ['inherit', 'pipe', 'pipe'],
});

// Filter out baseline-browser-mapping warnings
next.stdout.on('data', (data) => {
  const output = data.toString();
  if (!output.includes('[baseline-browser-mapping] The data in this module is over two months old')) {
    process.stdout.write(data);
  }
});

next.stderr.on('data', (data) => {
  const output = data.toString();
  if (!output.includes('[baseline-browser-mapping] The data in this module is over two months old')) {
    process.stderr.write(data);
  }
});

next.on('close', (code) => {
  process.exit(code || 0);
});

