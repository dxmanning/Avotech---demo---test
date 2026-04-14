#!/usr/bin/env node
/**
 * showLogs — CLI viewer for test run history.
 *
 * Usage:
 *   npm run logs               → show last 10 runs (summary table)
 *   npm run logs -- --last 20  → show last N runs
 *   npm run logs -- --run <id> → show full detail for a specific run
 *   npm run logs -- --fails    → show only runs with failures
 */

import * as fs from 'fs';
import * as path from 'path';

const LOGS_DIR = path.resolve('logs');
const HISTORY_FILE = path.join(LOGS_DIR, 'run-history.jsonl');

// ─── Parse args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const lastN = (() => {
  const i = args.indexOf('--last');
  return i !== -1 ? parseInt(args[i + 1], 10) : 10;
})();
const specificRun = (() => {
  const i = args.indexOf('--run');
  return i !== -1 ? args[i + 1] : null;
})();
const failsOnly = args.includes('--fails');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusIcon(status: string): string {
  if (status === 'passed') return '✅';
  if (status === 'interrupted') return '⚠️ ';
  return '❌';
}

function pad(str: string | number, len: number, dir: 'left' | 'right' = 'right'): string {
  const s = String(str);
  return dir === 'right'
    ? s.padEnd(len).slice(0, len)
    : s.padStart(len).slice(-len);
}

function colorize(text: string, color: 'green' | 'red' | 'yellow' | 'cyan' | 'reset'): string {
  const codes = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', reset: '\x1b[0m' };
  return `${codes[color]}${text}${codes.reset}`;
}

// ─── Load history ─────────────────────────────────────────────────────────────

if (!fs.existsSync(HISTORY_FILE)) {
  console.log('No run history found. Run the tests first:');
  console.log('  npx playwright test --grep "@smoke" --project=chromium');
  process.exit(0);
}

const allRuns = fs
  .readFileSync(HISTORY_FILE, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));

// ─── Show single run detail ───────────────────────────────────────────────────

if (specificRun) {
  const runFile = path.join(LOGS_DIR, `run-${specificRun}.json`);
  if (!fs.existsSync(runFile)) {
    // Try partial match
    const files = fs.readdirSync(LOGS_DIR).filter((f) => f.includes(specificRun));
    if (files.length === 0) {
      console.error(`Run "${specificRun}" not found in ${LOGS_DIR}`);
      process.exit(1);
    }
    const runData = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, files[0]), 'utf8'));
    printRunDetail(runData);
  } else {
    printRunDetail(JSON.parse(fs.readFileSync(runFile, 'utf8')));
  }
  process.exit(0);
}

// ─── Show history table ───────────────────────────────────────────────────────

let runs = [...allRuns].reverse(); // newest first
if (failsOnly) runs = runs.filter((r) => r.status !== 'passed');
runs = runs.slice(0, lastN);

console.log('\n' + colorize('  CSI Regression — Run History', 'cyan'));
console.log('  ' + '─'.repeat(82));
console.log(
  '  ' +
  [
    pad('', 3),
    pad('Timestamp', 22),
    pad('Status', 14),
    pad('Passed', 8),
    pad('Failed', 8),
    pad('Total', 7),
    pad('Rate', 6),
    pad('Duration', 10),
    pad('Build', 14),
  ].join(' ')
);
console.log('  ' + '─'.repeat(82));

runs.forEach((run, i) => {
  const ts = new Date(run.timestamp).toLocaleString('en-CA', {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const passColor = run.summary.failed === 0 ? 'green' : 'red';
  const row = [
    pad(String(i + 1), 3),
    pad(ts, 22),
    pad(`${statusIcon(run.status)} ${run.status}`, 14),
    colorize(pad(run.summary.passed, 8), 'green'),
    colorize(pad(run.summary.failed, 8), run.summary.failed > 0 ? 'red' : 'reset'),
    pad(run.summary.total, 7),
    colorize(pad(run.summary.passRate, 6), passColor),
    pad(run.duration, 10),
    pad(run.environment?.buildId ?? 'local', 14),
  ];
  console.log('  ' + row.join(' '));
});

console.log('  ' + '─'.repeat(82));
console.log(`  Showing ${runs.length} of ${allRuns.length} runs${failsOnly ? ' (failures only)' : ''}`);
console.log(colorize('\n  Commands:', 'cyan'));
console.log('  npm run logs -- --last 20       show more runs');
console.log('  npm run logs -- --fails          show only failed runs');
console.log(`  npm run logs -- --run <runId>    show test details for a run\n`);

// ─── Detail printer ───────────────────────────────────────────────────────────

function printRunDetail(run: any): void {
  console.log('\n' + colorize(`  Run Detail: ${run.runId}`, 'cyan'));
  console.log('  ' + '─'.repeat(70));
  console.log(`  Timestamp : ${run.timestamp}`);
  console.log(`  Duration  : ${run.duration}`);
  console.log(`  Status    : ${statusIcon(run.status)} ${run.status}`);
  console.log(`  Pass Rate : ${run.summary.passRate} (${run.summary.passed}/${run.summary.total})`);
  console.log(`  Base URL  : ${run.environment.baseUrl}`);
  console.log(`  Build     : ${run.environment.buildId}`);
  console.log(`  Node      : ${run.environment.nodeVersion}`);
  console.log('\n  ' + colorize('Test Results', 'cyan'));
  console.log('  ' + '─'.repeat(70));

  const groupedByFile: Record<string, typeof run.tests> = {};
  for (const t of run.tests) {
    if (!groupedByFile[t.file]) groupedByFile[t.file] = [];
    groupedByFile[t.file].push(t);
  }

  for (const [file, tests] of Object.entries(groupedByFile)) {
    console.log(`\n  📁 ${colorize(file, 'cyan')}`);
    for (const t of tests as any[]) {
      const icon = t.status === 'passed' ? colorize('✓', 'green') : colorize('✗', 'red');
      const dur = `${(t.durationMs / 1000).toFixed(1)}s`;
      const retry = t.retries > 0 ? colorize(` (retry ${t.retries})`, 'yellow') : '';
      console.log(`     ${icon} ${pad(t.title, 58)} ${pad(dur, 6)}${retry}`);
      if (t.error) {
        console.log(`       ${colorize('→ ' + t.error, 'red')}`);
      }
    }
  }
  console.log('\n  ' + '─'.repeat(70) + '\n');
}
