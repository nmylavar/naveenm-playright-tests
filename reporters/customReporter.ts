/**
 * Custom reporter: logs failures with project/site and error message, and prints a failure summary at the end.
 * Writes to test-results/failures.log and console.
 */
import type { Reporter, FullConfig, TestCase, TestResult } from '@playwright/test/reporter';
import type { Suite } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

const FAILURES_LOG = 'test-results/failures.log';

function getProjectName(test: TestCase): string {
  let s: Suite | undefined = test.parent;
  while (s) {
    if (s.type === 'project') return s.title;
    s = s.parent;
  }
  return 'unknown';
}

function getErrorMessage(result: TestResult): string {
  if (result.error) return result.error.message ?? String(result.error);
  if (result.status === 'timedOut') return 'Test timed out.';
  return `Status: ${result.status}`;
}

export default class CustomReporter implements Reporter {
  private failures: Array<{ project: string; title: string; error: string; file?: string }> = [];

  onBegin(_config: FullConfig) {
    this.failures = [];
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'passed' && result.status !== 'skipped') {
      const project = getProjectName(test);
      const error = getErrorMessage(result);
      this.failures.push({
        project,
        title: test.title,
        error,
        file: test.location?.file,
      });
      const prefix = '[FAIL]';
      console.log(`\n${prefix} [${project}] ${test.title}`);
      console.log(`  ${error.replace(/\n/g, '\n  ')}`);
    }
  }

  onEnd() {
    if (this.failures.length === 0) return;
    const lines = [
      `\n${'='.repeat(60)}`,
      `Failure summary (${this.failures.length} test(s))`,
      `${'='.repeat(60)}`,
      ...this.failures.map(
        (f) => `[${f.project}] ${f.title}\n  ${f.error.replace(/\n/g, '\n  ')}${f.file ? `\n  File: ${f.file}` : ''}`
      ),
      '',
    ];
    const out = lines.join('\n');
    const dir = path.dirname(FAILURES_LOG);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FAILURES_LOG, out, 'utf8');
    console.log(out);
  }
}
