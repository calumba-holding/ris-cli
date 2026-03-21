#!/usr/bin/env node
// Binary entry point for ris-cli

import("../dist/cli.js").catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
