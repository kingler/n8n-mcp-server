#!/usr/bin/env node
// Wrapper script to suppress Node.js module type warnings
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'MODULE_TYPELESS_PACKAGE_JSON') {
    return; // Suppress this specific warning
  }
  console.error(warning);
});

// Load and run the main server
import('./build/index.js');