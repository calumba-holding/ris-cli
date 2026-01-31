#!/usr/bin/env node
// urteil-watch CLI - Main entry point

import * as fs from 'fs';
import { Command } from 'commander';
import { createSearchCommand } from './commands/search.js';
import { createSyncCommand } from './commands/sync.js';
import { createNotifyCommand } from './commands/notify.js';

// Get version from package.json
const packageJsonPath = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

const program = new Command();

program
  .name('urteil-watch')
  .version(version, '-V, --version')
  .description('CLI tool for monitoring Austrian RIS judgments related to cyberbullying and hate speech')
  .addCommand(createSearchCommand())
  .addCommand(createSyncCommand())
  .addCommand(createNotifyCommand())
  .configureOutput({
    writeErr: (str) => console.error(`❌ ${str}`),
  });

// Handle global options
program.option('-v, --verbose', 'Enable verbose output');

// Parse and execute
program.parse(process.argv);

// Handle no command
if (program.args.length === 0) {
  program.help();
}
