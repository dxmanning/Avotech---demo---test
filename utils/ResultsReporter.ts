import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
  Suite,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestLog {
  id: string;
  title: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  durationMs: number;
  browser: string;
  error?: string;
  retries: number;
}

interface RunLog {
  runId: string;
  timestamp: string;
  duration: string;
  status: 'passed' | 'failed' | 'interrupted';
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
    passRate: string;
  };
  tests: TestLog[];
  environment: {
    baseUrl: string;
    platform: string;
    nodeVersion: string;
    buildId: string;
  };
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

export default class ResultsReporter implements Reporter {
  private readonly logsDir: string;
  private readonly historyFile: string;
  private tests: TestLog[] = [];
  private startTime = Date.now();

  constructor(options?: { outputDir?: string }) {
    this.logsDir = path.resolve(options?.outputDir ?? 'logs');
    this.historyFile = path.join(this.logsDir, 'run-history.jsonl');
    fs.mkdirSync(this.logsDir, { recursive: true });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const suiteTitles = test.titlePath().slice(0, -1);
    const browser = suiteTitles.find((t) => /chromium|firefox|webkit/i.test(t)) ?? 'unknown';

    const log: TestLog = {
      id: test.id,
      title: test.titlePath().slice(-1)[0],
      file: path.relative(process.cwd(), test.location.file),
      status: result.status,
      durationMs: result.duration,
      browser: browser.replace(/.*\[(.+)\].*/, '$1'),
      retries: result.retry,
      ...(result.error
        ? { error: result.error.message?.split('\n')[0].slice(0, 200) }
        : {}),
    };

    this.tests.push(log);
  }

  onEnd(result: FullResult): void {
    const passed   = this.tests.filter((t) => t.status === 'passed').length;
    const failed   = this.tests.filter((t) => t.status === 'failed').length;
    const skipped  = this.tests.filter((t) => t.status === 'skipped').length;
    const timedOut = this.tests.filter((t) => t.status === 'timedOut').length;
    const total    = this.tests.length;

    const durationMs = Date.now() - this.startTime;
    const mins = Math.floor(durationMs / 60_000);
    const secs = Math.floor((durationMs % 60_000) / 1_000);

    const runLog: RunLog = {
      runId: new Date().toISOString().replace(/[:.]/g, '-'),
      timestamp: new Date().toISOString(),
      duration: `${mins}m ${secs}s`,
      status: result.status,
      summary: {
        total,
        passed,
        failed,
        skipped,
        timedOut,
        passRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : 'N/A',
      },
      tests: this.tests,
      environment: {
        baseUrl: process.env.BASE_URL ?? 'https://personal-oajqxmji.outsystemscloud.com',
        platform: process.platform,
        nodeVersion: process.version,
        buildId: process.env.BUILD_ID ?? 'local',
      },
    };

    // ── Write per-run JSON file ───────────────────────────────────────────────
    const runFile = path.join(this.logsDir, `run-${runLog.runId}.json`);
    fs.writeFileSync(runFile, JSON.stringify(runLog, null, 2), 'utf8');

    // ── Append summary line to run-history.jsonl ──────────────────────────────
    const historySummary = {
      runId: runLog.runId,
      timestamp: runLog.timestamp,
      duration: runLog.duration,
      status: runLog.status,
      summary: runLog.summary,
      environment: runLog.environment,
    };
    fs.appendFileSync(this.historyFile, JSON.stringify(historySummary) + '\n', 'utf8');

    // ── Print compact summary to stdout ──────────────────────────────────────
    const icon = result.status === 'passed' ? '✅' : result.status === 'interrupted' ? '⚠️' : '❌';
    console.log('\n' + '─'.repeat(60));
    console.log(`${icon}  Run complete: ${runLog.summary.passed}/${runLog.summary.total} passed (${runLog.summary.passRate}) in ${runLog.duration}`);
    if (failed > 0 || timedOut > 0) {
      this.tests
        .filter((t) => t.status === 'failed' || t.status === 'timedOut')
        .forEach((t) => console.log(`   ✗ [${t.status.toUpperCase()}] ${t.title}`));
    }
    console.log(`📄  Log: ${path.relative(process.cwd(), runFile)}`);
    console.log('─'.repeat(60) + '\n');
  }

  printsToStdio(): boolean {
    return true;
  }
}
