// E2E eval runner for ris-cli.
//
// Runs the built CLI (dist/cli.js) against the live RIS OGD API, case by
// case, and reports PASS/FAIL per check. Cases run sequentially to stay
// gentle on the API; failed cases are retried once to absorb transient
// network flakiness.
//
// Usage:
//   pnpm eval:e2e                 run all cases (builds first)
//   tsx evals/e2e/run.ts --list   list case ids
//   tsx evals/e2e/run.ts --only vwgh   run cases whose id contains "vwgh"
//
// Exit code: 0 when every case passes, 1 otherwise.
// A machine-readable report is written to evals/e2e/report.json.

import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { evalCases } from "./cases.js";
import type { CliResult, EvalCase } from "./cases.js";

const ATTEMPTS = 2;
const DEFAULT_TIMEOUT_MS = 60000;

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const cliPath = path.join(rootDir, "dist", "cli.js");
const reportPath = path.join(rootDir, "evals", "e2e", "report.json");

interface CheckOutcome {
  name: string;
  passed: boolean;
  error?: string;
}

interface CaseOutcome {
  id: string;
  description: string;
  passed: boolean;
  attempts: number;
  durationMs: number;
  checks: CheckOutcome[];
}

function runCli(args: string[], timeoutMs: number): Promise<CliResult> {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [cliPath, ...args],
      { timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 },
      (error: any, stdout, stderr) => {
        resolve({
          exitCode: error
            ? typeof error.code === "number"
              ? error.code
              : 1
            : 0,
          stdout: String(stdout),
          stderr: String(stderr),
          durationMs: Date.now() - startedAt,
        });
      },
    );
  });
}

function tryParseJson(result: CliResult): void {
  try {
    result.json = JSON.parse(result.stdout);
  } catch {
    result.json = undefined;
  }
}

async function runCase(evalCase: EvalCase): Promise<CaseOutcome> {
  const timeoutMs = evalCase.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const expectExitCode = evalCase.expectExitCode ?? 0;
  const parseJson = evalCase.parseJson ?? true;
  const startedAt = Date.now();

  let checks: CheckOutcome[] = [];
  let attempt = 0;

  for (attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    checks = [];

    const primary = await runCli(evalCase.command, timeoutMs);
    const secondary = evalCase.compareCommand
      ? await runCli(evalCase.compareCommand, timeoutMs)
      : undefined;
    if (parseJson) {
      tryParseJson(primary);
      if (secondary) tryParseJson(secondary);
    }

    if (primary.exitCode !== expectExitCode) {
      checks.push({
        name: `exit code is ${expectExitCode}`,
        passed: false,
        error: `got ${primary.exitCode}; stderr: ${primary.stderr.slice(0, 300)}`,
      });
    } else {
      checks.push({ name: `exit code is ${expectExitCode}`, passed: true });
    }

    for (const check of evalCase.checks) {
      try {
        check.assert(primary, secondary);
        checks.push({ name: check.name, passed: true });
      } catch (error) {
        checks.push({
          name: check.name,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (checks.every((c) => c.passed)) break;
  }

  return {
    id: evalCase.id,
    description: evalCase.description,
    passed: checks.every((c) => c.passed),
    attempts: Math.min(attempt, ATTEMPTS),
    durationMs: Date.now() - startedAt,
    checks,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    for (const evalCase of evalCases) {
      console.log(`${evalCase.id}  —  ${evalCase.description}`);
    }
    return;
  }

  const onlyIndex = args.indexOf("--only");
  const filter = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
  const selected = filter
    ? evalCases.filter((c) => c.id.includes(filter))
    : evalCases;

  if (selected.length === 0) {
    console.error(`No eval cases match --only ${filter}`);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(cliPath)) {
    console.error(`Missing ${cliPath} — run "pnpm build" first.`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Running ${selected.length} e2e eval case(s) against the live RIS API\n`,
  );

  const outcomes: CaseOutcome[] = [];
  for (const evalCase of selected) {
    const outcome = await runCase(evalCase);
    outcomes.push(outcome);

    const status = outcome.passed ? "PASS" : "FAIL";
    const retry = outcome.attempts > 1 ? ` (attempt ${outcome.attempts})` : "";
    console.log(
      `${status}  ${outcome.id}  [${(outcome.durationMs / 1000).toFixed(1)}s]${retry}`,
    );
    for (const check of outcome.checks) {
      if (!check.passed) {
        console.log(`      ✗ ${check.name}: ${check.error}`);
      }
    }
  }

  const passed = outcomes.filter((o) => o.passed).length;
  const failed = outcomes.length - passed;
  console.log(
    `\nSummary: ${passed} passed, ${failed} failed, ${outcomes.length} total`,
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        finishedAt: new Date().toISOString(),
        cliPath,
        summary: { passed, failed, total: outcomes.length },
        cases: outcomes,
      },
      null,
      2,
    ),
  );
  console.log(`Report written to ${path.relative(rootDir, reportPath)}`);

  if (failed > 0) process.exitCode = 1;
}

main();
