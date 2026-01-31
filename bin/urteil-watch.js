#!/usr/bin/env node
// Binary entry point for urteil-watch

// Set up source map support for better error messages
import { installSourceMapSupport } from 'source-map-support';
installSourceMapSupport();

// Import and run the CLI
import('./cli.js').catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
